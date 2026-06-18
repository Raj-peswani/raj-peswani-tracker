import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StockDetailDashboard from "@/components/StockDetailDashboard";
import { getStockDetail } from "@/lib/stock-detail";

type Props = { params: Promise<{ symbol: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  const ticker = decodeURIComponent(symbol).toUpperCase();
  return { title: `${ticker} Stock | Raj Peswani's Tracker`, description: `${ticker} price chart, market statistics, and latest news.` };
}

export default async function StockDetailPage({ params }: Props) {
  const { symbol } = await params;
  const detail = await getStockDetail(decodeURIComponent(symbol), "1M");
  if (!detail) notFound();
  return <StockDetailDashboard initialDetail={detail} />;
}
