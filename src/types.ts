export type MarketQuote = {
  symbol: string;
  label: string;
  value: number;
  change: number;
  currency?: string;
};

export type Story = {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
};

export type StoryGroup = {
  label: string;
  stories: Story[];
};

export type NewsSection = {
  id: string;
  title: string;
  eyebrow: string;
  groups: StoryGroup[];
};

export type DashboardData = {
  generatedAt: string;
  markets: MarketQuote[];
  realEstateMarkets: MarketQuote[];
  newsSections: NewsSection[];
  realEstateGroups: StoryGroup[];
};

export type StockSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  periodChange: number;
};

export type StockSignal = {
  symbol: string;
  callPercent: number | null;
  putPercent: number | null;
  analystRating: string | null;
  analystCount: number | null;
};

export type SectorMovers = {
  sector: string;
  stocks: StockSnapshot[];
};

export type IpoRecord = {
  symbol: string;
  company: string;
  exchange: string;
  price: string;
  date: string;
  offerAmount: string;
  status: "Upcoming" | "Priced" | "Filed";
};

export type StocksData = {
  period: "day" | "month" | "year";
  gainers: StockSnapshot[];
  decliners: StockSnapshot[];
  sectors: SectorMovers[];
};

export type PoliticalTrade = {
  politician: string;
  chamber: "House" | "Senate";
  state: string;
  ticker: string | null;
  asset: string;
  amount: string;
  transactionDate: string;
  filingDate: string;
  sourceUrl: string;
};

export type InstitutionalOption = {
  manager: string;
  issuer: string;
  ticker: string | null;
  cusip?: string;
  reportedValue: number;
  shares: number;
  reportDate: string;
  sourceUrl: string;
  optionType: "CALL" | "PUT";
};

export type OptionSentiment = {
  theme: "Gold" | "Silver" | "Bitcoin" | "Tech";
  callValue: number;
  putValue: number;
  callPercent: number;
  putPercent: number;
};

export type CountryMover = {
  country: string;
  index: string;
  symbol: string;
  value: number;
  monthlyChange: number;
};

export type MarketBetsData = {
  politicalTrades: PoliticalTrade[];
  institutionalCalls: InstitutionalOption[];
  institutionalPuts: InstitutionalOption[];
  optionSentiment: OptionSentiment[];
  countryMovers: CountryMover[];
  updatedAt: string;
};

export type StockChartPoint = {
  timestamp: number;
  close: number;
};

export type StockDetailData = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  dayChange: number;
  dayChangePercent: number;
  rangeChange: number;
  rangeChangePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketTime: number;
  range: string;
  points: StockChartPoint[];
  news: Story[];
};
