import StocksDashboard from "@/components/StocksDashboard";
import type { Metadata } from "next";
import { defaultWatchlist } from "@/lib/stock-universe";
import { getIpoCalendar, getMoversData, getWatchlistQuotes } from "@/lib/stocks";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Stocks | Raj Peswani's Tracker",
  description: "Editable stock watchlist, US market movers, sector leaders, and new IPOs.",
};

export default async function StocksPage() {
  const [watchlist, movers, ipos] = await Promise.all([
    getWatchlistQuotes(defaultWatchlist),
    getMoversData("day"),
    getIpoCalendar(),
  ]);

  return <StocksDashboard initialWatchlist={watchlist} initialMovers={movers} ipos={ipos} />;
}
