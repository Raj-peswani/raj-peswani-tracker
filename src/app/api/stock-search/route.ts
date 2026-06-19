import { NextRequest } from "next/server";
import { searchStocks } from "@/lib/stock-search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return Response.json({ results: await searchStocks(query) });
}
