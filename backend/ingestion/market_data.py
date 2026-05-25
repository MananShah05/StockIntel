import yfinance as yf
import pandas as pd
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import PriceData, Fundamental, Stock
import asyncio
import logging
import random

logger = logging.getLogger(__name__)

# List of tickers seeded by default
TRACKED_TICKERS = [
    "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
    "TSLA", "META", "JPM", "AMD", "NFLX",
    "PLTR", "SOFI", "SPY", "QQQ", "VIX"
]

YFINANCE_SYMBOLS = {
    "VIX": "^VIX",
}

FALLBACK_STOCK_METADATA = {
    "AAPL": {"company_name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics"},
    "MSFT": {"company_name": "Microsoft Corporation", "sector": "Technology", "industry": "Software - Infrastructure"},
    "NVDA": {"company_name": "NVIDIA Corporation", "sector": "Technology", "industry": "Semiconductors"},
    "GOOGL": {"company_name": "Alphabet Inc.", "sector": "Communication Services", "industry": "Internet Content & Information"},
    "AMZN": {"company_name": "Amazon.com, Inc.", "sector": "Consumer Cyclical", "industry": "Internet Retail"},
    "TSLA": {"company_name": "Tesla, Inc.", "sector": "Consumer Cyclical", "industry": "Auto Manufacturers"},
    "META": {"company_name": "Meta Platforms, Inc.", "sector": "Communication Services", "industry": "Internet Content & Information"},
    "JPM": {"company_name": "JPMorgan Chase & Co.", "sector": "Financial Services", "industry": "Banks - Diversified"},
    "AMD": {"company_name": "Advanced Micro Devices, Inc.", "sector": "Technology", "industry": "Semiconductors"},
    "NFLX": {"company_name": "Netflix, Inc.", "sector": "Communication Services", "industry": "Entertainment"},
    "PLTR": {"company_name": "Palantir Technologies Inc.", "sector": "Technology", "industry": "Software - Infrastructure"},
    "SOFI": {"company_name": "SoFi Technologies, Inc.", "sector": "Financial Services", "industry": "Credit Services"},
    "SPY": {"company_name": "SPDR S&P 500 ETF Trust", "sector": "ETF", "industry": "Exchange Traded Fund"},
    "QQQ": {"company_name": "Invesco QQQ Trust", "sector": "ETF", "industry": "Exchange Traded Fund"},
    "VIX": {"company_name": "CBOE Volatility Index", "sector": "Index", "industry": "Market Volatility Index"},
}


def _yfinance_symbol(ticker: str) -> str:
    return YFINANCE_SYMBOLS.get(ticker, ticker)

def generate_mock_price_history(ticker: str, days: int = 90) -> list[dict]:
    """Generates extremely realistic historical price points for testing if yfinance fails or offline."""
    base_prices = {
        "AAPL": 175.0, "MSFT": 420.0, "NVDA": 900.0, "GOOGL": 170.0, "AMZN": 180.0,
        "TSLA": 175.0, "META": 475.0, "JPM": 195.0, "AMD": 160.0, "NFLX": 600.0,
        "PLTR": 21.0, "SOFI": 7.20, "SPY": 510.0, "QQQ": 435.0, "VIX": 13.5
    }
    
    base = base_prices.get(ticker, 50.0)
    records = []
    current_date = date.today() - timedelta(days=days)
    price = base * (0.8 + random.random() * 0.4) # start price offset
    
    volatility = 0.022 if ticker != "VIX" else 0.07
    if ticker in ["TSLA", "PLTR", "SOFI"]:
        volatility = 0.04
        
    for i in range(days + 1):
        # skip weekends for stocks, except for simplicity in mock let's include business days only
        if current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
            
        change_pct = random.normalvariate(0.0005, volatility)
        if ticker == "VIX":
            # mean-reverting mock VIX
            change_pct = (13.5 - price) * 0.05 + random.normalvariate(0, 1.2)
            close = max(9.0, price + change_pct)
        else:
            close = price * (1 + change_pct)
            
        high = max(price, close) * (1 + random.random() * 0.01)
        low = min(price, close) * (1 - random.random() * 0.01)
        open_p = price * (1 + random.normalvariate(0, 0.002))
        volume = int(random.randint(500000, 10000000) * (base / close if close > 0 else 1))
        
        records.append({
            "ticker": ticker,
            "date": current_date,
            "open": round(open_p, 4),
            "high": round(high, 4),
            "low": round(low, 4),
            "close": round(close, 4),
            "volume": volume,
            "adj_close": round(close, 4),
        })
        price = close
        current_date += timedelta(days=1)
        
    return records

