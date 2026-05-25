def compute_signal_flags(row: dict) -> dict:
    """
    Derive human-readable signal flags from raw indicator values.
    Called before returning /technicals endpoint.
    """
    flags = {}

    # RSI signal
    rsi = row.get("rsi_14", 50) or 50
    if rsi > 70:   flags["rsi_signal"] = "overbought"
    elif rsi < 30: flags["rsi_signal"] = "oversold"
    else:          flags["rsi_signal"] = "neutral"

    # MACD signal
    macd = row.get("macd", 0) or 0
    sig  = row.get("macd_signal", 0) or 0
    hist = row.get("macd_hist", 0) or 0
    if macd > sig and hist > 0:   flags["macd_signal_flag"] = "bullish_cross"
    elif macd < sig and hist < 0: flags["macd_signal_flag"] = "bearish_cross"
    else:                         flags["macd_signal_flag"] = "neutral"

    # Bollinger Band position
    price  = row.get("close", 0) or 0
    bb_u   = row.get("bb_upper", price) or price
    bb_l   = row.get("bb_lower", price) or price
    bb_rng = bb_u - bb_l if bb_u != bb_l else 1
    bb_pos = (price - bb_l) / bb_rng
    if bb_pos > 0.8:   flags["bb_position"] = "upper"
    elif bb_pos < 0.2: flags["bb_position"] = "lower"
    else:              flags["bb_position"] = "mid"

    # MA alignment
    ma20  = row.get("ma_20", 0) or 0
    ma50  = row.get("ma_50", 0) or 0
    ma200 = row.get("ma_200", 0) or 0
    above_count = sum([price > ma20, price > ma50, price > ma200])
    if above_count == 3:   flags["ma_alignment"] = "bullish"
    elif above_count == 0: flags["ma_alignment"] = "bearish"
    else:                  flags["ma_alignment"] = "mixed"

    # Volume
    vol    = row.get("volume", 0) or 0
    vol_ma = row.get("volume_ma_20", 1) or 1
    flags["volume_signal"] = "above_avg" if vol > vol_ma else "below_avg"

    # Count overall
    bullish_signals = [
        flags["rsi_signal"] == "oversold",          # oversold = buy opportunity
        flags["macd_signal_flag"] == "bullish_cross",
        flags["bb_position"] == "lower",             # near support
        flags["ma_alignment"] == "bullish",
        flags["volume_signal"] == "above_avg",
    ]
    bearish_signals = [
        flags["rsi_signal"] == "overbought",
        flags["macd_signal_flag"] == "bearish_cross",
        flags["bb_position"] == "upper",
        flags["ma_alignment"] == "bearish",
    ]
    b = sum(bullish_signals)
    be = sum(bearish_signals)
    flags["overall_signals"] = {
        "bullish": b,
        "neutral": 5 - b - be,
        "bearish": be
    }

    return flags
