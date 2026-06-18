import { XMLParser } from "fast-xml-parser";
import type { CountryMover, InstitutionalOption, InstitutionalSearchResult } from "@/types";

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
  ["Argentina", "MERVAL", "^MERV"], ["Turkey", "BIST 100", "XU100.IS"], ["Singapore", "Straits Times", "^STI"],
] as const;

const secHeaders = { "User-Agent": "RajPeswaniTracker rajpeswani@berkeley.edu", "Accept-Encoding": "gzip, deflate" };

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeCompanyName(value: string) {
  return value.toUpperCase().replace(/\b(INCORPORATED|INC|CORPORATION|CORP|COMPANY|CO|PLC|LTD|LIMITED|HOLDINGS|HLDGS|GROUP|CLASS|COMMON|STOCK)\b/g, " ").replace(/[^A-Z0-9]/g, "").trim();
}

async function companyNameForSymbol(symbol: string) {
  try {
    const response = await fetch(`https://api.nasdaq.com/api/company/${encodeURIComponent(symbol)}/company-profile`, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json,text/plain,*/*", Referer: `https://www.nasdaq.com/market-activity/stocks/${symbol.toLowerCase()}` },
      next: { revalidate: 21600 }, signal: AbortSignal.timeout(7000),
    });
    return response.ok ? (await response.json())?.data?.CompanyName?.value ?? symbol : symbol;
  } catch {
    return symbol;
  }
}

async function matchingManagerOptions(manager: SecManager, symbol: string, companyName: string): Promise<InstitutionalOption[]> {
  const submissionsResponse = await fetch(`https://data.sec.gov/submissions/CIK${manager.cik}.json`, { headers: secHeaders, cache: "no-store", signal: AbortSignal.timeout(9000) });
  if (!submissionsResponse.ok) return [];
  const submissions = await submissionsResponse.json();
  const forms = submissions?.filings?.recent?.form ?? [];
  const filingIndex = forms.findIndex((form: string) => form === "13F-HR");
  if (filingIndex < 0) return [];
  const accessionPath = String(submissions.filings.recent.accessionNumber[filingIndex]).replaceAll("-", "");
  const baseUrl = `https://www.sec.gov/Archives/edgar/data/${Number(manager.cik)}/${accessionPath}`;
  const indexResponse = await fetch(`${baseUrl}/index.json`, { headers: secHeaders, cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!indexResponse.ok) return [];
  const index = await indexResponse.json();
  const infoFile = toArray<{ name?: string; size?: string }>(index?.directory?.item)
    .filter((item) => item.name?.toLowerCase().endsWith(".xml") && !item.name.toLowerCase().includes("primary"))
    .sort((first, second) => Number(second.size || 0) - Number(first.size || 0))[0]?.name;
  if (!infoFile) return [];
  const sourceUrl = `${baseUrl}/${infoFile}`;
  const filingResponse = await fetch(sourceUrl, { headers: secHeaders, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!filingResponse.ok) return [];
  const parsed = new XMLParser({ removeNSPrefix: true }).parse(await filingResponse.text());
  const normalizedName = normalizeCompanyName(companyName);
  return toArray<Record<string, unknown>>(parsed?.informationTable?.infoTable).flatMap((row) => {
    const optionType = String(row.putCall).toUpperCase();
    const issuer = String(row.nameOfIssuer ?? "Unknown issuer");
    const normalizedIssuer = normalizeCompanyName(issuer);
    if (!["CALL", "PUT"].includes(optionType) || normalizedName.length < 3 || (!normalizedIssuer.includes(normalizedName) && !normalizedName.includes(normalizedIssuer))) return [];
    const shares = row.shrsOrPrnAmt as Record<string, number> | undefined;
    return [{ manager: manager.manager, issuer, ticker: symbol, cusip: String(row.cusip ?? ""), reportedValue: Number(row.value) || 0, shares: Number(shares?.sshPrnamt) || 0, reportDate: String(submissions.filings.recent.reportDate[filingIndex] ?? ""), sourceUrl, optionType: optionType as "CALL" | "PUT" }];
  });
}

export async function searchLiveInstitutionalOptions(symbolInput: string): Promise<InstitutionalSearchResult> {
  const symbol = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
  const companyName = await companyNameForSymbol(symbol);
  const positions: InstitutionalOption[] = [];
  for (const manager of secManagers) {
    try {
      positions.push(...await matchingManagerOptions(manager, symbol, companyName));
    } catch {
      continue;
    }
  }
  return { symbol, companyName, calls: positions.filter((position) => position.optionType === "CALL").sort((first, second) => second.reportedValue - first.reportedValue), puts: positions.filter((position) => position.optionType === "PUT").sort((first, second) => second.reportedValue - first.reportedValue), updatedAt: new Date().toISOString() };
}

export async function getLiveCountryMovers(): Promise<{ countryMovers: CountryMover[]; updatedAt: string }> {
  const symbols = countryIndices.map((entry) => entry[2]).join(",");
  const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1mo&interval=1d`, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(9000) });
  if (!response.ok) return { countryMovers: [], updatedAt: new Date().toISOString() };
  const payload = await response.json();
  const results = new Map<string, Record<string, unknown>>(((payload?.spark?.result ?? []) as Array<Record<string, unknown>>).map((item) => [String(item.symbol), item]));
  const countryMovers = countryIndices.map(([country, index, symbol]) => {
    const responseData = (results.get(symbol)?.response as Array<Record<string, unknown>> | undefined)?.[0];
    const meta = (responseData?.meta ?? {}) as Record<string, number>;
    const indicators = responseData?.indicators as { quote?: Array<{ close?: Array<number | null> }> } | undefined;
    const closes = (indicators?.quote?.[0]?.close ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const value = Number(meta.regularMarketPrice) || closes.at(-1) || 0;
    const start = closes[0] || Number(meta.chartPreviousClose) || value;
    return { country, index, symbol, value, monthlyChange: start ? ((value - start) / start) * 100 : 0 };
  }).filter((item) => item.value > 0).sort((first, second) => second.monthlyChange - first.monthlyChange);
  return { countryMovers, updatedAt: new Date().toISOString() };
}
