"use client";

import React, { useState, useEffect, useRef } from "react";
import { QuoteSnapshot } from "@/lib/types";
import { PlusCircle, Bell } from "@phosphor-icons/react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { badgePopIn } from "@/lib/motion";

function AnimatedPrice({ value }: { value: number }) {
  const motionVal = useMotionValue(value || 0);
  const displayVal = useTransform(motionVal, (latest) => {
    const val = Number(latest);
    if (isNaN(val)) return "—";
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  });

  useEffect(() => {
    const controls = animate(motionVal, value || 0, {
      type: "spring",
      stiffness: 90,
      damping: 18,
    });
    return () => controls.stop();
  }, [value, motionVal]);

  return <motion.span className="font-display tracking-tight">{displayVal}</motion.span>;
}

export function QuoteHeader({ quote }: { quote: QuoteSnapshot }) {
  const ltp = quote.ltp ?? 0;
  const change = quote.change ?? 0;
  const change_pct = quote.change_pct ?? 0;
  const isPositive = change >= 0;
  const colorClass = isPositive ? "text-[var(--text-up)]" : "text-[var(--text-down)]";
  
  // State to trigger the flash animation on price tick change
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevLtpRef = useRef(ltp);

  useEffect(() => {
    if (ltp > prevLtpRef.current) {
      setFlash("up");
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    } else if (ltp < prevLtpRef.current) {
      setFlash("down");
      const t = setTimeout(() => setFlash(null), 400);
      return () => clearTimeout(t);
    }
    prevLtpRef.current = ltp;
  }, [ltp]);

  const flashBg =
    flash === "up"
      ? "bg-[oklch(88%_0.14_142_/_0.15)] transition-none"
      : flash === "down"
      ? "bg-[oklch(82%_0.19_29_/_0.15)] transition-none"
      : "transition-colors duration-500 ease-out";

  const formatBidAsk = (val: any) => {
    const n = Number(val);
    if (isNaN(n)) return "—";
    return `₹${n.toFixed(2)}`;
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-[var(--border-soft)] bg-[var(--bg-base)] sticky top-0 z-10 ${flashBg}`}>
      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-display font-bold tracking-tight text-[var(--text-primary)]">
              {quote.ticker}
            </h1>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={badgePopIn}
            >
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-soft)]">
                {quote.exchange || "—"}
              </span>
            </motion.div>
          </div>
          <div className="text-sm font-medium text-[var(--text-secondary)] mt-0.5">
            {quote.company_name || "—"}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:items-end">
        <div className="flex items-center space-x-5">
          <div className="text-right">
            <div className={`text-2xl font-bold font-display ${colorClass}`}>
              <AnimatedPrice value={ltp} />
            </div>
            <div className={`text-xs font-semibold tracking-wide ${colorClass} mt-0.5`}>
              {isPositive ? "+" : ""}
              {change.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
              {isPositive ? "+" : ""}
              {change_pct.toFixed(2)}%)
            </div>
          </div>

          <div className="flex items-center space-x-1.5 border-l border-[var(--border-soft)] pl-4 ml-2">
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--amber-500)] hover:bg-[var(--bg-sunken)] rounded-lg transition-all" title="Add to Watchlist">
              <PlusCircle className="h-5 w-5" />
            </button>
            <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--teal-500)] hover:bg-[var(--bg-sunken)] rounded-lg transition-all" title="Set Alert">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex text-[11px] text-[var(--text-tertiary)] mt-1.5 space-x-2 font-medium">
          <div>Bid ({quote.bid_orders ?? 0}) <span className="text-[var(--text-primary)]">{formatBidAsk(quote.bid_price)}</span></div>
          <div className="text-[var(--border-soft)]">|</div>
          <div>Ask <span className="text-[var(--text-primary)]">{formatBidAsk(quote.ask_price)}</span> ({quote.ask_orders ?? 0})</div>
        </div>
      </div>
    </div>
  );
}
