import { NextRequest } from "next/server";
import { backtestCustomIndex } from "@/lib/index-backtest";
import type { IndexHolding } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { holdings?: IndexHolding[]; period?: "1y" | "3y" | "5y" } | null;
  if (!body?.holdings || !["1y", "3y", "5y"].includes(body.period ?? "")) {
    return Response.json({ error: "Provide at least two holdings and a valid period." }, { status: 400 });
  }
  const result = await backtestCustomIndex(body.holdings, body.period as "1y" | "3y" | "5y");
  if (!result) return Response.json({ error: "Not enough market history was available for this portfolio." }, { status: 422 });
  return Response.json({ result });
}
