import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "raj-tracker-auth";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
  redirect("/login");
}
