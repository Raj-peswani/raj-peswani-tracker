"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StrongBuysData, StrongBuyStock } from "@/types";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number | null) {
  return value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function HeaderNav() {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:text-xs">
      <Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">News</Link>
      <Link href="/stocks" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Stocks</Link>
      <Link href="/market-bets" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Market Bets</Link>
      <Link href="/quant" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Quant</Link>
      <Link href="/lookouts" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Lookouts</Link>
      <span className="whitespace-nowrap rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Strong Buys</span>
    </nav>
  );
}

function StrongBuyCard({ stock }: { stock: StrongBuyStock }) {
  return (
    <article className="rounded-3xl border border-[#daddd4] bg-white/75 p-5 shadow-[0_20px_55px_rgba(31,35,29,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#20231f] px-3 py-1 text-[10px] font-semibold text-white">{stock.analystRating}</span>
            <span className="rounded-full bg-[#eef0ec] px-3 py-1 text-[10px] text-[#676d64]">{stock.sector}</span>
            {stock.analystCount !== null && <span className="rounded-full bg-[#eef0ec] px-3 py-1 text-[10px] text-[#676d64]">{stock.analystCount} analysts</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <Link href={`/stocks/${stock.symbol}`} className="font-mono text-3xl font-bold hover:text-[#e85d24]">{stock.symbol}</Link>
            <h2 className="text-lg font-semibold">{stock.name}</h2>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold">{money(stock.price)} <span className={stock.changePercent >= 0 ? "text-sm text-[#087553]" : "text-sm text-[#bc3c2c]"}>{percent(stock.changePercent)}</span></p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
          <div className="rounded-2xl bg-[#e6f4ed] p-4 text-[#087553]"><p className="text-[9px] uppercase tracking-[0.12em]">Quant</p><p className="mt-2 font-mono text-3xl font-semibold">{stock.setupScore}</p></div>
          <div className="rounded-2xl bg-[#f3f5f0] p-4"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Reports</p><p className="mt-2 font-mono text-3xl font-semibold">{stock.reportScore}</p></div>
          <div className="rounded-2xl bg-[#f3f5f0] p-4"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Upside</p><p className="mt-2 font-mono text-2xl font-semibold">{percent(stock.targetUpside)}</p></div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-2 md:grid-cols-3">{stock.reasons.map((reason) => <p key={reason} className="rounded-xl bg-[#f3f5f0] p-3 text-xs leading-relaxed text-[#555b52]">{reason}</p>)}</div>
        <Link href={`/quant?symbol=${stock.symbol}`} className="inline-flex items-center justify-center rounded-full border border-[#20231f] px-5 py-3 text-xs font-semibold hover:bg-[#20231f] hover:text-white">Open Quant →</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-[#777d74]">
        <span className="rounded-full border border-[#daddd4] px-3 py-1">Calls: {stock.callPercent ?? "N/A"}%</span>
        <span className="rounded-full border border-[#daddd4] px-3 py-1">Puts: {stock.putPercent ?? "N/A"}%</span>
      </div>
    </article>
  );
}

export default function StrongBuysDashboard() {
  const [data, setData] = useState<StrongBuysData | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/strong-buys")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Strong buys unavailable")))
      .then(setData)
      .catch(() => setError("The strong-buy scan is temporarily unavailable. Please try again shortly."));
  }, []);

  const filtered = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!data || !cleanQuery) return data?.stocks ?? [];
    return data.stocks.filter((stock) => `${stock.symbol} ${stock.name} ${stock.sector}`.toLowerCase().includes(cleanQuery));
  }, [data, query]);

  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold sm:block">Raj Peswani&apos;s Tracker</span></Link>
          <HeaderNav />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] lg:block">Analyst desk</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="py-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Analyst consensus scanner</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Strong Buys</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#686e65]">Companies with bullish analyst ratings, then checked against Quant setup score, options positioning, annual-report quality, and balance-sheet feedback.</p>
          <p className="mt-2 text-[11px] text-[#969b92]">Educational research only — not investment advice or a recommendation.</p>
        </section>
        <section className="mb-6 grid gap-3 rounded-3xl border border-[#daddd4] bg-white/70 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Daily scan</p><p className="mt-1 text-sm text-[#656b62]">{data ? `${data.stocks.length} names surfaced from ${data.scannedStocks} tracked companies. Updated ${new Date(data.generatedAt).toLocaleString()}.` : "Scanning analyst ratings and cross-checking metrics…"}</p></div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol, company, sector…" className="rounded-full border border-[#cfd2ca] bg-white px-4 py-3 text-sm outline-none focus:border-[#8c9188]" />
        </section>
        {error && <p className="rounded-2xl border border-[#e8c9c3] bg-[#faeae7] p-5 text-sm text-[#8b382d]">{error}</p>}
        {!data && !error && <div className="grid gap-4"><div className="h-44 animate-pulse rounded-3xl bg-[#e8ebe4]" /><div className="h-44 animate-pulse rounded-3xl bg-[#eef0ec]" /></div>}
        {data && <div className="space-y-5">{filtered.map((stock) => <StrongBuyCard key={stock.symbol} stock={stock} />)}{!filtered.length && <p className="rounded-2xl border border-[#daddd4] bg-white/70 p-6 text-sm text-[#656b62]">No strong-buy names match that search.</p>}</div>}
      </div>
      <footer className="mt-12 bg-[#20231f] text-white"><div className="mx-auto max-w-[1500px] px-5 py-7 text-[11px] text-[#aeb4aa] sm:px-8">Strong Buys combines analyst labels with platform-side due diligence; always verify filings, liquidity, and risk yourself.</div></footer>
    </main>
  );
}
