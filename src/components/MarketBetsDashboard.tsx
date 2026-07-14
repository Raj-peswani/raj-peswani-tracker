"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { CountryMover, InstitutionalOption, InstitutionalSearchResult, MarketBetsData, OptionSentiment, PoliticalTrade } from "@/types";

function number(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function CountryCard({ mover, rank }: { mover: CountryMover; rank: number }) {
  const positive = mover.monthlyChange >= 0;
  return (
    <article className="rounded-2xl border border-[#dfe1da] bg-white/75 p-5">
      <div className="flex items-start justify-between"><span className="font-mono text-[10px] text-[#969b92]">#{rank}</span><span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${positive ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}>{positive ? "+" : ""}{mover.monthlyChange.toFixed(2)}%</span></div>
      <h3 className="mt-6 text-xl font-semibold tracking-tight">{mover.country}</h3>
      <p className="mt-1 text-sm text-[#747a71]">{mover.index}</p>
      <p className="mt-4 font-mono text-sm font-semibold text-[#333731]">{number(mover.value, 2)}</p>
    </article>
  );
}

function PoliticalTrades({ trades }: { trades: PoliticalTrade[] }) {
  if (!trades.length) {
    return <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-6 text-sm text-[#666c63]">No machine-readable House purchases were available in the latest official PTR batch. Scanned filings are intentionally excluded rather than guessed.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dfe1da] bg-white/70">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[1.2fr_100px_1.5fr_1fr_110px_110px] gap-4 border-b border-[#dfe1da] bg-[#f1f3ee] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#81877e]"><span>Politician</span><span>Ticker</span><span>Asset</span><span>Amount range</span><span>Traded</span><span>Filed</span></div>
        <div className="divide-y divide-[#e3e5de]">{trades.map((trade) => (
          <a key={`${trade.sourceUrl}-${trade.transactionDate}-${trade.asset}-${trade.amount}`} href={trade.sourceUrl} target="_blank" rel="noreferrer" className="grid grid-cols-[1.2fr_100px_1.5fr_1fr_110px_110px] items-center gap-4 px-5 py-4 text-sm transition hover:bg-[#f6f7f3]">
            <span><strong className="block font-semibold">{trade.politician}</strong><small className="text-[#858b82]">House / {trade.state}</small></span>
            <span className="font-mono font-bold text-[#e85d24]">{trade.ticker ?? "N/A"}</span><span className="truncate text-[#555b52]">{trade.asset}</span><span className="font-mono text-xs">{trade.amount}</span><span className="font-mono text-xs text-[#6f756c]">{trade.transactionDate}</span><span className="font-mono text-xs text-[#6f756c]">{trade.filingDate}</span>
          </a>
        ))}</div>
      </div>
    </div>
  );
}

function SentimentCard({ sentiment }: { sentiment: OptionSentiment }) {
  const bullish = sentiment.callPercent >= sentiment.putPercent;
  return (
    <article className="overflow-hidden rounded-2xl border border-[#dfe1da] bg-white/75 p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8a9087]">Call / put value</p><h3 className="mt-2 text-xl font-semibold tracking-tight">{sentiment.theme}</h3></div><span className={`rounded-full px-2.5 py-1 font-mono text-[9px] font-bold ${bullish ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}>{bullish ? "CALL LEAN" : "PUT LEAN"}</span></div>
      <div className="mt-6 flex items-end justify-between"><div><span className="font-mono text-3xl font-semibold text-[#087553]">{sentiment.callPercent}%</span><span className="ml-1 text-xs font-semibold text-[#087553]">calls</span></div><p className="font-mono text-sm font-semibold text-[#bc3c2c]">{sentiment.putPercent}% puts</p></div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#faeae7]"><span className="bg-[#14936a]" style={{ width: `${sentiment.callPercent}%` }} /></div>
      <div className="mt-4 flex justify-between font-mono text-[10px] text-[#7a8077]"><span>Calls {money(sentiment.callValue)}</span><span>Puts {money(sentiment.putValue)}</span></div>
    </article>
  );
}

function OptionCard({ position }: { position: InstitutionalOption }) {
  const bullish = position.optionType === "CALL";
  return (
    <a href={position.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[#dfe1da] bg-white/70 p-4 transition hover:-translate-y-0.5 hover:border-[#bfc3ba] hover:shadow-md">
      <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#30342d]">{position.manager}</span><span className={`rounded-full px-2 py-1 font-mono text-[9px] font-bold ${bullish ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}>{position.optionType}</span></div>
      <h3 className="mt-4 min-h-10 text-sm font-semibold leading-snug">{position.ticker && <span className="mr-2 font-mono text-[#e85d24]">{position.ticker}</span>}{position.issuer}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e1e3dc] pt-3"><div><p className="text-[9px] uppercase tracking-[0.12em] text-[#92978e]">Reported value</p><p className="mt-1 font-mono text-sm font-semibold">{money(position.reportedValue)}</p></div><div><p className="text-[9px] uppercase tracking-[0.12em] text-[#92978e]">Shares</p><p className="mt-1 font-mono text-sm font-semibold">{number(position.shares)}</p></div></div>
    </a>
  );
}

function SearchResults({ result }: { result: InstitutionalSearchResult }) {
  const total = result.calls.length + result.puts.length;
  if (!total) return <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-6 text-sm text-[#666c63]">No CALL or PUT positions for {result.symbol} were found in the latest tracked JPMorgan, Goldman Sachs, or Citigroup 13F filings.</div>;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold text-[#087553]">Calls</h3><span className="font-mono text-xs text-[#858b82]">{result.calls.length} disclosed</span></div><div className="grid gap-3 sm:grid-cols-2">{result.calls.map((position) => <OptionCard key={`search-call-${position.manager}-${position.reportedValue}-${position.shares}`} position={position} />)}</div>{!result.calls.length && <p className="rounded-2xl border border-[#dfe1da] bg-white/60 p-5 text-sm text-[#777d74]">No tracked calls found.</p>}</div>
      <div><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold text-[#bc3c2c]">Puts</h3><span className="font-mono text-xs text-[#858b82]">{result.puts.length} disclosed</span></div><div className="grid gap-3 sm:grid-cols-2">{result.puts.map((position) => <OptionCard key={`search-put-${position.manager}-${position.reportedValue}-${position.shares}`} position={position} />)}</div>{!result.puts.length && <p className="rounded-2xl border border-[#dfe1da] bg-white/60 p-5 text-sm text-[#777d74]">No tracked puts found.</p>}</div>
    </div>
  );
}

export default function MarketBetsDashboard({ data: initialData }: { data: MarketBetsData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<InstitutionalSearchResult | null>(null);
  const [searchError, setSearchError] = useState("");
  const updated = new Date(data.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });

  async function refreshMarket() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/market-bets?refresh=1");
      if (response.ok) {
        const update = await response.json() as Pick<MarketBetsData, "countryMovers" | "updatedAt">;
        setData((current) => ({ ...current, ...update }));
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function searchPositions(event: FormEvent) {
    event.preventDefault();
    const symbol = query.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    if (!symbol) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(`/api/market-bets/search?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) throw new Error("Search unavailable");
      setSearchResult(await response.json());
    } catch {
      setSearchError("Institutional search is temporarily unavailable.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold tracking-tight text-[#292c27] sm:block">Raj Peswani&apos;s Tracker</span></Link>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:gap-2 sm:text-xs"><Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">News</Link><Link href="/stocks" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Stocks</Link><span className="whitespace-nowrap rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Market Bets</span><Link href="/quant" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Quant</Link><Link href="/lookouts" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Lookouts</Link><Link href="/strong-buys" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Strong Buys</Link></nav>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] md:block">Public filings</span>
      </div></header>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="flex flex-col gap-4 py-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Positioning monitor</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Market Bets</h1></div><div className="flex items-center gap-3"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8f86]">Updated {updated}</p><button type="button" onClick={refreshMarket} disabled={refreshing} className="rounded-full border border-[#cfd2ca] bg-white px-4 py-2 text-xs font-semibold transition hover:border-[#959b91] disabled:opacity-50">{refreshing ? "Refreshing…" : "Refresh market"}</button></div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Institutional options pulse</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Calls vs. Puts</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#747a71]">Share of disclosed option value across tracked JPMorgan, Goldman Sachs, and Citigroup 13F positions. This is delayed institutional positioning—not live options flow.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.optionSentiment.map((sentiment) => <SentimentCard key={sentiment.theme} sentiment={sentiment} />)}</div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Institution finder</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Search Calls & Puts by Stock</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#747a71]">Search the latest tracked bank 13F option disclosures. Results identify reporting managers—not the companies themselves—and can be hedges or spread legs.</p></div><form onSubmit={searchPositions} className="mb-6 flex max-w-xl items-center overflow-hidden rounded-full border border-[#d5d8d0] bg-white focus-within:border-[#8c9188]"><input value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Ticker e.g. AAPL" aria-label="Institutional position ticker" className="min-w-0 flex-1 bg-transparent px-5 py-3 font-mono text-sm uppercase outline-none" /><button type="submit" disabled={searching} className="m-1 rounded-full bg-[#20231f] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e85d24] disabled:opacity-50">{searching ? "Searching…" : "Search filings"}</button></form>{searchError && <p className="text-sm text-[#bc3c2c]">{searchError}</p>}{searchResult && <><div className="mb-4 flex items-baseline gap-3"><h3 className="text-2xl font-semibold">{searchResult.symbol}</h3><p className="text-sm text-[#777d74]">{searchResult.companyName}</p></div><SearchResults result={searchResult} /></>}</section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Global momentum</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Top Country Indexes / 1 Month</h2></div>
          {data.countryMovers.length ? <><div className="grid gap-4 md:grid-cols-3">{data.countryMovers.slice(0, 3).map((mover, index) => <CountryCard key={mover.symbol} mover={mover} rank={index + 1} />)}</div><details className="mt-4 rounded-2xl border border-[#dfe1da] bg-white/60"><summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Full country ranking ({data.countryMovers.length})</summary><div className="divide-y divide-[#e2e4dd] border-t border-[#dfe1da] px-5">{data.countryMovers.map((mover, index) => <div key={mover.symbol} className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-4 py-3 text-sm"><span className="font-mono text-[10px] text-[#969b92]">{index + 1}</span><span><strong>{mover.country}</strong><small className="ml-2 text-[#858b82]">{mover.index}</small></span><span className="font-mono text-xs">{number(mover.value, 2)}</span><span className={`font-mono text-xs font-semibold ${mover.monthlyChange >= 0 ? "text-[#087553]" : "text-[#bc3c2c]"}`}>{mover.monthlyChange >= 0 ? "+" : ""}{mover.monthlyChange.toFixed(2)}%</span></div>)}</div></details></> : <p className="rounded-2xl border border-[#dfe1da] bg-white/70 p-6 text-sm text-[#666c63]">Country-index feed is temporarily unavailable.</p>}
        </section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">STOCK Act disclosures</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Politician Purchases</h2><p className="mt-2 max-w-3xl text-sm text-[#747a71]">Official House periodic transaction reports. Amounts are ranges and filings may arrive weeks after the trade.</p></div><PoliticalTrades trades={data.politicalTrades} /></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#087553]">SEC 13F / CALLS</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Institutional Bullish Signals</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#747a71]">Largest disclosed call-option positions from the tracked banks. Calls can also be part of hedges or spreads, and 13F filings are quarterly and delayed.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.institutionalCalls.map((position) => <OptionCard key={`${position.sourceUrl}-${position.issuer}-${position.reportedValue}-${position.shares}`} position={position} />)}</div></section>

        <section className="border-t border-[#d8dad3] py-9"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">SEC 13F / PUTS</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Institutional Bearish Signals</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#747a71]">These are disclosed put-option positions, not confirmed short sales. A put can be a hedge, spread leg, or directional bet; 13F filings are quarterly and delayed.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.institutionalPuts.map((position) => <OptionCard key={`${position.sourceUrl}-${position.issuer}-${position.reportedValue}-${position.shares}`} position={position} />)}</div></section>
      </div>

      <footer className="mt-6 bg-[#20231f] text-[#f4f5f1]"><div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-sm font-semibold">Sources: House Clerk / SEC EDGAR / Yahoo Finance</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e948b]">Public disclosures / Not investment advice</p></div></footer>
    </main>
  );
}
