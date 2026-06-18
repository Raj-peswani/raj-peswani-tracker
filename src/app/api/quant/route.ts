import type { NextRequest } from "next/server";
import { getQuantAnalysis } from "@/lib/quant-analysis";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const analysis = await getQuantAnalysis(symbol);
  return analysis ? Response.json({ analysis }) : Response.json({ error: "Ticker not found" }, { status: 404 });
}
