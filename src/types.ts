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

export type InstitutionalSearchResult = {
  symbol: string;
  companyName: string;
  calls: InstitutionalOption[];
  puts: InstitutionalOption[];
  updatedAt: string;
};

export type QuantAnalysis = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  setupScore: number;
  setupLabel: "Strong setup" | "Constructive" | "Neutral" | "Caution";
  technical: {
    sma20: number;
    sma50: number;
    sma200: number;
    rsi14: number;
    macd: number;
    signal: number;
    atr14: number;
    volatility: number;
    return20Day: number;
    support: number;
    resistance: number;
    stopReference: number;
    twoRTarget: number;
  };
  fundamentals: {
    sector: string;
    industry: string;
    oneYearTarget: number | null;
    targetUpside: number | null;
    revenueGrowth: number | null;
    netIncomeGrowth: number | null;
    profitMargin: number | null;
    currentRatio: number | null;
  };
  options: StockSignal;
  forecasting: {
    sharpeRatio: number;
    riskFreeRate: number;
    simulations: number;
    day20: { median: number; low: number; high: number; probabilityGain: number };
    day60: { median: number; low: number; high: number; probabilityGain: number };
  };
  pattern: {
    detected: boolean;
    averageSwing: number;
    averageCycleDays: number;
    consistency: number;
    phase: string;
    nextReference: number | null;
    pivots: Array<{ date: string; type: "high" | "low"; price: number }>;
  };
  scores: {
    trend: number;
    momentum: number;
    risk: number;
    fundamentals: number;
  };
  signals: Array<{ label: string; detail: string; tone: "positive" | "neutral" | "negative" }>;
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

export type LookoutCandidate = {
  rank: number;
  symbol: string;
  name: string;
  sector: string;
  price: number;
  researchScore: number;
  classification: "Priority research" | "Constructive watch" | "Monitor";
  holdingPeriod: string;
  expectedProfitPercent: number;
  scenarioTarget: number;
  probabilitySuccess: number;
  stopReference: number;
  downsideToStop: number;
  performance: { day: number; month: number; year: number };
  ratios: {
    sharpeRatio: number;
    rsi14: number;
    volatility: number;
    revenueGrowth: number | null;
    profitMargin: number | null;
    currentRatio: number | null;
    targetUpside: number | null;
    callPercent: number | null;
    putPercent: number | null;
    analystRating: string | null;
  };
  reportFeedback: {
    annualReportScore: number;
    balanceSheetScore: number;
    buyMetricsScore: number;
    annualReportNotes: string[];
    balanceSheetNotes: string[];
    metrics: {
      revenueGrowth: number | null;
      netIncomeGrowth: number | null;
      profitMargin: number | null;
      currentRatio: number | null;
      debtToEquity: number | null;
      cashToDebt: number | null;
      equityGrowth: number | null;
    };
  };
  pattern: QuantAnalysis["pattern"];
  reasoning: string[];
  risks: string[];
  news: Story[];
};

export type LookoutsData = {
  generatedAt: string;
  nextRefreshAt: string;
  scannedStocks: number;
  methodology: string[];
  candidates: LookoutCandidate[];
};

export type StrongBuyStock = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  analystRating: string;
  analystCount: number | null;
  callPercent: number | null;
  putPercent: number | null;
  setupScore: number;
  reportScore: number;
  targetUpside: number | null;
  reasons: string[];
};

export type StrongBuysData = {
  generatedAt: string;
  scannedStocks: number;
  stocks: StrongBuyStock[];
};

export type IndexHolding = {
  symbol: string;
  weight: number;
};

export type IndexBacktestMetrics = {
  totalReturn: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
};

export type IndexBacktestResult = {
  period: "1y" | "3y" | "5y";
  benchmark: "^GSPC";
  methodology: string;
  riskFreeRate: number;
  requestedSymbols: string[];
  includedSymbols: string[];
  omittedSymbols: string[];
  startDate: string;
  endDate: string;
  portfolio: IndexBacktestMetrics;
  sp500: IndexBacktestMetrics;
  relative: {
    outperformance: number;
    beta: number;
    correlation: number;
    trackingError: number;
    dailyWinRate: number;
  };
  series: Array<{ date: string; portfolio: number; sp500: number }>;
};
