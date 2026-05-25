// Resolve chart colors at component level — not at module level (SSR safe)

export function getChartColors(isDark: boolean) {
  return {
    price:    isDark ? '#4ade80' : '#16a34a',
    volumeUp: isDark ? '#34d399' : '#059669',
    volDown:  isDark ? '#6b7280' : '#9ca3af',
    volMa:    isDark ? '#fbbf24' : '#d97706',
    rsi:      isDark ? '#fcd34d' : '#b45309',
    macd:     isDark ? '#67e8f9' : '#0e7490',
    signal:   isDark ? '#fbbf24' : '#d97706',
    histPos:  isDark ? '#4ade80' : '#16a34a',
    histNeg:  isDark ? '#f87171' : '#dc2626',
    ma20:     isDark ? '#67e8f9' : '#0e7490',
    ma50:     isDark ? '#fbbf24' : '#b45309',
    ma200:    isDark ? '#c084fc' : '#7c3aed',
    bbBands:  isDark ? '#a78bfa' : '#7c3aed',
    bbFill:   isDark ? 'rgba(167,139,250,0.08)' : 'rgba(124,58,237,0.05)',
    gridLine: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tickText: isDark ? '#6b7280' : '#9ca3af',
  }
}
