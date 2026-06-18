import type { NextRequest } from "next/server";
import { getMarketBetsData } from "@/lib/market-bets";

export async function GET(request: NextRequest) {
  const forceMarket = request.nextUrl.searchParams.get("refresh") === "1";
  return Response.json(await getMarketBetsData(forceMarket));
}
