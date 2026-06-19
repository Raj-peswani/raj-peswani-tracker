import { unstable_cache } from "next/cache";
import { getQuantAnalysis } from "@/lib/quant-analysis";
import { getStockDetail } from "@/lib/stock-detail";
import { stockUniverse } from "@/lib/stock-universe";
import { getStockSnapshots } from "@/lib/stocks";
import type { LookoutCandidate, LookoutsData, QuantAnalysis, StockSnapshot } from "@/types";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function snapshotMap(rows: StockSnapshot[]) {
  return new Map(rows.map((row) => [row.symbol, row]));
}

function screeningScore(day: number, month: number, year: number) {
  const dayScore = clamp(50 + day * 7, 0, 100);
  const monthScore = clamp(50 + month * 2.4, 0, 100);
  const yearScore = clamp(50 + year * 0.45, 0, 100);
  const stabilityPenalty = Math.abs(day) > 8 || Math.abs(month) > 35 ? 14 : 0;
  return dayScore * 0.2 + monthScore * 0.5 + yearScore * 0.3 - stabilityPenalty;
}

function candidateScore(analysis: QuantAnalysis, screenScore: number) {
  const forecastScore = analysis.forecasting.day60.probabilityGain;
  const sharpeScore = clamp(50 + analysis.forecasting.sharpeRatio * 18, 0, 100);
  const optionsScore = analysis.options.callPercent ?? 50;
  return Math.round(clamp(
    analysis.setupScore * 0.42 + forecastScore * 0.24 + sharpeScore * 0.14 + optionsScore * 0.08 + screenScore * 0.12,
    0,
    100,
  ));
}

function buildReasoning(analysis: QuantAnalysis, month: number, year: number) {
  const reasons = analysis.signals.filter((signal) => signal.tone === "positive").map((signal) => signal.detail);
  if (month > 0) reasons.push(`One-month momentum is positive at ${month.toFixed(1)}%.`);
  if (year > 0) reasons.push(`One-year price trend is positive at ${year.toFixed(1)}%.`);
  if (analysis.forecasting.day60.probabilityGain >= 55) reasons.push(`The 60-day Monte Carlo model shows ${analysis.forecasting.day60.probabilityGain.toFixed(0)}% gain scenarios.`);
  if (analysis.pattern.detected) reasons.push(`A recurring swing structure was detected with ${analysis.pattern.consistency.toFixed(0)}% consistency.`);
  return [...new Set(reasons)].slice(0, 6);
}

function buildRisks(analysis: QuantAnalysis, month: number) {
  const risks = analysis.signals.filter((signal) => signal.tone === "negative").map((signal) => signal.detail);
  if (analysis.technical.volatility > 55) risks.push(`Annualized volatility is elevated at ${analysis.technical.volatility.toFixed(1)}%.`);
  if (analysis.fundamentals.profitMargin !== null && analysis.fundamentals.profitMargin < 0) risks.push(`Profit margin is negative at ${analysis.fundamentals.profitMargin.toFixed(1)}%.`);
  if (month > 25) risks.push("The recent move is extended and may be vulnerable to mean reversion.");
  if (!risks.length) risks.push("Unexpected news, earnings, macro events, and liquidity shifts can invalidate the setup.");
  return [...new Set(risks)].slice(0, 5);
}

async function generateLookouts(): Promise<LookoutsData> {
  const [dayRows, monthRows, yearRows] = await Promise.all([
    getStockSnapshots(stockUniverse, "day"),
    getStockSnapshots(stockUniverse, "month"),
    getStockSnapshots(stockUniverse, "year"),
  ]);
  const dayBySymbol = snapshotMap(dayRows);
  const monthBySymbol = snapshotMap(monthRows);
  const yearBySymbol = snapshotMap(yearRows);
  const screened = stockUniverse.map((stock) => {
    const day = dayBySymbol.get(stock.symbol)?.periodChange ?? 0;
    const month = monthBySymbol.get(stock.symbol)?.periodChange ?? 0;
    const year = yearBySymbol.get(stock.symbol)?.periodChange ?? 0;
    return { ...stock, day, month, year, screenScore: screeningScore(day, month, year) };
  }).sort((first, second) => second.screenScore - first.screenScore);

  const analyses = await Promise.all(screened.slice(0, 10).map(async (stock) => ({ stock, analysis: await getQuantAnalysis(stock.symbol) })));
  const ranked = analyses
    .filter((entry): entry is typeof entry & { analysis: QuantAnalysis } => Boolean(entry.analysis))
    .map((entry) => ({ ...entry, researchScore: candidateScore(entry.analysis, entry.stock.screenScore) }))
    .sort((first, second) => second.researchScore - first.researchScore)
    .slice(0, 5);

  const candidates = await Promise.all(ranked.map(async ({ stock, analysis, researchScore }, index): Promise<LookoutCandidate> => {
    const detail = await getStockDetail(stock.symbol, "1M");
    const forecast = analysis.forecasting.day60;
    const expectedProfitPercent = ((forecast.median - analysis.price) / analysis.price) * 100;
    const downsideToStop = ((analysis.technical.stopReference - analysis.price) / analysis.price) * 100;
    const probabilitySuccess = Math.round(clamp(forecast.probabilityGain * 0.65 + researchScore * 0.35, 1, 99));
    return {
      rank: index + 1,
      symbol: stock.symbol,
      name: analysis.name,
      sector: stock.sector,
      price: analysis.price,
      researchScore,
      classification: researchScore >= 75 ? "Priority research" : researchScore >= 62 ? "Constructive watch" : "Monitor",
      holdingPeriod: analysis.pattern.detected && analysis.pattern.averageCycleDays <= 12 ? "3–6 weeks" : "6–12 weeks",
      expectedProfitPercent,
      scenarioTarget: forecast.median,
      probabilitySuccess,
      stopReference: analysis.technical.stopReference,
      downsideToStop,
      performance: { day: stock.day, month: stock.month, year: stock.year },
      ratios: {
        sharpeRatio: analysis.forecasting.sharpeRatio,
        rsi14: analysis.technical.rsi14,
        volatility: analysis.technical.volatility,
        revenueGrowth: analysis.fundamentals.revenueGrowth,
        profitMargin: analysis.fundamentals.profitMargin,
        currentRatio: analysis.fundamentals.currentRatio,
        targetUpside: analysis.fundamentals.targetUpside,
        callPercent: analysis.options.callPercent,
        putPercent: analysis.options.putPercent,
        analystRating: analysis.options.analystRating,
      },
      pattern: analysis.pattern,
      reasoning: buildReasoning(analysis, stock.month, stock.year),
      risks: buildRisks(analysis, stock.month),
      news: detail?.news.slice(0, 3) ?? [],
    };
  }));

  const generatedAt = new Date();
  const nextRefreshAt = new Date(generatedAt.getTime() + 24 * 60 * 60 * 1000);
  return {
    generatedAt: generatedAt.toISOString(),
    nextRefreshAt: nextRefreshAt.toISOString(),
    scannedStocks: stockUniverse.length,
    methodology: [
      "Ranks the full tracked US universe using day, month, and year price behavior.",
      "Runs technical, fundamental, options, analyst, Monte Carlo, Sharpe, and pattern analysis on the leading shortlist.",
      "Combines model outputs into a transparent research score; scenarios are not promises or trade instructions.",
    ],
    candidates,
  };
}

export const getDailyLookouts = unstable_cache(generateLookouts, ["daily-lookouts-v1"], { revalidate: 82800 });
