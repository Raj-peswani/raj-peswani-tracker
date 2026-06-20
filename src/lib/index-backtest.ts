import type { IndexBacktestMetrics, IndexBacktestResult, IndexHolding } from "@/types";

type Period = IndexBacktestResult["period"];
type SparkRow = {
  symbol?: string;
  response?: Array<{
    timestamp?: number[];
    indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  }>;
};

const riskFreeRate = 4.3;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

function covariance(first: number[], second: number[]) {
  const length = Math.min(first.length, second.length);
  if (length < 2) return 0;
  const firstMean = average(first.slice(0, length));
  const secondMean = average(second.slice(0, length));
  return first.slice(0, length).reduce((sum, value, index) => sum + (value - firstMean) * (second[index] - secondMean), 0) / (length - 1);
}

function chunks<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, index * size + size));
}

async function fetchHistory(symbols: string[], period: Period) {
  const rows: SparkRow[] = [];
  for (const batch of chunks(symbols, 20)) {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(batch.join(","))}&range=${period}&interval=1d`, {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) continue;
    const payload = await response.json();
    rows.push(...((payload?.spark?.result ?? []) as SparkRow[]));
  }
  return rows;
}

function closeSeries(row: SparkRow) {
  const response = row.response?.[0];
  const timestamps = response?.timestamp ?? [];
  const closes = response?.indicators?.quote?.[0]?.close ?? [];
  const points = new Map<string, number>();
  timestamps.forEach((timestamp, index) => {
    const close = closes[index];
    if (typeof close === "number" && Number.isFinite(close)) points.set(new Date(timestamp * 1000).toISOString().slice(0, 10), close);
  });
  return points;
}

function returnSeries(prices: Map<string, number>) {
  const returns = new Map<string, number>();
  let previous: number | null = null;
  for (const [date, price] of prices) {
    if (previous !== null && previous > 0) returns.set(date, price / previous - 1);
    previous = price;
  }
  return returns;
}

function metrics(returns: number[], endingValue: number): IndexBacktestMetrics {
  const years = returns.length / 252;
  const annualizedReturn = years > 0 ? (endingValue / 100) ** (1 / years) - 1 : 0;
  const annualizedVolatility = standardDeviation(returns) * Math.sqrt(252);
  let peak = 100;
  let value = 100;
  let maxDrawdown = 0;
  for (const dailyReturn of returns) {
    value *= 1 + dailyReturn;
    peak = Math.max(peak, value);
    maxDrawdown = Math.min(maxDrawdown, value / peak - 1);
  }
  return {
    totalReturn: (endingValue / 100 - 1) * 100,
    annualizedReturn: annualizedReturn * 100,
    annualizedVolatility: annualizedVolatility * 100,
    sharpeRatio: annualizedVolatility ? (annualizedReturn - riskFreeRate / 100) / annualizedVolatility : 0,
    maxDrawdown: maxDrawdown * 100,
  };
}

export async function backtestCustomIndex(holdingInputs: IndexHolding[], period: Period): Promise<IndexBacktestResult | null> {
  const holdings = holdingInputs
    .map((holding) => ({ symbol: holding.symbol.trim().toUpperCase().replace(/[^A-Z0-9.^=-]/g, "").slice(0, 15), weight: Number(holding.weight) }))
    .filter((holding) => holding.symbol && holding.symbol !== "^GSPC" && Number.isFinite(holding.weight) && holding.weight > 0)
    .filter((holding, index, rows) => rows.findIndex((candidate) => candidate.symbol === holding.symbol) === index)
    .slice(0, 100);
  if (holdings.length < 2) return null;
  const totalWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  const normalized = holdings.map((holding) => ({ ...holding, weight: holding.weight / totalWeight }));
  const requestedSymbols = normalized.map((holding) => holding.symbol);
  const rows = await fetchHistory([...requestedSymbols, "^GSPC"], period);
  const bySymbol = new Map(rows.map((row) => [String(row.symbol), closeSeries(row)]));
  const benchmarkPrices = bySymbol.get("^GSPC");
  if (!benchmarkPrices || benchmarkPrices.size < 40) return null;

  const included = normalized.filter((holding) => (bySymbol.get(holding.symbol)?.size ?? 0) >= 40);
  if (included.length < 2) return null;
  const includedWeight = included.reduce((sum, holding) => sum + holding.weight, 0);
  const weights = new Map(included.map((holding) => [holding.symbol, holding.weight / includedWeight]));
  const assetReturns = new Map(included.map((holding) => [holding.symbol, returnSeries(bySymbol.get(holding.symbol) ?? new Map())]));
  const benchmarkReturns = returnSeries(benchmarkPrices);
  const portfolioReturns: number[] = [];
  const sp500Returns: number[] = [];
  const fullSeries: Array<{ date: string; portfolio: number; sp500: number }> = [];
  let portfolioValue = 100;
  let sp500Value = 100;

  for (const [date, sp500Return] of benchmarkReturns) {
    const available = included.flatMap((holding) => {
      const value = assetReturns.get(holding.symbol)?.get(date);
      return typeof value === "number" ? [{ value, weight: weights.get(holding.symbol) ?? 0 }] : [];
    });
    const availableWeight = available.reduce((sum, item) => sum + item.weight, 0);
    if (availableWeight < 0.5) continue;
    const portfolioReturn = available.reduce((sum, item) => sum + item.value * (item.weight / availableWeight), 0);
    if (!Number.isFinite(portfolioReturn) || !Number.isFinite(sp500Return)) continue;
    portfolioValue *= 1 + clamp(portfolioReturn, -0.95, 3);
    sp500Value *= 1 + clamp(sp500Return, -0.95, 3);
    portfolioReturns.push(portfolioReturn);
    sp500Returns.push(sp500Return);
    fullSeries.push({ date, portfolio: portfolioValue, sp500: sp500Value });
  }
  if (fullSeries.length < 40) return null;

  const sampleEvery = period === "1y" ? 5 : period === "3y" ? 10 : 20;
  const series = fullSeries.filter((_, index) => index % sampleEvery === 0 || index === fullSeries.length - 1);
  const benchmarkVariance = standardDeviation(sp500Returns) ** 2;
  const portfolioDeviation = standardDeviation(portfolioReturns);
  const benchmarkDeviation = standardDeviation(sp500Returns);
  const sharedCovariance = covariance(portfolioReturns, sp500Returns);
  const differences = portfolioReturns.map((value, index) => value - sp500Returns[index]);
  const portfolioMetrics = metrics(portfolioReturns, portfolioValue);
  const sp500Metrics = metrics(sp500Returns, sp500Value);

  return {
    period,
    benchmark: "^GSPC",
    methodology: "Daily-rebalanced weighted index using market closes; dividends, taxes, fees, spreads, and survivorship effects are not modeled.",
    riskFreeRate,
    requestedSymbols,
    includedSymbols: included.map((holding) => holding.symbol),
    omittedSymbols: requestedSymbols.filter((symbol) => !included.some((holding) => holding.symbol === symbol)),
    startDate: fullSeries[0].date,
    endDate: fullSeries.at(-1)?.date ?? fullSeries[0].date,
    portfolio: portfolioMetrics,
    sp500: sp500Metrics,
    relative: {
      outperformance: portfolioMetrics.totalReturn - sp500Metrics.totalReturn,
      beta: benchmarkVariance ? sharedCovariance / benchmarkVariance : 0,
      correlation: portfolioDeviation && benchmarkDeviation ? sharedCovariance / (portfolioDeviation * benchmarkDeviation) : 0,
      trackingError: standardDeviation(differences) * Math.sqrt(252) * 100,
      dailyWinRate: portfolioReturns.filter((value, index) => value > sp500Returns[index]).length / portfolioReturns.length * 100,
    },
    series,
  };
}
