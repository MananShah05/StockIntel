"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { StockListItem } from "@/lib/types";
import { useWatchlist } from "@/hooks/useWatchlist";
import { HeartStraight, Bell, PencilSimple, Trash, Check, Star, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

export default function WatchlistConsole() {
  const { data: stocks, isLoading } = useSWR<StockListItem[]>("/api/stocks", fetcher);
  const { watchlist, toggleWatchlist } = useWatchlist();

  // Custom notes and alerts stored in local storage
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const [alerts, setAlerts] = useState<Record<string, { price: number; score: number }>>({});
  const [activeAlertTicker, setActiveAlertTicker] = useState<string | null>(null);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertScore, setAlertScore] = useState("");

  // Load custom notes and alerts from local storage on client boot
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem("stockintel_watchlist_notes");
      if (storedNotes) setNotes(JSON.parse(storedNotes));

      const storedAlerts = localStorage.getItem("stockintel_watchlist_alerts");
      if (storedAlerts) setAlerts(JSON.parse(storedAlerts));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveNote = (ticker: string) => {
    const newNotes = { ...notes, [ticker]: noteInput };
    setNotes(newNotes);
    localStorage.setItem("stockintel_watchlist_notes", JSON.stringify(newNotes));
    setEditingTicker(null);
  };

  const handleSaveAlert = (ticker: string) => {
    const p = parseFloat(alertPrice) || 0;
    const s = (parseFloat(alertScore) || 0) / 100.0;

    const newAlerts = { ...alerts, [ticker]: { price: p, score: s } };
    setAlerts(newAlerts);
    localStorage.setItem("stockintel_watchlist_alerts", JSON.stringify(newAlerts));
    setActiveAlertTicker(null);
  };

  const handleDeleteAlert = (ticker: string) => {
    const newAlerts = { ...alerts };
    delete newAlerts[ticker];
    setAlerts(newAlerts);
    localStorage.setItem("stockintel_watchlist_alerts", JSON.stringify(newAlerts));
  };

  const trackedStocks = stocks
    ? stocks.filter((s) => watchlist.includes(s.ticker) && s.ticker !== "SPY" && s.ticker !== "QQQ" && s.ticker !== "VIX")
    : [];

  return (
    <div className="space-y-8 py-6 text-[var(--text-primary)]">
      {/* Header */}
      <section className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-[var(--text-secondary)] select-none">
          <HeartStraight className="h-4 w-4 text-[var(--amber-500)] animate-pulse" />
          Personal Intelligence Command
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-[var(--text-primary)] leading-none">
          My Watchlist & Alerts
        </h1>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          Monitor your tracked setups, write private investment notes, and establish custom alert boundaries for score adjustments or price gaps.
        </p>
      </section>

      {/* Grid of tracked equities */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-xs text-[var(--text-tertiary)] uppercase tracking-widest font-bold skeleton-shimmer">
          Gathering Watchlist Decisions & Financials...
        </div>
      ) : trackedStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {trackedStocks.map((stock) => {
            const hasAlert = alerts[stock.ticker] !== undefined;
            const currentNote = notes[stock.ticker] || "";
            const isEditing = editingTicker === stock.ticker;
            const isAlerting = activeAlertTicker === stock.ticker;

            return (
              <div
                key={stock.ticker}
                className="bg-[var(--bg-card)] border border-[var(--border-soft)] hover:border-[var(--text-tertiary)]/30 rounded-2xl p-6 shadow-sm transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-[var(--border-soft)] pb-3 mb-4">
                    <Link href={`/dashboard/${stock.ticker}`} className="flex items-center gap-2.5 group">
                      <span className="flex h-8 w-12 items-center justify-center rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-soft)] text-xs font-bold text-[var(--teal-500)] group-hover:bg-[var(--border-soft)] group-hover:text-[var(--text-primary)] transition-all">
                        {stock.ticker}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--amber-500)] transition-colors">
                          {stock.company_name}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider mt-1 ${
                            stock.decision_label === "Strong Setup"
                              ? "bg-[oklch(88%_0.14_142_/_0.15)] text-[var(--text-up)] border-[oklch(88%_0.14_142_/_0.2)]"
                              : stock.decision_label === "Watchlist"
                              ? "bg-[oklch(76%_0.15_75_/_0.15)] text-[var(--amber-500)] border-[oklch(76%_0.15_75_/_0.2)]"
                              : stock.decision_label === "Mixed Signals"
                              ? "bg-[var(--bg-sunken)] text-[var(--text-secondary)] border-[var(--border-soft)]"
                              : "bg-[oklch(82%_0.19_29_/_0.15)] text-[var(--text-down)] border-[oklch(82%_0.19_29_/_0.2)]"
                          }`}
                        >
                          {stock.decision_label}
                        </span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-display font-bold text-[var(--text-primary)]">
                        ${stock.current_price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => toggleWatchlist(stock.ticker)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-down)] hover:bg-[var(--bg-sunken)] rounded-lg transition-all p-1.5"
                      >
                        <Trash className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Private Thesis Editor */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] mb-2">
                      <span className="flex items-center gap-1">
                        <PencilSimple className="h-3.5 w-3.5 text-[var(--teal-500)]" />
                        Private Thesis Notes
                      </span>
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingTicker(stock.ticker);
                            setNoteInput(currentNote);
                          }}
                          className="text-[var(--teal-500)] hover:text-[var(--amber-500)] hover:underline transition-colors font-bold"
                        >
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Write down your custom thesis notes here..."
                          className="w-full bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl p-3 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)] min-h-[70px] transition-colors"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingTicker(null)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:bg-[var(--border-soft)] bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(stock.ticker)}
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[var(--teal-500)] text-[var(--bg-base)] hover:bg-[var(--teal-500)]/90 rounded-lg transition-all"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--bg-sunken)]/40 border border-[var(--border-soft)] rounded-xl p-3.5 min-h-[50px]">
                        {currentNote ? `"${currentNote}"` : "No custom thesis notes recorded. Click edit to add private research comments."}
                      </p>
                    )}
                  </div>

                  {/* Active alert configs */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] mb-2">
                      <span className="flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5 text-[var(--amber-500)]" />
                        Alert Thresholds
                      </span>
                      {!isAlerting && (
                        <button
                          onClick={() => {
                            setActiveAlertTicker(stock.ticker);
                            setAlertPrice(hasAlert ? alerts[stock.ticker].price.toString() : "");
                            setAlertScore(hasAlert ? Math.round(alerts[stock.ticker].score * 100).toString() : "");
                          }}
                          className="text-[var(--teal-500)] hover:text-[var(--amber-500)] hover:underline transition-colors font-bold"
                        >
                          Configure
                        </button>
                      )}
                    </div>

                    {isAlerting ? (
                      <div className="space-y-3 bg-[var(--bg-sunken)] border border-[var(--border-soft)] rounded-xl p-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Target Price ($)</label>
                            <input
                              type="text"
                              value={alertPrice}
                              onChange={(e) => setAlertPrice(e.target.value)}
                              placeholder="e.g. 185.00"
                              className="w-full bg-[var(--bg-card)] border border-[var(--border-soft)] rounded p-1.5 text-xs text-[var(--text-primary)] font-display"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Score Floor (%)</label>
                            <input
                              type="text"
                              value={alertScore}
                              onChange={(e) => setAlertScore(e.target.value)}
                              placeholder="e.g. 72"
                              className="w-full bg-[var(--bg-card)] border border-[var(--border-soft)] rounded p-1.5 text-xs text-[var(--text-primary)] font-display"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1.5">
                          {hasAlert ? (
                            <button
                              onClick={() => handleDeleteAlert(stock.ticker)}
                              className="text-[9px] font-bold text-[var(--text-down)] hover:underline"
                            >
                              Delete Alert
                            </button>
                          ) : (
                            <div />
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActiveAlertTicker(null)}
                              className="px-2.5 py-1 text-[9px] font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveAlert(stock.ticker)}
                              className="px-3 py-1.5 text-[9px] font-bold uppercase bg-[var(--teal-500)] text-[var(--bg-base)] rounded-lg transition-all"
                            >
                              Save Alert
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : hasAlert ? (
                      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] bg-[var(--bg-sunken)]/60 border border-[var(--border-soft)] rounded-xl p-3">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-primary)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal-500)] animate-pulse" />
                          Alert: Price ${alerts[stock.ticker].price.toFixed(2)} | Score floor {Math.round(alerts[stock.ticker].score * 100)}%
                        </span>
                        <button
                          onClick={() => handleDeleteAlert(stock.ticker)}
                          className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-down)] hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-tertiary)] italic bg-[var(--bg-sunken)]/10 border border-[var(--border-soft)] border-dashed rounded-xl p-3 text-center">
                        No alert triggers set for score revisions or price actions.
                      </p>
                    )}
                  </div>
                </div>

                {/* Inspect Link */}
                <div className="mt-5 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[var(--text-tertiary)]">Rating: {Math.round(stock.final_score * 100)}%</span>
                  <Link href={`/dashboard/${stock.ticker}`} className="text-[var(--teal-500)] hover:text-[var(--amber-500)] transition-colors">
                    Open Signal Command →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--bg-sunken)]/20 p-16 text-center max-w-xl mx-auto my-12">
          <WarningCircle className="h-10 w-10 text-[var(--text-tertiary)] mx-auto mb-4 animate-pulse" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Your Portfolio is Clear</h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-6 leading-relaxed">
            You are not currently monitoring any stock models. Add stocks on the Landing Hub or search a ticker in the Search bar to begin.
          </p>
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest bg-[var(--teal-500)] hover:bg-[var(--teal-500)]/90 px-4 py-2.5 rounded-xl text-[var(--bg-base)] transition-all inline-block"
          >
            Go to Intelligence Hub
          </Link>
        </div>
      )}
    </div>
  );
}
