import { getDailyLookouts } from "@/lib/lookouts";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await getDailyLookouts();
  return Response.json({ ok: true, generatedAt: data.generatedAt, candidates: data.candidates.length });
}
