import type { Metadata } from "next";
import LookoutsDashboard from "@/components/LookoutsDashboard";

export const metadata: Metadata = {
  title: "Lookouts | Raj Peswani's Tracker",
  description: "Daily model-assisted stock research with transparent due diligence, scenarios, ratios, risks, and news.",
};

export default function LookoutsPage() {
  return <LookoutsDashboard />;
}
