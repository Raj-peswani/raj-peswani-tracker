import type { NextRequest } from "next/server";
import { getStockDetail, stockRanges, type StockRange } from "@/lib/stock-detail";

export async function GET(request: NextRequest, { params }: RouteContext<"/api/stocks/[symbol]">) {
  const { symbol } = await params;
  const requestedRange = request.nextUrl.searchParams.get("range") ?? "1M";
  const range = requestedRange in stockRanges ? requestedRange as StockRange : "1M";
  const detail = await getStockDetail(symbol, range);
  return detail ? Response.json(detail) : Response.json({ error: "Stock not found" }, { status: 404 });
}
