import type { NextRequest } from "next/server";
import { getMoversData, getWatchlistQuotes } from "@/lib/stocks";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols");
  if (symbols) {
    const quotes = await getWatchlistQuotes(symbols.split(","));
    return Response.json({ quotes });
  }

  const requestedPeriod = request.nextUrl.searchParams.get("period");
  const period = requestedPeriod === "month" || requestedPeriod === "year" ? requestedPeriod : "day";
  return Response.json(await getMoversData(period));
}
