"use client";

import { useState, useEffect } from "react";

// Standard default tickers for the initial user watchlist
const DEFAULT_WATCHLIST: string[] = [];

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Initialize from localStorage on client-side boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stockintel_watchlist");
      if (stored) {
        setWatchlist(JSON.parse(stored));
      } else {
        localStorage.setItem("stockintel_watchlist", JSON.stringify(DEFAULT_WATCHLIST));
        setWatchlist(DEFAULT_WATCHLIST);
      }
    } catch (e) {
      console.warn("localStorage is not accessible, using default watchlist:", e);
      setWatchlist(DEFAULT_WATCHLIST);
    }
    setLoaded(true);
  }, []);

  const saveWatchlist = (newWatchlist: string[]) => {
    setWatchlist(newWatchlist);
    try {
      localStorage.setItem("stockintel_watchlist", JSON.stringify(newWatchlist));
    } catch (e) {
      console.error("Failed to write watchlist to localStorage:", e);
    }
  };

  const addToWatchlist = (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (!watchlist.includes(sym)) {
      saveWatchlist([...watchlist, sym]);
    }
  };

  const removeFromWatchlist = (ticker: string) => {
    const sym = ticker.toUpperCase();
    saveWatchlist(watchlist.filter((t) => t !== sym));
  };

  const isInWatchlist = (ticker: string) => {
    return watchlist.includes(ticker.toUpperCase());
  };

  const toggleWatchlist = (ticker: string) => {
    const sym = ticker.toUpperCase();
    if (isInWatchlist(sym)) {
      removeFromWatchlist(sym);
    } else {
      addToWatchlist(sym);
    }
  };

  return {
    watchlist,
    loaded,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
  };
}
