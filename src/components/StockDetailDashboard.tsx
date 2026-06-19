"use client";

import Link from "next/link";
import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { stockRanges, type StockRange } from "@/lib/stock-detail";
import type { StockChartPoint, StockDetailData, Story } from "@/types";

const chartWidth = 900;
const chartHeight = 360;
const chartPadding = 18;

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function number(value: number) {
  return new Intl.NumberFormat("en-US", { notation: value >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return minutes < 1 ? "just now" : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

function createGeometry(points: StockChartPoint[]) {
  const values = points.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || Math.max(max * 0.01, 1);
  const coordinates = points.map((point, index) => ({
    ...point,
    x: chartPadding + (index / Math.max(points.length - 1, 1)) * (chartWidth - chartPadding * 2),
    y: chartPadding + ((max - point.close) / spread) * (chartHeight - chartPadding * 2),
  }));
  const path = coordinates.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const area = `${path} L${coordinates.at(-1)?.x ?? chartWidth - chartPadding},${chartHeight} L${coordinates[0]?.x ?? chartPadding},${chartHeight} Z`;
  return { coordinates, path, area, min, max };
}

function PriceChart({ detail }: { detail: StockDetailData }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const geometry = useMemo(() => createGeometry(detail.points), [detail.points]);
  const selected = hoverIndex === null ? geometry.coordinates.at(-1) : geometry.coordinates[hoverIndex];
  const positive = detail.rangeChange >= 0;
  const color = positive ? "#00a86b" : "#d64b3b";

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHoverIndex(Math.round(ratio * Math.max(detail.points.length - 1, 0)));
  }

  const selectedDate = selected
    ? new Date(selected.timestamp * 1000).toLocaleString("en-US", detail.range === "1D" ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#e1e3dc] bg-[#fbfcf9]">
      <div className="absolute left-5 top-4 z-10 rounded-xl bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
        <p className="font-mono text-sm font-bold text-[#252823]">{selected ? money(selected.close, detail.currency) : money(detail.price, detail.currency)}</p>
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#858b82]">{selectedDate}</p>
      </div>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${detail.symbol} ${detail.range} price chart`} className="h-[300px] w-full touch-none sm:h-[380px]" onPointerMove={handlePointerMove} onPointerLeave={() => setHoverIndex(null)}>
        <defs><linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.24" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={chartPadding} x2={chartWidth - chartPadding} y1={chartHeight * ratio} y2={chartHeight * ratio} stroke="#e6e8e1" strokeDasharray="4 8" />)}
        <path d={geometry.area} fill="url(#priceArea)" />
        <path d={geometry.path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hoverIndex !== null && selected && <><line x1={selected.x} x2={selected.x} y1={chartPadding} y2={chartHeight - chartPadding} stroke="#858b82" strokeWidth="1" strokeDasharray="3 5" /><circle cx={selected.x} cy={selected.y} r="6" fill="white" stroke={color} strokeWidth="3" /></>}
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-[#e1e3dc] py-3"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#92978e]">{label}</p><p className="mt-1 font-mono text-sm font-semibold text-[#30342d]">{value}</p></div>;
}

function NewsCard({ story }: { story: Story }) {
  return <a href={story.url} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-[#dfe1da] bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-[#bfc3ba] hover:shadow-md"><div className="flex items-center gap-2 text-[10px] text-[#878d83]"><span className="font-bold text-[#555b52]">{story.source}</span><span>•</span><span>{timeAgo(story.publishedAt)}</span></div><h3 className="mt-3 text-base font-semibold leading-snug text-[#292c27] transition group-hover:text-[#e85d24]">{story.title}</h3><span className="mt-5 inline-flex text-xs font-semibold text-[#6f756c]">Read story →</span></a>;
}

export default function StockDetailDashboard({ initialDetail }: { initialDetail: StockDetailData }) {
  const [detail, setDetail] = useState(initialDetail);
  const [loading, setLoading] = useState(false);
  const positive = detail.rangeChange >= 0;

  async function changeRange(range: StockRange) {
    if (range === detail.range || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/stocks/${encodeURIComponent(detail.symbol)}?range=${range}`);
      if (response.ok) setDetail(await response.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
        <Link href="/stocks" className="flex items-center gap-2 text-xs font-semibold text-[#5f655c] transition hover:text-[#e85d24]"><span className="text-lg">←</span> Stocks</Link>
        <nav className="flex items-center gap-1 overflow-x-auto rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:gap-2 sm:text-xs"><Link href="/" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">News</Link><Link href="/stocks" className="rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">Stocks</Link><Link href="/market-bets" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Market Bets</Link><Link href="/quant" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Quant</Link><Link href="/lookouts" className="rounded-full px-2.5 py-2 text-[#666c63] hover:text-[#e85d24] sm:px-4">Lookouts</Link></nav>
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-[#858b81] md:block">{detail.exchange}</span>
      </div></header>

      <div className="mx-auto max-w-[1300px] px-5 py-8 sm:px-8">
        <section className="grid gap-8 lg:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-3"><h1 className="font-mono text-2xl font-bold tracking-tight sm:text-3xl">{detail.symbol}</h1><span className="rounded-full bg-[#eceee8] px-2.5 py-1 text-[10px] font-semibold text-[#687067]">{detail.exchange}</span></div><p className="mt-1 text-sm text-[#747a71]">{detail.name}</p></div><p className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8f86] sm:block">As of {new Date(detail.marketTime * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}</p></div>
            <div className="mt-7"><p className="font-mono text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">{money(detail.price, detail.currency)}</p><p className={`mt-2 font-mono text-sm font-semibold ${positive ? "text-[#008c5c]" : "text-[#c94132]"}`}>{detail.rangeChange >= 0 ? "+" : ""}{money(detail.rangeChange, detail.currency)} ({percent(detail.rangeChangePercent)}) <span className="ml-1 text-[#858b82]">{detail.range}</span></p></div>
            <PriceChart detail={detail} />
            <div className="mt-4 flex flex-wrap items-center gap-1 rounded-full border border-[#dfe1da] bg-white p-1.5 sm:w-fit">{(Object.keys(stockRanges) as StockRange[]).map((range) => <button key={range} type="button" disabled={loading} onClick={() => changeRange(range)} className={`rounded-full px-4 py-2 font-mono text-xs font-semibold transition ${detail.range === range ? "bg-[#20231f] text-white" : "text-[#697067] hover:bg-[#f0f2ed]"}`}>{range}</button>)}</div>
          </div>

          <aside className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5 lg:mt-20"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#e85d24]">Market stats</p><Stat label="Day change" value={`${detail.dayChange >= 0 ? "+" : ""}${money(detail.dayChange, detail.currency)} / ${percent(detail.dayChangePercent)}`} /><Stat label="Day range" value={`${money(detail.dayLow, detail.currency)} – ${money(detail.dayHigh, detail.currency)}`} /><Stat label="52-week range" value={`${money(detail.fiftyTwoWeekLow, detail.currency)} – ${money(detail.fiftyTwoWeekHigh, detail.currency)}`} /><Stat label="Volume" value={number(detail.volume)} /><Stat label="Previous close" value={money(detail.previousClose, detail.currency)} /></aside>
        </section>

        <section className="mt-12 border-t border-[#d8dad3] py-10"><div className="mb-6"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Latest coverage</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Top News for {detail.symbol}</h2></div>{detail.news.length ? <div className="grid gap-5 md:grid-cols-3">{detail.news.slice(0, 3).map((story) => <NewsCard key={`${story.url}-${story.title}`} story={story} />)}</div> : <p className="rounded-2xl border border-[#dfe1da] bg-white/70 p-6 text-sm text-[#6f756c]">No recent company-specific stories were available.</p>}</section>
      </div>
    </main>
  );
}
