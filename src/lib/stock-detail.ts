import { XMLParser } from "fast-xml-parser";
import type { StockDetailData, Story } from "@/types";

export const stockRanges = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "1h" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
} as const;

export type StockRange = keyof typeof stockRanges;

const parser = new XMLParser({ ignoreAttributes: false });

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function splitNewsTitle(title: string) {
  const parts = title.split(" - ");
  return parts.length > 1
    ? { title: parts.slice(0, -1).join(" - "), source: parts.at(-1) ?? "Google News" }
    : { title, source: "Google News" };
}

async function getStockNews(symbol: string, name: string): Promise<Story[]> {
  try {
    const query = `${symbol} ${name} stock when:7d`;
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const response = await fetch(url, {
      next: { revalidate: 1800 },
      headers: { "User-Agent": "Raj-Peswani-Tracker/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return [];
    const xml = parser.parse(await response.text());
    return asArray<Record<string, string>>(xml?.rss?.channel?.item).slice(0, 3).map((item) => ({
      ...splitNewsTitle(item.title ?? `${symbol} market update`),
      url: item.link ?? url,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function getStockDetail(symbolInput: string, selectedRange: StockRange = "1M"): Promise<StockDetailData | null> {
  const symbol = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9.^=-]/g, "").slice(0, 15);
  if (!symbol) return null;
  const config = stockRanges[selectedRange];
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.range}&interval=${config.interval}&events=div%2Csplits`;
    const response = await fetch(url, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const result = payload?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta ?? {};
    const timestamps = (result.timestamp ?? []) as number[];
    const closes = (result.indicators?.quote?.[0]?.close ?? []) as Array<number | null>;
    const points = timestamps.flatMap((timestamp, index) => {
      const close = closes[index];
      return typeof close === "number" && Number.isFinite(close) ? [{ timestamp, close }] : [];
    });
    if (!points.length) return null;
    const price = Number(meta.regularMarketPrice) || points.at(-1)?.close || 0;
    const previousClose = Number(meta.previousClose) || Number(meta.chartPreviousClose) || points[0].close;
    const rangeStart = points[0].close;
    const name = String(meta.longName || meta.shortName || symbol);
    const news = await getStockNews(symbol, name);
    return {
      symbol,
      name,
      exchange: String(meta.fullExchangeName || meta.exchangeName || "US Market"),
      currency: String(meta.currency || "USD"),
      price,
      previousClose,
      dayChange: price - previousClose,
      dayChangePercent: previousClose ? ((price - previousClose) / previousClose) * 100 : 0,
      rangeChange: price - rangeStart,
      rangeChangePercent: rangeStart ? ((price - rangeStart) / rangeStart) * 100 : 0,
      dayHigh: Number(meta.regularMarketDayHigh) || 0,
      dayLow: Number(meta.regularMarketDayLow) || 0,
      volume: Number(meta.regularMarketVolume) || 0,
      fiftyTwoWeekHigh: Number(meta.fiftyTwoWeekHigh) || 0,
      fiftyTwoWeekLow: Number(meta.fiftyTwoWeekLow) || 0,
      marketTime: Number(meta.regularMarketTime) || points.at(-1)?.timestamp || 0,
      range: selectedRange,
      points,
      news,
    };
  } catch {
    return null;
  }
}
