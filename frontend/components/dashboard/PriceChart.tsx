"use client";

import { useState, useEffect } from "react";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

const formatINR = (v: number) => `₹${v.toLocaleString("en-IN")}`;

export function PriceChart({ ticker }: { ticker: string }) {
  const [period, setPeriod] = useState("1M");
  const { data, error, isLoading } = usePriceHistory(ticker, period);
  const periods = ["1D", "1W", "1M", "3M", "1Y"];

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const colors = getColors(isDark);

  if (!mounted || isLoading) {
    return (
      <div className="h-[235px] border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-4 w-24 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-6 w-36 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-[150px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[235px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] text-[var(--text-down)] font-medium">
        Error loading chart data
      </div>
    );
  }

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] shadow-sm"
    >
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Price History</h3>
        <div className="flex space-x-1 bg-[var(--bg-sunken)] p-1 rounded-lg border border-[var(--border-soft)]">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                period === p
                  ? "bg-[var(--bg-base)] shadow-sm font-bold text-[var(--text-primary)] border border-[var(--border-soft)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[150px] w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.price} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={colors.price} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.gridLine} vertical={false} />
              <XAxis
                dataKey="datetime"
                tick={{ fontSize: 9, fill: colors.tickText, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) =>
                  period === "1D"
                    ? val
                    : new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric" })
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
                formatter={(value: any) => [formatINR(Number(value)), "Price"]}
                labelFormatter={(label) =>
                  period === "1D" ? label : new Date(label).toLocaleDateString()
                }
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={colors.price}
                fillOpacity={1}
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
            </AreaChart>
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
