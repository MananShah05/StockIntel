"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fetcher } from "@/lib/api";
import { StockDashboardData } from "@/lib/types";
import { useQuote } from "@/hooks/useQuote";

import { DecisionCard } from "@/components/dashboard/DecisionCard";
import { WhatChangedToday } from "@/components/dashboard/WhatChangedToday";
import { SignalLayers } from "@/components/dashboard/SignalLayers";

import { QuoteHeader } from "@/components/dashboard/QuoteHeader";
import { QuoteStatsGrid } from "@/components/dashboard/QuoteStatsGrid";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { RSIChart } from "@/components/dashboard/RSIChart";
import { MACDChart } from "@/components/dashboard/MACDChart";
import { MovingAveragesChart } from "@/components/dashboard/MovingAveragesChart";
import { BollingerBandsChart } from "@/components/dashboard/BollingerBandsChart";
import { TechnicalSignals } from "@/components/dashboard/TechnicalSignals";
import { FundamentalsGrid } from "@/components/dashboard/FundamentalsGrid";
import { DepthTable } from "@/components/dashboard/DepthTable";

import {
  ArrowLeft,
  TrendUp,
  Brain,
  Newspaper,
  CircleNotch,
  WarningCircle
} from "@phosphor-icons/react";
import { pageVariants, sectionVariants } from "@/lib/motion";

export default function StockDashboard() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string).toUpperCase();

  const { data: scoreData } = useSWR<StockDashboardData>(
    `/api/scores/${ticker}/latest`,
    fetcher
  );

  const { data: quote, error: quoteError, isLoading: quoteLoading } = useQuote(ticker);

  const [activeTab, setActiveTab] = useState<"overview" | "decision" | "news" >("overview");
  const [activeTechTab, setActiveTechTab] = useState<"rsi" | "macd" | "ma" | "bb">("rsi");

  if (quoteLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        <CircleNotch className="h-10 w-10 text-[var(--teal-500)] animate-spin mb-4" />
        <p className="text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
          Loading Market Data for {ticker}...
        </p>
      </div>
    );
  }

  if (quoteError || !quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8 bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl max-w-xl mx-auto my-12 shadow-sm">
        <WarningCircle className="h-10 w-10 text-[var(--text-down)] mb-3" />
        <h2 className="text-xl font-display font-bold text-[var(--text-primary)] mb-2">Quote Failed</h2>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
          Could not fetch the live quote for {ticker}.
        </p>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-bold uppercase tracking-wider bg-[var(--bg-sunken)] border border-[var(--border-soft)] px-5 py-2.5 rounded-xl hover:bg-[var(--border-soft)] text-[var(--text-primary)] transition-all"
        >
          Back Home
        </button>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 text-[var(--text-primary)]"
    >
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mt-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Hub
      </button>

      {/* Unified Quote Header */}
      <QuoteHeader quote={quote} />

      {/* Tabs */}
      <div className="border-b border-[var(--border-soft)] flex gap-2 overflow-x-auto select-none py-1.5 relative">
        {[
          { id: "overview", label: "Market Overview", icon: TrendUp },
          { id: "decision", label: "AI Decision Engine", icon: Brain },
          { id: "news", label: "News & Filings", icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl whitespace-nowrap transition-colors duration-250 z-10 ${
                isActive
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-[var(--bg-sunken)] rounded-xl border border-[var(--border-soft)] -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-6"
          >
            {/* Top Level Stats Row - Full Width */}
            <QuoteStatsGrid quote={quote} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                <PriceChart ticker={ticker} />
                <VolumeChart ticker={ticker} />

                {/* Technical Studies Segmented Card */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl px-6 py-4 shadow-sm gap-3">
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-sm text-[var(--text-primary)]">Technical Indicators</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider mt-0.5">Select a study to view overlay</span>
                    </div>
                    <div className="flex bg-[var(--bg-sunken)] p-1 rounded-xl border border-[var(--border-soft)] overflow-x-auto self-start sm:self-auto max-w-full">
                      {[
                        { id: "rsi", label: "RSI" },
                        { id: "macd", label: "MACD" },
                        { id: "ma", label: "Moving Averages" },
                        { id: "bb", label: "Bollinger Bands" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTechTab(t.id as any)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                            activeTechTab === t.id
                              ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-soft)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-[-16px]">
                    <AnimatePresence mode="wait">
                      {activeTechTab === "rsi" && (
                        <motion.div
                          key="rsi"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <RSIChart ticker={ticker} />
                        </motion.div>
                      )}
                      {activeTechTab === "macd" && (
                        <motion.div
                          key="macd"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MACDChart ticker={ticker} />
                        </motion.div>
                      )}
                      {activeTechTab === "ma" && (
                        <motion.div
                          key="ma"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <MovingAveragesChart ticker={ticker} />
                        </motion.div>
                      )}
                      {activeTechTab === "bb" && (
                        <motion.div
                          key="bb"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <BollingerBandsChart ticker={ticker} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <FundamentalsGrid ticker={ticker} />
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                <TechnicalSignals ticker={ticker} />
                <DepthTable depth={quote.depth} />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "decision" && scoreData && (
          <motion.div
            key="decision"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              <DecisionCard score={scoreData.score} />
            </div>
            <div className="space-y-6">
              <WhatChangedToday changes={scoreData.score.what_changed} date={scoreData.score.date} />
              <SignalLayers score={scoreData.score} />
            </div>
          </motion.div>
        )}

        {activeTab === "decision" && !scoreData && (
          <motion.div
            key="decision-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-10 text-[var(--text-tertiary)] flex flex-col items-center justify-center"
          >
            <CircleNotch className="h-8 w-8 text-[var(--teal-500)] animate-spin mb-2" />
            <span className="font-bold text-xs uppercase tracking-wider">Loading AI Decision Data...</span>
          </motion.div>
        )}

        {activeTab === "news" && scoreData && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-4"
          >
            {scoreData.news && scoreData.news.length > 0 ? (
              scoreData.news.map((n) => (
                <div
                  key={n.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-soft)] rounded-2xl p-5 shadow-sm hover:border-[var(--text-tertiary)]/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-soft)]">
                        {n.source_name}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-bold">
                        {n.published_at}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${
                        n.sentiment_label === "positive"
                          ? "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
                          : n.sentiment_label === "negative"
                          ? "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
                          : "bg-[var(--bg-sunken)] border-[var(--border-soft)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {n.sentiment_label} ({n.sentiment_score >= 0 ? "+" : ""}
                      {n.sentiment_score.toFixed(2)})
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mt-2">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[var(--amber-500)] hover:underline transition-colors"
                    >
                      {n.title}
                    </a>
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-2.5 line-clamp-2">
                    {n.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-[var(--border-soft)] rounded-2xl text-xs text-[var(--text-tertiary)] font-bold uppercase tracking-wider">
                No news available for {ticker}.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
