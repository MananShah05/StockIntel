"use client";

import { useFundamentals } from "@/hooks/useFundamentals";
import { motion, Variants } from "framer-motion";
import { cardHover } from "@/lib/motion";

export function FundamentalsGrid({ ticker }: { ticker: string }) {
  const { data: f, error, isLoading } = useFundamentals(ticker);

  if (isLoading) {
    return (
      <div className="mt-6">
        <h3 className="font-display font-bold text-lg mb-4 text-[var(--text-primary)]">Fundamentals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="border border-[var(--border-soft)] rounded-2xl p-4 bg-[var(--bg-card)] h-20 skeleton-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !f) {
    return (
      <div className="mt-6 border border-[var(--border-soft)] rounded-2xl p-6 bg-[var(--bg-card)] text-[var(--text-down)] font-medium">
        Failed to load fundamentals
      </div>
    );
  }

  const cards = [
    {
      label: "P/E Ratio",
      value: f.pe_ratio?.toFixed(2) || "N/A",
      sub: f.sector_pe ? `Sector: ${f.sector_pe.toFixed(2)}` : "",
      subColor: f.pe_ratio && f.sector_pe && f.pe_ratio < f.sector_pe ? "text-[var(--text-up)]" : "text-[var(--text-tertiary)]",
    },
    {
      label: "EPS (TTM)",
      value: f.eps ? `₹${f.eps.toFixed(2)}` : "N/A",
      sub: f.eps_growth_yoy ? `${f.eps_growth_yoy > 0 ? "+" : ""}${f.eps_growth_yoy}% YoY` : "",
      subColor: f.eps_growth_yoy && f.eps_growth_yoy > 0 ? "text-[var(--text-up)]" : "text-[var(--text-down)]",
    },
    {
      label: "P/B Ratio",
      value: f.pb_ratio?.toFixed(2) || "N/A",
      sub: f.sector_pb ? `Sector: ${f.sector_pb.toFixed(2)}` : "",
      subColor: "text-[var(--text-tertiary)]",
    },
    {
      label: "Dividend Yield",
      value: f.dividend_yield ? `${f.dividend_yield.toFixed(2)}%` : "N/A",
      sub: f.dividend_yield && f.eps ? `₹${((f.dividend_yield / 100) * f.eps).toFixed(2)}/share` : "",
      subColor: "text-[var(--text-tertiary)]",
    },
    {
      label: "ROE",
      value: f.roe ? `${f.roe.toFixed(2)}%` : "N/A",
      sub: "",
      subColor: "",
      valueColor: f.roe && f.roe > 15 ? "text-[var(--text-up)]" : f.roe && f.roe > 8 ? "text-[var(--amber-500)]" : "text-[var(--text-down)]",
    },
    {
      label: "Debt/Equity",
      value: f.debt_to_equity?.toFixed(2) || "N/A",
      sub: "",
      subColor: "",
      valueColor:
        f.debt_to_equity !== null && f.debt_to_equity !== undefined
          ? f.debt_to_equity < 0.5
            ? "text-[var(--text-up)]"
            : f.debt_to_equity <= 1
            ? "text-[var(--amber-500)]"
            : "text-[var(--text-down)]"
          : "",
    },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } as any },
  };

  return (
    <div className="mt-6">
      <h3 className="font-display font-bold text-lg mb-4 text-[var(--text-primary)]">Fundamentals</h3>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            variants={item}
            whileHover="hover"
            animate="rest"
            className="border border-[var(--border-soft)] rounded-2xl p-4 bg-[var(--bg-card)] flex flex-col justify-center transition-all hover:border-[var(--text-tertiary)]/30"
          >
            <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider mb-1">
              {card.label}
            </div>
            <div className={`text-lg font-display font-bold ${card.valueColor || "text-[var(--text-primary)]"}`}>
              {card.value}
            </div>
            {card.sub && <div className={`text-[10px] font-semibold mt-1 ${card.subColor}`}>{card.sub}</div>}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
