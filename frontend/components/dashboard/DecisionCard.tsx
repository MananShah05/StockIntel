"use client";

import React, { useEffect, useRef } from "react";
import { StockScore, DecisionLabel } from "@/lib/types";
import { ShieldCheck, Star, Question, WarningCircle, Prohibit, TrendUp } from "@phosphor-icons/react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { badgePopIn } from "@/lib/motion";

const DECISION_CONFIG: Record<
  DecisionLabel,
  {
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
    borderColor: string; // Used for framer-motion border animation
    icon: React.ComponentType<any>;
    description: string;
  }
> = {
  "Strong Setup": {
    bgClass: "bg-[oklch(96%_0.02_142_/_0.3)] dark:bg-[oklch(20%_0.04_142_/_0.15)]",
    textClass: "text-[var(--text-up)]",
    borderClass: "border-[oklch(69%_0.12_142_/_0.3)]",
    borderColor: "oklch(69% 0.12 142)",
    badgeClass: "bg-[oklch(69%_0.12_142_/_0.1)] text-[var(--text-up)] border-[oklch(69%_0.12_142_/_0.2)]",
    icon: ShieldCheck,
    description: "Highly aligned setup. Robust technical momentum meets outstanding balance sheet credentials.",
  },
  Watchlist: {
    bgClass: "bg-[oklch(97%_0.02_75_/_0.3)] dark:bg-[oklch(20%_0.04_75_/_0.15)]",
    textClass: "text-[var(--amber-500)]",
    borderClass: "border-[oklch(76%_0.15_75_/_0.3)]",
    borderColor: "oklch(76% 0.15 75)",
    badgeClass: "bg-[oklch(76%_0.15_75_/_0.1)] text-[var(--amber-500)] border-[oklch(76%_0.15_75_/_0.2)]",
    icon: Star,
    description: "Business fundamentals are healthy, but technical/sentiment signals recommend monitoring entries.",
  },
  "Mixed Signals": {
    bgClass: "bg-[var(--bg-sunken)]/30",
    textClass: "text-[var(--text-secondary)]",
    borderClass: "border-[var(--border-soft)]",
    borderColor: "var(--border-soft)",
    badgeClass: "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]",
    icon: Question,
    description: "Conflicting triggers detected. Stand aside until technical price trends and sentiment converge.",
  },
  "High Risk": {
    bgClass: "bg-[oklch(95%_0.02_29_/_0.3)] dark:bg-[oklch(20%_0.04_29_/_0.15)]",
    textClass: "text-[var(--text-down)]",
    borderClass: "border-[oklch(62%_0.16_29_/_0.3)]",
    borderColor: "oklch(62% 0.16 29)",
    badgeClass: "bg-[oklch(62%_0.16_29_/_0.1)] text-[var(--text-down)] border-[oklch(62%_0.16_29_/_0.2)]",
    icon: WarningCircle,
    description: "Warning triggers active. Severe volatility (ATR) or highly leveraged balance sheet ratios observed.",
  },
  Avoid: {
    bgClass: "bg-[oklch(95%_0.02_29_/_0.3)] dark:bg-[oklch(20%_0.04_29_/_0.15)]",
    textClass: "text-[var(--text-down)]",
    borderClass: "border-[oklch(58%_0.18_29_/_0.3)]",
    borderColor: "oklch(58% 0.18 29)",
    badgeClass: "bg-[oklch(58%_0.18_29_/_0.1)] text-[var(--text-down)] border-[oklch(58%_0.18_29_/_0.2)]",
    icon: Prohibit,
    description: "Severe bearish alignments. Downward moving average crossings and negative public sentiment.",
  },
};

const factorListVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const factorItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 } as any,
  },
};

