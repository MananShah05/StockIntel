"use client";

import { useState, useEffect } from "react";
import { useTechnicalsHistory } from "@/hooks/useTechnicalsHistory";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

const formatINR = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function MovingAveragesChart({ ticker }: { ticker: string }) {
  const { data, error, isLoading } = useTechnicalsHistory(ticker, 200);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = getColors(isDark);

  if (!mounted || isLoading) {
    return (
      <div className="h-[310px] border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-5 w-20 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-[140px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-12 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-12 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[310px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-4 text-[var(--text-down)] font-medium">
        Error loading moving averages
      </div>
    );
  }

  const latest = data && data.length > 0 ? data[data.length - 1] : null;
  const p = latest?.close || 0;

  let signal = "Mixed";
  let badgeColorClass = "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]";

  if (latest && p > latest.ma_20 && p > latest.ma_50 && p > latest.ma_200) {
    signal = "Bullish";
    badgeColorClass = "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.25)]";
  } else if (latest && p < latest.ma_20 && p < latest.ma_50 && p < latest.ma_200) {
    signal = "Bearish";
    badgeColorClass = "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.25)]";
  }

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 shadow-sm"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Moving Averages</h3>
        <span className={`inline-flex items-center justify-center text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider whitespace-nowrap ${badgeColorClass}`}>
          {signal}
        </span>
      </div>

      <div className="h-[150px] w-full mb-4">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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
                formatter={(value: any, name?: any) => [formatINR(value as number), name || ""]}
              />
              <Line type="monotone" dataKey="close" name="Price" stroke={colors.price} dot={false} strokeWidth={2.5} />
              <Line type="monotone" dataKey="ma_20" name="MA(20)" stroke={colors.ma20} dot={false} strokeWidth={1.5} />
              <Line
                type="monotone"
                dataKey="ma_50"
                name="MA(50)"
                stroke={colors.ma50}
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={1.5}
              />
              <Line
                type="monotone"
                dataKey="ma_200"
                name="MA(200)"
                stroke={colors.ma200}
                strokeDasharray="6 3"
                dot={false}
                strokeWidth={1.5}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] text-xs font-semibold">
            No data available
          </div>
        )}
      </div>

      {latest && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--bg-sunken)] border border-[var(--border-soft)] p-2.5 rounded-xl text-center">
            <div className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">MA 20</div>
            <div className="text-sm font-display font-bold" style={{ color: colors.ma20 }}>
              ₹{latest.ma_20.toFixed(2)}
            </div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">
              {p > latest.ma_20 ? "Below Price" : "Above Price"}
            </div>
          </div>
          <div className="bg-[var(--bg-sunken)] border border-[var(--border-soft)] p-2.5 rounded-xl text-center">
            <div className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">MA 50</div>
            <div className="text-sm font-display font-bold" style={{ color: colors.ma50 }}>
              ₹{latest.ma_50.toFixed(2)}
            </div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">
              {p > latest.ma_50 ? "Below Price" : "Above Price"}
            </div>
          </div>
          <div className="bg-[var(--bg-sunken)] border border-[var(--border-soft)] p-2.5 rounded-xl text-center">
            <div className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider">MA 200</div>
            <div className="text-sm font-display font-bold" style={{ color: colors.ma200 }}>
              ₹{latest.ma_200.toFixed(2)}
            </div>
            <div className="text-[10px] font-medium text-[var(--text-secondary)] mt-0.5">
              {p > latest.ma_200 ? "Below Price" : "Above Price"}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
