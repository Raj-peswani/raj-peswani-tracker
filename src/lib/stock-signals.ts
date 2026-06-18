import type { StockSignal } from "@/types";

type NasdaqOptionRow = {
  c_Openinterest?: string | null;
  p_Openinterest?: string | null;
};

const nasdaqHeaders = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json,text/plain,*/*",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/market-activity/stocks",
};

function numeric(value: string | null | undefined) {
  const parsed = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getAnalystSignal(symbol: string) {
  try {
    const response = await fetch(`https://api.nasdaq.com/api/analyst/${encodeURIComponent(symbol)}/ratings`, {
      headers: nasdaqHeaders,
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return { analystRating: null, analystCount: null };
    const data = (await response.json())?.data;
    const analystRating = typeof data?.meanRatingType === "string" ? data.meanRatingType : null;
    const countMatch = String(data?.ratingsSummary ?? "").match(/Based on (\d+) analysts?/i);
    return { analystRating, analystCount: countMatch ? Number(countMatch[1]) : null };
  } catch {
    return { analystRating: null, analystCount: null };
  }
}

async function getOptionsSignal(symbol: string) {
  try {
    const response = await fetch(`https://api.nasdaq.com/api/quote/${encodeURIComponent(symbol)}/option-chain?assetclass=stocks&limit=5000`, {
      headers: { ...nasdaqHeaders, Referer: `https://www.nasdaq.com/market-activity/stocks/${symbol.toLowerCase()}/option-chain` },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return { callPercent: null, putPercent: null };
    const rows = ((await response.json())?.data?.table?.rows ?? []) as NasdaqOptionRow[];
    const callOpenInterest = rows.reduce((sum, row) => sum + numeric(row.c_Openinterest), 0);
    const putOpenInterest = rows.reduce((sum, row) => sum + numeric(row.p_Openinterest), 0);
    const totalOpenInterest = callOpenInterest + putOpenInterest;
    if (!totalOpenInterest) return { callPercent: null, putPercent: null };
    const callPercent = Math.round((callOpenInterest / totalOpenInterest) * 100);
    return { callPercent, putPercent: 100 - callPercent };
  } catch {
    return { callPercent: null, putPercent: null };
  }
}

async function getStockSignal(symbol: string): Promise<StockSignal> {
  const [analyst, options] = await Promise.all([getAnalystSignal(symbol), getOptionsSignal(symbol)]);
  return { symbol, ...analyst, ...options };
}

export async function getStockSignals(symbolInputs: string[]) {
  const symbols = [...new Set(symbolInputs.map((symbol) => symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "")).filter(Boolean))].slice(0, 12);
  const signals: StockSignal[] = [];
  for (let index = 0; index < symbols.length; index += 4) {
    signals.push(...await Promise.all(symbols.slice(index, index + 4).map(getStockSignal)));
  }
  return signals;
}
