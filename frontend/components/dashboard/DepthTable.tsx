"use client";

import React from "react";
import { DepthLevel } from "@/lib/types";
import { DepthPressureBar } from "./DepthPressureBar";

interface DepthTableProps {
  depth: DepthLevel[];
}

export function DepthTable({ depth }: DepthTableProps) {
  if (!depth || depth.length === 0) return null;

  const totalBuyQty = depth.reduce((acc, row) => acc + (Number(row.bid_qty) || 0), 0);
  const totalSellQty = depth.reduce((acc, row) => acc + (Number(row.ask_qty) || 0), 0);

  return (
    <div className="border border-[var(--border-soft)] rounded-2xl p-6 bg-[var(--bg-card)] mt-6 shadow-sm">
      <h3 className="font-display font-bold text-lg mb-4 text-[var(--text-primary)]">Market Depth</h3>

      <DepthPressureBar totalBuyQty={totalBuyQty} totalSellQty={totalSellQty} />

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right">
          <thead className="text-[var(--text-tertiary)] bg-[var(--bg-sunken)] font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2.5 rounded-tl-xl">Ord</th>
              <th className="px-3 py-2.5">Qty</th>
              <th className="px-3 py-2.5 text-[var(--text-up)] border-r border-[var(--border-soft)]">Bid</th>
              <th className="px-3 py-2.5 text-[var(--text-down)]">Ask</th>
              <th className="px-3 py-2.5">Qty</th>
              <th className="px-3 py-2.5 rounded-tr-xl">Ord</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {depth.map((row, idx) => {
              const bidQty = Number(row.bid_qty) || 0;
              const askQty = Number(row.ask_qty) || 0;
              const bidPrice = Number(row.bid_price) || 0;
              const askPrice = Number(row.ask_price) || 0;
              return (
                <tr
                  key={idx}
                  className="hover:bg-[var(--bg-sunken)]/50 transition-colors"
                >
                  <td className="px-3 py-3 text-[var(--text-tertiary)] font-medium">{row.bid_orders ?? 0}</td>
                  <td className="px-3 py-3 font-medium text-[var(--text-secondary)]">{bidQty.toLocaleString()}</td>
                  <td className="px-3 py-3 font-semibold text-[var(--text-up)] border-r border-[var(--border-soft)]">
                    ₹{bidPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--text-down)]">
                    ₹{askPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 font-medium text-[var(--text-secondary)]">{askQty.toLocaleString()}</td>
                  <td className="px-3 py-3 text-[var(--text-tertiary)] font-medium">{row.ask_orders ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-[var(--border-soft)] bg-[var(--bg-sunken)]/60">
            <tr className="font-bold text-[var(--text-primary)]">
              <td colSpan={2} className="px-3 py-2.5 text-left font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Total Buy
              </td>
              <td className="px-3 py-2.5 font-bold text-[var(--text-up)] border-r border-[var(--border-soft)]">
                {totalBuyQty.toLocaleString()}
              </td>
              <td className="px-3 py-2.5 font-bold text-[var(--text-down)] text-left">
                {totalSellQty.toLocaleString()}
              </td>
              <td colSpan={2} className="px-3 py-2.5 text-right font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                Total Sell
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
