"use client";

import React from "react";
import { StockScore } from "@/lib/types";
import { Info } from "@phosphor-icons/react";
import { motion } from "framer-motion";

interface LayerConfig {
  key: keyof StockScore;
  label: string;
  icon: string;
  description: string;
}

const LAYERS: LayerConfig[] = [
  {
    key: "sentiment_score",
    label: "Sentiment Index",
    icon: "◉",
    description: "Weighted opinion compiled across financial media, SEC filing commentary, and Reddit engagement boards.",
  },
  {
    key: "technical_score",
    label: "Technical Momentum",
    icon: "◈",
    description: "Evaluates trend alignment using MACD crossovers, RSI boundaries, and moving average crossovers (20/50/200).",
  },
  {
    key: "fundamental_score",
    label: "Fundamental Quality",
    icon: "◎",
    description: "Calculates operational efficiency using return on equity (ROE), P/E value multiples, and debt-to-equity leverage ratios.",
  },
  {
    key: "event_score",
    label: "Event Ingestion",
    icon: "◆",
    description: "Tracks frequency and regulatory sentiment from SEC 8-K filings and corporate news alerts.",
  },
  {
    key: "regime_score",
    label: "Global Market Regime",
    icon: "◇",
    description: "Weights global market risk thresholds (using SPY 200MA crossings and VIX volatility zones).",
  },
];

export function SignalLayers({ score }: { score: StockScore }) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-sm">
      {/* Title */}
      <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-5 border-b border-[var(--border-soft)] pb-3">
        Signal Layers Overview
      </h3>

      {/* Progress Bars Stack */}
      <div className="space-y-4">
        {LAYERS.map(({ key, label, icon, description }) => {
          const value = (score[key] as number) || 0.5;
          const percentage = Math.round(value * 100);

          // Color-coding based on scoring tier using oklch values matching our palette strategy
          let barColor = "bg-[oklch(62%_0.16_29)]"; // Red/Coral
          let labelColor = "text-[var(--text-down)]";

          if (percentage >= 68) {
            barColor = "bg-[oklch(69%_0.12_142)]"; // Teal/Green
            labelColor = "text-[var(--text-up)]";
          } else if (percentage >= 48) {
            barColor = "bg-[var(--teal-500)]"; // Teal
            labelColor = "text-[var(--teal-500)]";
          } else if (percentage >= 32) {
            barColor = "bg-[var(--amber-500)]"; // Amber
            labelColor = "text-[var(--amber-500)]";
          }

          return (
            <div key={key} className="group relative">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2 group-hover:text-[var(--text-primary)] transition-colors">
                  <span className="text-[var(--text-tertiary)] font-bold select-none">{icon}</span>
                  {label}
                </span>
                <span className={`text-xs font-bold font-display ${labelColor}`}>{percentage}%</span>
              </div>

              {/* Custom Animated Progress Bar */}
              <div className="h-2 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Hover Tooltip Description */}
              <div className="pointer-events-none absolute bottom-full left-0 right-0 mb-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl p-3 shadow-md z-50 text-[11px] text-[var(--text-secondary)] leading-relaxed">
                <div className="flex gap-2 items-start">
                  <Info className="h-4 w-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
                  <p>{description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Risk Panel (Inverted progress bar at the bottom) */}
      <div className="mt-5 pt-4 border-t border-[var(--border-soft)]">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
            <span className="text-[var(--text-tertiary)] font-bold select-none">⚠</span>
            Risk Exposure
          </span>
          <span
            className={`text-xs font-bold font-display ${
              score.risk_score >= 0.65
                ? "text-[var(--text-down)]"
                : score.risk_score >= 0.4
                ? "text-[var(--amber-500)]"
                : "text-[var(--text-up)]"
            }`}
          >
            {Math.round(score.risk_score * 100)}%
          </span>
        </div>
        <div className="h-2 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.round(score.risk_score * 100)}%` }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            className={`h-full rounded-full ${
              score.risk_score >= 0.65
                ? "bg-[oklch(62%_0.16_29)]"
                : score.risk_score >= 0.4
                ? "bg-[var(--amber-500)]"
                : "bg-[oklch(69%_0.12_142)]"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
