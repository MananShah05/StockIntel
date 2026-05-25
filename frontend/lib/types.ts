export type DecisionLabel =
  | "Strong Setup"
  | "Watchlist"
  | "Mixed Signals"
  | "High Risk"
  | "Avoid";

export type ConfidenceTier =
  | "High Confidence"
  | "Moderate Confidence"
  | "Low Confidence"
  | "Very Uncertain";

export interface StockScore {
  ticker: string;
  date: string;
  decision_label: DecisionLabel;
  confidence_score: number;
  confidence_tier: ConfidenceTier;
  final_score: number;

  // Layer scores (0-1)
  sentiment_score: number;
  technical_score: number;
  fundamental_score: number;
  event_score: number;
  risk_score: number;
  regime_score: number;

  // Explanations
  thesis_summary: string;
  positive_factors: string[];
  negative_factors: string[];
  what_changed: string[];
  time_horizon: string;
  source_summary: Record<string, number>;
}

export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: number;
  title: string;
  source_name: string;
  source_type: "newsapi" | "reddit" | "sec";
  url: string;
  content: string;
  published_at: string;
  trust_weight: number;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: number;
}


export interface StockDashboardData {
  ticker: string;
  company_name: string;
  sector: string;
  current_price: number;
  price_change_1d: number;
  price_change_pct_1d: number;
  score: StockScore;
  price_history: PricePoint[];
  news: NewsItem[];
  technicals: TechnicalSnapshot;
  fundamentals: FundamentalSnapshot;
  sentiment_history: Array<{ date: string; score: number }>;
}

export interface StockListItem {
  ticker: string;
  company_name: string;
  sector: string;
  industry: string;
  market_cap: number;
  current_price: number;
  price_change_1d: number;
  price_change_pct_1d: number;
  decision_label: DecisionLabel;
  final_score: number;
}

export interface DepthLevel {
  bid_orders: number;
  bid_qty: number;
  bid_price: number;
  ask_price: number;
  ask_qty: number;
  ask_orders: number;
}

export interface QuoteSnapshot {
  ticker: string;
  company_name: string;
  exchange: string;
  ltp: number;
  change: number;
  change_pct: number;
  open: number;
  prev_close: number;
  atp: number;
  day_high: number;
  day_low: number;
  week52_high: number;
  week52_low: number;
  week52_position_pct: number;
  volume: number;
  avg_volume_20d: number;
  volume_ratio: number;
  turnover: number;
  market_cap: number;
  bid_price: number;
  bid_qty: number;
  bid_orders: number;
  ask_price: number;
  ask_qty: number;
  ask_orders: number;
  depth: DepthLevel[];
  ltt: string;
}

export interface OHLCVPoint {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalHistoryPoint {
  date: string;
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  bb_upper: number;
  bb_mid: number;
  bb_lower: number;
  ma_20: number;
  ma_50: number;
  ma_200: number;
  close: number;
  volume: number;
}

export interface TechnicalSnapshot {
  rsi_14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
  bb_mid: number | null;
  ma_20: number | null;
  ma_50: number | null;
  ma_200: number | null;
  atr_14: number | null;
  rsi_signal?: "overbought" | "neutral" | "oversold";
  macd_signal_flag?: "bullish_cross" | "bearish_cross" | "neutral";
  bb_position?: "upper" | "mid" | "lower";
  ma_alignment?: "bullish" | "bearish" | "mixed";
  volume_signal?: "above_avg" | "below_avg";
  overall_signals?: { bullish: number; neutral: number; bearish: number };
}

export interface FundamentalSnapshot {
  pe_ratio: number | null;
  pb_ratio: number | null;
  ps_ratio: number | null;
  eps: number | null;
  eps_growth_yoy?: number | null;
  revenue: number | null;
  net_income: number | null;
  debt_to_equity: number | null;
  free_cash_flow: number | null;
  roe: number | null;
  profit_margin: number | null;
  dividend_yield?: number | null;
  sector_pe?: number | null;
  sector_pb?: number | null;
}

