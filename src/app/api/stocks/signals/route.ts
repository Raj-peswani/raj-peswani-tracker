import type { NextRequest } from "next/server";
import { getStockSignals } from "@/lib/stock-signals";

export async function GET(request: NextRequest) {
  const symbols = request.nextUrl.searchParams.get("symbols")?.split(",") ?? [];
  return Response.json({ signals: await getStockSignals(symbols) });
}
