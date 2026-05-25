"use client";

import React from "react";
import { motion } from "framer-motion";

interface Week52RangeBarProps {
  low: number;
  high: number;
  current: number;
}

export function Week52RangeBar({ low, high, current }: Week52RangeBarProps) {
  const l = Number(low) || 0;
  const h = Number(high) || 0;
  const c = Number(current) || 0;
  const range = h - l;
  const clampedCurrent = Math.max(l, Math.min(h, c));
  const positionPct = range > 0 ? ((clampedCurrent - l) / range) * 100 : 50;

  const formatNum = (v: number) => {
    return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="w-full mt-5">
      <div className="flex justify-between text-xs font-semibold mb-1.5">
        <span className="text-[var(--text-secondary)]">52W Low</span>
        <span className="text-[var(--text-primary)] font-bold">
          ₹{formatNum(c)}
        </span>
        <span className="text-[var(--text-secondary)]">52W High</span>
      </div>

      <div className="relative h-2 w-full bg-[var(--bg-sunken)] rounded-full overflow-visible">
        {/* Subtle, premium indicator track */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[oklch(62%_0.16_29)] via-[oklch(76%_0.15_75)] to-[oklch(69%_0.12_142)] opacity-80"
          style={{ width: "100%" }}
        />
        {/* Spring animated dot indicator starting from center (50%) */}
        <motion.div
          initial={{ left: "50%" }}
          animate={{ left: `${positionPct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="absolute top-1/2 w-3.5 h-3.5 -mt-[7px] bg-[var(--bg-base)] border-2 border-[var(--text-primary)] rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform z-10"
          style={{ transform: "translateX(-50%)" }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-[var(--text-tertiary)] mt-1.5 font-medium">
        <span>₹{formatNum(l)}</span>
        <span>₹{formatNum(h)}</span>
      </div>
    </div>
  );
}
