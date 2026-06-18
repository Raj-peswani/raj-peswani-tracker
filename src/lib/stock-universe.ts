export type StockDefinition = {
  symbol: string;
  name: string;
  sector: string;
};

const sectors: Record<string, Array<[string, string]>> = {
  "Information Technology": [
    ["AAPL", "Apple"], ["MSFT", "Microsoft"], ["NVDA", "NVIDIA"], ["AVGO", "Broadcom"], ["ORCL", "Oracle"],
    ["CRM", "Salesforce"], ["AMD", "AMD"], ["ADBE", "Adobe"], ["QCOM", "Qualcomm"], ["CSCO", "Cisco"],
  ],
  "Communication Services": [
    ["GOOGL", "Alphabet"], ["META", "Meta Platforms"], ["NFLX", "Netflix"], ["DIS", "Walt Disney"], ["TMUS", "T-Mobile US"],
    ["VZ", "Verizon"], ["T", "AT&T"], ["CHTR", "Charter"], ["EA", "Electronic Arts"], ["WBD", "Warner Bros. Discovery"],
  ],
  "Consumer Discretionary": [
    ["AMZN", "Amazon"], ["TSLA", "Tesla"], ["HD", "Home Depot"], ["MCD", "McDonald's"], ["NKE", "Nike"],
    ["SBUX", "Starbucks"], ["LOW", "Lowe's"], ["BKNG", "Booking Holdings"], ["TJX", "TJX Companies"], ["GM", "General Motors"],
  ],
  "Consumer Staples": [
    ["WMT", "Walmart"], ["COST", "Costco"], ["PG", "Procter & Gamble"], ["KO", "Coca-Cola"], ["PEP", "PepsiCo"],
    ["PM", "Philip Morris"], ["MO", "Altria"], ["MDLZ", "Mondelez"], ["CL", "Colgate-Palmolive"], ["KMB", "Kimberly-Clark"],
  ],
  Energy: [
    ["XOM", "Exxon Mobil"], ["CVX", "Chevron"], ["COP", "ConocoPhillips"], ["SLB", "SLB"], ["EOG", "EOG Resources"],
    ["MPC", "Marathon Petroleum"], ["PSX", "Phillips 66"], ["OXY", "Occidental Petroleum"], ["VLO", "Valero Energy"], ["KMI", "Kinder Morgan"],
  ],
  Financials: [
    ["BRK-B", "Berkshire Hathaway"], ["JPM", "JPMorgan Chase"], ["V", "Visa"], ["MA", "Mastercard"], ["BAC", "Bank of America"],
    ["WFC", "Wells Fargo"], ["GS", "Goldman Sachs"], ["MS", "Morgan Stanley"], ["AXP", "American Express"], ["C", "Citigroup"],
  ],
  "Health Care": [
    ["LLY", "Eli Lilly"], ["UNH", "UnitedHealth"], ["JNJ", "Johnson & Johnson"], ["ABBV", "AbbVie"], ["MRK", "Merck"],
    ["TMO", "Thermo Fisher"], ["ABT", "Abbott"], ["AMGN", "Amgen"], ["GILD", "Gilead Sciences"], ["ISRG", "Intuitive Surgical"],
  ],
  Industrials: [
    ["GE", "GE Aerospace"], ["CAT", "Caterpillar"], ["RTX", "RTX"], ["BA", "Boeing"], ["HON", "Honeywell"],
    ["UPS", "UPS"], ["DE", "Deere"], ["LMT", "Lockheed Martin"], ["ETN", "Eaton"], ["UNP", "Union Pacific"],
  ],
  Materials: [
    ["LIN", "Linde"], ["SHW", "Sherwin-Williams"], ["FCX", "Freeport-McMoRan"], ["NEM", "Newmont"], ["APD", "Air Products"],
    ["ECL", "Ecolab"], ["NUE", "Nucor"], ["DOW", "Dow"], ["MLM", "Martin Marietta"], ["VMC", "Vulcan Materials"],
  ],
  "Real Estate": [
    ["PLD", "Prologis"], ["AMT", "American Tower"], ["EQIX", "Equinix"], ["WELL", "Welltower"], ["SPG", "Simon Property"],
    ["O", "Realty Income"], ["PSA", "Public Storage"], ["CCI", "Crown Castle"], ["DLR", "Digital Realty"], ["CBRE", "CBRE Group"],
  ],
  Utilities: [
    ["NEE", "NextEra Energy"], ["SO", "Southern Company"], ["DUK", "Duke Energy"], ["CEG", "Constellation Energy"], ["AEP", "American Electric Power"],
    ["SRE", "Sempra"], ["VST", "Vistra"], ["EXC", "Exelon"], ["XEL", "Xcel Energy"], ["ED", "Consolidated Edison"],
  ],
};

export const stockUniverse: StockDefinition[] = Object.entries(sectors).flatMap(([sector, stocks]) =>
  stocks.map(([symbol, name]) => ({ symbol, name, sector })),
);

export const defaultWatchlist = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA"];
