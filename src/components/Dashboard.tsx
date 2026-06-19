import RefreshButton from "@/components/RefreshButton";
import Link from "next/link";
import type { DashboardData, MarketQuote, NewsSection, Story, StoryGroup } from "@/types";

function formatValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value < 1000 ? 2 : 0,
  }).format(value);
}

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function MarketStrip({ quotes, compact = false }: { quotes: MarketQuote[]; compact?: boolean }) {
  return (
    <div className={`grid border-y border-[#dedfd9] bg-white/60 ${compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10"}`}>
      {quotes.map((quote) => {
        const positive = quote.change >= 0;
        return (
          <div key={quote.symbol} className="relative min-w-0 border-b border-r border-[#e4e5df] px-4 py-4 last:border-r-0 lg:border-b-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777d74]">{quote.label}</p>
            <div className="mt-1.5 flex items-baseline justify-between gap-2">
              <span className="font-mono text-base font-semibold tracking-tight text-[#20231f]">{formatValue(quote.value)}</span>
              <span className={`font-mono text-[11px] font-medium ${positive ? "text-[#14845c]" : "text-[#cf4937]"}`}>
                {positive ? "+" : ""}{quote.change.toFixed(2)}%
              </span>
            </div>
            <span className={`absolute bottom-0 left-0 h-0.5 ${positive ? "bg-[#14845c]" : "bg-[#cf4937]"}`} style={{ width: `${Math.min(100, 22 + Math.abs(quote.change) * 18)}%` }} />
          </div>
        );
      })}
    </div>
  );
}

function StoryRow({ story, featured = false }: { story: Story; featured?: boolean }) {
  return (
    <a href={story.url} target="_blank" rel="noreferrer" className="group block border-b border-[#e5e6e0] py-3.5 last:border-0">
      <h3 className={`${featured ? "text-lg leading-snug" : "text-[15px] leading-snug"} font-medium text-[#262923] transition group-hover:text-[#d9531e]`}>
        {story.title}
        <svg className="ml-1 inline h-3 w-3 -translate-y-0.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 8h9M8 4l4 4-4 4" /></svg>
      </h3>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-[#7b8078]">
        <span className="font-semibold text-[#4e534c]">{story.source}</span>
        <span className="h-0.5 w-0.5 rounded-full bg-[#a9ada5]" />
        <span>{timeAgo(story.publishedAt)}</span>
      </div>
    </a>
  );
}

function StoryColumn({ group }: { group: StoryGroup }) {
  return (
    <section className="min-w-0">
      <div className="mb-1 flex items-center gap-2 border-b-2 border-[#282b26] pb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#e85d24]" />
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#30342d]">{group.label}</h3>
      </div>
      {group.stories.map((story, index) => <StoryRow key={`${story.url}-${index}`} story={story} featured={index === 0} />)}
    </section>
  );
}

function NewsBlock({ section }: { section: NewsSection }) {
  return (
    <section id={section.id} className="scroll-mt-24 py-10">
      <div className="mb-6 flex items-end justify-between border-b border-[#cfd2ca] pb-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">{section.eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#1e211d] sm:text-4xl">{section.title}</h2>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[#8a8f86] sm:block">Live feed / {section.groups.length.toString().padStart(2, "0")}</span>
      </div>
      <div className={`grid gap-x-8 gap-y-8 ${section.groups.length === 1 ? "max-w-2xl" : "md:grid-cols-3"}`}>
        {section.groups.map((group) => <StoryColumn key={group.label} group={group} />)}
      </div>
    </section>
  );
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const timestamp = new Date(data.generatedAt);
  const date = timestamp.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const time = timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });

  return (
    <main>
      <header className="sticky top-0 z-50 isolate border-b border-[#dcddd7] bg-[#f7f8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3 sm:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#20231f] text-xs font-bold text-white">RP</span>
            <span className="hidden text-sm font-semibold tracking-tight text-[#292c27] lg:block">Raj Peswani&apos;s Tracker</span>
          </a>
          <nav className="flex items-center gap-1 rounded-full border border-[#d9dbd4] bg-white p-1 text-[10px] font-semibold sm:gap-2 sm:text-xs">
            <span className="rounded-full bg-[#20231f] px-2.5 py-2 text-white sm:px-4">News</span>
            <Link className="rounded-full px-2.5 py-2 text-[#666c63] transition hover:text-[#e85d24] sm:px-4" href="/stocks">Stocks</Link>
            <Link className="rounded-full px-2.5 py-2 text-[#666c63] transition hover:text-[#e85d24] sm:px-4" href="/market-bets">Market Bets</Link>
            <Link className="rounded-full px-2.5 py-2 text-[#666c63] transition hover:text-[#e85d24] sm:px-4" href="/quant">Quant</Link>
          </nav>
          <div className="hidden sm:block"><RefreshButton /></div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <section className="flex flex-col gap-2 py-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Live dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-[#1c1f1b]">News & Markets</h1></div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a8f86]">{date} / Updated {time}</p>
        </section>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 sm:px-8"><MarketStrip quotes={data.markets} /></div>

      <div className="mx-auto max-w-[1500px] divide-y divide-[#d8dad3] px-5 sm:px-8">
        {data.newsSections.map((section) => <NewsBlock key={section.id} section={section} />)}

        <section id="real-estate" className="scroll-mt-24 py-10">
          <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#e85d24]">Local Lens</p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#1e211d] sm:text-4xl">Pune Real Estate</h2>
              <p className="mt-2 text-sm text-[#777d74]">REITs / Global RE indices / PCMC / Hinjewadi / Laws / Deals</p>
            </div>
            <div className="rounded-full border border-[#d9dbd4] bg-white/70 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#70766d]">Property desk / Pune</div>
          </div>
          <MarketStrip quotes={data.realEstateMarkets} compact />
          <div className="mt-8 grid gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
            {data.realEstateGroups.map((group) => <StoryColumn key={group.label} group={group} />)}
          </div>
        </section>
      </div>

      <footer className="mt-6 bg-[#20231f] text-[#f4f5f1]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div><p className="text-lg font-semibold">Raj Peswani&apos;s Tracker</p><p className="mt-1 text-xs text-[#9da39a]">Global context. Pune focus.</p></div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#8e948b]">Updates every hour / Data via RSS & Yahoo Finance</p>
        </div>
      </footer>
    </main>
  );
}
