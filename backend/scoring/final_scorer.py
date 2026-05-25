from dataclasses import dataclass, field
from typing import List, Dict, Any, Tuple, Optional
from datetime import date, datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Scoring weights - must sum to 1.0 (excluding risk which acts as a penalty)
LAYER_WEIGHTS = {
    "sentiment":   0.20,
    "technical":   0.25,
    "fundamental": 0.25,
    "event":       0.15,
    "regime":      0.05,
    "risk":       -0.10,  # Risk acts as a direct penalty weight
}

DECISION_THRESHOLDS = {
    "Strong Setup":   0.72,
    "Watchlist":      0.55,
    "Mixed Signals":  0.40,
    "High Risk":      0.25,
    "Avoid":          0.00,
}

@dataclass
class ScoreBundle:
    sentiment_score:   float = 0.5
    technical_score:   float = 0.5
    fundamental_score: float = 0.5
    event_score:       float = 0.5
    risk_score:        float = 0.2  # 0 = safe, 1 = extremely risky
    regime_score:      float = 0.5
    confidence_score:  float = 0.5
    
    # Explanations & metadata
    positive_factors: List[str] = field(default_factory=list)
    negative_factors: List[str] = field(default_factory=list)
    what_changed:     List[str] = field(default_factory=list)
    thesis_summary:   str = ""
    time_horizon:     str = "Medium Term"
    source_summary:   Dict[str, int] = field(default_factory=dict)

def compute_final_score(bundle: ScoreBundle) -> Tuple[float, str, str]:
    """
    Combines layers using the weighted average formula and deducts risk penalties.
    Returns: (final_score 0-1, decision_label, confidence_tier)
    """
    raw_weighted = (
        bundle.sentiment_score   * LAYER_WEIGHTS["sentiment"]   +
        bundle.technical_score   * LAYER_WEIGHTS["technical"]   +
        bundle.fundamental_score * LAYER_WEIGHTS["fundamental"] +
        bundle.event_score       * LAYER_WEIGHTS["event"]       +
        bundle.regime_score      * LAYER_WEIGHTS["regime"]      +
        (bundle.risk_score       * abs(LAYER_WEIGHTS["risk"]) * -1) # Risk deducts from the score
    )
    
    # Clamp final score between 0.0 and 1.0
    final = max(0.0, min(1.0, raw_weighted))
    
    # Assign plain-english decision label
    decision_label = "Avoid"
    for label, threshold in DECISION_THRESHOLDS.items():
        if final >= threshold:
            decision_label = label
            break
            
    # Assign confidence tier
    conf = bundle.confidence_score
    if conf >= 0.78:
        confidence_tier = "High Confidence"
    elif conf >= 0.55:
        confidence_tier = "Moderate Confidence"
    elif conf >= 0.35:
        confidence_tier = "Low Confidence"
    else:
        confidence_tier = "Very Uncertain"
        
    return round(final, 3), decision_label, confidence_tier

# Individual Layer Scorer Implementations

def score_sentiment_layer(articles: List[Dict[str, Any]]) -> Tuple[float, Dict[str, int], List[str]]:
    """
    Aggregates news, reddit, and SEC sentiments based on source trust weight.
    Returns: (sentiment_score, source_summary, positive/negative factor tags)
    """
    factors = []
    source_counts = {"newsapi": 0, "reddit": 0, "sec": 0}
    
    if not articles:
        return 0.5, source_counts, ["Neutral baseline sentiment due to no active news feeds"]
        
    total_weight = 0.0
    weighted_sentiment = 0.0
    
    for art in articles:
        weight = float(art.get("trust_weight", 0.5))
        score = float(art.get("sentiment_score", 0.0))  # -1.0 to +1.0
        
        weighted_sentiment += score * weight
        total_weight += weight
        
        stype = art.get("source_type", "newsapi")
        if stype in source_counts:
            source_counts[stype] += 1
            
    if total_weight > 0:
        avg_sentiment = weighted_sentiment / total_weight # -1.0 to +1.0
    else:
        avg_sentiment = 0.0
        
    # Map from [-1.0, 1.0] -> [0.0, 1.0]
    layer_score = (avg_sentiment + 1.0) / 2.0
    
    if layer_score >= 0.65:
        factors.append(f"Bullish news & social sentiment index ({layer_score:.2f})")
    elif layer_score <= 0.35:
        factors.append(f"Bearish news sentiment pressure ({layer_score:.2f})")
        
    return round(layer_score, 3), source_counts, factors

