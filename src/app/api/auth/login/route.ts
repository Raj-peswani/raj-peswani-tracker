import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "raj-tracker-auth";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
  return next.startsWith("/login") ? "/" : next;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const configuredPassword = process.env.TRACKER_PASSWORD?.trim();
  const authToken = process.env.TRACKER_AUTH_TOKEN?.trim();
  const next = safeNext(formData.get("next"));

  if (!configuredPassword || !authToken || password !== configuredPassword) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, authToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

  redirect(next);
}
