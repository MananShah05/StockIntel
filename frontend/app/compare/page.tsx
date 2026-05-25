"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { StockListItem, StockDashboardData } from "@/lib/types";
import { Scales, Plus, Trash, Sparkle, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

export default function SignalCompare() {
  const { data: stocks } = useSWR<StockListItem[]>("/api/stocks", fetcher);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch detailed scores for each selected stock
  const { data: detailsList, isLoading: detailsLoading } = useSWR<StockDashboardData[]>(
    selectedTickers.length > 0 ? `compare-${selectedTickers.join("-")}` : null,
    async () => {
      const promises = selectedTickers.map(async (ticker) => {
        try {
          return await fetcher<StockDashboardData>(`/api/scores/${ticker}/latest`);
        } catch (err) {
          console.error(`Failed to fetch latest score for ${ticker}:`, err);
          return null;
        }
      });
      const results = await Promise.all(promises);
      return results.filter((r): r is StockDashboardData => r !== null);
    }
  );

  const handleAddStock = (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (selectedTickers.length >= 3) {
      alert("You can compare a maximum of 3 stocks side-by-side.");
      return;
    }
    if (!selectedTickers.includes(sym)) {
      setSelectedTickers([...selectedTickers, sym]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveStock = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== ticker));
  };

  // Filter out macro indices and already selected stocks from suggestions
  const suggestions = stocks
    ? stocks.filter(
        (s) =>
          s.ticker !== "SPY" &&
          s.ticker !== "QQQ" &&
          s.ticker !== "VIX" &&
          !selectedTickers.includes(s.ticker) &&
          (s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-8 py-6 text-[var(--text-primary)]">
      {/* Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-[var(--text-secondary)] select-none">
          <Scales className="h-4 w-4 text-[var(--amber-500)] animate-pulse" />
          Signal Convergence Comparison
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-[var(--text-primary)] leading-none">
          Signal Compare Center
        </h1>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Compare up to three assets side-by-side to discover the strongest setups, sentiment agreement, and balance sheet cushions.
        </p>
      </section>

      {/* Selector input */}
      <div className="relative max-w-md mx-auto z-40">
        <div className="flex bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl overflow-hidden shadow-sm p-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type ticker symbol to add... (e.g. TSLA, MSFT)"
            className="w-full bg-transparent px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
          />
          <button className="bg-[var(--bg-sunken)] border border-[var(--border-soft)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors">
            Add
          </button>
        </div>

        {/* Suggestion Dropdown */}
        {showDropdown && searchTerm && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-xl shadow-md overflow-hidden z-50">
            <ul className="divide-y divide-[var(--border-soft)]">
              {suggestions.map((s) => (
                <li key={s.ticker}>
                  <button
                    onClick={() => handleAddStock(s.ticker)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-sunken)] text-left transition-all text-xs"
                  >
                    <span className="font-display font-bold text-[var(--teal-500)]">{s.ticker}</span>
                    <span className="text-[var(--text-secondary)] text-[11px] truncate max-w-[200px]">{s.company_name}</span>
                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase">Add +</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Selected Stock Panels list */}
      <div className="flex flex-wrap items-center justify-center gap-3 select-none">
        {selectedTickers.map((ticker) => (
          <span
            key={ticker}
            className="inline-flex items-center gap-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-soft)] px-3.5 py-2 text-xs font-bold text-[var(--text-secondary)] shadow-sm"
          >
            <span className="flex h-5 w-10 items-center justify-center rounded bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-[9px] font-bold text-[var(--teal-500)]">
              {ticker}
            </span>
            <button
              onClick={() => handleRemoveStock(ticker)}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-down)] transition-colors p-0.5"
            >
              <Trash className="h-4 w-4" />
            </button>
          </span>
        ))}
        {selectedTickers.length === 0 && (
          <p className="text-xs text-[var(--text-tertiary)] italic">No tickers selected. Type in search above to add stocks.</p>
        )}
      </div>

      {/* Comparison Grid */}
      {selectedTickers.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl overflow-hidden shadow-sm">
          {detailsLoading ? (
            <div className="h-64 flex items-center justify-center text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold skeleton-shimmer">
              Compiling Side-by-Side Signal Parameters...
            </div>
          ) : detailsList && detailsList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border-soft)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-sunken)]/60 select-none">
                    <th className="py-4 px-6 w-1/4">Evaluation Layer</th>
                    {detailsList.map((d) => (
                      <th key={d.ticker} className="py-4 px-6 w-1/4 text-center">
                        <Link href={`/dashboard/${d.ticker}`} className="inline-flex flex-col items-center gap-1 group">
                          <span className="flex h-7 w-12 items-center justify-center rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-[10px] font-bold text-[var(--teal-500)] group-hover:bg-[var(--border-soft)] group-hover:text-[var(--text-primary)] transition-all">
                            {d.ticker}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] group-hover:text-[var(--amber-500)] transition-colors truncate max-w-[150px]">
                            {d.company_name}
                          </span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)] text-xs text-[var(--text-secondary)]">
                  {/* Rating Category */}
                  <tr className="bg-[var(--bg-sunken)]/25">
                    <td className="py-4 px-6 font-bold text-[var(--text-primary)]">Decision Support State</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            d.score?.decision_label === "Strong Setup"
                              ? "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
                              : d.score?.decision_label === "Watchlist"
                              ? "bg-[oklch(76%_0.15_75_/_0.15)] text-[var(--amber-500)] border-[oklch(76%_0.15_75_/_0.2)]"
                              : d.score?.decision_label === "Mixed Signals"
                              ? "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]"
                              : "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
                          }`}
                        >
                          {d.score?.decision_label || "No Data"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Overall Score */}
                  <tr>
                    <td className="py-4 px-6 font-bold text-[var(--text-secondary)]">System Evaluation Score</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-bold text-sm text-[var(--text-primary)] font-display">
                        {d.score?.final_score !== undefined ? `${Math.round(d.score.final_score * 100)}%` : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Sentiment score */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">Sentiment Score Index</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-medium text-[var(--text-secondary)]">
                        {d.score?.sentiment_score !== undefined ? `${Math.round(d.score.sentiment_score * 100)}%` : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Technical score */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">Technical Momentum</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-medium text-[var(--text-secondary)]">
                        {d.score?.technical_score !== undefined ? `${Math.round(d.score.technical_score * 100)}%` : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Fundamental score */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">Fundamental Strength</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-medium text-[var(--text-secondary)]">
                        {d.score?.fundamental_score !== undefined ? `${Math.round(d.score.fundamental_score * 100)}%` : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Risk score */}
                  <tr className="bg-[oklch(82%_0.19_29_/_0.04)]">
                    <td className="py-4 px-6 font-bold text-[var(--text-down)] flex items-center gap-1.5">
                      <WarningCircle className="h-4.5 w-4.5" />
                      Risk Penalty Level
                    </td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-bold text-[var(--text-down)]">
                        {d.score?.risk_score !== undefined ? `${Math.round(d.score.risk_score * 100)}%` : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* P/E Ratio */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">P/E Ratio (Valuation)</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-bold text-[var(--text-secondary)]">
                        {d.fundamentals?.pe_ratio !== null && d.fundamentals?.pe_ratio !== undefined
                          ? d.fundamentals.pe_ratio.toFixed(1)
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Debt Ratio */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">Debt-to-Equity Ratio</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-bold text-[var(--text-secondary)]">
                        {d.fundamentals?.debt_to_equity !== null && d.fundamentals?.debt_to_equity !== undefined
                          ? (d.fundamentals.debt_to_equity / 100).toFixed(2)
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* ROE */}
                  <tr>
                    <td className="py-4 px-6 font-medium text-[var(--text-tertiary)]">Capital Return (ROE)</td>
                    {detailsList.map((d) => (
                      <td key={d.ticker} className="py-4 px-6 text-center font-display font-bold text-[var(--text-secondary)]">
                        {d.fundamentals?.roe !== null && d.fundamentals?.roe !== undefined
                          ? `${(d.fundamentals.roe * 100).toFixed(1)}%`
                          : "N/A"}
                      </td>
                    ))}
                  </tr>

                  {/* Thesis Summary */}
                  <tr className="bg-[var(--bg-sunken)]/25">
                    <td className="py-4 px-6 font-bold text-[var(--text-primary)]">Signal Thesis Summary</td>
                    {detailsList.map((d) => (
                      <td
                        key={d.ticker}
                        className="py-4 px-4 text-[var(--text-secondary)] text-[11px] leading-relaxed max-w-[200px] text-justify font-medium italic"
                      >
                        {d.score?.thesis_summary ? `"${d.score.thesis_summary}"` : "N/A"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold border border-dashed border-[var(--border-soft)] border-spacing-2 m-4 rounded-xl">
              Select stock assets above to generate comparison indices.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
