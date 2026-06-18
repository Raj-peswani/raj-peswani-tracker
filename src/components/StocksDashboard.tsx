"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { IpoRecord, SectorMovers, StockSnapshot, StocksData } from "@/types";

const storageKey = "raj-tracker-watchlist";
const periods: StocksData["period"][] = ["day", "month", "year"];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function saveSymbols(symbols: string[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(symbols));
}

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 font-mono text-xs font-semibold ${positive ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#faeae7] text-[#bc3c2c]"}`}>
      {positive ? "↗" : "↘"} {percent(value)}
    </span>
  );
}

function StockRows({ stocks, limit }: { stocks: StockSnapshot[]; limit: number }) {
  return (
    <div className="divide-y divide-[#e4e6df]">
      {stocks.slice(0, limit).map((stock, index) => (
        <div key={stock.symbol} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-3.5">
          <span className="font-mono text-[10px] text-[#9a9f96]">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2"><span className="font-mono text-sm font-bold text-[#232621]">{stock.symbol}</span><span className="truncate text-xs text-[#7a8076]">{stock.name}</span></div>
            <span className="mt-0.5 block font-mono text-[11px] text-[#555b52]">{currency(stock.price)}</span>
          </div>
          <Change value={stock.periodChange} />
        </div>
      ))}
    </div>
  );
}

function ExpandButton({ expanded, onClick, count }: { expanded: boolean; onClick: () => void; count: number }) {
  return (
    <button type="button" onClick={onClick} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe1da] py-2.5 text-xs font-semibold text-[#555b52] transition hover:border-[#bfc3ba] hover:bg-[#f5f6f2]">
      {expanded ? "Show top 3" : `Expand to ${count}`} <span className={`transition ${expanded ? "rotate-180" : ""}`}>↓</span>
    </button>
  );
}

function RankingCard({ title, label, stocks, expanded, onToggle }: { title: string; label: string; stocks: StockSnapshot[]; expanded: boolean; onToggle: () => void }) {
  return (
    <section className="rounded-2xl border border-[#dfe1da] bg-white/75 p-5 shadow-[0_15px_40px_rgba(31,35,29,0.04)]">
      <div className="mb-2 flex items-center justify-between border-b-2 border-[#262923] pb-3">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">{label}</p><h3 className="mt-1 text-xl font-semibold tracking-tight">{title}</h3></div>
        <span className="font-mono text-[10px] text-[#8b9087]">USA / {stocks.length}</span>
      </div>
      <StockRows stocks={stocks} limit={expanded ? 20 : 3} />
      <ExpandButton expanded={expanded} onClick={onToggle} count={20} />
    </section>
  );
}

function SectorCard({ group, expanded, onToggle }: { group: SectorMovers; expanded: boolean; onToggle: () => void }) {
  return (
    <section className="rounded-2xl border border-[#dfe1da] bg-white/65 p-4">
      <div className="flex items-center justify-between border-b border-[#d9dbd4] pb-3">
        <h3 className="text-sm font-bold tracking-tight text-[#292c27]">{group.sector}</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#949a90]">Top moves</span>
      </div>
      <StockRows stocks={group.stocks} limit={expanded ? group.stocks.length : 3} />
      <ExpandButton expanded={expanded} onClick={onToggle} count={group.stocks.length} />
    </section>
  );
}

function Watchlist({ initialQuotes }: { initialQuotes: StockSnapshot[] }) {
  const [symbols, setSymbols] = useState(initialQuotes.map((quote) => quote.symbol));
  const [quotes, setQuotes] = useState(initialQuotes);
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed) && parsed.length) queueMicrotask(() => setSymbols(parsed.slice(0, 30)));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (!symbols.length) {
      queueMicrotask(() => setQuotes([]));
      return;
    }
    const controller = new AbortController();
    fetch(`/api/stocks?symbols=${encodeURIComponent(symbols.join(","))}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => setQuotes(data.quotes ?? []))
      .catch(() => undefined);
    return () => controller.abort();
  }, [symbols]);

  function addSymbol(event: FormEvent) {
    event.preventDefault();
    const symbol = input.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
    if (!symbol || symbols.includes(symbol) || symbols.length >= 30) return;
    const next = [...symbols, symbol];
    setSymbols(next);
    saveSymbols(next);
    setInput("");
  }

  function removeSymbol(symbol: string) {
    const next = symbols.filter((item) => item !== symbol);
    setSymbols(next);
    saveSymbols(next);
  }

  return (
    <section className="rounded-3xl border border-[#daddd4] bg-white/75 p-5 shadow-[0_24px_60px_rgba(31,35,29,0.06)] sm:p-7">
      <div className="flex flex-col gap-4 border-b border-[#dfe1da] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Your list</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Watchlist</h2><p className="mt-1 text-sm text-[#747a71]">Saved on this device. Add up to 30 US tickers.</p></div>
        <div className="flex items-center gap-2">
          <form onSubmit={addSymbol} className="flex items-center overflow-hidden rounded-full border border-[#d5d8d0] bg-white focus-within:border-[#8c9188]">
            <input value={input} onChange={(event) => setInput(event.target.value.toUpperCase())} placeholder="Ticker e.g. PLTR" aria-label="Stock ticker" className="w-36 bg-transparent px-4 py-2.5 font-mono text-xs uppercase outline-none placeholder:text-[#a4a9a0]" />
            <button type="submit" className="mr-1 grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-lg text-white transition hover:bg-[#e85d24]" aria-label="Add stock">+</button>
          </form>
          <button type="button" onClick={() => setEditing((value) => !value)} className={`rounded-full border px-4 py-2.5 text-xs font-semibold transition ${editing ? "border-[#20231f] bg-[#20231f] text-white" : "border-[#d5d8d0] bg-white text-[#4d534a] hover:border-[#9fa49b]"}`}>{editing ? "Done" : "Edit"}</button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[650px]">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-4 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#949a90]"><span>Company</span><span>Price</span><span>Day move</span><span>Sector</span><span /></div>
          <div className="divide-y divide-[#e5e7e1]">
            {quotes.map((quote) => (
              <div key={quote.symbol} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-4 rounded-xl px-3 py-3 transition hover:bg-[#f5f6f2]">
                <div className="min-w-0"><span className="font-mono text-sm font-bold">{quote.symbol}</span><span className="ml-2 truncate text-xs text-[#7a8076]">{quote.name}</span></div>
                <span className="font-mono text-sm font-semibold">{currency(quote.price)}</span>
                <Change value={quote.changePercent} />
                <span className="truncate text-xs text-[#71776e]">{quote.sector}</span>
                <button type="button" onClick={() => removeSymbol(quote.symbol)} aria-label={`Remove ${quote.symbol}`} className={`grid h-7 w-7 place-items-center rounded-full text-sm text-[#bd4435] transition hover:bg-[#faeae7] ${editing ? "visible opacity-100" : "invisible opacity-0"}`}>×</button>
              </div>
            ))}
            {!quotes.length && <p className="py-10 text-center text-sm text-[#7c8278]">Your watchlist is empty. Add a ticker above.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

function IpoTable({ records }: { records: IpoRecord[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#dfe1da] bg-white/70">
      <div className="min-w-[850px]">
        <div className="grid grid-cols-[100px_1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-[#dfe1da] bg-[#f1f3ee] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#81877e]"><span>Symbol</span><span>Company</span><span>Status</span><span>Price</span><span>Date</span><span>Offer</span></div>
        <div className="divide-y divide-[#e3e5de]">
          {records.map((record) => (
            <div key={`${record.symbol}-${record.company}-${record.date}-${record.status}`} className="grid grid-cols-[100px_1.5fr_1fr_1fr_1fr_1fr] items-center gap-4 px-5 py-4 text-sm">
              <span className="font-mono font-bold">{record.symbol}</span><span className="font-medium">{record.company}</span>
              <span><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${record.status === "Upcoming" ? "bg-[#fff1d8] text-[#8b5b00]" : record.status === "Priced" ? "bg-[#e6f4ed] text-[#087553]" : "bg-[#eef0ec] text-[#61675e]"}`}>{record.status}</span></span>
              <span className="font-mono text-xs">{record.price}</span><span className="text-xs text-[#6d736a]">{record.date}</span><span className="font-mono text-xs text-[#4f554d]">{record.offerAmount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StocksDashboard({ initialWatchlist, initialMovers, ipos }: { initialWatchlist: StockSnapshot[]; initialMovers: StocksData; ipos: IpoRecord[] }) {
  const [movers, setMovers] = useState(initialMovers);
  const [period, setPeriod] = useState<StocksData["period"]>("day");
  const [loading, setLoading] = useState(false);
  const [gainersExpanded, setGainersExpanded] = useState(false);
  const [declinersExpanded, setDeclinersExpanded] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<string[]>([]);
  const periodLabel = period === "day" ? "Today's" : period === "month" ? "One-month" : "One-year";

  async function changePeriod(next: StocksData["period"]) {
    if (next === period) return;
    setPeriod(next);
    setLoading(true);
    setGainersExpanded(false);
    setDeclinersExpanded(false);
    try {
      const response = await fetch(`/api/stocks?period=${next}`);
      if (response.ok) setMovers(await response.json());
    } finally {
      setLoading(false);
    }
  }

  function toggleSector(sector: string) {
    setExpandedSectors((current) => current.includes(sector) ? current.filter((item) => item !== sector) : [...current, sector]);
  }

  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span><span className="hidden text-sm font-semibold tracking-tight text-[#292c27] sm:block">Raj Peswani&apos;s Tracker</span></Link>
          <nav className="flex items-center gap-2 rounded-full border border-[#d9dbd4] bg-white p-1 text-xs font-semibold">
            <Link href="/" className="rounded-full px-4 py-2 text-[#666c63] transition hover:text-[#e85d24]">News</Link>
            <span className="rounded-full bg-[#20231f] px-4 py-2 text-white">Stocks</span>
          </nav>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] md:block">US market desk</span>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="grid gap-8 pb-9 pt-14 lg:grid-cols-[1fr_auto] lg:items-end lg:pt-20">
          <div><div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#e85d24]" />Stocks / United States</div><h1 className="max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#1c1f1b] sm:text-7xl lg:text-[82px]">Watch what matters.<br /><span className="text-[#8c9188]">Move with the market.</span></h1></div>
          <p className="max-w-sm border-l border-[#cfd2ca] pl-5 text-sm leading-relaxed text-[#656b62]">Your editable watchlist, the strongest and weakest US stocks, sector leadership, and the newest public offerings in one focused view.</p>
        </section>

        <Watchlist initialQuotes={initialWatchlist} />

        <section className="py-12">
          <div className="mb-6 flex flex-col gap-4 border-b border-[#cfd2ca] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Market pulse</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{periodLabel} US Movers</h2><p className="mt-1 text-sm text-[#777d74]">A liquid large-cap universe spanning every major sector.</p></div>
            <div className="flex w-fit rounded-full border border-[#d5d8d0] bg-white p-1">
              {periods.map((item) => <button key={item} type="button" disabled={loading} onClick={() => changePeriod(item)} className={`rounded-full px-5 py-2 text-xs font-semibold capitalize transition ${period === item ? "bg-[#20231f] text-white" : "text-[#666c63] hover:text-[#e85d24]"}`}>{item}</button>)}
            </div>
          </div>
          <div className={`grid gap-6 transition lg:grid-cols-2 ${loading ? "animate-pulse opacity-50" : ""}`}>
            <RankingCard title="Top Gainers" label="Leading the tape" stocks={movers.gainers} expanded={gainersExpanded} onToggle={() => setGainersExpanded((value) => !value)} />
            <RankingCard title="Top Decliners" label="Under pressure" stocks={movers.decliners} expanded={declinersExpanded} onToggle={() => setDeclinersExpanded((value) => !value)} />
          </div>
        </section>

        <section className="border-t border-[#d8dad3] py-12">
          <div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Inside the market</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Sector Movers</h2><p className="mt-2 max-w-2xl text-sm text-[#777d74]">The three largest moves in each major US equity sector. Expand any sector for the full ranked list.</p></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {movers.sectors.map((group) => <SectorCard key={group.sector} group={group} expanded={expandedSectors.includes(group.sector)} onToggle={() => toggleSector(group.sector)} />)}
          </div>
        </section>

        <section className="border-t border-[#d8dad3] py-12">
          <div className="mb-7 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Primary market</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">New IPOs</h2><p className="mt-2 text-sm text-[#777d74]">Upcoming, newly priced, and recently filed US offerings.</p></div><span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#92978e] sm:block">Source / Nasdaq IPO calendar</span></div>
          <IpoTable records={ipos} />
        </section>
      </div>

      <footer className="mt-6 bg-[#20231f] text-[#f4f5f1]"><div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><p className="text-lg font-semibold">Raj Peswani&apos;s Tracker</p><p className="mt-1 text-xs text-[#9da39a]">Markets, sectors, and new listings.</p></div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e948b]">Market data is informational / Not investment advice</p></div></footer>
    </main>
  );
}
