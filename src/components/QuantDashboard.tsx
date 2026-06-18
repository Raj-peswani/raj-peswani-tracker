"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { QuantAnalysis } from "@/types";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number | null) {
  return value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const tone = score >= 70 ? "text-[#087553]" : score < 45 ? "text-[#bc3c2c]" : "text-[#9a6500]";
  return <article className="rounded-2xl border border-[#dfe1da] bg-white/70 p-4"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#858b82]">{label}</p><div className="mt-3 flex items-end justify-between"><span className={`font-mono text-3xl font-semibold ${tone}`}>{score}</span><span className="font-mono text-[10px] text-[#92978e]">/ 100</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e5e8e1]"><span className="block h-full rounded-full bg-[#e85d24]" style={{ width: `${score}%` }} /></div></article>;
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="border-b border-[#e1e3dc] py-3 last:border-0"><div className="flex items-center justify-between gap-4"><span className="text-xs text-[#777d74]">{label}</span><strong className="font-mono text-sm">{value}</strong></div>{note && <p className="mt-1 text-right text-[10px] text-[#999e95]">{note}</p>}</div>;
}

export default function QuantDashboard({ initialAnalysis }: { initialAnalysis: QuantAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [query, setQuery] = useState(initialAnalysis.symbol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    const symbol = query.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    if (!symbol) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/quant?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error("Ticker not found");
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch {
      setError("Analysis is unavailable for that ticker. Check the symbol and try again.");
    } finally {
      setLoading(false);
    }
  }

  const scoreTone = analysis.setupScore >= 70 ? "text-[#087553]" : analysis.setupScore < 45 ? "text-[#bc3c2c]" : "text-[#9a6500]";
  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold tracking-tight sm:block">Raj Peswani&apos;s Tracker</span></Link><nav className="flex items-center gap-1 rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:text-xs"><Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">News</Link><Link href="/stocks" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Stocks</Link><Link href="/market-bets" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Market Bets</Link><span className="rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Quant</span></nav><span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] md:block">Swing lab</span></div></header>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="py-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Technical + fundamental engine</p><h1 className="mt-1 text-4xl font-semibold tracking-[-0.05em]">Quant Swing Lab</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6f756c]">A transparent setup score for research—not an order recommendation. Confirm catalysts, liquidity, and your own risk tolerance before trading.</p></div><form onSubmit={runAnalysis} className="flex w-full max-w-md items-center overflow-hidden rounded-full border border-[#cfd2ca] bg-white focus-within:border-[#8c9188]"><input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} aria-label="Quant analysis ticker" placeholder="Ticker e.g. NVDA" className="min-w-0 flex-1 bg-transparent px-5 py-3 font-mono text-sm uppercase outline-none" /><button type="submit" disabled={loading} className="m-1 rounded-full bg-[#20231f] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#e85d24] disabled:opacity-50">{loading ? "Running…" : "Analyze"}</button></form></div>{error && <p className="mt-4 text-sm text-[#bc3c2c]">{error}</p>}</section>

        <section className="grid gap-6 border-t border-[#d8dad3] py-9 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-3xl border border-[#daddd4] bg-white/75 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-baseline gap-3"><h2 className="font-mono text-4xl font-bold">{analysis.symbol}</h2><span className="text-sm text-[#747a71]">{analysis.name}</span></div><p className="mt-4 font-mono text-3xl font-semibold">{money(analysis.price)}</p><p className={`mt-1 font-mono text-sm ${analysis.changePercent >= 0 ? "text-[#087553]" : "text-[#bc3c2c]"}`}>{percent(analysis.changePercent)} today</p></div><div className="text-center sm:text-right"><p className={`font-mono text-7xl font-semibold tracking-[-0.08em] ${scoreTone}`}>{analysis.setupScore}</p><p className="mt-1 text-lg font-semibold">{analysis.setupLabel}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#92978e]">Composite / 100</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ScoreCard label="Trend" score={analysis.scores.trend} /><ScoreCard label="Momentum" score={analysis.scores.momentum} /><ScoreCard label="Risk quality" score={analysis.scores.risk} /><ScoreCard label="Fundamentals" score={analysis.scores.fundamentals} /></div></div>

          <aside className="rounded-3xl border border-[#daddd4] bg-[#20231f] p-6 text-[#f4f5f1]"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef8a61]">Swing planning map</p><div className="mt-5 space-y-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Current</p><p className="mt-1 font-mono text-2xl font-semibold">{money(analysis.price)}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Support</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.support)}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Resistance</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.resistance)}</p></div><div className="rounded-2xl bg-[#5f2722] p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#efb3aa]">Stop reference</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.stopReference)}</p></div><div className="rounded-2xl bg-[#155842] p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#a5dfca]">2R reference</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.twoRTarget)}</p></div></div></div><p className="mt-5 text-xs leading-relaxed text-[#aeb4aa]">ATR-based reference levels are planning aids, not guaranteed exits or price targets.</p></aside>
        </section>

        <section className="grid gap-6 border-t border-[#d8dad3] py-9 lg:grid-cols-3"><div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Technicals</p><div className="mt-3"><Metric label="SMA 20" value={money(analysis.technical.sma20)} /><Metric label="SMA 50" value={money(analysis.technical.sma50)} /><Metric label="SMA 200" value={money(analysis.technical.sma200)} /><Metric label="RSI 14" value={analysis.technical.rsi14.toFixed(1)} /><Metric label="MACD / signal" value={`${analysis.technical.macd.toFixed(2)} / ${analysis.technical.signal.toFixed(2)}`} /><Metric label="20-day return" value={percent(analysis.technical.return20Day)} /></div></div>
          <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Risk & positioning</p><div className="mt-3"><Metric label="ATR 14" value={money(analysis.technical.atr14)} /><Metric label="Annualized volatility" value={percent(analysis.technical.volatility)} /><Metric label="Call open interest" value={analysis.options.callPercent === null ? "N/A" : `${analysis.options.callPercent}%`} /><Metric label="Put open interest" value={analysis.options.putPercent === null ? "N/A" : `${analysis.options.putPercent}%`} /><Metric label="Analyst consensus" value={analysis.options.analystRating ?? "N/A"} note={analysis.options.analystCount ? `${analysis.options.analystCount} analysts` : undefined} /></div></div>
          <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Fundamentals</p><div className="mt-3"><Metric label="Sector" value={analysis.fundamentals.sector} /><Metric label="Industry" value={analysis.fundamentals.industry} /><Metric label="Revenue growth" value={percent(analysis.fundamentals.revenueGrowth)} /><Metric label="Net income growth" value={percent(analysis.fundamentals.netIncomeGrowth)} /><Metric label="Profit margin" value={percent(analysis.fundamentals.profitMargin)} /><Metric label="1-year target upside" value={percent(analysis.fundamentals.targetUpside)} /></div></div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Signal ledger</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">What Drives the Score</h2></div><div className="grid gap-4 md:grid-cols-2">{analysis.signals.map((signal) => <article key={signal.label} className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${signal.tone === "positive" ? "bg-[#14936a]" : signal.tone === "negative" ? "bg-[#c74b3a]" : "bg-[#d6a33a]"}`} /><h3 className="font-semibold">{signal.label}</h3></div><p className="mt-3 text-sm leading-relaxed text-[#6f756c]">{signal.detail}</p></article>)}</div></section>
      </div>
      <footer className="mt-6 bg-[#20231f] text-[#f4f5f1]"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-sm font-semibold">Sources: Yahoo Finance / Nasdaq / listed options open interest</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e948b]">Research tool / Not investment advice</p></div></footer>
    </main>
  );
}
