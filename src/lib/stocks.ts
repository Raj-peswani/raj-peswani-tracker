import { defaultWatchlist, stockUniverse, type StockDefinition } from "@/lib/stock-universe";
import type { IpoRecord, StockSnapshot, StocksData } from "@/types";

type Period = StocksData["period"];
type SparkResponse = {
  symbol?: string;
  response?: Array<{
    meta?: Record<string, number | string>;
    indicators?: { quote?: Array<{ close?: Array<number | null> }> };
  }>;
};

const fallbackPrices: Record<string, number> = {
  AAPL: 298.01, MSFT: 379.4, NVDA: 210.69, AMZN: 245.18, GOOGL: 193.4, TSLA: 414.62,
};

const rangeByPeriod: Record<Period, { range: string; interval: string }> = {
  day: { range: "1d", interval: "5m" },
  month: { range: "1mo", interval: "1d" },
  year: { range: "1y", interval: "1wk" },
};

function chunks<T>(values: T[], size: number) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, index * size + size),
  );
}

function fallbackSnapshot(definition: StockDefinition, index: number): StockSnapshot {
  const direction = index % 3 === 0 ? -1 : 1;
  const changePercent = direction * (0.35 + (index % 9) * 0.31);
  const price = fallbackPrices[definition.symbol] ?? 35 + (index * 17.43) % 470;
  return {
    ...definition,
    price,
    change: (price * changePercent) / 100,
    changePercent,
    periodChange: changePercent,
  };
}

async function fetchSpark(definitions: StockDefinition[], period: Period) {
  const config = rangeByPeriod[period];
  const batches = chunks(definitions, 20);
  const results: SparkResponse[] = [];
  for (const batch of batches) {
    try {
      const symbols = batch.map((item) => item.symbol).join(",");
      const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=${config.range}&interval=${config.interval}`;
      const response = await fetch(url, {
        next: { revalidate: 900 },
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(7000),
      });
      if (!response.ok) throw new Error(`Stock history ${response.status}`);
      const payload = await response.json();
      results.push(...((payload?.spark?.result ?? []) as SparkResponse[]));
    } catch {
      continue;
    }
  }
  return results;
}

export async function getStockSnapshots(definitions: StockDefinition[], period: Period = "day") {
  try {
    const sparkResults = await fetchSpark(definitions, period);
    const bySymbol = new Map(sparkResults.map((item) => [item.symbol, item]));

    return definitions.map((definition, index) => {
      const result = bySymbol.get(definition.symbol)?.response?.[0];
      if (!result) return fallbackSnapshot(definition, index);
      const meta = result?.meta ?? {};
      const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      );
      const price = Number(meta.regularMarketPrice) || closes.at(-1) || fallbackPrices[definition.symbol] || 0;
      const previousClose = Number(meta.chartPreviousClose) || closes.at(-2) || price;
      const periodStart = period === "day" ? previousClose : closes[0] || previousClose;
      const periodChange = periodStart ? ((price - periodStart) / periodStart) * 100 : 0;
      const dayChange = price - previousClose;
      const dayChangePercent = previousClose ? (dayChange / previousClose) * 100 : 0;

      return {
        ...definition,
        price,
        change: dayChange,
        changePercent: dayChangePercent,
        periodChange,
      } satisfies StockSnapshot;
    });
  } catch {
    return definitions.map(fallbackSnapshot);
  }
}

export async function getWatchlistQuotes(symbols = defaultWatchlist) {
  const normalized = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].slice(0, 30);
  const definitions = normalized.map((symbol) =>
    stockUniverse.find((stock) => stock.symbol === symbol) ?? { symbol, name: symbol, sector: "Other" },
  );
  return getStockSnapshots(definitions, "day");
}

export async function getMoversData(period: Period): Promise<StocksData> {
  const snapshots = await getStockSnapshots(stockUniverse, period);
  const ranked = [...snapshots].sort((a, b) => b.periodChange - a.periodChange);
  const sectors = [...new Set(stockUniverse.map((stock) => stock.sector))].map((sector) => ({
    sector,
    stocks: snapshots
      .filter((stock) => stock.sector === sector)
      .sort((a, b) => Math.abs(b.periodChange) - Math.abs(a.periodChange)),
  }));
  return { period, gainers: ranked.slice(0, 20), decliners: ranked.slice(-20).reverse(), sectors };
}

type NasdaqRow = Record<string, string | null>;

function mapIpo(row: NasdaqRow, status: IpoRecord["status"]): IpoRecord {
  return {
    symbol: row.proposedTickerSymbol || "TBA",
    company: row.companyName || "To be announced",
    exchange: row.proposedExchange || "US Market",
    price: row.proposedSharePrice || "TBA",
    date: row.expectedPriceDate || row.pricedDate || row.filedDate || "TBA",
    offerAmount: row.dollarValueOfSharesOffered || "TBA",
    status,
  };
}

const ipoFallback: IpoRecord[] = [
  { symbol: "DPC", company: "DPC Holdings Ltd", exchange: "NYSE", price: "$28-$32", date: "Expected soon", offerAmount: "$858.7M", status: "Upcoming" },
  { symbol: "KARD", company: "Kardigan, Inc.", exchange: "NASDAQ", price: "$16", date: "Expected soon", offerAmount: "$400M", status: "Upcoming" },
  { symbol: "QNT", company: "Quantinuum Inc.", exchange: "NASDAQ", price: "$60", date: "Recently priced", offerAmount: "$1.68B", status: "Priced" },
  { symbol: "INIO", company: "INNIO N.V.", exchange: "NASDAQ", price: "$27", date: "Recently priced", offerAmount: "$2.43B", status: "Priced" },
];

export async function getIpoCalendar(): Promise<IpoRecord[]> {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  try {
    const response = await fetch(`https://api.nasdaq.com/api/ipo/calendar?date=${date}`, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json,text/plain,*/*",
        Origin: "https://www.nasdaq.com",
        Referer: "https://www.nasdaq.com/market-activity/ipos",
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`IPO calendar ${response.status}`);
    const payload = await response.json();
    const upcoming = (payload?.data?.upcoming?.upcomingTable?.rows ?? []) as NasdaqRow[];
    const priced = (payload?.data?.priced?.rows ?? []) as NasdaqRow[];
    const filed = (payload?.data?.filed?.rows ?? []) as NasdaqRow[];
    const records = [
      ...upcoming.map((row) => mapIpo(row, "Upcoming")),
      ...priced.map((row) => mapIpo(row, "Priced")),
      ...filed.slice(0, 8).map((row) => mapIpo(row, "Filed")),
    ];
    return records.length ? records.slice(0, 24) : ipoFallback;
  } catch {
    return ipoFallback;
  }
}
