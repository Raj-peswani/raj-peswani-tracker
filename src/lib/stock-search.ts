import { stockUniverse } from "@/lib/stock-universe";

export type StockSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

function localMatches(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return stockUniverse
    .filter((stock) => stock.symbol.toLowerCase().includes(normalized) || stock.name.toLowerCase().includes(normalized))
    .map((stock) => ({ symbol: stock.symbol, name: stock.name, exchange: stock.sector }));
}

export async function searchStocks(queryInput: string): Promise<StockSearchResult[]> {
  const query = queryInput.trim().slice(0, 80);
  if (!query) return [];
  const local = localMatches(query);

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return local.slice(0, 8);
    const payload = await response.json() as { quotes?: Array<Record<string, unknown>> };
    const remote = (payload.quotes ?? [])
      .filter((quote) => ["EQUITY", "ETF"].includes(String(quote.quoteType)) && typeof quote.symbol === "string")
      .map((quote) => ({
        symbol: String(quote.symbol).toUpperCase(),
        name: String(quote.longname || quote.shortname || quote.symbol),
        exchange: String(quote.exchDisp || quote.exchange || "Equity"),
      }));
    return [...local, ...remote]
      .filter((result, index, results) => results.findIndex((candidate) => candidate.symbol === result.symbol) === index)
      .slice(0, 8);
  } catch {
    return local.slice(0, 8);
  }
}
