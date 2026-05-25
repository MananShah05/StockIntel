"use client";

import { useState, useEffect } from "react";
import { useTechnicalsHistory } from "@/hooks/useTechnicalsHistory";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { useTheme } from "next-themes";
import { getChartColors as getColors } from "@/lib/chart-colors";
import { motion } from "framer-motion";
import { sectionVariants } from "@/lib/motion";

const formatVol = (v: number) => `${(v / 1_000_000).toFixed(2)}M`;

export function VolumeChart({ ticker }: { ticker: string }) {
  const { data, error, isLoading } = useTechnicalsHistory(ticker, 30);
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
          <div className="h-4 w-32 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
          <div className="h-5 w-24 bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
        </div>
        <div className="h-[150px] w-full bg-[var(--bg-sunken)] rounded skeleton-shimmer" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[235px] flex items-center justify-center border border-[var(--border-soft)] rounded-2xl bg-[var(--bg-card)] mt-4 text-[var(--text-down)] font-medium">
        Error loading volume data
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-display font-bold text-sm text-[var(--text-primary)]">Volume Analysis</h3>
        {latest && latest.volume > (latest as any).volume_ma_20 && (
          <span className="text-[10px] bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border border-[oklch(88%_0.14_142_/_0.2)] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            Above 20D Average
          </span>
        )}
      </div>

      <div className="h-[150px] w-full">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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
                width={50}
                tickFormatter={formatVol}
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
                formatter={(value: any) => [formatVol(Number(value)), "Volume"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="volume" fill={colors.volumeUp} opacity={0.7} radius={[4, 4, 0, 0]} />
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
