import { getDailyLookouts } from "@/lib/lookouts";

export const maxDuration = 60;

export async function GET() {
  return Response.json(await getDailyLookouts());
}
