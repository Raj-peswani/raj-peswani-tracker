import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { PDFParse } from "pdf-parse";
import type { CountryMover, InstitutionalOption, MarketBetsData, OptionSentiment, PoliticalTrade } from "@/types";

type HouseIndexEntry = {
  First?: string;
  Last?: string;
  StateDst?: string;
  FilingType?: string;
  FilingDate?: string;
  DocID?: string;
};

type SecManager = { manager: string; cik: string };

const secManagers: SecManager[] = [
  { manager: "JPMorgan", cik: "0000019617" },
  { manager: "Goldman Sachs", cik: "0000886982" },
  { manager: "Citigroup", cik: "0000831001" },
];

const countryIndices = [
  ["United States", "S&P 500", "^GSPC"], ["South Korea", "KOSPI", "^KS11"], ["Japan", "Nikkei 225", "^N225"],
  ["China", "Shanghai Composite", "000001.SS"], ["Hong Kong", "Hang Seng", "^HSI"], ["India", "Nifty 50", "^NSEI"],
  ["Taiwan", "Taiwan Weighted", "^TWII"], ["United Kingdom", "FTSE 100", "^FTSE"], ["Germany", "DAX", "^GDAXI"],
  ["France", "CAC 40", "^FCHI"], ["Eurozone", "Euro Stoxx 50", "^STOXX50E"], ["Brazil", "Bovespa", "^BVSP"],
  ["Mexico", "IPC Mexico", "^MXX"], ["Canada", "S&P/TSX", "^GSPTSE"], ["Australia", "ASX 200", "^AXJO"],
  ["New Zealand", "NZX 50", "^NZ50"], ["Argentina", "MERVAL", "^MERV"], ["Turkey", "BIST 100", "XU100.IS"],
  ["Israel", "TA-125", "^TA125.TA"], ["Singapore", "Straits Times", "^STI"], ["Indonesia", "Jakarta Composite", "^JKSE"],
] as const;

const secHeaders = {
  "User-Agent": "RajPeswaniTracker rajpeswani@berkeley.edu",
  "Accept-Encoding": "gzip, deflate",
};

const politicianFallback: PoliticalTrade[] = [
  { politician: "Robert E. Latta", chamber: "House", state: "OH05", ticker: "FMAO", asset: "Farmers & Merchants Bancorp, Inc. (FMAO)", amount: "$15,001 - $50,000", transactionDate: "2026-06-04", filingDate: "2026-06-05", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034726.pdf" },
  { politician: "Tim Moore", chamber: "House", state: "NC14", ticker: "T", asset: "AT&T Inc. (T)", amount: "$50,001 - $100,000", transactionDate: "2026-06-04", filingDate: "2026-06-05", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034721.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "SFTBF", asset: "SoftBank Group Corp. (SFTBF)", amount: "$1,001 - $15,000", transactionDate: "2026-06-02", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "BSX", asset: "Boston Scientific Corporation (BSX)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "CIEN", asset: "Ciena Corporation (CIEN)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "DASH", asset: "DoorDash, Inc. (DASH)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "INDB", asset: "Independent Bank Corp. (INDB)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "LGND", asset: "Ligand Pharmaceuticals Incorporated (LGND)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "PWP", asset: "Perella Weinberg Partners (PWP)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "TEL", asset: "TE Connectivity plc (TEL)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Gilbert Cisneros", chamber: "House", state: "CA31", ticker: "TSLA", asset: "Tesla, Inc. (TSLA)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034713.pdf" },
  { politician: "Maria Elvira Salazar", chamber: "House", state: "FL27", ticker: "BEP", asset: "Brookfield Renewable Partners L.P. (BEP)", amount: "$1,001 - $15,000", transactionDate: "2026-05-29", filingDate: "2026-06-08", sourceUrl: "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2026/20034709.pdf" },
];

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
}

function extractTicker(asset: string) {
  const explicit = asset.match(/(?:ticker\s*:\s*|\()([A-Z][A-Z0-9.-]{0,5})(?:\)|\b)/i)?.[1];
  return explicit ? explicit.toUpperCase() : null;
}

