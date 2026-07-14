"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LookoutCandidate, LookoutsData } from "@/types";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number | null) {
  return value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function Ratio({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#e1e3dc] py-2.5 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-[#777d74]">{label}</span>
        <strong className="font-mono text-xs">{value}</strong>
      </div>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const tone = value >= 70 ? "bg-[#e6f4ed] text-[#087553]" : value < 45 ? "bg-[#faeae7] text-[#bc3c2c]" : "bg-[#f3f5f0] text-[#343932]";
  return (
    <div className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-[9px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-2 font-mono text-3xl font-semibold">{value}</p>
      <p className="text-[10px] opacity-70">out of 100</p>
    </div>
  );
}

function HeaderNav() {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:text-xs">
      <Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">News</Link>
      <Link href="/stocks" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Stocks</Link>
      <Link href="/market-bets" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Market Bets</Link>
      <Link href="/quant" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Quant</Link>
      <span className="rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Lookouts</span>
      <Link href="/strong-buys" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Strong Buys</Link>
    </nav>
  );
}

function CandidateCard({ candidate }: { candidate: LookoutCandidate }) {
  const positive = candidate.expectedProfitPercent >= 0;
  return (
    <article className="overflow-hidden rounded-3xl border border-[#daddd4] bg-white/75 shadow-[0_20px_55px_rgba(31,35,29,0.06)]">
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-[#92978e]">#{candidate.rank}</span>
            <span className="rounded-full bg-[#20231f] px-3 py-1 text-[10px] font-semibold text-white">{candidate.classification}</span>
            <span className="rounded-full bg-[#eef0ec] px-3 py-1 text-[10px] text-[#676d64]">{candidate.sector}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <Link href={`/stocks/${candidate.symbol}`} className="font-mono text-3xl font-bold hover:text-[#e85d24]">{candidate.symbol}</Link>
            <h2 className="text-lg font-semibold">{candidate.name}</h2>
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold">{money(candidate.price)}</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-[#f3f5f0] p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Day</p><p className="mt-1 font-mono text-sm font-bold">{percent(candidate.performance.day)}</p></div>
            <div className="rounded-xl bg-[#f3f5f0] p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Month</p><p className="mt-1 font-mono text-sm font-bold">{percent(candidate.performance.month)}</p></div>
            <div className="rounded-xl bg-[#f3f5f0] p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Year</p><p className="mt-1 font-mono text-sm font-bold">{percent(candidate.performance.year)}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#20231f] p-4 text-white"><p className="text-[9px] uppercase tracking-[0.12em] text-[#aeb4aa]">Research score</p><p className="mt-3 font-mono text-4xl font-semibold">{candidate.researchScore}</p><p className="text-[10px] text-[#aeb4aa]">out of 100</p></div>
          <div className="rounded-2xl bg-[#e6f4ed] p-4 text-[#087553]"><p className="text-[9px] uppercase tracking-[0.12em]">Modeled success</p><p className="mt-3 font-mono text-4xl font-semibold">{candidate.probabilitySuccess}%</p><p className="text-[10px]">heuristic probability</p></div>
          <div className="rounded-2xl border border-[#dfe1da] p-4"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Holding window</p><p className="mt-3 font-mono text-lg font-semibold">{candidate.holdingPeriod}</p></div>
          <div className={`rounded-2xl p-4 ${positive ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}><p className="text-[9px] uppercase tracking-[0.12em]">Expected scenario</p><p className="mt-3 font-mono text-2xl font-semibold">{percent(candidate.expectedProfitPercent)}</p><p className="text-[10px]">median target {money(candidate.scenarioTarget)}</p></div>
        </div>
      </div>

      <details className="group border-t border-[#dfe1da]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold sm:px-7">
          <span>Open full due diligence</span>
          <span className="text-lg text-[#8a8f86] transition group-open:rotate-45">+</span>
        </summary>
        <div className="grid gap-6 border-t border-[#e2e4dd] px-5 py-6 sm:px-7 lg:grid-cols-3">
          <section><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Why it surfaced</p><div className="mt-3 space-y-2">{candidate.reasoning.map((reason) => <p key={reason} className="rounded-xl bg-[#f3f5f0] p-3 text-xs leading-relaxed">{reason}</p>)}</div></section>
          <section><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#bc3c2c]">Risks & invalidation</p><div className="mt-3 space-y-2">{candidate.risks.map((risk) => <p key={risk} className="rounded-xl bg-[#faeae7] p-3 text-xs leading-relaxed text-[#7f342a]">{risk}</p>)}</div><div className="mt-3 rounded-xl border border-[#e1e3dc] p-3"><p className="text-[9px] uppercase tracking-[0.12em] text-[#858b82]">Model stop reference</p><p className="mt-1 font-mono font-semibold">{money(candidate.stopReference)} <span className="text-xs text-[#bc3c2c]">({percent(candidate.downsideToStop)})</span></p></div></section>
          <section><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Ratios & positioning</p><div className="mt-2"><Ratio label="Sharpe ratio" value={candidate.ratios.sharpeRatio.toFixed(2)} /><Ratio label="RSI 14" value={candidate.ratios.rsi14.toFixed(1)} /><Ratio label="Annualized volatility" value={percent(candidate.ratios.volatility)} /><Ratio label="Revenue growth" value={percent(candidate.ratios.revenueGrowth)} /><Ratio label="Profit margin" value={percent(candidate.ratios.profitMargin)} /><Ratio label="Current ratio" value={candidate.ratios.currentRatio?.toFixed(2) ?? "N/A"} /><Ratio label="Analyst target upside" value={percent(candidate.ratios.targetUpside)} /><Ratio label="Calls / puts" value={candidate.ratios.callPercent === null ? "N/A" : `${candidate.ratios.callPercent}% / ${candidate.ratios.putPercent}%`} /><Ratio label="Analyst consensus" value={candidate.ratios.analystRating ?? "N/A"} /></div></section>
        </div>
        <section className="border-t border-[#e2e4dd] px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Annual reports + balance sheet</p><h3 className="mt-1 text-xl font-semibold">Buy-metrics feedback for {candidate.symbol}</h3></div><p className="text-[11px] text-[#858b82]">Built from annual financial statement trends when available.</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-3"><ScoreTile label="Annual report" value={candidate.reportFeedback.annualReportScore} /><ScoreTile label="Balance sheet" value={candidate.reportFeedback.balanceSheetScore} /><ScoreTile label="Buy metrics" value={candidate.reportFeedback.buyMetricsScore} /></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#dfe1da] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Annual report feedback</p><div className="mt-3 space-y-2">{candidate.reportFeedback.annualReportNotes.map((note) => <p key={note} className="text-xs leading-relaxed text-[#5f655d]">{note}</p>)}</div></div>
            <div className="rounded-2xl border border-[#dfe1da] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Balance sheet feedback</p><div className="mt-3 space-y-2">{candidate.reportFeedback.balanceSheetNotes.map((note) => <p key={note} className="text-xs leading-relaxed text-[#5f655d]">{note}</p>)}</div></div>
            <div className="rounded-2xl border border-[#dfe1da] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Core buy metrics</p><div className="mt-2"><Ratio label="Net income growth" value={percent(candidate.reportFeedback.metrics.netIncomeGrowth)} /><Ratio label="Equity growth" value={percent(candidate.reportFeedback.metrics.equityGrowth)} /><Ratio label="Debt / equity" value={candidate.reportFeedback.metrics.debtToEquity?.toFixed(2) ?? "N/A"} /><Ratio label="Cash / debt" value={candidate.reportFeedback.metrics.cashToDebt?.toFixed(2) ?? "N/A"} /></div></div>
          </div>
        </section>
        <section className="border-t border-[#e2e4dd] px-5 py-6 sm:px-7">
          <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Relevant news</p><h3 className="mt-1 text-xl font-semibold">Latest coverage for {candidate.symbol}</h3></div><Link href={`/quant?symbol=${candidate.symbol}`} className="text-xs font-semibold text-[#e85d24]">Open Quant →</Link></div>
          {candidate.news.length ? <div className="mt-4 grid gap-3 md:grid-cols-3">{candidate.news.map((story) => <a key={`${story.url}-${story.title}`} href={story.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-[#dfe1da] p-4 transition hover:border-[#aeb3aa] hover:bg-[#f7f8f4]"><p className="text-[10px] text-[#858b82]">{story.source}</p><p className="mt-2 text-sm font-semibold leading-snug">{story.title}</p></a>)}</div> : <p className="mt-4 text-sm text-[#777d74]">No company-specific stories were available in the latest scan.</p>}
        </section>
      </details>
    </article>
  );
}

export default function LookoutsDashboard() {
  const [data, setData] = useState<LookoutsData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/lookouts")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Lookouts unavailable")))
      .then(setData)
      .catch(() => setError("The daily research scan is temporarily unavailable. Please try again shortly."));
  }, []);

  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold sm:block">Raj Peswani&apos;s Tracker</span></Link>
          <HeaderNav />
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] lg:block">Daily diligence</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="py-9">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Daily opportunity research</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Lookouts</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#686e65]">A transparent, model-assisted shortlist built from the market, Quant, options, analyst, annual-report, balance-sheet, pattern, forecasting, and news tools across this platform.</p>
          <p className="mt-2 text-[11px] text-[#969b92]">This is not a recommendation, personalized advice, or a promise of returns. Verify every source and make your own decision.</p>
        </section>
        {error && <p className="rounded-2xl border border-[#e8c9c3] bg-[#faeae7] p-5 text-sm text-[#8b382d]">{error}</p>}
        {!data && !error && <div className="grid gap-4"><div className="h-52 animate-pulse rounded-3xl bg-[#e8ebe4]" /><div className="h-52 animate-pulse rounded-3xl bg-[#eef0ec]" /><p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-[#858b82]">Scanning the tracked market and building due diligence…</p></div>}
        {data && <><section className="mb-7 grid gap-4 rounded-3xl border border-[#daddd4] bg-[#20231f] p-5 text-white md:grid-cols-[.45fr_1.55fr]"><div><p className="text-[9px] uppercase tracking-[0.16em] text-[#aeb4aa]">Universe scanned</p><p className="mt-2 font-mono text-5xl font-semibold">{data.scannedStocks}</p><p className="mt-2 text-xs text-[#aeb4aa]">Updated {new Date(data.generatedAt).toLocaleString()}</p></div><div><p className="text-[9px] uppercase tracking-[0.16em] text-[#aeb4aa]">How the shortlist works</p><div className="mt-3 grid gap-2">{data.methodology.map((item) => <p key={item} className="rounded-xl bg-white/10 p-3 text-xs leading-relaxed text-[#d8ddd4]">{item}</p>)}</div></div></section><div className="space-y-5">{data.candidates.map((candidate) => <CandidateCard key={candidate.symbol} candidate={candidate} />)}</div></>}
      </div>
      <footer className="mt-12 bg-[#20231f] text-white"><div className="mx-auto max-w-[1500px] px-5 py-7 text-[11px] text-[#aeb4aa] sm:px-8">Lookouts is an educational research workflow. Probabilities, targets, holding windows, and risk levels are model outputs—not guarantees or instructions to trade.</div></footer>
    </main>
  );
}
