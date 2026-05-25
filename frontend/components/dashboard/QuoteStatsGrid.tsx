"use client";

import React from "react";
import { QuoteSnapshot } from "@/lib/types";
import { Week52RangeBar } from "./Week52RangeBar";

export function QuoteStatsGrid({ quote }: { quote: QuoteSnapshot }) {
  const formatNum = (num: any) => {
    if (num === null || num === undefined || isNaN(Number(num))) return "—";
    return Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVol = (num: any) => {
    if (num === null || num === undefined || isNaN(Number(num))) return "—";
    const n = Number(num);
    if (n > 10000000) return (n / 10000000).toFixed(2) + "Cr";
    if (n > 100000) return (n / 100000).toFixed(2) + "L";
    return n.toLocaleString("en-IN");
  };

  return (
    <div className="p-6 border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-y-0 md:divide-x divide-[var(--border-soft)] text-sm">
        {/* Column 1 */}
        <div className="space-y-4 md:pr-6">
          <div className="flex justify-between items-center md:block md:space-y-1">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Open</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">₹{formatNum(quote.open)}</div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Prev Close</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">₹{formatNum(quote.prev_close)}</div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">ATP</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">₹{formatNum(quote.atp)}</div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4 md:px-6">
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Day Range</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">
              ₹{formatNum(quote.day_low)} - ₹{formatNum(quote.day_high)}
            </div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">52W Range</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">
              ₹{formatNum(quote.week52_low)} - ₹{formatNum(quote.week52_high)}
            </div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Turnover</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">₹{formatVol(quote.turnover)}</div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-4 md:pl-6">
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Volume</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">{formatVol(quote.volume)}</div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Avg Vol (20D)</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">{formatVol(quote.avg_volume_20d)}</div>
          </div>
          <div className="flex justify-between items-center md:block md:space-y-1 border-t border-[var(--border-soft)] md:border-0 pt-2 md:pt-0">
            <div className="text-[var(--text-tertiary)] text-xs font-semibold uppercase tracking-wider">Market Cap</div>
            <div className="font-display font-bold text-base text-[var(--text-primary)]">₹{formatVol(quote.market_cap)}</div>
          </div>
        </div>
      </div>

      <Week52RangeBar low={quote.week52_low} high={quote.week52_high} current={quote.ltp} />

      <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex justify-between items-center text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider">
        <span>StockIntel Metrics</span>
        <span>LTT: {quote.ltt}</span>
      </div>
    </div>
  );
}