export function DecisionCard({ score }: { score: StockScore }) {
  const config = DECISION_CONFIG[score.decision_label] || DECISION_CONFIG["Mixed Signals"];
  const IconComponent = config.icon;
  const cardRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [15, -15]);

  const confidencePct = Math.round(score.confidence_score * 100);

  return (
    <motion.div
      ref={cardRef}
      style={{ y }}
      initial={{ opacity: 0, scale: 0.97, borderColor: "var(--border-soft)" }}
      animate={{ opacity: 1, scale: 1, borderColor: config.borderColor }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`rounded-2xl border p-6 shadow-md transition-colors duration-300 ${config.bgClass} backdrop-blur-sm`}
    >
      {/* Label and Badge Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[var(--border-soft)] pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest block mb-1">
            System Recommendation
          </span>
          <div className="flex items-center gap-2.5">
            <IconComponent className={`h-8 w-8 ${config.textClass}`} />
            <h2 className={`text-2xl font-display font-bold tracking-tight ${config.textClass}`}>
              {score.decision_label}
            </h2>
          </div>
        </div>
        <div>
          <motion.span
            variants={badgePopIn}
            initial="hidden"
            animate="visible"
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border ${config.badgeClass}`}
          >
            {score.confidence_tier}
          </motion.span>
        </div>
      </div>

      {/* Aggregate Score Pills */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <ScorePill label="Overall Score" value={score.final_score} />
        <ScorePill label="Confidence Index" value={score.confidence_score} />
        <ScorePill label="Risk Cushion" value={1.0 - score.risk_score} invert />
      </div>

      {/* Hardware-accelerated Confidence Meter Clip-Path Reveal */}
      <div className="mb-6 bg-[var(--bg-sunken)] p-4 rounded-xl border border-[var(--border-soft)]">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] mb-2">
          <span>Confidence Index Details</span>
          <span>{confidencePct}%</span>
        </div>
        <div className="relative h-2 w-full bg-[var(--border-soft)] rounded-full overflow-hidden">
          <motion.div
            initial={{ clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)" }}
            animate={{ clipPath: `polygon(0% 0%, ${confidencePct}% 0%, ${confidencePct}% 100%, 0% 100%)` }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
            className="absolute top-0 left-0 h-full bg-[var(--teal-500)] rounded-full"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Thesis Block */}
      <div className="mb-6">
        <h3 className="text-xs uppercase font-bold text-[var(--text-secondary)] tracking-wider mb-2.5 flex items-center gap-2">
          <TrendUp className="h-4 w-4 text-[var(--teal-500)]" />
          Investment Thesis
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl p-4 italic">
          &ldquo;{score.thesis_summary}&rdquo;
        </p>
      </div>

      {/* Positive and Negative Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Factors */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-[var(--text-up)] tracking-wider mb-3 border-b border-[var(--border-soft)] pb-1.5">
            + Confluence Signals
          </h4>
          <motion.ul
            variants={factorListVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2.5"
          >
            {score.positive_factors && score.positive_factors.length > 0 ? (
              score.positive_factors.map((fact, idx) => (
                <motion.li
                  key={idx}
                  variants={factorItemVariants}
                  className="text-xs text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--text-up)] font-extrabold select-none mt-0.5">•</span>
                  <span>{fact}</span>
                </motion.li>
              ))
            ) : (
              <li className="text-xs text-[var(--text-tertiary)] italic">No significant positive setup factors found.</li>
            )}
          </motion.ul>
        </div>

        {/* Negative Factors */}
        <div>
          <h4 className="text-[11px] uppercase font-bold text-[var(--text-down)] tracking-wider mb-3 border-b border-[var(--border-soft)] pb-1.5">
            − Risk Penalties
          </h4>
          <motion.ul
            variants={factorListVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-2.5"
          >
            {score.negative_factors && score.negative_factors.length > 0 ? (
              score.negative_factors.map((fact, idx) => (
                <motion.li
                  key={idx}
                  variants={factorItemVariants}
                  className="text-xs text-[var(--text-secondary)] flex items-start gap-2"
                >
                  <span className="text-[var(--text-down)] font-extrabold select-none mt-0.5">•</span>
                  <span>{fact}</span>
                </motion.li>
              ))
            ) : (
              <li className="text-xs text-[var(--text-tertiary)] italic">No major risk flags detected.</li>
            )}
          </motion.ul>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="mt-6 pt-4 border-t border-[var(--border-soft)] text-[10px] text-[var(--text-tertiary)] font-medium leading-normal select-none">
        * Estimates are purely algorithmic calculations. Past results are completely hypothetical. Always perform your own research.
      </div>
    </motion.div>
  );
}

interface ScorePillProps {
  label: string;
  value: number;
  invert?: boolean;
}

function ScorePill({ label, value, invert }: ScorePillProps) {
  const percentage = Math.round(value * 100);

  // Decide color logic
  let colorClass = "text-[var(--text-secondary)]";
  if (invert) {
    // For Risk Cushion: Higher is better (meaning lower risk)
    if (percentage >= 70) colorClass = "text-[var(--text-up)]";
    else if (percentage >= 45) colorClass = "text-[var(--amber-500)]";
    else colorClass = "text-[var(--text-down)]";
  } else {
    // For general scores
    if (percentage >= 72) colorClass = "text-[var(--text-up)]";
    else if (percentage >= 55) colorClass = "text-[var(--teal-500)]";
    else if (percentage >= 40) colorClass = "text-[var(--amber-500)]";
    else colorClass = "text-[var(--text-down)]";
  }

  return (
    <div className="bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl p-3 text-center">
      <div className={`text-2xl font-display font-bold ${colorClass}`}>{percentage}%</div>
      <div className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wider uppercase mt-1">
        {label}
      </div>
    </div>
  );
}
