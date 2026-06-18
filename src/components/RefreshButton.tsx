"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#d7d9d2] bg-white px-4 text-sm font-medium text-[#30332e] shadow-sm transition hover:-translate-y-0.5 hover:border-[#b9bdb4] hover:shadow-md disabled:cursor-wait disabled:opacity-60"
      disabled={pending}
    >
      <svg className={`h-4 w-4 ${pending ? "animate-spin" : "transition group-hover:rotate-45"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 6v5h-5M4 18v-5h5" />
        <path d="M18.4 9A7 7 0 0 0 6.2 6.2L4 8m2 7a7 7 0 0 0 11.8 2.8L20 16" />
      </svg>
      {pending ? "Updating" : "Refresh"}
    </button>
  );
}
