"use client";

import React from "react";
import { motion } from "framer-motion";

interface DepthPressureBarProps {
  totalBuyQty: number;
  totalSellQty: number;
}

export function DepthPressureBar({ totalBuyQty, totalSellQty }: DepthPressureBarProps) {
  const buyQty = Number(totalBuyQty) || 0;
  const sellQty = Number(totalSellQty) || 0;
  const total = buyQty + sellQty;
  const buyPct = total > 0 ? (buyQty / total) * 100 : 50;
  const sellPct = total > 0 ? (sellQty / total) * 100 : 50;

  return (
    <div className="w-full mb-5">
      <div className="flex justify-between text-xs font-semibold mb-2">
        <span className="text-[var(--text-up)]">
          Buy {buyQty.toLocaleString()} ({buyPct.toFixed(1)}%)
        </span>
        <span className="text-[var(--text-down)]">
          Sell {sellQty.toLocaleString()} ({sellPct.toFixed(1)}%)
        </span>
      </div>
      <div className="flex h-2.5 w-full bg-[var(--bg-sunken)] rounded-full overflow-hidden border border-[var(--border-soft)]">
        {/* Buy Bar - Animates from left to right */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          className="bg-[oklch(69%_0.12_142)] h-full origin-left"
          style={{ width: `${buyPct}%` }}
        />
        {/* Sell Bar - Animates from right to left */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ type: "spring", stiffness: 60, damping: 14 }}
          className="bg-[oklch(62%_0.16_29)] h-full origin-right"
          style={{ width: `${sellPct}%` }}
        />
      </div>
    </div>
  );
}