def generate_mock_fundamentals(ticker: str) -> dict:
    """Generates highly realistic financial metrics for mock backup."""
    pe_vals = {"AAPL": 28.5, "MSFT": 35.2, "NVDA": 72.1, "GOOGL": 26.0, "AMZN": 41.5, "TSLA": 58.0, "META": 24.3, "JPM": 11.5, "AMD": 54.0, "NFLX": 38.0, "PLTR": 85.0, "SOFI": 35.0}
    de_vals = {"AAPL": 140.0, "MSFT": 42.0, "NVDA": 25.0, "GOOGL": 9.5, "AMZN": 95.0, "TSLA": 15.0, "META": 12.0, "JPM": 220.0, "AMD": 18.0, "NFLX": 110.0, "PLTR": 8.0, "SOFI": 180.0}
    roe_vals = {"AAPL": 145.0, "MSFT": 38.5, "NVDA": 54.0, "GOOGL": 25.0, "AMZN": 18.0, "TSLA": 22.0, "META": 28.0, "JPM": 12.5, "AMD": 9.0, "NFLX": 26.0, "PLTR": 5.5, "SOFI": 4.0}
    
    return {
        "pe_ratio": pe_vals.get(ticker, 18.5),
        "pb_ratio": pe_vals.get(ticker, 18.5) / 6.0 if ticker in pe_vals else 2.5,
        "ps_ratio": pe_vals.get(ticker, 18.5) / 4.0 if ticker in pe_vals else 1.8,
        "eps": random.uniform(1.5, 8.5) if ticker != "SOFI" else 0.12,
        "revenue": random.randint(10, 300) * 1000000000,
        "net_income": random.randint(1, 80) * 1000000000,
        "debt_to_equity": de_vals.get(ticker, 65.0),
        "free_cash_flow": random.randint(2, 50) * 1000000000,
        "roe": roe_vals.get(ticker, 14.0) / 100.0,
        "profit_margin": roe_vals.get(ticker, 14.0) / 200.0,
    }

async def ingest_price_data(db: AsyncSession, ticker: str, days: int = 90, force_mock: bool = False):
    """
    Fetch OHLCV data from yfinance and upsert into the price_data table.
    Falls back to highly realistic mock data on networks that block yfinance.
    """
    records = []
    
    if not force_mock:
        try:
            yf_symbol = _yfinance_symbol(ticker)
            logger.info(f"Downloading yfinance price history for {ticker} using symbol {yf_symbol}...")
            loop = asyncio.get_event_loop()
            
            # yfinance download is synchronous, run in executor
            df = await loop.run_in_executor(
                None,
                lambda: yf.download(yf_symbol, period=f"{days}d", auto_adjust=True, progress=False)
            )
            
            if not df.empty:
                for date_idx, row in df.iterrows():
                    records.append({
                        "ticker": ticker,
                        "date": date_idx.date(),
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": int(row["Volume"]),
                        "adj_close": float(row["Close"]),
                    })
                logger.info(f"Successfully scraped {len(records)} price rows from yfinance for {ticker}")
            else:
                logger.warning(f"No price data returned from yfinance for {ticker}. Using Mock Generator.")
                records = generate_mock_price_history(ticker, days)
                
        except Exception as e:
            logger.warning(f"yfinance price ingestion failed for {ticker}: {e}. Falling back to Mock Generator.")
            records = generate_mock_price_history(ticker, days)
    else:
        logger.info(f"Mocking price history for {ticker}...")
        records = generate_mock_price_history(ticker, days)

    # Database Upsert
    try:
        # Cross-dialect Upsert (handles SQLite/PostgreSQL seamlessly)
        for r in records:
            q = select(PriceData).where(
                PriceData.ticker == ticker,
                PriceData.date == r["date"]
            )
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            
            if existing:
                existing.open = r["open"]
                existing.high = r["high"]
                existing.low = r["low"]
                existing.close = r["close"]
                existing.volume = r["volume"]
                existing.adj_close = r["adj_close"]
            else:
                new_price = PriceData(**r)
                db.add(new_price)
                
        await db.commit()
        logger.info(f"Saved price history data for {ticker} to database.")
    except Exception as e:
        logger.error(f"Failed writing price data to database for {ticker}: {e}")
        await db.rollback()