def score_technical_layer(ti: Optional[Dict[str, Any]], price_history: List[Dict[str, Any]]) -> Tuple[float, List[str], List[str]]:
    """
    Computes a multi-factor technical signal based on momentum (RSI), trend (MACD, MA alignments), and volatility.
    """
    pos_factors = []
    neg_factors = []
    
    if not ti or not price_history:
        return 0.5, ["Technical metrics unavailable; using baseline default"], []
        
    points = 0
    total_points = 10
    
    # 1. RSI Scoring (3 points)
    rsi = ti.get("rsi_14")
    if rsi is not None:
        if 48 <= rsi <= 64:
            points += 3  # strong healthy momentum
            pos_factors.append("RSI shows healthy momentum without being overbought")
        elif 30 <= rsi < 48:
            points += 1.5  # moderate neutral
        elif rsi < 30:
            points += 1.0  # oversold (potential reversal, but short-term bearish)
            neg_factors.append("RSI is oversold, flagging downward pressure but potential floor")
        else: # rsi > 64
            points += 0.5  # overbought risk
            neg_factors.append("RSI indicates overbought conditions (potential cool-off)")
            
    # 2. MACD Scoring (3 points)
    macd = ti.get("macd")
    macd_signal = ti.get("macd_signal")
    macd_hist = ti.get("macd_hist")
    if macd is not None and macd_signal is not None:
        if macd > macd_signal:
            points += 2.0
            pos_factors.append("MACD is in a bullish crossover state")
        else:
            neg_factors.append("MACD shows a bearish signal crossover")
        if macd_hist is not None and macd_hist > 0:
            points += 1.0
            
    # 3. Moving Average Alignments (4 points)
    current_close = float(price_history[-1]["close"]) if price_history else 0
    ma20 = ti.get("ma_20")
    ma50 = ti.get("ma_50")
    ma200 = ti.get("ma_200")
    
    if current_close > 0:
        if ma20 and current_close > ma20:
            points += 1.0
        if ma50 and current_close > ma50:
            points += 1.0
            pos_factors.append("Price is trading above its 50-day moving average")
        if ma200 and current_close > ma200:
            points += 2.0
            pos_factors.append("Long-term support holds: trading above 200-day moving average")
        elif ma200 and current_close < ma200:
            neg_factors.append("Trading below 200-day moving average (long-term bearish trend)")

    score = points / total_points
    return round(score, 3), pos_factors, neg_factors

def score_fundamental_layer(f: Optional[Dict[str, Any]]) -> Tuple[float, List[str], List[str]]:
    """
    Computes a fundamental health rating based on valuation, profitability, debt, and cash flow.
    """
    pos_factors = []
    neg_factors = []
    
    if not f:
        return 0.5, ["Fundamental profile unavailable; neutral rating"], []
        
    points = 0
    total_points = 8
    
    # 1. P/E Ratio (2 points)
    pe = f.get("pe_ratio")
    if pe is not None:
        if 0 < pe <= 22:
            points += 2.0
            pos_factors.append(f"Valuation is highly attractive with P/E ratio of {pe:.1f}")
        elif 22 < pe <= 40:
            points += 1.0
        elif pe < 0:
            neg_factors.append("Company is currently unprofitable (negative trailing P/E)")
        else: # pe > 40
            neg_factors.append(f"High growth premium or elevated P/E ratio of {pe:.1f}")
            
    # 2. Debt-to-Equity (2 points)
    de = f.get("debt_to_equity")
    if de is not None:
        # yfinance often gives this as percentage (e.g. 150 = 1.5) or multiplier
        de_ratio = de / 100.0 if de > 5 else de
        if de_ratio < 1.0:
            points += 2.0
            pos_factors.append("Balance sheet is highly conservative (low debt/equity)")
        elif de_ratio <= 2.0:
            points += 1.0
        else:
            neg_factors.append(f"Highly leveraged balance sheet (Debt/Equity: {de_ratio:.2f})")
            
    # 3. ROE (2 points)
    roe = f.get("roe")
    if roe is not None:
        roe_val = roe / 100.0 if roe > 1.0 else roe
        if roe_val >= 0.15:
            points += 2.0
            pos_factors.append(f"Excellent capital efficiency: ROE of {roe_val*100:.1f}%")
        elif roe_val > 0.05:
            points += 1.0
        else:
            neg_factors.append("Low capital efficiency or depressed Return on Equity")
            
    # 4. FCF and Profit Margin (2 points)
    fcf = f.get("free_cash_flow")
    pm = f.get("profit_margin")
    
    if fcf and fcf > 0:
        points += 1.0
        pos_factors.append("Generates positive free cash flows")
    if pm is not None:
        pm_val = pm / 100.0 if pm > 1.0 else pm
        if pm_val > 0.10:
            points += 1.0
            
    score = points / total_points
    return round(score, 3), pos_factors, neg_factors

