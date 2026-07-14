type FinancialRow = { value1?: string; value2?: string; value3?: string; value4?: string };

export type FinancialFeedback = {
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

const nasdaqHeaders = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json,text/plain,*/*",
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/market-activity/stocks",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function parseNumber(value: string | undefined) {
  if (!value || value === "N/A") return null;
  const multiplier = /\((.*)\)/.test(value) ? -1 : 1;
  const parsed = Number(value.replace(/[()$,%]/g, "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed * multiplier : null;
}

function findRow(rows: FinancialRow[], labels: string[]) {
  return rows.find((row) => labels.some((label) => String(row.value1 ?? "").toLowerCase().includes(label.toLowerCase())));
}

function growth(current: number | null, previous: number | null) {
  return current !== null && previous ? ((current - previous) / Math.abs(previous)) * 100 : null;
}

function scorePositiveGrowth(value: number | null, weight: number) {
  if (value === null) return weight * 0.35;
  if (value >= 20) return weight;
  if (value >= 8) return weight * 0.82;
  if (value > 0) return weight * 0.58;
  return weight * 0.18;
}

function fallback(symbol: string): FinancialFeedback {
  return {
    annualReportScore: 50,
    balanceSheetScore: 50,
    buyMetricsScore: 50,
    annualReportNotes: [`${symbol} annual report feed was unavailable, so this candidate leans more on market, analyst, and Quant signals.`],
    balanceSheetNotes: [`${symbol} balance sheet feed was unavailable; confirm leverage, liquidity, and cash runway before acting.`],
    metrics: {
      revenueGrowth: null,
      netIncomeGrowth: null,
      profitMargin: null,
      currentRatio: null,
      debtToEquity: null,
      cashToDebt: null,
      equityGrowth: null,
    },
  };
}

export async function getFinancialFeedback(symbolInput: string): Promise<FinancialFeedback> {
  const symbol = symbolInput.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
  if (!symbol) return fallback("The company");

  try {
    const response = await fetch(`https://api.nasdaq.com/api/company/${encodeURIComponent(symbol)}/financials?frequency=1`, {
      headers: nasdaqHeaders,
      next: { revalidate: 21600 },
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return fallback(symbol);
    const data = (await response.json())?.data;
    const incomeRows = (data?.incomeStatementTable?.rows ?? []) as FinancialRow[];
    const balanceRows = (data?.balanceSheetTable?.rows ?? []) as FinancialRow[];
    const ratioRows = (data?.financialRatiosTable?.rows ?? []) as FinancialRow[];

    const revenue = findRow(incomeRows, ["Total Revenue", "Revenue"]);
    const netIncome = findRow(incomeRows, ["Net Income"]);
    const assets = findRow(balanceRows, ["Total Assets"]);
    const liabilities = findRow(balanceRows, ["Total Liabilities"]);
    const equity = findRow(balanceRows, ["Total Equity", "Stockholders Equity", "Shareholders Equity"]);
    const cash = findRow(balanceRows, ["Cash and Cash Equivalents", "Cash & Cash Equivalents", "Cash"]);
    const debt = findRow(balanceRows, ["Total Debt", "Long Term Debt", "Short Term Debt"]);

    const revenueGrowth = growth(parseNumber(revenue?.value2), parseNumber(revenue?.value3));
    const netIncomeGrowth = growth(parseNumber(netIncome?.value2), parseNumber(netIncome?.value3));
    const equityGrowth = growth(parseNumber(equity?.value2), parseNumber(equity?.value3));
    const profitMargin = parseNumber(findRow(ratioRows, ["Profit Margin"])?.value2);
    const currentRatioRaw = parseNumber(findRow(ratioRows, ["Current Ratio"])?.value2);
    const currentRatio = currentRatioRaw === null ? null : currentRatioRaw / 100;
    const latestAssets = parseNumber(assets?.value2);
    const latestLiabilities = parseNumber(liabilities?.value2);
    const latestEquity = parseNumber(equity?.value2);
    const latestCash = parseNumber(cash?.value2);
    const latestDebt = parseNumber(debt?.value2);
    const debtToEquity = latestDebt !== null && latestEquity ? latestDebt / Math.abs(latestEquity) : null;
    const cashToDebt = latestCash !== null && latestDebt ? latestCash / Math.abs(latestDebt) : null;
    const liabilityToAsset = latestLiabilities !== null && latestAssets ? latestLiabilities / Math.abs(latestAssets) : null;

    const annualReportScore = Math.round(clamp(
      scorePositiveGrowth(revenueGrowth, 34) +
      scorePositiveGrowth(netIncomeGrowth, 28) +
      (profitMargin === null ? 12 : profitMargin >= 20 ? 20 : profitMargin >= 10 ? 16 : profitMargin > 0 ? 10 : 2) +
      scorePositiveGrowth(equityGrowth, 18),
      0,
      100,
    ));
    const balanceSheetScore = Math.round(clamp(
      (currentRatio === null ? 18 : currentRatio >= 2 ? 30 : currentRatio >= 1.2 ? 24 : currentRatio >= 1 ? 15 : 5) +
      (debtToEquity === null ? 16 : debtToEquity <= 0.5 ? 25 : debtToEquity <= 1.5 ? 18 : debtToEquity <= 3 ? 10 : 3) +
      (cashToDebt === null ? 14 : cashToDebt >= 1 ? 22 : cashToDebt >= 0.4 ? 15 : 7) +
      (liabilityToAsset === null ? 12 : liabilityToAsset <= 0.45 ? 23 : liabilityToAsset <= 0.7 ? 15 : 6),
      0,
      100,
    ));
    const buyMetricsScore = Math.round((annualReportScore * 0.55) + (balanceSheetScore * 0.45));

    const annualReportNotes = [
      revenueGrowth === null ? "Revenue trend was not available in the annual feed." : `Annual revenue growth reads ${revenueGrowth.toFixed(1)}%.`,
      netIncomeGrowth === null ? "Net income trend was not available in the annual feed." : `Annual net income growth reads ${netIncomeGrowth.toFixed(1)}%.`,
      profitMargin === null ? "Profit margin was not available." : `Profit margin is ${profitMargin.toFixed(1)}%, showing ${profitMargin > 10 ? "healthy" : profitMargin > 0 ? "thin but positive" : "negative"} profitability.`,
    ];
    const balanceSheetNotes = [
      currentRatio === null ? "Current ratio was not available." : `Current ratio is ${currentRatio.toFixed(2)}.`,
      debtToEquity === null ? "Debt-to-equity was not available." : `Debt-to-equity is ${debtToEquity.toFixed(2)}.`,
      cashToDebt === null ? "Cash-to-debt coverage was not available." : `Cash-to-debt coverage is ${cashToDebt.toFixed(2)}.`,
    ];

    return {
      annualReportScore,
      balanceSheetScore,
      buyMetricsScore,
      annualReportNotes,
      balanceSheetNotes,
      metrics: { revenueGrowth, netIncomeGrowth, profitMargin, currentRatio, debtToEquity, cashToDebt, equityGrowth },
    };
  } catch {
    return fallback(symbol);
  }
}