function parseHousePurchases(text: string) {
  let flat = text.replace(/[\u0000\u00a0]/g, " ").replace(/\s+/g, " ");
  flat = flat.replace(/^[\s\S]*?\$\s*200\s*\?/, " ");
  flat = flat.replace(/(?:[A-Z]\s){1,3}:\s*(?:New|Amended|Partially Sold|Partial)?/g, " ");
  const anchor = /([PSE])\s*(\([^)]*\))?\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(\d{1,2}\/\d{1,2}\/\d{4})\s*(\$[\d,]+(?:\s*-\s*\$[\d,]+)?\s*\+?)/g;
  const purchases: Array<{ asset: string; ticker: string | null; date: string; amount: string }> = [];
  let previousEnd = 0;
  let match: RegExpExecArray | null;
  while ((match = anchor.exec(flat)) !== null) {
    const [, transactionType, , transactionDate, , amount] = match;
    const window = flat.slice(previousEnd, match.index);
    previousEnd = anchor.lastIndex;
    if (transactionType !== "P") continue;
    const ownerMatches = [...window.matchAll(/(SP|JT|DC|JO)\s*(?=[A-Z])/g)];
    const lastOwner = ownerMatches.at(-1);
    let asset = window.slice(lastOwner ? (lastOwner.index ?? 0) + lastOwner[1].length : 0).trim();
    asset = asset.replace(/--\s*\d+\s+of\s+\d+\s*--[\s\S]*?Cap\. Gains > \$200\?/i, " ").replace(/\s*\[[A-Z]{1,3}\]\s*$/, "").replace(/\s+/g, " ").trim();
    if (asset.length < 2 || asset.length > 180) continue;
    purchases.push({ asset, ticker: extractTicker(asset), date: normalizeDate(transactionDate), amount: amount.replace(/\s+/g, " ") });
  }
  return purchases;
}

async function getHousePurchases(): Promise<PoliticalTrade[]> {
  try {
    const year = new Date().getFullYear();
    const indexResponse = await fetch(`https://disclosures-clerk.house.gov/public_disc/financial-pdfs/${year}FD.ZIP`, {
      next: { revalidate: 21600 }, signal: AbortSignal.timeout(9000),
    });
    if (!indexResponse.ok) throw new Error(`House index ${indexResponse.status}`);
    const zip = new AdmZip(Buffer.from(await indexResponse.arrayBuffer()));
    const xmlEntry = zip.getEntries().find((entry) => entry.entryName.toLowerCase().endsWith(".xml"));
    if (!xmlEntry) return [];
    const parsed = new XMLParser({ ignoreAttributes: true, parseTagValue: false }).parse(xmlEntry.getData().toString("utf8"));
    const entries = toArray<HouseIndexEntry>(parsed?.FinancialDisclosure?.Member)
      .filter((entry) => entry.FilingType === "P" && entry.DocID?.startsWith("2"))
      .sort((a, b) => String(b.FilingDate).localeCompare(String(a.FilingDate)))
      .slice(0, 14);
    const filings = await Promise.allSettled(entries.map(async (entry) => {
      const sourceUrl = `https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/${year}/${entry.DocID}.pdf`;
      const response = await fetch(sourceUrl, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(7000) });
      if (!response.ok) return [];
      const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) });
      const pdf = await parser.getText();
      await parser.destroy();
      return parseHousePurchases(pdf.text).map((trade) => ({
        politician: `${entry.First ?? ""} ${entry.Last ?? ""}`.trim(), chamber: "House" as const,
        state: entry.StateDst ?? "", ticker: trade.ticker, asset: trade.asset, amount: trade.amount,
        transactionDate: trade.date, filingDate: normalizeDate(entry.FilingDate ?? ""), sourceUrl,
      }));
    }));
    const trades = filings.flatMap((result) => result.status === "fulfilled" ? result.value : [])
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)).slice(0, 20);
    return trades.length ? trades : politicianFallback;
  } catch {
    return politicianFallback;
  }
}

