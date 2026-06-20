"use client";

import { FormEvent, useEffect, useState } from "react";
import { stockUniverse } from "@/lib/stock-universe";
import type { StockSearchResult } from "@/lib/stock-search";
import type { IndexBacktestMetrics, IndexBacktestResult, IndexHolding } from "@/types";

type WeightMode = "equal" | "custom";
type Period = IndexBacktestResult["period"];

const semiconductorSymbols = ["NVDA", "AMD", "AVGO", "QCOM", "MU", "INTC", "AMAT", "LRCX", "KLAC", "TXN", "ADI", "MRVL", "ON", "ASML", "TSM"];
const balancedHoldings: IndexHolding[] = [
  { symbol: "SPY", weight: 25 }, { symbol: "QQQ", weight: 20 }, { symbol: "VTI", weight: 15 },
  { symbol: "BND", weight: 20 }, { symbol: "TLT", weight: 10 }, { symbol: "TIP", weight: 10 },
];

function percent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function setEqualWeights(symbols: string[]) {
  return symbols.map((symbol) => ({ symbol, weight: 1 }));
}

function MetricGrid({ label, metrics }: { label: string; metrics: IndexBacktestMetrics }) {
  return <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e85d24]">{label}</p><div className="mt-3 grid grid-cols-2 gap-x-4"><Metric label="Total return" value={percent(metrics.totalReturn)} /><Metric label="Annualized" value={percent(metrics.annualizedReturn)} /><Metric label="Volatility" value={percent(metrics.annualizedVolatility)} /><Metric label="Sharpe" value={metrics.sharpeRatio.toFixed(2)} /><Metric label="Max drawdown" value={percent(metrics.maxDrawdown)} /></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-[#e3e5de] py-2.5"><p className="text-[10px] text-[#858b82]">{label}</p><p className="mt-0.5 font-mono text-sm font-semibold">{value}</p></div>;
}