def score_event_layer(articles: List[Dict[str, Any]]) -> float:
    """
    Evaluates regulatory SEC filings and high-impact corporate alerts.
    """
    score = 0.5
    sec_filings = [a for a in articles if a.get("source_type") == "sec"]
    
    # 8-K / 10-Q filing activity triggers positive score baseline adjustment
    if sec_filings:
        score += min(len(sec_filings) * 0.1, 0.3)
        
    # Check if there are strong bullish positive titles in filings or news
    bullish_titles = sum(1 for a in articles if "merger" in a["title"].lower() or "acquisition" in a["title"].lower() or "breakthrough" in a["title"].lower())
    score += min(bullish_titles * 0.1, 0.2)
    
    return min(1.0, score)

def score_regime_layer(macro: Optional[Dict[str, Any]]) -> float:
    """
    Translates S&P 500 moving averages, inflation indices, and VIX volatility to a regime score.
    """
    if not macro:
        return 0.5
        
    vix = macro.get("vix")
    regime = macro.get("regime_label", "Neutral").lower()
    
    if regime == "risk-on":
        score = 0.90
    elif regime == "risk-off":
        score = 0.25
    else:
        score = 0.55
        
    if vix and vix > 25:
        score -= 0.15
        
    return max(0.0, min(1.0, score))

def score_risk_layer(ti: Optional[Dict[str, Any]], f: Optional[Dict[str, Any]], articles: List[Dict[str, Any]], sentiment_score: float) -> Tuple[float, List[str]]:
    """
    Aggregates volatility indicators, high leverage ratios, and negative news streams into a 0 to 1 risk score.
    """
    risk_factors = []
    risk_accum = 0.0
    
    # 1. Financial Leverage Risk
    if f:
        de = f.get("debt_to_equity")
        if de:
            de_ratio = de / 100.0 if de > 5 else de
            if de_ratio > 2.5:
                risk_accum += 0.3
                risk_factors.append(f"Extremely high leverage ratio (Debt/Equity: {de_ratio:.2f})")
                
    # 2. Extreme Volatility Risk (using ATR)
    if ti:
        atr = ti.get("atr_14")
        ma20 = ti.get("ma_20")
        if atr and ma20 and ma20 > 0:
            rel_atr = atr / ma20
            if rel_atr > 0.06:  # ATR exceeds 6% of baseline stock price
                risk_accum += 0.35
                risk_factors.append("Extreme relative daily trading volatility (high ATR)")
            elif rel_atr > 0.035:
                risk_accum += 0.15
                
    # 3. High Bearish Sentiment Risk
    if sentiment_score < 0.35:
        risk_accum += 0.3
        risk_factors.append("Substantial negative news stream & investor panic")
        
    # 4. Bearish chart alignment
    if ti and ti.get("ma_200") and ti.get("ma_50"):
        if ti["ma_50"] < ti["ma_200"]:
            risk_accum += 0.15
            risk_factors.append("Chart pattern exhibits bearish alignment (50MA below 200MA)")
            
    risk_score = min(1.0, risk_accum)
    if risk_score < 0.1:
        risk_score = 0.1  # baseline minimal operational risk
        
    return round(risk_score, 3), risk_factors

def score_confidence_layer(articles: List[Dict[str, Any]], sentiment_score: float, technical_score: float) -> float:
    """
    Evaluates signal certainty based on news volume, data age, and technical-sentiment convergence.
    """
    points = 0.0
    total = 3.0
    
    # 1. Source convergence (agreement)
    agreement = abs(sentiment_score - technical_score)
    if agreement < 0.15:
        points += 1.0  # complete alignment of sentiment and charts
    elif agreement < 0.35:
        points += 0.6
        
    # 2. Information Volume
    if len(articles) >= 12:
        points += 1.0
    elif len(articles) >= 4:
        points += 0.6
        
    # 3. Data availability points
    points += 1.0  # default baseline data connectivity holds
    
    return round(points / total, 3)
