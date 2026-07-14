import { getStrongBuys } from "@/lib/strong-buys";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getStrongBuys());
}
