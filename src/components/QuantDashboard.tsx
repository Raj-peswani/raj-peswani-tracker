"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import IndexFundBuilder from "@/components/IndexFundBuilder";
import type { StockSearchResult } from "@/lib/stock-search";
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

function ForecastCard({ label, currentPrice, forecast }: { label: string; currentPrice: number; forecast: QuantAnalysis["forecasting"]["day20"] }) {
  const range = Math.max(forecast.high - forecast.low, 0.01);
  const currentPosition = Math.max(0, Math.min(100, ((currentPrice - forecast.low) / range) * 100));
  const medianPosition = Math.max(0, Math.min(100, ((forecast.median - forecast.low) / range) * 100));
  return <article className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex items-start justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Monte Carlo</p><h3 className="mt-1 text-lg font-semibold">{label}</h3></div><span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${forecast.probabilityGain >= 50 ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}>{forecast.probabilityGain.toFixed(0)}% gain odds</span></div><p className="mt-5 font-mono text-3xl font-semibold">{money(forecast.median)}</p><p className="mt-1 text-xs text-[#777d74]">Median terminal price</p><div className="relative mt-6 h-2 rounded-full bg-[#e5e8e1]"><span className="absolute -top-1 h-4 w-0.5 bg-[#e85d24]" style={{ left: `${currentPosition}%` }} /><span className="absolute -top-1 h-4 w-1 rounded-full bg-[#14845c]" style={{ left: `${medianPosition}%` }} /></div><div className="mt-2 flex justify-between font-mono text-[10px] text-[#858b82]"><span>P10 {money(forecast.low)}</span><span>P90 {money(forecast.high)}</span></div></article>;
}

