"use client";

import React from "react";

export function Disclaimer() {
  return (
    <div
      className="rounded-xl p-4 text-[11px] leading-relaxed text-justify max-w-7xl mx-auto my-6 select-none"
      style={{
        border: '1px solid var(--border-soft)',
        background: 'var(--bg-sunken)',
        color: 'var(--text-tertiary)',
      }}
    >
      <span
        className="font-semibold mr-1 uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        Disclaimer:
      </span>
      StockIntel is a data-driven market intelligence and decisions-support tool, not a licensed financial advisor. 
      All scores, signals, and decision labels represent probabilistic estimates generated automatically from historical and real-time inputs. 
      They do not constitute investment advice, buying/selling recommendations, or returns guarantees of any kind. 
      Always consult a qualified financial professional before executing market trades. 
      Past scoring performance is completely hypothetical and does not predict future returns.
    </div>
  );
}
