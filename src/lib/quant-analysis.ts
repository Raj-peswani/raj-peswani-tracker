import { getStockSignals } from "@/lib/stock-signals";
import type { QuantAnalysis } from "@/types";

type PriceBar = { close: number; high: number; low: number; timestamp: number };
type NasdaqValue = { value?: string };
type FinancialRow = { value1?: string; value2?: string; value3?: string };

const nasdaqHeaders = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json,text/plain,*/*",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/market-activity/stocks",
};

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sma(values: number[], period: number) {
  return average(values.slice(-period));
}

function emaSeries(values: number[], period: number) {
  if (!values.length) return [];
  const multiplier = 2 / (period + 1);
  const result = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    result.push((values[index] * multiplier) + (result[index - 1] * (1 - multiplier)));
  }
  return result;
}

function rsi(values: number[], period = 14) {
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = average(recent.map((change) => Math.max(change, 0)));
  const losses = average(recent.map((change) => Math.max(-change, 0)));
  if (!losses) return gains ? 100 : 50;
  return 100 - (100 / (1 + gains / losses));
}

function standardDeviation(values: number[]) {
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function parseNumber(value: string | undefined) {
  if (!value || value === "N/A") return null;
  const parsed = Number(value.replace(/[$,%]/g, "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function rowValue(rows: FinancialRow[], label: string) {
  return rows.find((row) => row.value1 === label);
}

function growth(current: number | null, previous: number | null) {
  return current !== null && previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
}

function scoreLabel(score: number): QuantAnalysis["setupLabel"] {
  if (score >= 75) return "Strong setup";
  if (score >= 60) return "Constructive";
  if (score >= 45) return "Neutral";
  return "Caution";
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalSample(random: () => number) {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second);
}

function percentile(sorted: number[], fraction: number) {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * fraction)))] ?? 0;
}

function monteCarloForecast(symbol: string, price: number, dailyReturns: number[], simulations = 5000) {
  const seed = symbol.split("").reduce((sum, character) => sum + character.charCodeAt(0), 2026);
  const random = seededRandom(seed);
  const dailyDrift = Math.max(-0.003, Math.min(0.003, average(dailyReturns.slice(-120))));
  const dailyVolatility = Math.max(0.0001, standardDeviation(dailyReturns.slice(-120)));
  const day20Prices: number[] = [];
  const day60Prices: number[] = [];
  for (let simulation = 0; simulation < simulations; simulation += 1) {
    let simulatedPrice = price;
    for (let day = 1; day <= 60; day += 1) {
      simulatedPrice *= Math.exp((dailyDrift - (dailyVolatility ** 2) / 2) + (dailyVolatility * normalSample(random)));
      if (day === 20) day20Prices.push(simulatedPrice);
    }
    day60Prices.push(simulatedPrice);
  }
  day20Prices.sort((first, second) => first - second);
  day60Prices.sort((first, second) => first - second);
  const summarize = (prices: number[]) => ({
    median: percentile(prices, 0.5),
    low: percentile(prices, 0.1),
    high: percentile(prices, 0.9),
    probabilityGain: (prices.filter((forecastPrice) => forecastPrice > price).length / prices.length) * 100,
  });
  return { simulations, day20: summarize(day20Prices), day60: summarize(day60Prices) };
}

function detectSwingPattern(bars: PriceBar[]): QuantAnalysis["pattern"] {
  const recentBars = bars.slice(-180);
  const rawPivots: Array<{ timestamp: number; type: "high" | "low"; price: number }> = [];
  const window = 3;
  for (let index = window; index < recentBars.length - window; index += 1) {
    const comparison = recentBars.slice(index - window, index + window + 1);
    const bar = recentBars[index];
    if (bar.high === Math.max(...comparison.map((candidate) => candidate.high))) rawPivots.push({ timestamp: bar.timestamp, type: "high", price: bar.high });
    if (bar.low === Math.min(...comparison.map((candidate) => candidate.low))) rawPivots.push({ timestamp: bar.timestamp, type: "low", price: bar.low });
  }
  rawPivots.sort((first, second) => first.timestamp - second.timestamp);
  const alternating: typeof rawPivots = [];
  for (const pivot of rawPivots) {
    const previous = alternating.at(-1);
    if (!previous || previous.type !== pivot.type) {
      alternating.push(pivot);
    } else if ((pivot.type === "high" && pivot.price > previous.price) || (pivot.type === "low" && pivot.price < previous.price)) {
      alternating[alternating.length - 1] = pivot;
    }
  }
  const pivots = alternating.slice(-8);
  const swings = pivots.slice(1).map((pivot, index) => Math.abs((pivot.price - pivots[index].price) / pivots[index].price) * 100);
  const cycles = pivots.slice(1).map((pivot, index) => Math.abs(pivot.timestamp - pivots[index].timestamp) / 86400);
  const averageSwing = average(swings);
  const averageCycleDays = average(cycles);
  const variation = averageSwing ? standardDeviation(swings) / averageSwing : 1;
  const consistency = Math.max(0, Math.min(100, 100 - (variation * 100)));
  const latestPivot = pivots.at(-1);
  const currentPrice = bars.at(-1)?.close ?? 0;
  const phase = !latestPivot ? "No stable swing cycle detected" : latestPivot.type === "low" && currentPrice > latestPivot.price ? "Rebounding from a detected swing low" : latestPivot.type === "high" && currentPrice < latestPivot.price ? "Pulling back from a detected swing high" : `Testing the latest swing ${latestPivot.type}`;
  const nextReference = !latestPivot || !averageSwing ? null : latestPivot.type === "low" ? latestPivot.price * (1 + averageSwing / 100) : latestPivot.price * (1 - averageSwing / 100);
  return {
    detected: pivots.length >= 4 && averageSwing >= 6 && consistency >= 35,
    averageSwing,
    averageCycleDays,
    consistency,
    phase,
    nextReference,
    pivots: pivots.map((pivot) => ({ date: new Date(pivot.timestamp * 1000).toISOString().slice(0, 10), type: pivot.type, price: pivot.price })),
  };
}

export async function getQuantAnalysis(symbolInput: string): Promise<QuantAnalysis | null> {
  const symbol = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
  if (!symbol) return null;

  try {
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
    const summaryUrl = `https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/summary?assetclass=stocks`;
    const financialsUrl = `https://api.nasdaq.com/api/company/${encodeURIComponent(symbol)}/financials?frequency=1`;
    const [chartResponse, summaryResponse, financialsResponse, stockSignals] = await Promise.all([
      fetch(chartUrl, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 900 }, signal: AbortSignal.timeout(9000) }),
      fetch(summaryUrl, { headers: nasdaqHeaders, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }),
      fetch(financialsUrl, { headers: nasdaqHeaders, next: { revalidate: 21600 }, signal: AbortSignal.timeout(9000) }),
      getStockSignals([symbol]),
    ]);
    if (!chartResponse.ok) return null;

    const chart = (await chartResponse.json())?.chart?.result?.[0];
    if (!chart) return null;
    const timestamps = (chart.timestamp ?? []) as number[];
    const quote = chart.indicators?.quote?.[0] ?? {};
    const closes = (quote.close ?? []) as Array<number | null>;
    const highs = (quote.high ?? []) as Array<number | null>;
    const lows = (quote.low ?? []) as Array<number | null>;
    const bars: PriceBar[] = timestamps.flatMap((timestamp, index) => {
      const close = closes[index];
      if (typeof close !== "number" || !Number.isFinite(close)) return [];
      return [{ timestamp, close, high: typeof highs[index] === "number" ? highs[index] : close, low: typeof lows[index] === "number" ? lows[index] : close }];
    });
    if (bars.length < 50) return null;

    const closeValues = bars.map((bar) => bar.close);
    const price = Number(chart.meta?.regularMarketPrice) || closeValues.at(-1) || 0;
    const previousClose = closeValues.at(-2) || price;
    const sma20 = sma(closeValues, 20);
    const sma50 = sma(closeValues, 50);
    const sma200 = sma(closeValues, Math.min(200, closeValues.length));
    const ema12 = emaSeries(closeValues, 12);
    const ema26 = emaSeries(closeValues, 26);
    const macdSeries = closeValues.map((_, index) => ema12[index] - ema26[index]);
    const signalSeries = emaSeries(macdSeries, 9);
    const macd = macdSeries.at(-1) ?? 0;
    const signal = signalSeries.at(-1) ?? 0;
    const trueRanges = bars.slice(1).map((bar, index) => Math.max(bar.high - bar.low, Math.abs(bar.high - bars[index].close), Math.abs(bar.low - bars[index].close)));
    const atr14 = average(trueRanges.slice(-14));
    const dailyReturns = closeValues.slice(1).map((value, index) => Math.log(value / closeValues[index]));
    const volatility = standardDeviation(dailyReturns.slice(-60)) * Math.sqrt(252) * 100;
    const riskFreeRate = 4.3;
    const annualizedReturn = average(dailyReturns) * 252 * 100;
    const annualizedVolatility = standardDeviation(dailyReturns) * Math.sqrt(252) * 100;
    const sharpeRatio = annualizedVolatility ? (annualizedReturn - riskFreeRate) / annualizedVolatility : 0;
    const forecast = monteCarloForecast(symbol, price, dailyReturns);
    const pattern = detectSwingPattern(bars);
    const return20Day = closeValues.length > 20 ? ((price - closeValues.at(-21)!) / closeValues.at(-21)!) * 100 : 0;
    const support = Math.min(...bars.slice(-20).map((bar) => bar.low));
    const resistance = Math.max(...bars.slice(-60).map((bar) => bar.high));
    const stopReference = Math.max(0, support - (atr14 * 0.5));
    const riskPerShare = Math.max(price - stopReference, atr14);
    const twoRTarget = price + (riskPerShare * 2);

    const summary = summaryResponse.ok ? (await summaryResponse.json())?.data?.summaryData as Record<string, NasdaqValue> | undefined : undefined;
    const financials = financialsResponse.ok ? (await financialsResponse.json())?.data : undefined;
    const incomeRows = (financials?.incomeStatementTable?.rows ?? []) as FinancialRow[];
    const ratioRows = (financials?.financialRatiosTable?.rows ?? []) as FinancialRow[];
    const revenue = rowValue(incomeRows, "Total Revenue");
    const netIncome = rowValue(incomeRows, "Net Income");
    const oneYearTarget = parseNumber(summary?.OneYrTarget?.value);
    const revenueGrowth = growth(parseNumber(revenue?.value2), parseNumber(revenue?.value3));
    const netIncomeGrowth = growth(parseNumber(netIncome?.value2), parseNumber(netIncome?.value3));
    const profitMargin = parseNumber(rowValue(ratioRows, "Profit Margin")?.value2);
    const currentRatioRaw = parseNumber(rowValue(ratioRows, "Current Ratio")?.value2);
    const currentRatio = currentRatioRaw === null ? null : currentRatioRaw / 100;
    const targetUpside = oneYearTarget ? ((oneYearTarget - price) / price) * 100 : null;
    const options = stockSignals[0] ?? { symbol, callPercent: null, putPercent: null, analystRating: null, analystCount: null };

    const trend = Math.round(([price > sma20, sma20 > sma50, sma50 > sma200, price > sma200].filter(Boolean).length / 4) * 100);
    const momentum = Math.min(100, ((rsi(closeValues) >= 45 && rsi(closeValues) <= 70) ? 40 : rsi(closeValues) > 70 ? 15 : 20) + (macd > signal ? 30 : 10) + (return20Day > 0 ? 30 : 5));
    const atrPercent = price ? (atr14 / price) * 100 : 0;
    const stopDistance = price ? ((price - stopReference) / price) * 100 : 100;
    const risk = Math.min(100, (volatility < 25 ? 40 : volatility < 40 ? 25 : 10) + (atrPercent < 3 ? 30 : atrPercent < 5 ? 20 : 10) + (stopDistance < 8 ? 30 : stopDistance < 12 ? 20 : 10));
    const analystPositive = /buy|outperform|overweight/i.test(options.analystRating ?? "");
    const fundamentals = Math.min(100, (revenueGrowth !== null && revenueGrowth > 0 ? 25 : 5) + (netIncomeGrowth !== null && netIncomeGrowth > 0 ? 25 : 5) + (profitMargin !== null && profitMargin > 10 ? 20 : 8) + (targetUpside !== null && targetUpside > 0 ? 15 : 5) + (analystPositive ? 15 : 5));
    const setupScore = Math.round((trend * 0.35) + (momentum * 0.25) + (risk * 0.15) + (fundamentals * 0.25));
    const rsi14 = rsi(closeValues);
    const signals: QuantAnalysis["signals"] = [
      { label: "Primary trend", detail: price > sma50 ? `Price is above the 50-day average (${sma50.toFixed(2)}).` : `Price is below the 50-day average (${sma50.toFixed(2)}).`, tone: price > sma50 ? "positive" : "negative" },
      { label: "Momentum", detail: `RSI is ${rsi14.toFixed(1)} and MACD is ${macd > signal ? "above" : "below"} its signal line.`, tone: rsi14 >= 45 && rsi14 <= 70 && macd > signal ? "positive" : rsi14 > 75 || macd < signal ? "negative" : "neutral" },
      { label: "Options positioning", detail: options.callPercent === null ? "No listed open-interest signal is available." : `${options.callPercent}% calls versus ${options.putPercent}% puts by open interest.`, tone: options.callPercent === null ? "neutral" : options.callPercent >= 55 ? "positive" : options.callPercent <= 45 ? "negative" : "neutral" },
      { label: "Fundamental direction", detail: revenueGrowth === null ? "Annual financial growth data is unavailable." : `Revenue growth ${revenueGrowth.toFixed(1)}%; net income growth ${netIncomeGrowth?.toFixed(1) ?? "N/A"}%.`, tone: revenueGrowth !== null && revenueGrowth > 0 && (netIncomeGrowth ?? -1) > 0 ? "positive" : "neutral" },
    ];

    return {
      symbol,
      name: String(chart.meta?.longName || chart.meta?.shortName || symbol),
      price,
      changePercent: previousClose ? ((price - previousClose) / previousClose) * 100 : 0,
      setupScore,
      setupLabel: scoreLabel(setupScore),
      technical: { sma20, sma50, sma200, rsi14, macd, signal, atr14, volatility, return20Day, support, resistance, stopReference, twoRTarget },
      fundamentals: { sector: summary?.Sector?.value ?? "N/A", industry: summary?.Industry?.value ?? "N/A", oneYearTarget, targetUpside, revenueGrowth, netIncomeGrowth, profitMargin, currentRatio },
      options,
      forecasting: { sharpeRatio, riskFreeRate, simulations: forecast.simulations, day20: forecast.day20, day60: forecast.day60 },
      pattern,
      scores: { trend, momentum, risk, fundamentals },
      signals,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
