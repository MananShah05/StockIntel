"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetcher } from "@/lib/api";
import { StockListItem, DecisionLabel } from "@/lib/types";
import { useWatchlist } from "@/hooks/useWatchlist";

import { StockSearch } from "@/components/shared/StockSearch";
import {
  TrendUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Check,
  Info,
  Sliders,
  Compass,
  XCircle,
  WarningCircle
} from "@phosphor-icons/react";
import { pageVariants, sectionVariants } from "@/lib/motion";
import { useSession } from "next-auth/react";
import { HeroSection } from "@/components/ui/hero-section-1";

export default function IntelligenceHub() {
  const { data: session, status } = useSession();

  const { data: stocks, error, isLoading, mutate } = useSWR<StockListItem[]>(
    status === "authenticated" ? "/api/stocks" : null,
    fetcher,
    {
      refreshInterval: 15000, // refresh price tickers every 15s
    }
  );

  const { watchlist, toggleWatchlist } = useWatchlist();

  const [sortField, setSortField] = useState<"ticker" | "final_score" | "current_price" | "price_change_pct_1d">("final_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // If NextAuth is loading the session state
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 select-none">
        <div className="h-8 w-8 rounded-full border-[3px] border-[var(--border-soft)] border-t-[var(--teal-500)] animate-spin mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
          Verifying Security Access...
        </p>
      </div>
    );
  }

  // If visitor is unauthenticated, serve the premium interactive landing HeroSection!
  if (status === "unauthenticated" || !session) {
    return <HeroSection />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl max-w-xl mx-auto my-12 shadow-sm">
        <XCircle className="h-10 w-10 text-[var(--text-down)] mb-3" />
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-2">Service Offline</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
          Could not establish connection with the StockIntel Decision Engine service. Ensure the backend server is active on port 8000.
        </p>
        <button
          onClick={() => mutate()}
          className="text-xs font-bold uppercase tracking-wider bg-[var(--bg-sunken)] border border-[var(--border-soft)] px-5 py-2.5 rounded-xl hover:bg-[var(--border-soft)] text-[var(--text-primary)] transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Filter Macro tickers for the Regime Banner
  const spy = stocks?.find((s) => s.ticker === "SPY");
  const qqq = stocks?.find((s) => s.ticker === "QQQ");
  const vix = stocks?.find((s) => s.ticker === "VIX");

  // Calculate Market Regime label dynamically
  let regimeLabel = "Risk-On (Bullish)";
  let regimeBg = "bg-[oklch(88%_0.14_142_/_0.15)] border-[oklch(88%_0.14_142_/_0.2)] text-[var(--text-up)]";

  if (vix && vix.current_price > 22.0) {
    regimeLabel = "Risk-Off (Volatile)";
    regimeBg = "bg-[oklch(82%_0.19_29_/_0.15)] border-[oklch(82%_0.19_29_/_0.2)] text-[var(--text-down)]";
  } else if (vix && vix.current_price > 17.0) {
    regimeLabel = "Market Neutral";
    regimeBg = "bg-[oklch(76%_0.15_75_/_0.15)] border-[oklch(76%_0.15_75_/_0.2)] text-[var(--amber-500)]";
  }

  // Split equities into Watchlisted and General Pool
  const watchlistedStocks = stocks
    ? stocks.filter((s) => watchlist.includes(s.ticker) && s.ticker !== "SPY" && s.ticker !== "QQQ" && s.ticker !== "VIX")
    : [];

  const discoverStocks = stocks
    ? stocks.filter((s) => !watchlist.includes(s.ticker) && s.ticker !== "SPY" && s.ticker !== "QQQ" && s.ticker !== "VIX")
    : [];

  const sortStocks = (arr: StockListItem[]) => {
    return [...arr].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      valA = Number(valA || 0);
      valB = Number(valB || 0);
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
  };

  const sortedWatchlist = sortStocks(watchlistedStocks);
  const sortedDiscover = sortStocks(discoverStocks);

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 py-6 text-[var(--text-primary)]"
    >
      {/* Cinematic Hero */}
      <section className="text-center space-y-6 max-w-4xl mx-auto py-8">
        <motion.div variants={sectionVariants}>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-[var(--text-secondary)] select-none shadow-sm">
            <TrendUp className="h-4 w-4 text-[var(--teal-500)] animate-pulse" />
            Probabilistic Decision Support Dashboard
          </span>
        </motion.div>

        <motion.h1
          variants={sectionVariants}
          className="text-4xl sm:text-6xl font-display font-black tracking-tight text-[var(--text-primary)] leading-[1.15] max-w-3xl mx-auto"
        >
          Market Intelligence, <br />
          Backed by <span className="text-[var(--amber-500)]">Transparent Reasoning</span>
        </motion.h1>

        <motion.p
          variants={sectionVariants}
          className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed font-medium"
        >
          StockIntel is a reason-based stock decision evaluator. We clean noise and aggregate regulatory filings, financials, sentiments, and chart trends into transparent labels.
        </motion.p>

        {/* Search Bar */}
        <motion.div variants={sectionVariants} className="pt-4 max-w-md mx-auto">
          <StockSearch />
        </motion.div>
      </section>

      {/* Macro Regime Indicators */}
      {stocks && (
        <motion.section
          variants={sectionVariants}
          className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-sm max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] flex items-center justify-center">
                <Compass className="h-5 w-5 text-[var(--text-secondary)]" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">System Regime State</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${regimeBg}`}>
                    {regimeLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* SPY, QQQ, VIX tickers */}
            <div className="grid grid-cols-3 gap-6 w-full md:w-auto md:divide-x md:divide-[var(--border-soft)]">
              <MacroPill tickerObj={spy} name="S&P 500" />
              <MacroPill tickerObj={qqq} name="NASDAQ" className="md:pl-6" />
              <MacroPill tickerObj={vix} name="VOLATILITY (VIX)" className="md:pl-6" />
            </div>
          </div>
        </motion.section>
      )}

      {/* Watchlist Section */}
      <motion.section variants={sectionVariants} className="space-y-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
          <div>
            <h2 className="text-lg font-display font-bold tracking-tight flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--teal-500)] animate-pulse" />
              My Actively Tracked Equities
            </h2>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 font-medium">
              Equities added to your tracking watchlist. Rates refresh dynamically every 15s.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">Sort Controls</span>
          </div>
        </div>

        {isLoading ? (
          <div className="h-48 rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-wider skeleton-shimmer">
            Compiling signal intelligence tables...
          </div>
        ) : sortedWatchlist.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg-sunken)]/60 select-none">
                  <th className="py-4 px-6 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort("ticker")}>
                    Ticker
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort("final_score")}>
                    Score Rating
                  </th>
                  <th className="py-4 px-6">Decision State</th>
                  <th className="py-4 px-6 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort("current_price")}>
                    Latest Price
                  </th>
                  <th className="py-4 px-6 cursor-pointer hover:text-[var(--text-primary)] transition-colors" onClick={() => handleSort("price_change_pct_1d")}>
                    Daily Return
                  </th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {sortedWatchlist.map((stock, idx) => (
                  <motion.tr
                    key={stock.ticker}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    className="hover:bg-[var(--bg-sunken)]/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <Link href={`/dashboard/${stock.ticker}`} className="flex items-center gap-3">
                        <span className="flex h-8 w-14 items-center justify-center rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-xs font-bold tracking-wider text-[var(--teal-500)] group-hover:bg-[var(--border-soft)] group-hover:text-[var(--text-primary)] transition-all">
                          {stock.ticker}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--amber-500)] transition-all">
                            {stock.company_name}
                          </p>
                          <p className="text-[10px] font-medium text-[var(--text-tertiary)]">{stock.sector}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/dashboard/${stock.ticker}`} className="flex items-center gap-2">
                        <span className="h-2 w-20 rounded-full bg-[var(--bg-sunken)] overflow-hidden border border-[var(--border-soft)]">
                          <span
                            className={`h-full block rounded-full ${
                              stock.final_score >= 0.72
                                ? "bg-[oklch(69%_0.12_142)]"
                                : stock.final_score >= 0.55
                                ? "bg-[var(--teal-500)]"
                                : stock.final_score >= 0.4
                                ? "bg-[var(--amber-500)]"
                                : "bg-[oklch(62%_0.16_29)]"
                            }`}
                            style={{ width: `${stock.final_score * 100}%` }}
                          />
                        </span>
                        <span className="text-xs font-bold text-[var(--text-secondary)] font-display">
                          {Math.round(stock.final_score * 100)}%
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/dashboard/${stock.ticker}`}>
                        <DecisionBadge label={stock.decision_label} />
                      </Link>
                    </td>
                    <td className="py-4 px-6 font-display text-xs font-bold text-[var(--text-secondary)]">
                      <Link href={`/dashboard/${stock.ticker}`}>${stock.current_price.toFixed(2)}</Link>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/dashboard/${stock.ticker}`}>
                        <PriceChangeBadge change={stock.price_change_1d} pct={stock.price_change_pct_1d} />
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleWatchlist(stock.ticker)}
                        className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-down)] hover:bg-[oklch(82%_0.19_29_/_0.1)] border border-[oklch(82%_0.19_29_/_0.15)] hover:border-[oklch(82%_0.19_29_/_0.3)] px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        Remove
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-sunken)]/20 p-10 text-center max-w-xl mx-auto">
            <WarningCircle className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" />
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Your Watchlist is Empty</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-6 leading-relaxed">
              You are not tracking any stock signals. Select any stock below or search a ticker in the search bar above to begin.
            </p>
          </div>
        )}
      </motion.section>

      {/* Discovery Hub */}
      <motion.section variants={sectionVariants} className="space-y-4 max-w-7xl mx-auto">
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--text-tertiary)]" />
            Signal Discovery Hub
          </h2>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 font-medium">
            Evaluate alternative high-interest and tech growth securities evaluated by the StockIntel core service.
          </p>
        </div>

        {discoverStocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDiscover.map((stock, idx) => (
              <motion.div
                key={stock.ticker}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="group relative rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] hover:border-[var(--text-tertiary)]/30 p-5 shadow-sm transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <Link href={`/dashboard/${stock.ticker}`} className="flex items-center gap-2">
                    <span className="flex h-8 w-12 items-center justify-center rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-xs font-bold text-[var(--teal-500)] group-hover:bg-[var(--border-soft)] group-hover:text-[var(--text-primary)] transition-all">
                      {stock.ticker}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--amber-500)] transition-all">
                        {stock.company_name}
                      </h4>
                      <p className="text-[10px] font-medium text-[var(--text-tertiary)]">{stock.sector}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => toggleWatchlist(stock.ticker)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-sunken)] hover:bg-[var(--border-soft)] border border-[var(--border-soft)] transition-all text-[var(--text-secondary)] hover:text-[var(--teal-500)] z-10"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-6 border-t border-[var(--border-soft)] pt-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Evaluation rating</span>
                    <p className="text-sm font-display font-bold text-[var(--text-secondary)] mt-0.5">
                      {Math.round(stock.final_score * 100)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider block text-right">System label</span>
                    <div className="mt-0.5">
                      <DecisionBadge label={stock.decision_label} />
                    </div>
                  </div>
                </div>

                {/* Overlay link */}
                <Link href={`/dashboard/${stock.ticker}`} className="absolute inset-0 rounded-2xl" />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

// Subcomponents

interface MacroPillProps {
  tickerObj?: StockListItem;
  name: string;
  className?: string;
}

function MacroPill({ tickerObj, name, className }: MacroPillProps) {
  if (!tickerObj) return null;
  const isUp = tickerObj.price_change_1d >= 0;

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">{name}</span>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-display text-sm font-bold text-[var(--text-primary)]">
          {name.includes("VIX") ? tickerObj.current_price.toFixed(2) : `$${tickerObj.current_price.toFixed(2)}`}
        </span>
        <span
          className={`text-[10px] font-bold flex items-center ${
            isUp ? "text-[var(--text-up)]" : "text-[var(--text-down)]"
          }`}
        >
          {isUp ? "+" : ""}
          {tickerObj.price_change_pct_1d.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function DecisionBadge({ label }: { label: DecisionLabel }) {
  const badgeMap: Record<DecisionLabel, string> = {
    "Strong Setup": "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]",
    Watchlist: "bg-[oklch(76%_0.15_75_/_0.15)] text-[var(--amber-500)] border-[oklch(76%_0.15_75_/_0.2)]",
    "Mixed Signals": "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    "High Risk": "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]",
    Avoid: "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
        badgeMap[label] || badgeMap["Mixed Signals"]
      }`}
    >
      {label}
    </span>
  );
}

function PriceChangeBadge({ change, pct }: { change: number; pct: number }) {
  const isUp = change >= 0;
  const color = isUp
    ? "text-[var(--text-up)] bg-[oklch(88%_0.14_142_/_0.1)] border-[oklch(88%_0.14_142_/_0.15)]"
    : "text-[var(--text-down)] bg-[oklch(82%_0.19_29_/_0.1)] border-[oklch(82%_0.19_29_/_0.15)]";
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 text-[10px] font-bold border ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {isUp ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}
