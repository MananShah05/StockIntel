"use client";

import React from "react";
import { useTechnicals } from "@/hooks/useTechnicals";
import { motion } from "framer-motion";
import { signalStagger, signalItem, badgePopIn } from "@/lib/motion";

export function TechnicalSignals({ ticker }: { ticker: string }) {
  const { data: technicals, error, isLoading } = useTechnicals(ticker);

  if (isLoading) {
    return (
      <div className="p-6 border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-6 animate-pulse">
        <div className="h-6 w-1/3 bg-[var(--bg-sunken)] rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-[var(--bg-sunken)] rounded" />
          <div className="h-10 bg-[var(--bg-sunken)] rounded" />
          <div className="h-10 bg-[var(--bg-sunken)] rounded" />
        </div>
      </div>
    );
  }

  if (error || !technicals) {
    return (
      <div className="p-6 border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-6 text-[var(--text-down)] font-medium">
        Failed to load technical signals
      </div>
    );
  }

  const rows = [
    {
      label: "RSI 14",
      value: technicals.rsi_14?.toFixed(2) || "N/A",
      signal: technicals.rsi_signal === "oversold" ? "Bullish" : technicals.rsi_signal === "overbought" ? "Bearish" : "Neutral",
      colorClass:
        technicals.rsi_signal === "oversold"
          ? "bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
          : technicals.rsi_signal === "overbought"
          ? "bg-[oklch(82%_0.19_29_/_0.1)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    },
    {
      label: "MACD",
      value: technicals.macd?.toFixed(2) || "N/A",
      signal: technicals.macd_signal_flag === "bullish_cross" ? "Buy Signal" : technicals.macd_signal_flag === "bearish_cross" ? "Sell Signal" : "Neutral",
      colorClass:
        technicals.macd_signal_flag === "bullish_cross"
          ? "bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
          : technicals.macd_signal_flag === "bearish_cross"
          ? "bg-[oklch(82%_0.19_29_/_0.1)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    },
    {
      label: "Bollinger Band",
      value: technicals.bb_position || "N/A",
      signal: technicals.bb_position === "lower" ? "Lower Zone" : technicals.bb_position === "upper" ? "Upper Zone" : "Mid Zone",
      colorClass:
        technicals.bb_position === "lower"
          ? "bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
          : technicals.bb_position === "upper"
          ? "bg-[oklch(82%_0.19_29_/_0.1)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    },
    {
      label: "MA Crossover",
      value: "Price vs MAs",
      signal: technicals.ma_alignment === "bullish" ? "Strong Up" : technicals.ma_alignment === "bearish" ? "Strong Down" : "Mixed",
      colorClass:
        technicals.ma_alignment === "bullish"
          ? "bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
          : technicals.ma_alignment === "bearish"
          ? "bg-[oklch(82%_0.19_29_/_0.1)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    },
    {
      label: "Volume",
      value: "vs 20D Avg",
      signal: technicals.volume_signal === "above_avg" ? "Above Avg" : "Below Avg",
      colorClass:
        technicals.volume_signal === "above_avg"
          ? "bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
          : "bg-[var(--bg-sunken)] text-[var(--text-tertiary)] border-[var(--border-soft)]",
    },
  ];

  return (
    <div className="border border-[var(--border-soft)] rounded-2xl p-6 bg-[var(--bg-card)] mt-6 shadow-sm">
      <h3 className="font-display font-bold text-lg mb-4 text-[var(--text-primary)]">Technical Signals</h3>

      <div className="overflow-x-auto">
        <motion.table
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={signalStagger}
          className="w-full text-sm text-left"
        >
          <thead className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-sunken)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 rounded-tl-xl">Indicator</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3 rounded-tr-xl">Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {rows.map((row, idx) => (
              <motion.tr
                key={idx}
                variants={signalItem}
                className="hover:bg-[var(--bg-sunken)]/50 transition-colors"
              >
                <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{row.label}</td>
                <td className="px-4 py-3.5 text-[var(--text-secondary)]">{row.value}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${row.colorClass}`}>
                    {row.signal}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>
      </div>

      {technicals.overall_signals && (
        <div className="mt-5 pt-4 border-t border-[var(--border-soft)] flex justify-center gap-3">
          <motion.div
            variants={badgePopIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[oklch(88%_0.14_142_/_0.1)] text-[var(--text-up)] border border-[oklch(88%_0.14_142_/_0.2)] shadow-sm"
          >
            {technicals.overall_signals.bullish} Bullish
          </motion.div>
          <motion.div
            variants={badgePopIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-soft)] shadow-sm"
          >
            {technicals.overall_signals.neutral} Neutral
          </motion.div>
          <motion.div
            variants={badgePopIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[oklch(82%_0.19_29_/_0.1)] text-[var(--text-down)] border border-[oklch(82%_0.19_29_/_0.2)] shadow-sm"
          >
            {technicals.overall_signals.bearish} Bearish
          </motion.div>
        </div>
      )}
    </div>
  );
}
