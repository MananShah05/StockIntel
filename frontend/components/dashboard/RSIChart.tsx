"use client";

import { useState, useEffect } from "react";
import { useTechnicalsHistory } from "@/hooks/useTechnicalsHistory";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, ReferenceArea } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

export function RSIChart({ ticker }: { ticker: string }) {
  const { data, error, isLoading } = useTechnicalsHistory(ticker, 60);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = getColors(isDark);

  if (!mounted || isLoading) {
    return (
      <div className="h-[235px] border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-4 w-28 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-5 w-24 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-[150px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[235px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-4 text-[var(--text-down)] font-medium">
        Error loading RSI data
      </div>
    );
  }

  const latest = data && data.length > 0 ? data[data.length - 1].rsi_14 : null;
  let signal = "Neutral";
  let badgeColorClass = "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]";

  if (latest && latest > 70) {
    signal = "Overbought";
    badgeColorClass = "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.25)]";
  } else if (latest && latest < 30) {
    signal = "Oversold";
    badgeColorClass = "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.25)]";
  }

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 shadow-sm"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">RSI (14)</h3>
        {latest !== null && (
          <span className={`inline-flex items-center justify-center text-[10px] px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider whitespace-nowrap ${badgeColorClass}`}>
            {latest.toFixed(2)} — {signal}
          </span>
        )}
      </div>

      <div className="h-[150px] w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: colors.tickText, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                }
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 9, fill: colors.tickText, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border-soft)",
                  borderRadius: "12px",
                  fontSize: "11px",
                  boxShadow: "var(--shadow-md)",
                  color: "var(--text-primary)",
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              {/* Overbought shaded reference area */}
              <ReferenceArea y1={70} y2={100} fill="rgba(180, 83, 9, 0.06)" />
              {/* Oversold shaded reference area */}
              <ReferenceArea y1={0} y2={30} fill="rgba(22, 163, 74, 0.06)" />
              
              <ReferenceLine y={70} stroke={colors.histNeg} strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={30} stroke={colors.price} strokeDasharray="4 4" opacity={0.6} />
              
              <Line type="monotone" dataKey="rsi_14" stroke={colors.rsi} dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs font-semibold">
            No data available
          </div>
        )}
      </div>
    </motion.div>
  );
}
