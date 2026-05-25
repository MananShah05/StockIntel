"use client";

import { useState, useEffect } from "react";
import { useTechnicalsHistory } from "@/hooks/useTechnicalsHistory";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, Cell } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

export function MACDChart({ ticker }: { ticker: string }) {
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
          <div className="h-4 w-20 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-5 w-44 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-[150px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[235px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-4 text-[var(--text-down)] font-medium">
        Error loading MACD data
      </div>
    );
  }

  const latest = data && data.length > 0 ? data[data.length - 1] : null;

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="border border-[var(--border-soft)] rounded-2xl p-5 bg-[var(--bg-card)] mt-4 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">MACD</h3>
        {latest && (
          <div className="flex space-x-3 text-[10px] font-semibold uppercase tracking-wider">
            <span>
              MACD: <span className="text-[var(--teal-500)]">{latest.macd.toFixed(2)}</span>
            </span>
            <span className="text-[var(--border-soft)]">|</span>
            <span>
              Signal: <span className="text-[var(--amber-500)]">{latest.macd_signal.toFixed(2)}</span>
            </span>
            <span className="text-[var(--border-soft)]">|</span>
            <span>
              Hist:{" "}
              <span className={latest.macd_hist >= 0 ? "text-[var(--text-up)]" : "text-[var(--text-down)]"}>
                {latest.macd_hist.toFixed(2)}
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="h-[150px] w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -25 }}>
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
              <Bar dataKey="macd_hist" fill={colors.histPos} radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.macd_hist >= 0 ? colors.histPos : colors.histNeg}
                    opacity={0.75}
                  />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke={colors.macd} dot={false} strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="macd_signal"
                stroke={colors.signal}
                strokeDasharray="4 4"
                dot={false}
                strokeWidth={2}
              />
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
