"use client";

import React from "react";
import { ClockCounterClockwise, ArrowRight } from "@phosphor-icons/react";

interface Props {
  changes: string[];
  date: string;
}

export function WhatChangedToday({ changes, date }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-sm">
      {/* Header Banner */}
      <div className="flex items-center justify-between mb-5 border-b border-[var(--border-soft)] pb-3.5">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise className="h-5 w-5 text-[var(--amber-500)]" />
          <h3 className="text-xs uppercase font-bold text-[var(--text-secondary)] tracking-wider">
            Today&apos;s Deviation Logs
          </h3>
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest bg-[var(--bg-sunken)] border border-[var(--border-soft)] px-2.5 py-0.5 rounded-lg">
          {date}
        </span>
      </div>

      {/* Changes list */}
      <ul className="space-y-3">
        {changes && changes.length > 0 ? (
          changes.map((change, idx) => {
            const isDecisionChange = change.toLowerCase().includes("decision");

            return (
              <li
                key={idx}
                className={`flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed p-3 rounded-xl border transition-all ${
                  isDecisionChange
                    ? "bg-[oklch(76%_0.15_75_/_0.1)] border-[oklch(76%_0.15_75_/_0.3)] font-bold"
                    : "bg-[var(--bg-sunken)]/40 border-[var(--border-soft)]"
                }`}
              >
                <ArrowRight className="h-4 w-4 text-[var(--amber-500)] mt-0.5 flex-shrink-0" />
                <span>{change}</span>
              </li>
            );
          })
        ) : (
          <li className="text-xs text-[var(--text-tertiary)] italic text-center py-5 bg-[var(--bg-sunken)]/20 rounded-xl border border-[var(--border-soft)] border-dashed">
            All signal indices matched yesterday&apos;s values exactly. No deviations logged.
          </li>
        )}
      </ul>
    </div>
  );
}
