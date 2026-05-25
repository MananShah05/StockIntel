from fredapi import Fred
import asyncio
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import MacroData
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

def generate_mock_macro() -> dict:
    """Generates highly realistic economic benchmarks for testing."""
    return {
        "fed_funds_rate": 5.25,
        "cpi_yoy": 3.15,
        "unemployment": 3.90,
        "sp500_return_1d": 0.0018,
        "vix": 13.52,
        "regime_label": "Risk-On",
    }

def _fetch_fred_data_sync() -> dict:
    """Synchronous FRED API calls wrapped for Async execution."""
    fred = Fred(api_key=settings.fred_api_key)
    end = datetime.now()
    start = end - timedelta(days=45)

    def safe_get(series_id):
        try:
            s = fred.get_series(series_id, observation_start=start, observation_end=end)
            return float(s.dropna().iloc[-1]) if not s.empty else None
        except Exception as e:
            logger.warning(f"Failed to query series {series_id} from FRED: {e}")
            return None

    return {
        "fed_funds_rate": safe_get("DFF"),
        "cpi_yoy": safe_get("CPIAUCSL"),
        "unemployment": safe_get("UNRATE"),
    }


def _latest_close(df):
    close = df["Close"]
    if hasattr(close, "columns"):
        close = close.iloc[:, 0]
    return float(close.dropna().iloc[-1])


def _fetch_yfinance_macro_sync() -> dict:
    import yfinance as yf

    data = {}

    vix_df = yf.download("^VIX", period="5d", auto_adjust=True, progress=False)
    if not vix_df.empty:
        data["vix"] = _latest_close(vix_df)

    sp_df = yf.download("^GSPC", period="5d", auto_adjust=True, progress=False)
    if not sp_df.empty and len(sp_df) >= 2:
        close = sp_df["Close"]
        if hasattr(close, "columns"):
            close = close.iloc[:, 0]
        close = close.dropna()
        if len(close) >= 2:
            prev_close = float(close.iloc[-2])
            curr_close = float(close.iloc[-1])
            data["sp500_return_1d"] = (curr_close - prev_close) / prev_close if prev_close > 0 else 0.0

    return data

async def ingest_macro(db: AsyncSession, force_mock: bool = False):
    """
    Ingests global economic indicators. Uses FRED API or falls back to realistic mock indicators.
    Saves daily macroeconomic snapshots to the database.
    """
    data = None

    if not force_mock:
        data = generate_mock_macro()

        if settings.fred_api_key:
            try:
                logger.info("Scraping macroeconomic parameters from FRED API...")
                loop = asyncio.get_event_loop()
                fred_data = await loop.run_in_executor(None, _fetch_fred_data_sync)
                data.update({k: v for k, v in fred_data.items() if v is not None})
            except Exception as e:
                logger.error(f"FRED macro ingestion failed: {e}. Keeping fallback economic indicators.")
        else:
            logger.warning("FRED API key is missing. Keeping fallback FRED indicators and fetching market regime data from yfinance.")

        try:
            logger.info("Fetching VIX and S&P 500 return from yfinance...")
            loop = asyncio.get_event_loop()
            yf_data = await loop.run_in_executor(None, _fetch_yfinance_macro_sync)
            data.update(yf_data)
        except Exception as yf_err:
            logger.warning(f"yfinance VIX/S&P fetch failed: {yf_err}. Keeping fallback market regime data.")

        try:
            vix_val = data["vix"]
            ret_val = data["sp500_return_1d"]
            
            # Determine regime
            if vix_val < 18 and ret_val > -0.005:
                data["regime_label"] = "Risk-On"
            elif vix_val > 23:
                data["regime_label"] = "Risk-Off"
            else:
                data["regime_label"] = "Neutral"
                
            logger.info("Successfully prepared macro indicators.")
        except Exception as e:
            logger.error(f"Failed to derive macro regime label: {e}. Defaulting to neutral regime.")
            data["regime_label"] = "Neutral"
    else:
        logger.info("Smart Mock Mode active. Simulating macroeconomic indicators...")
        data = generate_mock_macro()

    # Save to database
    today_date = date.today()
    try:
        q = select(MacroData).where(MacroData.date == today_date)
        res = await db.execute(q)
        existing = res.scalar_one_or_none()
        
        cleaned_data = {k: (float(v) if isinstance(v, (int, float)) else v) for k, v in data.items()}
        
        if existing:
            for k, v in cleaned_data.items():
                setattr(existing, k, v)
        else:
            new_macro = MacroData(
                date=today_date,
                **cleaned_data
            )
            db.add(new_macro)
            
        await db.commit()
        logger.info(f"Saved macroeconomic snapshot for {today_date} to database.")
    except Exception as e:
        logger.error(f"Failed writing macro data to database: {e}")
        await db.rollback()