async def ingest_fundamentals(db: AsyncSession, ticker: str, force_mock: bool = False):
    """
    Fetch company financial parameters and valuation snapshots.
    """
    record = None
    period_str = datetime.now().strftime("%Y-Q1")  # generic tracker period
    
    if not force_mock:
        try:
            yf_symbol = _yfinance_symbol(ticker)
            logger.info(f"Downloading yfinance fundamentals info for {ticker} using symbol {yf_symbol}...")
            loop = asyncio.get_event_loop()
            
            # yfinance info is synchronous, run in executor
            ticker_obj = yf.Ticker(yf_symbol)
            info = await loop.run_in_executor(None, lambda: ticker_obj.info)
            
            if info and isinstance(info, dict) and "trailingPE" in info:
                record = {
                    "pe_ratio": info.get("trailingPE"),
                    "pb_ratio": info.get("priceToBook"),
                    "ps_ratio": info.get("priceToSalesTrailing12Months"),
                    "eps": info.get("trailingEps"),
                    "revenue": info.get("totalRevenue"),
                    "net_income": info.get("netIncomeToCommon"),
                    "debt_to_equity": info.get("debtToEquity"),
                    "free_cash_flow": info.get("freeCashflow"),
                    "roe": info.get("returnOnEquity"),
                    "profit_margin": info.get("profitMargins"),
                }
                logger.info(f"Successfully scraped fundamental snapshot from yfinance for {ticker}")
            else:
                logger.warning(f"Empty fundamentals returned from yfinance for {ticker}. Using Mock Generator.")
                record = generate_mock_fundamentals(ticker)
                
        except Exception as e:
            logger.warning(f"yfinance fundamentals scraping failed for {ticker}: {e}. Falling back to Mock Generator.")
            record = generate_mock_fundamentals(ticker)
    else:
        logger.info(f"Mocking fundamental snapshot for {ticker}...")
        record = generate_mock_fundamentals(ticker)

    try:
        q = select(Fundamental).where(
            Fundamental.ticker == ticker,
            Fundamental.period == period_str
        )
        res = await db.execute(q)
        existing = res.scalar_one_or_none()
        
        # Clean null values to standard default zero or float
        cleaned_record = {k: (float(v) if v is not None else None) for k, v in record.items()}
        
        if existing:
            for k, v in cleaned_record.items():
                setattr(existing, k, v)
        else:
            new_fund = Fundamental(
                ticker=ticker,
                period=period_str,
                **cleaned_record
            )
            db.add(new_fund)
            
        await db.commit()
        logger.info(f"Saved fundamental snapshot for {ticker} to database.")
    except Exception as e:
        logger.error(f"Failed writing fundamentals to database for {ticker}: {e}")
        await db.rollback()

async def ingest_all_market_data(db: AsyncSession, force_mock: bool = False):
    """Loops and executes data fetchers polite with delays."""
    for ticker in TRACKED_TICKERS:
        # Seed the master Stock list if ticker is not present
        q_stock = select(Stock).where(Stock.ticker == ticker)
        res = await db.execute(q_stock)
        existing_stock = res.scalar_one_or_none()
        
        if not existing_stock:
            # Try to fetch real metadata from yfinance
            fallback_metadata = FALLBACK_STOCK_METADATA.get(ticker, {})
            company_name = fallback_metadata.get("company_name", ticker)
            sector = fallback_metadata.get("sector", "Unknown")
            industry = fallback_metadata.get("industry", "Unknown")
            market_cap = fallback_metadata.get("market_cap")

            if not force_mock:
                try:
                    yf_symbol = _yfinance_symbol(ticker)
                    ticker_obj = yf.Ticker(yf_symbol)
                    info = await asyncio.get_event_loop().run_in_executor(None, lambda: ticker_obj.info)
                    if info and isinstance(info, dict):
                        company_name = info.get("longName") or info.get("shortName") or company_name
                        sector = info.get("sector") or info.get("quoteType") or sector
                        industry = info.get("industry") or industry
                        market_cap = info.get("marketCap") or market_cap
                        logger.info(f"Fetched live metadata for {ticker}: {company_name} | {sector} | {industry}")
                except Exception as e:
                    logger.warning(f"yfinance metadata fetch failed for {ticker}: {e}. Using fallback metadata.")
            
            new_stock = Stock(
                ticker=ticker,
                company_name=company_name,
                sector=sector,
                industry=industry,
                market_cap=market_cap,
                is_active=True
            )
            db.add(new_stock)
            await db.commit()
            
        await ingest_price_data(db, ticker, days=90, force_mock=force_mock)
        await ingest_fundamentals(db, ticker, force_mock=force_mock)
        await asyncio.sleep(0.5)  # polite throttle delay
