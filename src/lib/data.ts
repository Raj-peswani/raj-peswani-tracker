import { XMLParser } from "fast-xml-parser";
import { fallbackStories, marketFallbacks, realEstateFallbacks } from "@/lib/fallback-data";
import type { DashboardData, MarketQuote, NewsSection, StoryGroup } from "@/types";

type FeedDefinition = { label: string; query: string; fallback: string };

const parser = new XMLParser({ ignoreAttributes: false });

function googleNewsUrl(query: string) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function splitGoogleTitle(title: string) {
  const parts = title.split(" - ");
  return parts.length > 1
    ? { title: parts.slice(0, -1).join(" - "), source: parts.at(-1) ?? "Google News" }
    : { title, source: "Google News" };
}

async function fetchFeed(definition: FeedDefinition): Promise<StoryGroup> {
  try {
    const response = await fetch(googleNewsUrl(definition.query), {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Raj-Peswani-Tracker/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`RSS ${response.status}`);

    const xml = parser.parse(await response.text());
    const items = asArray<Record<string, string>>(xml?.rss?.channel?.item);
    const stories = items.slice(0, 5).map((item) => {
      const parsed = splitGoogleTitle(item.title ?? "Market update");
      return {
        ...parsed,
        url: item.link ?? googleNewsUrl(definition.query),
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      };
    });
    if (!stories.length) throw new Error("Empty RSS response");
    return { label: definition.label, stories };
  } catch {
    return { label: definition.label, stories: fallbackStories[definition.fallback] };
  }
}

async function fetchQuotes(fallbacks: MarketQuote[]) {
  const symbols = fallbacks.map((item) => item.symbol).join(",");
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`,
      {
        next: { revalidate: 3600 },
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`Yahoo Finance ${response.status}`);
    const payload = await response.json();
    const results = payload?.quoteResponse?.result ?? [];
    const bySymbol = new Map<string, Record<string, number | string>>(
      results.map((quote: Record<string, number | string>) => [String(quote.symbol), quote]),
    );

    return fallbacks.map((fallback) => {
      const quote = bySymbol.get(fallback.symbol);
      const value = Number(quote?.regularMarketPrice);
      const change = Number(quote?.regularMarketChangePercent);
      return {
        ...fallback,
        value: Number.isFinite(value) ? value : fallback.value,
        change: Number.isFinite(change) ? change : fallback.change,
        currency: typeof quote?.currency === "string" ? quote.currency : undefined,
      };
    });
  } catch {
    return fallbacks;
  }
}

const newsDefinitions: Array<Omit<NewsSection, "groups"> & { feeds: FeedDefinition[] }> = [
  {
    id: "top-stories",
    title: "Top Stories",
    eyebrow: "The Briefing",
    feeds: [
      { label: "United States", query: "US stock market business when:1d", fallback: "us" },
      { label: "Global", query: "global business economy when:1d", fallback: "global" },
      { label: "India", query: "India stock market economy when:1d", fallback: "india" },
    ],
  },
  {
    id: "markets-tech",
    title: "Markets & Tech",
    eyebrow: "Capital & Innovation",
    feeds: [
      { label: "United States", query: "US technology AI finance markets when:1d", fallback: "tech" },
      { label: "Global", query: "global technology business finance when:1d", fallback: "global" },
      { label: "India", query: "India technology startups business when:2d", fallback: "india" },
    ],
  },
  {
    id: "deals",
    title: "M&A Rumours & Deals",
    eyebrow: "Transactions",
    feeds: [
      { label: "Deals, Rumours & Activity", query: "merger acquisition IPO deal markets when:2d", fallback: "deals" },
    ],
  },
];

const realEstateFeeds: FeedDefinition[] = [
  { label: "Pimpri-Chinchwad", query: "Pimpri Chinchwad PCMC housing property when:7d", fallback: "pcmc" },
  { label: "RE Laws & Policy", query: "India RERA housing property law policy when:7d", fallback: "policy" },
  { label: "New Deals & Development", query: "Pune real estate development infrastructure when:7d", fallback: "development" },
  { label: "Hinjewadi & IT Corridor", query: "Hinjewadi Pune metro real estate IT corridor when:14d", fallback: "hinjewadi" },
];

export async function getDashboardData(): Promise<DashboardData> {
  const [markets, realEstateMarkets, sectionGroups, realEstateGroups] = await Promise.all([
    fetchQuotes(marketFallbacks),
    fetchQuotes(realEstateFallbacks),
    Promise.all(newsDefinitions.map((section) => Promise.all(section.feeds.map(fetchFeed)))),
    Promise.all(realEstateFeeds.map(fetchFeed)),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    markets,
    realEstateMarkets,
    newsSections: newsDefinitions.map((section, index) => ({
      id: section.id,
      title: section.title,
      eyebrow: section.eyebrow,
      groups: sectionGroups[index],
    })),
    realEstateGroups,
  };
}
