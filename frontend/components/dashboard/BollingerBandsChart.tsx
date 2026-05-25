"use client";

import { useState, useEffect } from "react";
import { useTechnicalsHistory } from "@/hooks/useTechnicalsHistory";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, Area } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

const formatINR = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function BollingerBandsChart({ ticker }: { ticker: string }) {
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
      <div className="h-[275px] border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-5 w-44 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-4 w-56 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        <div className="h-[140px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[275px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-4 text-[var(--text-down)] font-medium">
        Error loading Bollinger Bands
      </div>
    );
  }

  const latest = data && data.length > 0 ? data[data.length - 1] : null;
  const p = latest?.close || 0;

  let signal = "Neutral";
  let alertMsg = "Price in middle zone — neutral";
  let badgeColorClass = "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]";

  if (latest) {
    const range = latest.bb_upper - latest.bb_lower;
    const pos = (p - latest.bb_lower) / (range || 1);
    if (pos > 0.9) {
      signal = "Upper";
      alertMsg = "Approaching upper band — caution";
      badgeColorClass = "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.25)]";
    } else if (pos < 0.1) {
      signal = "Lower";
      alertMsg = "Near support — potential bounce";
      badgeColorClass = "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.25)]";
    }
  }

  const chartData = data?.map((d) => ({
    ...d,
    bandArea: [d.bb_lower, d.bb_upper],
  }));

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Bollinger Bands</h3>
        {latest && (
          <span className={`inline-flex items-center justify-center text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap ${badgeColorClass}`}>
            {alertMsg}
          </span>
        )}
      </div>

      {latest && (
        <div className="flex space-x-4 mb-4 text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
          <div>
            Upper: <span className="text-[var(--text-primary)] font-display">₹{latest.bb_upper.toFixed(2)}</span>
          </div>
          <div className="text-[var(--border-soft)]">|</div>
          <div>
            Mid: <span className="text-[var(--text-primary)] font-display">₹{latest.bb_mid.toFixed(2)}</span>
          </div>
          <div className="text-[var(--border-soft)]">|</div>
          <div>
            Lower: <span className="text-[var(--text-primary)] font-display">₹{latest.bb_lower.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="h-[150px] w-full">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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
                domain={["auto", "auto"]}
                tick={{ fontSize: 9, fill: colors.tickText, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={formatINR}
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
                formatter={(value: any, name?: any) => {
                  if (Array.isArray(value)) return [`₹${value[0].toFixed(2)} - ₹${value[1].toFixed(2)}`, "Band Area"];
                  return [formatINR(value as number), name || ""];
                }}
              />

              <Area type="monotone" dataKey="bandArea" fill={colors.bbBands} stroke="none" fillOpacity={isDark ? 0.08 : 0.04} />
              <Line
                type="monotone"
                dataKey="bb_upper"
                name="Upper Band"
                stroke={colors.bbBands}
                strokeDasharray="3 3"
                dot={false}
                strokeWidth={1}
                opacity={0.6}
              />
              <Line type="monotone" dataKey="bb_mid" name="Mid Band" stroke={colors.bbBands} dot={false} strokeWidth={1} opacity={0.6} />
              <Line
                type="monotone"
                dataKey="bb_lower"
                name="Lower Band"
                stroke={colors.bbBands}
                strokeDasharray="3 3"
                dot={false}
                strokeWidth={1}
                opacity={0.6}
              />
              <Line type="monotone" dataKey="close" name="Price" stroke={colors.price} dot={false} strokeWidth={2} />
            </ComposedChart>
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