function BacktestChart({ result }: { result: IndexBacktestResult }) {
  const width = 900;
  const height = 280;
  const values = result.series.flatMap((point) => [point.portfolio, point.sp500]);
  const minimum = Math.min(...values) * 0.96;
  const maximum = Math.max(...values) * 1.04;
  const range = Math.max(maximum - minimum, 1);
  const points = (key: "portfolio" | "sp500") => result.series.map((point, index) => {
    const x = result.series.length === 1 ? 0 : index / (result.series.length - 1) * width;
    const y = height - ((point[key] - minimum) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#e85d24]">Growth of $100</p><p className="mt-1 text-sm text-[#747a71]">{result.startDate} → {result.endDate}</p></div><div className="flex gap-4 text-[10px]"><span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-[#e85d24]" />Custom index</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-5 bg-[#20231f]" />S&amp;P 500</span></div></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Custom index versus S&P 500 growth chart" className="h-[240px] w-full overflow-visible"><line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#dfe1da" /><line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#dfe1da" /><line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#dfe1da" /><polyline points={points("sp500")} fill="none" stroke="#20231f" strokeWidth="3" vectorEffect="non-scaling-stroke" /><polyline points={points("portfolio")} fill="none" stroke="#e85d24" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg></div>;
}

export default function IndexFundBuilder() {
  const [holdings, setHoldings] = useState<IndexHolding[]>(setEqualWeights(semiconductorSymbols));
  const [weightMode, setWeightMode] = useState<WeightMode>("equal");
  const [period, setPeriod] = useState<Period>("3y");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [result, setResult] = useState<IndexBacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2 || /[,\s]/.test(searchQuery)) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch(`/api/stock-search?q=${encodeURIComponent(searchQuery)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : { results: [] })
        .then((data: { results?: StockSearchResult[] }) => setSuggestions(data.results ?? []))
        .catch(() => undefined);
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  function addSymbols(symbolInputs: string[]) {
    const symbols = symbolInputs.map((symbol) => symbol.trim().toUpperCase().replace(/[^A-Z0-9.^=-]/g, "")).filter(Boolean);
    setHoldings((current) => [...current, ...symbols.map((symbol) => ({ symbol, weight: 1 }))]
      .filter((holding, index, rows) => rows.findIndex((candidate) => candidate.symbol === holding.symbol) === index)
      .slice(0, 100));
    setQuery("");
    setSuggestions([]);
    setResult(null);
  }

  function addFromInput(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    addSymbols(query.split(/[\s,]+/));
  }

  function applyPreset(preset: "large" | "semis" | "balanced") {
    if (preset === "large") {
      setHoldings(setEqualWeights(stockUniverse.slice(0, 100).map((stock) => stock.symbol)));
      setWeightMode("equal");
    } else if (preset === "semis") {
      setHoldings(setEqualWeights(semiconductorSymbols));
      setWeightMode("equal");
    } else {
      setHoldings(balancedHoldings);
      setWeightMode("custom");
    }
    setResult(null);
    setError("");
  }

  function updateWeight(symbol: string, weight: number) {
    setHoldings((current) => current.map((holding) => holding.symbol === symbol ? { ...holding, weight: Math.max(0, weight) } : holding));
    setResult(null);
  }

  async function runBacktest() {
    if (holdings.length < 2) {
      setError("Add at least two holdings before running a backtest.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = weightMode === "equal" ? setEqualWeights(holdings.map((holding) => holding.symbol)) : holdings;
      const response = await fetch("/api/index-backtest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ holdings: payload, period }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Backtest unavailable");
      setResult(data.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Backtest unavailable.");
    } finally {
      setLoading(false);
    }
  }

  const totalWeight = holdings.reduce((sum, holding) => sum + holding.weight, 0);
  return <section className="border-t border-[#d8dad3] py-10"><div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e85d24]">Portfolio laboratory</p><h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Custom Index Fund Builder</h2><p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#70766d]">Combine up to 100 stocks, equity ETFs, and bond ETFs, choose weights, and compare the historical index against the S&amp;P 500.</p><p className="mt-1 text-[11px] text-[#969b92]">Backtests are hypothetical, use historical closes, and do not include dividends, taxes, fees, spreads, or future constituent changes.</p></div>

    <div className="grid gap-6 xl:grid-cols-[.72fr_1.28fr]"><div className="space-y-4"><div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Start with a preset</p><div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1"><button type="button" onClick={() => applyPreset("large")} className="rounded-xl border border-[#d8dbd3] px-4 py-3 text-left text-xs font-semibold hover:border-[#e85d24]">Tracked Large-Cap 100<span className="mt-1 block text-[10px] font-normal text-[#858b82]">100-company equal-weight proxy</span></button><button type="button" onClick={() => applyPreset("semis")} className="rounded-xl border border-[#d8dbd3] px-4 py-3 text-left text-xs font-semibold hover:border-[#e85d24]">Semiconductor Basket<span className="mt-1 block text-[10px] font-normal text-[#858b82]">15 global chip leaders</span></button><button type="button" onClick={() => applyPreset("balanced")} className="rounded-xl border border-[#d8dbd3] px-4 py-3 text-left text-xs font-semibold hover:border-[#e85d24]">60 / 40 Multi-Asset<span className="mt-1 block text-[10px] font-normal text-[#858b82]">Stocks plus bond ETFs</span></button></div></div>

      <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Holdings</p><p className="mt-1 text-sm font-semibold">{holdings.length} assets</p></div><div className="flex rounded-full bg-[#eef0ec] p-1 text-[10px] font-semibold"><button type="button" onClick={() => setWeightMode("equal")} className={`rounded-full px-3 py-1.5 ${weightMode === "equal" ? "bg-[#20231f] text-white" : "text-[#666c63]"}`}>Equal</button><button type="button" onClick={() => setWeightMode("custom")} className={`rounded-full px-3 py-1.5 ${weightMode === "custom" ? "bg-[#20231f] text-white" : "text-[#666c63]"}`}>Custom</button></div></div><form onSubmit={addFromInput} className="relative mt-4"><div className="flex overflow-hidden rounded-full border border-[#d5d8d0] bg-white focus-within:border-[#e85d24]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Add ticker, company, or paste AAPL, BND, TLT" aria-label="Add index holding" className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-xs outline-none" /><button className="m-1 rounded-full bg-[#20231f] px-4 text-xs font-semibold text-white">Add</button></div>{suggestions.length > 0 && <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-[#d8dbd3] bg-white p-1 shadow-xl">{suggestions.slice(0, 5).map((suggestion) => <button key={suggestion.symbol} type="button" onClick={() => addSymbols([suggestion.symbol])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-[#f2f4ef]"><span className="truncate text-xs">{suggestion.name}</span><strong className="ml-3 font-mono text-[10px]">{suggestion.symbol}</strong></button>)}</div>}</form><div className="mt-4 max-h-72 space-y-1 overflow-y-auto pr-1">{holdings.map((holding) => <div key={holding.symbol} className="flex items-center gap-2 rounded-lg bg-[#f4f5f1] px-3 py-2"><strong className="min-w-16 font-mono text-xs">{holding.symbol}</strong>{weightMode === "custom" ? <label className="ml-auto flex items-center gap-1 text-[10px] text-[#7b8178]"><input type="number" min="0" step="0.1" value={holding.weight} onChange={(event) => updateWeight(holding.symbol, Number(event.target.value))} className="w-16 rounded-md border border-[#d5d8d0] bg-white px-2 py-1 text-right font-mono text-xs" />%</label> : <span className="ml-auto font-mono text-[10px] text-[#858b82]">{(100 / holdings.length).toFixed(2)}%</span>}<button type="button" aria-label={`Remove ${holding.symbol}`} onClick={() => { setHoldings((current) => current.filter((item) => item.symbol !== holding.symbol)); setResult(null); }} className="grid h-6 w-6 place-items-center rounded-full text-sm text-[#bc3c2c] hover:bg-[#faeae7]">×</button></div>)}</div>{weightMode === "custom" && <p className="mt-2 text-right font-mono text-[10px] text-[#858b82]">Input weight total: {totalWeight.toFixed(1)}% · normalized automatically</p>}</div>

      <div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#858b82]">Backtest period</p><div className="mt-3 flex gap-2">{(["1y", "3y", "5y"] as Period[]).map((option) => <button key={option} type="button" onClick={() => { setPeriod(option); setResult(null); }} className={`rounded-full px-4 py-2 font-mono text-xs font-semibold ${period === option ? "bg-[#20231f] text-white" : "bg-[#eef0ec] text-[#62685f]"}`}>{option.toUpperCase()}</button>)}</div></div><button type="button" onClick={runBacktest} disabled={loading || holdings.length < 2} className="rounded-full bg-[#e85d24] px-5 py-3 text-xs font-bold text-white transition hover:bg-[#cf4e1c] disabled:opacity-50">{loading ? "Running…" : "Run backtest"}</button></div>{error && <p className="mt-3 text-xs text-[#bc3c2c]">{error}</p>}</div></div>

      <div>{!result && <div className="grid min-h-[520px] place-items-center rounded-3xl border border-dashed border-[#ccd0c7] bg-white/35 p-8 text-center"><div><p className="font-mono text-5xl text-[#c0c5bc]">100</p><h3 className="mt-3 text-xl font-semibold">Build it, then test it.</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-[#777d74]">Your custom growth chart and S&amp;P 500 comparison will appear here.</p></div></div>}{result && <div className="space-y-4"><BacktestChart result={result} /><div className="grid gap-4 md:grid-cols-2"><MetricGrid label="Custom index" metrics={result.portfolio} /><MetricGrid label="S&P 500" metrics={result.sp500} /></div><div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#20231f] p-5 text-white sm:grid-cols-5"><Metric label="Outperformance" value={percent(result.relative.outperformance)} /><Metric label="Beta" value={result.relative.beta.toFixed(2)} /><Metric label="Correlation" value={result.relative.correlation.toFixed(2)} /><Metric label="Tracking error" value={percent(result.relative.trackingError)} /><Metric label="Daily win rate" value={percent(result.relative.dailyWinRate)} /></div><div className="rounded-2xl border border-[#dfe1da] bg-white/70 p-4 text-xs leading-relaxed text-[#747a71]"><p>{result.methodology}</p><p className="mt-2">Included {result.includedSymbols.length} of {result.requestedSymbols.length} holdings.{result.omittedSymbols.length ? ` Missing history: ${result.omittedSymbols.join(", ")}.` : ""} Risk-free assumption: {result.riskFreeRate.toFixed(1)}%.</p></div></div>}</div></div>
  </section>;
}
