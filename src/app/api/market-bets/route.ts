import { getLiveCountryMovers } from "@/lib/market-live";

export async function GET() {
  return Response.json(await getLiveCountryMovers());
}