const institutionalFallback: InstitutionalOption[] = [
  { manager: "Goldman Sachs", issuer: "NVIDIA Corporation", ticker: "NVDA", reportedValue: 4404280160, shares: 25253900, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "PUT" },
  { manager: "Citigroup", issuer: "NVIDIA Corporation", ticker: "NVDA", reportedValue: 3350136800, shares: 19209500, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/831001/000083100126000022/CITIGROUP_13F_HR_INFOTABLE.xml", optionType: "PUT" },
  { manager: "Citigroup", issuer: "Apple Inc.", ticker: "AAPL", reportedValue: 2872699768, shares: 11319200, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/831001/000083100126000022/CITIGROUP_13F_HR_INFOTABLE.xml", optionType: "PUT" },
  { manager: "Goldman Sachs", issuer: "SPDR Gold Trust", ticker: "GLD", cusip: "78463V107", reportedValue: 479773350, shares: 1115000, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "PUT" },
  { manager: "Goldman Sachs", issuer: "iShares Silver Trust", ticker: "SLV", cusip: "46428Q109", reportedValue: 232262004, shares: 3408600, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "PUT" },
  { manager: "Goldman Sachs", issuer: "iShares Bitcoin Trust ETF", ticker: "IBIT", cusip: "46438F101", reportedValue: 625539072, shares: 16281600, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "PUT" },
  { manager: "Goldman Sachs", issuer: "Taiwan Semiconductor", ticker: "TSM", reportedValue: 3898793970, shares: 11536600, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "CALL" },
  { manager: "Citigroup", issuer: "Invesco QQQ Trust", ticker: "QQQ", cusip: "46090E103", reportedValue: 2276455638, shares: 3944100, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/831001/000083100126000022/CITIGROUP_13F_HR_INFOTABLE.xml", optionType: "CALL" },
  { manager: "Goldman Sachs", issuer: "Apple Inc.", ticker: "AAPL", reportedValue: 2214850709, shares: 8727100, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "CALL" },
  { manager: "Citigroup", issuer: "SPDR Gold Trust", ticker: "GLD", cusip: "78463V107", reportedValue: 1880066097, shares: 4369300, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/831001/000083100126000022/CITIGROUP_13F_HR_INFOTABLE.xml", optionType: "CALL" },
  { manager: "Goldman Sachs", issuer: "iShares Silver Trust", ticker: "SLV", cusip: "46428Q109", reportedValue: 295884322, shares: 4342300, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "CALL" },
  { manager: "Goldman Sachs", issuer: "iShares Bitcoin Trust ETF", ticker: "IBIT", cusip: "46438F101", reportedValue: 263046372, shares: 6846600, reportDate: "2026-03-31", sourceUrl: "https://www.sec.gov/Archives/edgar/data/886982/000088698226000274/InfoTable_20260513_FinalV.xml", optionType: "CALL" },
];

const optionSentimentFallback: OptionSentiment[] = [
  { theme: "Gold", callValue: 2806136235, putValue: 1173314772, callPercent: 71, putPercent: 29 },
  { theme: "Silver", callValue: 419319932, putValue: 382790078, callPercent: 52, putPercent: 48 },
  { theme: "Bitcoin", callValue: 263046372, putValue: 625539072, callPercent: 30, putPercent: 70 },
  { theme: "Tech", callValue: 19041493250, putValue: 29600955027, callPercent: 39, putPercent: 61 },
];

const tickerByCusip: Record<string, string> = {
  "78463V107": "GLD", "464285105": "IAU", "46428Q109": "SLV", "46438F101": "IBIT",
  "315948109": "FBTC", "389637109": "GBTC", "09174C104": "BITB", "040919102": "ARKB",
  "46090E103": "QQQ", "81369Y803": "XLK", "92189F676": "SMH",
};

const issuerTickers: Array<[RegExp, string]> = [
  [/NVIDIA/i, "NVDA"], [/APPLE/i, "AAPL"], [/MICROSOFT/i, "MSFT"], [/AMAZON/i, "AMZN"],
  [/ALPHABET/i, "GOOGL"], [/META PLATFORMS/i, "META"], [/TAIWAN SEMICONDUCTOR/i, "TSM"],
  [/BROADCOM/i, "AVGO"], [/ADVANCED MICRO/i, "AMD"], [/PALANTIR/i, "PLTR"],
];

function inferTicker(cusip: string, issuer: string) {
  return tickerByCusip[cusip] ?? issuerTickers.find(([pattern]) => pattern.test(issuer))?.[1] ?? null;
}

function optionTheme(position: InstitutionalOption): OptionSentiment["theme"] | null {
  if (["GLD", "IAU"].includes(position.ticker ?? "")) return "Gold";
  if (position.ticker === "SLV") return "Silver";
  if (["IBIT", "FBTC", "GBTC", "BITB", "ARKB"].includes(position.ticker ?? "")) return "Bitcoin";
  if (["QQQ", "XLK", "SMH", "NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSM", "AVGO", "AMD", "PLTR"].includes(position.ticker ?? "")) return "Tech";
  return null;
}

function summarizeOptionSentiment(positions: InstitutionalOption[]): OptionSentiment[] {
  return (["Gold", "Silver", "Bitcoin", "Tech"] as const).map((theme) => {
    const matching = positions.filter((position) => optionTheme(position) === theme);
    const callValue = matching.filter((position) => position.optionType === "CALL").reduce((sum, position) => sum + position.reportedValue, 0);
    const putValue = matching.filter((position) => position.optionType === "PUT").reduce((sum, position) => sum + position.reportedValue, 0);
    const total = callValue + putValue;
    const callPercent = total ? Math.round((callValue / total) * 100) : 0;
    return { theme, callValue, putValue, callPercent, putPercent: total ? 100 - callPercent : 0 };
  });
}

async function getManagerOptions(manager: SecManager): Promise<InstitutionalOption[]> {
  const submissions = await fetch(`https://data.sec.gov/submissions/CIK${manager.cik}.json`, {
    headers: secHeaders, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000),
  }).then((response) => response.json());
  const forms = submissions?.filings?.recent?.form ?? [];
  const filingIndex = forms.findIndex((form: string) => form === "13F-HR");
  if (filingIndex < 0) return [];
  const accession = String(submissions.filings.recent.accessionNumber[filingIndex]);
  const accessionPath = accession.replaceAll("-", "");
  const cikNumber = String(Number(manager.cik));
  const baseUrl = `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionPath}`;
  const index = await fetch(`${baseUrl}/index.json`, { headers: secHeaders, next: { revalidate: 21600 }, signal: AbortSignal.timeout(8000) }).then((response) => response.json());
  const infoFile = toArray<{ name?: string; size?: string }>(index?.directory?.item)
    .filter((item) => item.name?.toLowerCase().endsWith(".xml") && !item.name.toLowerCase().includes("primary"))
    .sort((a, b) => Number(b.size || 0) - Number(a.size || 0))[0]?.name;
  if (!infoFile) return [];
  const xml = await fetch(`${baseUrl}/${infoFile}`, { headers: secHeaders, next: { revalidate: 21600 }, signal: AbortSignal.timeout(12000) }).then((response) => response.text());
  const parsed = new XMLParser({ removeNSPrefix: true }).parse(xml);
  const rows = toArray<Record<string, unknown>>(parsed?.informationTable?.infoTable);
  return rows.filter((row) => ["CALL", "PUT"].includes(String(row.putCall).toUpperCase())).map((row) => {
    const shares = row.shrsOrPrnAmt as Record<string, number> | undefined;
    const issuer = String(row.nameOfIssuer ?? "Unknown issuer");
    const cusip = String(row.cusip ?? "");
    return {
      manager: manager.manager, issuer, ticker: inferTicker(cusip, issuer), cusip,
      reportedValue: Number(row.value) || 0, shares: Number(shares?.sshPrnamt) || 0,
      reportDate: String(submissions.filings.recent.reportDate[filingIndex] ?? ""), sourceUrl: `${baseUrl}/${infoFile}`,
      optionType: String(row.putCall).toUpperCase() as "CALL" | "PUT",
    };
  });
}

function topOptionsByManager(positions: InstitutionalOption[], optionType: InstitutionalOption["optionType"]) {
  return secManagers.flatMap(({ manager }) => positions
    .filter((position) => position.manager === manager && position.optionType === optionType)
    .sort((first, second) => second.reportedValue - first.reportedValue)
    .slice(0, 5));
}

async function getInstitutionalOptions() {
  const results = await Promise.allSettled(secManagers.map(getManagerOptions));
  const positions = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const available = positions.length ? positions : institutionalFallback;
  return {
    institutionalCalls: topOptionsByManager(available, "CALL"),
    institutionalPuts: topOptionsByManager(available, "PUT"),
    optionSentiment: positions.length ? summarizeOptionSentiment(positions) : optionSentimentFallback,
  };
}

async function getCountryMovers(): Promise<CountryMover[]> {
  try {
    const batches = [countryIndices.slice(0, 11), countryIndices.slice(11)];
    const payloads = [];
    for (const batch of batches) {
      const symbols = batch.map((entry) => entry[2]).join(",");
      const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1mo&interval=1d`, {
        next: { revalidate: 3600 }, headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000),
      });
      if (response.ok) payloads.push(await response.json());
    }
    const resultRows = payloads.flatMap((payload) => payload?.spark?.result ?? []) as Array<Record<string, unknown>>;
    const results = new Map<string, Record<string, unknown>>(resultRows.map((item) => [String(item.symbol), item]));
    return countryIndices.map(([country, index, symbol]) => {
      const responseData = (results.get(symbol)?.response as Array<Record<string, unknown>> | undefined)?.[0];
      const meta = (responseData?.meta ?? {}) as Record<string, number>;
      const indicators = responseData?.indicators as { quote?: Array<{ close?: Array<number | null> }> } | undefined;
      const closes = (indicators?.quote?.[0]?.close ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const value = Number(meta.regularMarketPrice) || closes.at(-1) || 0;
      const start = closes[0] || Number(meta.chartPreviousClose) || value;
      return { country, index, symbol, value, monthlyChange: start ? ((value - start) / start) * 100 : 0 };
    }).filter((item) => item.value > 0).sort((a, b) => b.monthlyChange - a.monthlyChange);
  } catch {
    return [];
  }
}

export async function getMarketBetsData(): Promise<MarketBetsData> {
  const [politicalTrades, institutionalOptions, countryMovers] = await Promise.all([
    getHousePurchases(), getInstitutionalOptions(), getCountryMovers(),
  ]);
  return { politicalTrades, ...institutionalOptions, countryMovers, updatedAt: new Date().toISOString() };
}
