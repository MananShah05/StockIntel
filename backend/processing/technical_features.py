import pandas as pd
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import PriceData, TechnicalIndicator
import logging

logger = logging.getLogger(__name__)

# Optional import of 'ta' library
HAS_TA_LIB = False
try:
    from ta.momentum import RSIIndicator
    from ta.trend import MACD
    from ta.volatility import BollingerBands, AverageTrueRange
    HAS_TA_LIB = True
except ImportError:
    HAS_TA_LIB = False

def compute_indicators_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Calculates all technical indicators on the DataFrame. Supports fallback if ta is missing."""
    close = df["close"]
    high  = df["high"]
    low   = df["low"]
    
    if HAS_TA_LIB:
        try:
            df["rsi_14"] = RSIIndicator(close=close, window=14).rsi()
            
            macd_obj = MACD(close=close)
            df["macd"] = macd_obj.macd()
            df["macd_signal"] = macd_obj.macd_signal()
            df["macd_hist"] = macd_obj.macd_diff()
            
            bb = BollingerBands(close=close, window=20, window_dev=2)
            df["bb_upper"] = bb.bollinger_hband()
            df["bb_lower"] = bb.bollinger_lband()
            df["bb_mid"] = bb.bollinger_mavg()
            
            df["ma_20"] = close.rolling(20).mean()
            df["ma_50"] = close.rolling(50).mean()
            df["ma_200"] = close.rolling(200).mean()
            df["volume_ma_20"] = df["volume"].rolling(20).mean()
            
            df["atr_14"] = AverageTrueRange(high=high, low=low, close=close, window=14).average_true_range()
            return df
        except Exception as e:
            logger.warning(f"Error in ta library calculations: {e}. Falling back to pure pandas calculations.")
            
    # Pure-Pandas/Numpy Fallback Engine (No dependencies required)
    # RSI Fallback
    delta = close.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / (loss + 1e-9)
    df["rsi_14"] = 100 - (100 / (1 + rs))

    # MACD Fallback
    exp12 = close.ewm(span=12, adjust=False).mean()
    exp26 = close.ewm(span=26, adjust=False).mean()
    df["macd"] = exp12 - exp26
    df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()
    df["macd_hist"] = df["macd"] - df["macd_signal"]

    # Bollinger Bands Fallback
    df["bb_mid"] = close.rolling(window=20).mean()
    rstd = close.rolling(window=20).std()
    df["bb_upper"] = df["bb_mid"] + 2 * rstd
    df["bb_lower"] = df["bb_mid"] - 2 * rstd

    # Moving Averages & ATR
    df["ma_20"] = close.rolling(window=20).mean()
    df["ma_50"] = close.rolling(window=50).mean()
    df["ma_200"] = close.rolling(window=200).mean()
    df["volume_ma_20"] = df["volume"].rolling(window=20).mean()

    # ATR Fallback (High-Low, High-PrevClose, Low-PrevClose)
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = abs(high - prev_close)
    tr3 = abs(low - prev_close)
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    df["atr_14"] = tr.rolling(window=14).mean()
    
    return df

async def compute_technicals(db: AsyncSession, ticker: str):
    """
    Reads price_data from DB, computes indicators, upserts into technical_indicators.
    Supports both SQLite and PostgreSQL async databases.
    """
    result = await db.execute(
        select(PriceData)
        .where(PriceData.ticker == ticker)
        .order_by(PriceData.date.asc())
    )
    rows = result.scalars().all()
    if len(rows) < 15:
        logger.warning(f"Not enough price data for technicals on {ticker} (requires at least 15 rows, found {len(rows)})")
        return

    df = pd.DataFrame([{
        "date": r.date,
        "open": float(r.open or 0),
        "high": float(r.high or 0),
        "low": float(r.low or 0),
        "close": float(r.close or 0),
        "volume": int(r.volume or 0),
    } for r in rows])

    # Compute values
    df = compute_indicators_dataframe(df)

    # Upsert the last 30 days of data only (to keep it fast and updated)
    recent = df.tail(30)
    
    for _, row in recent.iterrows():
        if pd.isna(row["rsi_14"]) and pd.isna(row["macd"]):
            continue

        q = select(TechnicalIndicator).where(
            TechnicalIndicator.ticker == ticker,
            TechnicalIndicator.date == row["date"]
        )
        res = await db.execute(q)
        existing = res.scalar_one_or_none()

        data_dict = {
            "rsi_14": float(row["rsi_14"]) if not pd.isna(row["rsi_14"]) else None,
            "macd": float(row["macd"]) if not pd.isna(row["macd"]) else None,
            "macd_signal": float(row["macd_signal"]) if not pd.isna(row["macd_signal"]) else None,
            "macd_hist": float(row["macd_hist"]) if not pd.isna(row["macd_hist"]) else None,
            "bb_upper": float(row["bb_upper"]) if not pd.isna(row["bb_upper"]) else None,
            "bb_lower": float(row["bb_lower"]) if not pd.isna(row["bb_lower"]) else None,
            "bb_mid": float(row["bb_mid"]) if not pd.isna(row["bb_mid"]) else None,
            "ma_20": float(row["ma_20"]) if not pd.isna(row["ma_20"]) else None,
            "ma_50": float(row["ma_50"]) if not pd.isna(row["ma_50"]) else None,
            "ma_200": float(row["ma_200"]) if not pd.isna(row["ma_200"]) else None,
            "volume_ma_20": int(row["volume_ma_20"]) if not pd.isna(row["volume_ma_20"]) else None,
            "atr_14": float(row["atr_14"]) if not pd.isna(row["atr_14"]) else None,
        }

        if existing:
            for k, v in data_dict.items():
                setattr(existing, k, v)
        else:
            new_ti = TechnicalIndicator(
                ticker=ticker,
                date=row["date"],
                **data_dict
            )
            db.add(new_ti)

    await db.commit()
    logger.info(f"Computed technical indicators for {ticker}")
