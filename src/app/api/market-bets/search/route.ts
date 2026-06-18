import type { NextRequest } from "next/server";
import { searchInstitutionalOptions } from "@/lib/market-bets";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  if (!symbol) return Response.json({ error: "Ticker is required" }, { status: 400 });
  return Response.json(await searchInstitutionalOptions(symbol));
}
