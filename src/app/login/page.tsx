import Link from "next/link";

export const metadata = {
  title: "Login | Raj Peswani's Tracker",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/";
  const hasError = params.error === "1";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-[2rem] border border-[#daddd4] bg-white/80 p-7 shadow-[0_24px_80px_rgba(31,35,29,0.12)] backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#20231f] text-sm font-bold text-white">RP</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e85d24]">Private access</p>
            <h1 className="text-xl font-semibold tracking-[-0.03em]">Raj Peswani&apos;s Tracker</h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-[#686e65]">
          This dashboard is locked. Enter the tracker password to continue.
        </p>

        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-xs font-semibold text-[#555b52]">Password</span>
            <input
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-[#cfd2ca] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#20231f] focus:ring-4 focus:ring-[#e85d24]/10"
              placeholder="Enter password"
            />
          </label>
          {hasError && <p className="rounded-2xl border border-[#e8c9c3] bg-[#faeae7] p-3 text-xs text-[#8b382d]">Wrong password. Try again.</p>}
          <button type="submit" className="w-full rounded-full bg-[#20231f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e85d24]">
            Unlock tracker
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-[#969b92]">
          Lost the password? Update `TRACKER_PASSWORD` in Vercel.
        </p>
        <Link href="/" className="sr-only">Back to tracker</Link>
      </section>
    </main>
  );
}
