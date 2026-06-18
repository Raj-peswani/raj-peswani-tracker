import type { MarketQuote, Story } from "@/types";

export const marketFallbacks: MarketQuote[] = [
  { symbol: "^GSPC", label: "S&P 500", value: 7500.58, change: 1.08 },
  { symbol: "^IXIC", label: "NASDAQ", value: 26518, change: 1.91 },
  { symbol: "^DJI", label: "DOW", value: 51565, change: 0.14 },
  { symbol: "^NSEI", label: "NIFTY 50", value: 24168, change: 0.34 },
  { symbol: "^BSESN", label: "SENSEX", value: 77410, change: 0.33 },
  { symbol: "^NSEBANK", label: "BANK NIFTY", value: 57964, change: 0.66 },
  { symbol: "000001.SS", label: "SHANGHAI", value: 4090.48, change: -0.03 },
  { symbol: "^N225", label: "NIKKEI", value: 71053, change: 1.65 },
  { symbol: "^BVSP", label: "BOVESPA", value: 168278, change: -0.1 },
  { symbol: "^FTSE", label: "FTSE 100", value: 10400, change: -1.04 },
];

export const realEstateFallbacks: MarketQuote[] = [
  { symbol: "VNQ", label: "VNQ", value: 95.56, change: -0.05 },
  { symbol: "EMBASSY.NS", label: "EMBASSY", value: 369.92, change: 1.51 },
  { symbol: "MINDSPACE.NS", label: "MINDSPACE", value: 345.06, change: 1.51 },
  { symbol: "IYR", label: "US RE (IYR)", value: 100.45, change: -0.17 },
  { symbol: "^SP500-60", label: "S&P RE", value: 43.86, change: -0.25 },
  { symbol: "^CNXREALTY", label: "NIFTY REALTY", value: 286.3, change: 1.36 },
  { symbol: "02821.HK", label: "CN RE", value: 39.72, change: -3.17 },
  { symbol: "1343.T", label: "JP REIT", value: 1905.5, change: -0.1 },
  { symbol: "IUKP.L", label: "UK PROP", value: 417.3, change: -0.41 },
  { symbol: "VAP.AX", label: "AUS PROP", value: 95.62, change: -1.49 },
];

const story = (title: string, source: string): Story => ({
  title,
  source,
  url: `https://news.google.com/search?q=${encodeURIComponent(title)}`,
  publishedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
});

export const fallbackStories: Record<string, Story[]> = {
  us: [
    story("Wall Street advances as chip stocks and rate optimism lift sentiment", "MarketWatch"),
    story("Technology shares lead gains in a busy session for global markets", "CNBC"),
    story("Investors weigh the latest Federal Reserve outlook", "Reuters"),
    story("Dollar holds firm as traders reassess the path for rates", "Bloomberg"),
    story("Market breadth improves as investors move beyond megacap names", "MarketWatch"),
  ],
  global: [
    story("Asian markets trade mixed after a strong US session", "Reuters"),
    story("European shares open lower as energy prices shift", "CNBC World"),
    story("Global investors monitor central bank signals", "Investing.com"),
    story("Oil steadies while the dollar remains near recent highs", "Reuters"),
    story("Emerging markets attract fresh portfolio inflows", "Bloomberg"),
  ],
  india: [
    story("Indian benchmarks rise as banking and IT stocks gain", "Economic Times"),
    story("Sensex and Nifty extend gains in afternoon trade", "Livemint"),
    story("Foreign investors turn buyers in Indian equities", "ET Markets"),
    story("Rupee holds steady against the US dollar", "Business Standard"),
    story("Small-cap shares outperform broader Indian market", "Moneycontrol"),
  ],
  tech: [
    story("AI infrastructure spending continues to reshape technology markets", "TechCrunch"),
    story("Chipmakers rally as demand forecasts strengthen", "CNBC Tech"),
    story("Cloud companies race to lower the cost of AI inference", "The Verge"),
    story("Startups draw new funding for enterprise AI products", "TechCrunch"),
    story("Big Tech outlines its next wave of data center investment", "Reuters"),
  ],
  deals: [
    story("Dealmakers prepare for a busier second half of the year", "Financial Times"),
    story("Private equity firms return to the market with new bids", "Bloomberg"),
    story("Banks line up financing for a major technology transaction", "Reuters"),
    story("IPO pipeline grows as market volatility eases", "ET Markets"),
    story("Board approves strategic review after takeover interest", "MarketWatch"),
  ],
  pcmc: [
    story("Pimpri-Chinchwad housing societies seek clarity on civic rules", "Google News"),
    story("PCMC infrastructure projects gather pace across growth corridors", "Punekar News"),
    story("New road links promise easier access to western Pune", "Indian Express Pune"),
    story("Residents raise waste-management concerns with civic officials", "Times of India"),
  ],
  policy: [
    story("Homebuyers track the latest RERA policy changes", "Economic Times"),
    story("Affordable housing remains in focus for lenders", "Livemint"),
    story("Property registration rules updated for buyers and agents", "Business Standard"),
    story("Housing finance demand stays resilient in major cities", "ET Realty"),
  ],
  development: [
    story("Pune development pipeline expands along new transit routes", "Indian Express Pune"),
    story("Commercial property activity rises across Pune", "ET Realty"),
    story("New infrastructure spending targets faster regional connectivity", "Economic Times"),
    story("Developers announce mixed-use projects in Pune growth areas", "Moneycontrol"),
  ],
  hinjewadi: [
    story("Hinjewadi metro work reaches another key milestone", "Indian Express Pune"),
    story("IT corridor commute upgrades move closer to completion", "Punekar News"),
    story("Office leasing demand remains firm in Hinjewadi", "ET Realty"),
    story("New residential supply comes to Pune's western corridor", "Housing.com"),
  ],
};
