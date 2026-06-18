import type { Metadata } from "next";
import QuantDashboard from "@/components/QuantDashboard";
import { getQuantAnalysis } from "@/lib/quant-analysis";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Quant Swing Lab | Raj Peswani's Tracker",
  description: "Searchable technical, options, analyst, risk, and fundamental analysis for swing-trade research.",
};

export default async function QuantPage() {
  const analysis = await getQuantAnalysis("AAPL");
  if (!analysis) throw new Error("Default quant analysis is temporarily unavailable.");
  return <QuantDashboard initialAnalysis={analysis} />;
}
