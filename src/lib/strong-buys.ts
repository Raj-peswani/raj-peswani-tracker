import { unstable_cache } from "next/cache";
import { getFinancialFeedback } from "@/lib/financial-feedback";
import { getQuantAnalysis } from "@/lib/quant-analysis";
import { getStockSignals } from "@/lib/stock-signals";
import { stockUniverse } from "@/lib/stock-universe";
import { getStockSnapshots } from "@/lib/stocks";
import type { StockSignal, StrongBuysData, StrongBuyStock } from "@/types";

function signalMap(signals: StockSignal[]) {
  return new Map(signals.map((signal) => [signal.symbol, signal]));
}

function isStrongBuy(rating: string | null | undefined) {
  return /strong\s*buy|buy|outperform|overweight/i.test(rating ?? "");
}

async function generateStrongBuys(): Promise<StrongBuysData> {
  const symbols = stockUniverse.map((stock) => stock.symbol);
  const [signals, dayRows] = await Promise.all([
    getStockSignals(symbols, symbols.length),
    getStockSnapshots(stockUniverse, "day"),
  ]);
  const bySignal = signalMap(signals);
  const priceBySymbol = new Map(dayRows.map((row) => [row.symbol, row]));
  const analystFiltered = stockUniverse.filter((stock) => isStrongBuy(bySignal.get(stock.symbol)?.analystRating));
  const fallbackFiltered = analystFiltered.length ? analystFiltered : stockUniverse.filter((stock) => ["NVDA", "MSFT", "AVGO", "AMZN", "GOOGL", "JPM", "LLY", "COST"].includes(stock.symbol));

  const rows = await Promise.all(fallbackFiltered.slice(0, 20).map(async (stock): Promise<StrongBuyStock | null> => {
    const [analysis, feedback] = await Promise.all([getQuantAnalysis(stock.symbol), getFinancialFeedback(stock.symbol)]);
    const signal = bySignal.get(stock.symbol);
    if (!analysis) return null;
    const reasons = [
      signal?.analystRating ? `Analyst consensus shows ${signal.analystRating}.` : "Analyst signal is unavailable, so the fallback ranking leans on Quant and report metrics.",
      `${analysis.setupLabel} with a ${analysis.setupScore}/100 Quant setup score.`,
      `Annual report and balance sheet buy-metrics score is ${feedback.buyMetricsScore}/100.`,
    ];
    if (analysis.fundamentals.targetUpside !== null) reasons.push(`Analyst target upside is ${analysis.fundamentals.targetUpside.toFixed(1)}%.`);
    if (signal?.callPercent !== null && signal?.callPercent !== undefined) reasons.push(`Options positioning shows ${signal.callPercent}% calls versus ${signal.putPercent}% puts.`);
    return {
      symbol: stock.symbol,
      name: analysis.name,
      sector: stock.sector,
      price: analysis.price,
      changePercent: priceBySymbol.get(stock.symbol)?.periodChange ?? analysis.changePercent,
      analystRating: signal?.analystRating ?? "Strong watch",
      analystCount: signal?.analystCount ?? null,
      callPercent: signal?.callPercent ?? null,
      putPercent: signal?.putPercent ?? null,
      setupScore: analysis.setupScore,
      reportScore: feedback.buyMetricsScore,
      targetUpside: analysis.fundamentals.targetUpside,
      reasons,
    };
  }));

  return {
    generatedAt: new Date().toISOString(),
    scannedStocks: stockUniverse.length,
    stocks: rows
      .filter((row): row is StrongBuyStock => Boolean(row))
      .sort((first, second) => (second.setupScore + second.reportScore) - (first.setupScore + first.reportScore))
      .slice(0, 20),
  };
}

export const getStrongBuys = unstable_cache(generateStrongBuys, ["strong-buys-v1"], { revalidate: 21600 });
