"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import SuggestiveSearch from "@/components/ui/suggestive-search";

const SUGGESTIONS = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology" },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Technology" },
  { ticker: "TSLA", name: "Tesla, Inc.", sector: "Automotive" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { ticker: "AMZN", name: "Amazon.com, Inc.", sector: "Consumer Cyclical" },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "Technology" },
  { ticker: "SOFI", name: "SoFi Technologies", sector: "Financials" },
  { ticker: "SPY", name: "S&P 500 ETF Trust", sector: "ETF" },
  { ticker: "QQQ", name: "Nasdaq QQQ Trust", sector: "ETF" },
];

export function StockSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchSubmit = (tickerStr: string) => {
    if (!tickerStr) return;
    setIsOpen(false);
    router.push(`/dashboard/${tickerStr.toUpperCase().trim()}`);
  };

  const filtered = query
    ? SUGGESTIONS.filter(
        (s) =>
          s.ticker.toLowerCase().includes(query.toLowerCase()) ||
          s.name.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS.slice(0, 5);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto z-30">
      {/* Input Bar with animated suggestive search */}
      <SuggestiveSearch
        value={query}
        onChange={(val) => {
          setQuery(val);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const exactMatch = SUGGESTIONS.find(s => s.ticker.toLowerCase() === query.toLowerCase().trim());
            handleSearchSubmit(exactMatch ? exactMatch.ticker : query);
          }
        }}
        suggestions={[
          "Search Apple or AAPL...",
          "Search NVIDIA or NVDA...",
          "Search Tesla or TSLA...",
          "Search Microsoft or MSFT...",
          "Search Google or GOOGL...",
          "Search Palantir or PLTR...",
        ]}
        effect="typewriter"
        className="w-full text-sm rounded-xl py-3 px-4 border border-[var(--border-soft)] bg-[var(--bg-surface)] shadow-sm focus-within:border-[var(--text-tertiary)]/50 transition-all duration-200"
        showLeading={true}
        Leading={() => (
          <MagnifyingGlass
            size={18}
            weight="regular"
            className="mr-1.5"
            style={{ color: "var(--text-tertiary)" }}
          />
        )}
        showTrailing={query.length > 0}
        Trailing={() => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
            }}
            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
            style={{
              color: "var(--text-tertiary)",
              background: "var(--bg-sunken)",
            }}
          >
            Clear
          </button>
        )}
      />

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-40"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            className="px-4 py-2 text-micro flex items-center gap-1.5"
            style={{
              borderBottom: '1px solid var(--border-soft)',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-sunken)',
            }}
          >
            <Sparkle size={14} weight="fill" style={{ color: 'var(--amber-500)' }} />
            {query ? "Matching Signals" : "Featured Market Assets"}
          </div>
          
          <ul className="max-h-72 overflow-y-auto" style={{ borderColor: 'var(--border-soft)' }}>
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <li
                  key={item.ticker}
                  style={{ borderBottom: '1px solid var(--border-soft)' }}
                >
                  <button
                    onClick={() => handleSearchSubmit(item.ticker)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left group"
                    style={{ transition: 'background-color 100ms' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-sunken)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-14 items-center justify-center rounded-md text-xs font-bold tracking-wider tabular-nums"
                        style={{
                          background: 'var(--teal-50)',
                          color: 'var(--teal-700)',
                          border: '1px solid var(--teal-200)',
                        }}
                      >
                        {item.ticker}
                      </span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {item.name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {item.sector}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider opacity-0 group-hover:opacity-100"
                      style={{
                        color: 'var(--teal-500)',
                        transition: 'opacity 100ms',
                      }}
                    >
                      Select →
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>
                No tracked assets match your query. Press Enter to search anyway.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
