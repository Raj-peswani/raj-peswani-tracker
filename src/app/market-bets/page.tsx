import type { Metadata } from "next";
import MarketBetsDashboard from "@/components/MarketBetsDashboard";
import { getMarketBetsData } from "@/lib/market-bets";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Market Bets | Raj Peswani's Tracker",
  description: "Public politician trades, institutional put positions, and monthly country-index leaders.",
};

export default async function MarketBetsPage() {
  return <MarketBetsDashboard data={await getMarketBetsData()} />;
}