export default function QuantDashboard({ initialAnalysis }: { initialAnalysis: QuantAnalysis }) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [query, setQuery] = useState(initialAnalysis.symbol);
  const [selectedSymbol, setSelectedSymbol] = useState(initialAnalysis.symbol);
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchQuery = query.trim();
    if (selectedSymbol || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/stock-search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : { results: [] })
        .then((data: { results?: StockSearchResult[] }) => {
          setSuggestions(data.results ?? []);
          setSuggestionsOpen(true);
        })
        .catch(() => undefined);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedSymbol]);

  function chooseSuggestion(result: StockSearchResult) {
    setQuery(result.name);
    setSelectedSymbol(result.symbol);
    setSuggestionsOpen(false);
  }

  async function runAnalysis(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      let symbol = selectedSymbol;
      if (!symbol) {
        const tickerCandidate = query.trim().toUpperCase();
        const searchResponse = await fetch(`/api/stock-search?q=${encodeURIComponent(query.trim())}`);
        if (!searchResponse.ok) throw new Error("Search unavailable");
        const searchData = await searchResponse.json() as { results?: StockSearchResult[] };
        const results = searchData.results ?? [];
        symbol = results.find((result) => result.symbol === tickerCandidate)?.symbol
          ?? results[0]?.symbol
          ?? (/^[A-Z0-9.-]{1,12}$/.test(tickerCandidate) ? tickerCandidate : "");
      }
      if (!symbol) throw new Error("Company not found");
      const response = await fetch(`/api/quant?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error("Ticker not found");
      const data = await response.json();
      setAnalysis(data.analysis);
      setQuery(data.analysis.name);
      setSelectedSymbol(data.analysis.symbol);
      setSuggestionsOpen(false);
    } catch {
      setError("Analysis is unavailable for that company or ticker. Check the search and try again.");
    } finally {
      setLoading(false);
    }
  }

  const scoreTone = analysis.setupScore >= 70 ? "text-[#087553]" : analysis.setupScore < 45 ? "text-[#bc3c2c]" : "text-[#9a6500]";
  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8"><Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold tracking-tight sm:block">Raj Peswani&apos;s Tracker</span></Link><nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:text-xs"><Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">News</Link><Link href="/stocks" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Stocks</Link><Link href="/market-bets" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Market Bets</Link><span className="rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Quant</span><Link href="/lookouts" className="rounded-full px-2.5 py-2 text-[#666c63] sm:px-4">Lookouts</Link></nav><span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] md:block">Swing lab</span></div></header>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="py-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Technical + fundamental engine</p><h1 className="mt-1 text-4xl font-semibold tracking-[-0.05em]">Quant Swing Lab</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6f756c]">A transparent setup score for research—not an order recommendation. Confirm catalysts, liquidity, and your own risk tolerance before trading.</p></div><form onSubmit={runAnalysis} className="relative w-full max-w-md"><div className="flex items-center overflow-hidden rounded-full border border-[#cfd2ca] bg-white focus-within:border-[#8c9188] focus-within:ring-4 focus-within:ring-[#e85d24]/10"><span className="pl-4 text-[#858b82]" aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setSelectedSymbol(""); }} onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)} aria-label="Search a company or ticker for quant analysis" placeholder="Search Apple, CoreWeave, NVDA…" autoComplete="off" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-[#9ba097]" /><button type="submit" disabled={loading} className="m-1 rounded-full bg-[#20231f] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#e85d24] disabled:opacity-50">{loading ? "Running…" : "Analyze"}</button></div>{suggestionsOpen && suggestions.length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[#d5d8d0] bg-white p-1.5 shadow-[0_18px_50px_rgba(31,35,29,0.18)]">{suggestions.map((result) => <button key={result.symbol} type="button" onClick={() => chooseSuggestion(result)} className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f2f4ef]"><span className="min-w-0"><strong className="block truncate text-sm">{result.name}</strong><span className="mt-0.5 block truncate text-[10px] text-[#858b82]">{result.exchange}</span></span><span className="shrink-0 rounded-full bg-[#eef0ec] px-2.5 py-1 font-mono text-[10px] font-bold">{result.symbol}</span></button>)}</div>}<p className="mt-2 px-3 text-[10px] text-[#858b82]">Search by company name or ticker symbol</p></form></div>{error && <p className="mt-4 text-sm text-[#bc3c2c]">{error}</p>}</section>

        <section className="grid gap-6 border-t border-[#d8dad3] py-9 lg:grid-cols-[1.25fr_.75fr]"><div className="rounded-3xl border border-[#daddd4] bg-white/75 p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-baseline gap-3"><h2 className="font-mono text-4xl font-bold">{analysis.symbol}</h2><span className="text-sm text-[#747a71]">{analysis.name}</span></div><p className="mt-4 font-mono text-3xl font-semibold">{money(analysis.price)}</p><p className={`mt-1 font-mono text-sm ${analysis.changePercent >= 0 ? "text-[#087553]" : "text-[#bc3c2c]"}`}>{percent(analysis.changePercent)} today</p></div><div className="text-center sm:text-right"><p className={`font-mono text-7xl font-semibold tracking-[-0.08em] ${scoreTone}`}>{analysis.setupScore}</p><p className="mt-1 text-lg font-semibold">{analysis.setupLabel}</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#92978e]">Composite / 100</p></div></div><div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ScoreCard label="Trend" score={analysis.scores.trend} /><ScoreCard label="Momentum" score={analysis.scores.momentum} /><ScoreCard label="Risk quality" score={analysis.scores.risk} /><ScoreCard label="Fundamentals" score={analysis.scores.fundamentals} /></div></div>

          <aside className="rounded-3xl border border-[#daddd4] bg-[#20231f] p-6 text-[#f4f5f1]"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ef8a61]">Swing planning map</p><div className="mt-5 space-y-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Current</p><p className="mt-1 font-mono text-2xl font-semibold">{money(analysis.price)}</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Support</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.support)}</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#aeb4aa]">Resistance</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.resistance)}</p></div><div className="rounded-2xl bg-[#5f2722] p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#efb3aa]">Stop reference</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.stopReference)}</p></div><div className="rounded-2xl bg-[#155842] p-4"><p className="text-[9px] uppercase tracking-[0.14em] text-[#a5dfca]">2R reference</p><p className="mt-1 font-mono font-semibold">{money(analysis.technical.twoRTarget)}</p></div></div></div><p className="mt-5 text-xs leading-relaxed text-[#aeb4aa]">ATR-based reference levels are planning aids, not guaranteed exits or price targets.</p></aside>
        </section>

        <section className="grid gap-6 border-t border-[#d8dad3] py-9 lg:grid-cols-3"><div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Technicals</p><div className="mt-3"><Metric label="SMA 20" value={money(analysis.technical.sma20)} /><Metric label="SMA 50" value={money(analysis.technical.sma50)} /><Metric label="SMA 200" value={money(analysis.technical.sma200)} /><Metric label="RSI 14" value={analysis.technical.rsi14.toFixed(1)} /><Metric label="MACD / signal" value={`${analysis.technical.macd.toFixed(2)} / ${analysis.technical.signal.toFixed(2)}`} /><Metric label="20-day return" value={percent(analysis.technical.return20Day)} /></div></div>
          <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Risk & positioning</p><div className="mt-3"><Metric label="ATR 14" value={money(analysis.technical.atr14)} /><Metric label="Annualized volatility" value={percent(analysis.technical.volatility)} /><Metric label="Call open interest" value={analysis.options.callPercent === null ? "N/A" : `${analysis.options.callPercent}%`} /><Metric label="Put open interest" value={analysis.options.putPercent === null ? "N/A" : `${analysis.options.putPercent}%`} /><Metric label="Analyst consensus" value={analysis.options.analystRating ?? "N/A"} note={analysis.options.analystCount ? `${analysis.options.analystCount} analysts` : undefined} /></div></div>
          <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Fundamentals</p><div className="mt-3"><Metric label="Sector" value={analysis.fundamentals.sector} /><Metric label="Industry" value={analysis.fundamentals.industry} /><Metric label="Revenue growth" value={percent(analysis.fundamentals.revenueGrowth)} /><Metric label="Net income growth" value={percent(analysis.fundamentals.netIncomeGrowth)} /><Metric label="Profit margin" value={percent(analysis.fundamentals.profitMargin)} /><Metric label="1-year target upside" value={percent(analysis.fundamentals.targetUpside)} /></div></div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Probabilistic forecast</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Monte Carlo & Risk-Adjusted Return</h2><p className="mt-2 max-w-3xl text-sm text-[#777d74]">{analysis.forecasting.simulations.toLocaleString()} deterministic simulation paths using the stock&apos;s recent daily drift and volatility. Ranges are scenarios, not price promises.</p></div><div className="grid gap-4 lg:grid-cols-[.65fr_1fr_1fr]"><article className="rounded-2xl border border-[#dfe1da] bg-[#20231f] p-5 text-[#f4f5f1]"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#ef8a61]">Annualized Sharpe</p><p className="mt-5 font-mono text-5xl font-semibold">{analysis.forecasting.sharpeRatio.toFixed(2)}</p><p className="mt-2 text-sm text-[#aeb4aa]">Return per unit of volatility</p><div className="mt-6 border-t border-white/15 pt-4"><p className="text-[10px] text-[#aeb4aa]">Risk-free assumption</p><p className="mt-1 font-mono font-semibold">{analysis.forecasting.riskFreeRate.toFixed(1)}%</p></div></article><ForecastCard label="20 trading days" currentPrice={analysis.price} forecast={analysis.forecasting.day20} /><ForecastCard label="60 trading days" currentPrice={analysis.price} forecast={analysis.forecasting.day60} /></div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Recurring structure</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Swing Pattern Detection</h2><p className="mt-2 max-w-3xl text-sm text-[#777d74]">Detects alternating local highs and lows—useful for repeated moves such as 100 → 80 → 105 → 78.</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${analysis.pattern.detected ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#eef0ec] text-[#61675e]"}`}>{analysis.pattern.detected ? "Recurring cycle detected" : "No stable cycle"}</span></div><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-sm font-semibold">{analysis.pattern.phase}</p><div className="mt-4"><Metric label="Average swing" value={percent(analysis.pattern.averageSwing)} /><Metric label="Average half-cycle" value={`${analysis.pattern.averageCycleDays.toFixed(1)} days`} /><Metric label="Pattern consistency" value={`${analysis.pattern.consistency.toFixed(0)}%`} /><Metric label="Next pattern reference" value={analysis.pattern.nextReference === null ? "N/A" : money(analysis.pattern.nextReference)} note="Historical rhythm reference, not a forecast" /></div></div><div className="overflow-x-auto rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex min-w-[620px] items-center gap-2">{analysis.pattern.pivots.map((pivot, index) => <div key={`${pivot.date}-${pivot.type}-${pivot.price}`} className="contents"><div className={`min-w-24 rounded-xl p-3 text-center ${pivot.type === "high" ? "bg-[#e6f4ed]" : "bg-[#faeae7]"}`}><p className={`text-[9px] font-bold uppercase tracking-[0.12em] ${pivot.type === "high" ? "text-[#087553]" : "text-[#bc3c2c]"}`}>{pivot.type}</p><p className="mt-1 font-mono text-sm font-semibold">{money(pivot.price)}</p><p className="mt-1 font-mono text-[9px] text-[#858b82]">{pivot.date.slice(5)}</p></div>{index < analysis.pattern.pivots.length - 1 && <span className="text-[#a4a9a0]">→</span>}</div>)}</div></div></div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Signal ledger</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">What Drives the Score</h2></div><div className="grid gap-4 md:grid-cols-2">{analysis.signals.map((signal) => <article key={signal.label} className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${signal.tone === "positive" ? "bg-[#14936a]" : signal.tone === "negative" ? "bg-[#c74b3a]" : "bg-[#d6a33a]"}`} /><h3 className="font-semibold">{signal.label}</h3></div><p className="mt-3 text-sm leading-relaxed text-[#6f756c]">{signal.detail}</p></article>)}</div></section>

        <IndexFundBuilder />
      </div>
      <footer className="mt-6 bg-[#20231f] text-[#f4f5f1]"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-sm font-semibold">Sources: Yahoo Finance / Nasdaq / listed options open interest</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e948b]">Research tool / Not investment advice</p></div></footer>
    </main>
  );
}
