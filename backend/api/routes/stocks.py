from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.db_models import Stock, PriceData, DailyScore, TechnicalIndicator, Fundamental
from ingestion.pipeline import run_single_stock_pipeline
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(tags=["Stocks"])

@router.get("/")
async def list_stocks(db: AsyncSession = Depends(get_db)):
    """Returns a list of all tracked stocks with latest closing price and percentage change."""
    try:
        # Fetch active stocks
        q_stocks = select(Stock).where(Stock.is_active == True)
        res_stocks = await db.execute(q_stocks)
        stocks = res_stocks.scalars().all()
        
        output = []
        for stock in stocks:
            # Query the 2 most recent price points to compute daily price percentage shift
            q_prices = select(PriceData).where(
                PriceData.ticker == stock.ticker
            ).order_by(PriceData.date.desc()).limit(2)
            
            res_prices = await db.execute(q_prices)
            prices = res_prices.scalars().all()
            
            latest_price = 0.0
            price_change = 0.0
            price_change_pct = 0.0
            
            if len(prices) >= 1:
                latest_price = float(prices[0].close or 0)
                
            if len(prices) >= 2:
                prev_price = float(prices[1].close or 0)
                if prev_price > 0:
                    price_change = latest_price - prev_price
                    price_change_pct = (price_change / prev_price) * 100.0
                    
            # Get latest decision label
            q_score = select(DailyScore).where(
                DailyScore.ticker == stock.ticker
            ).order_by(DailyScore.date.desc()).limit(1)
            res_score = await db.execute(q_score)
            score_obj = res_score.scalar_one_or_none()
            
            output.append({
                "ticker": stock.ticker,
                "company_name": stock.company_name,
                "sector": stock.sector,
                "industry": stock.industry,
                "market_cap": stock.market_cap,
                "current_price": latest_price,
                "price_change_1d": round(price_change, 2),
                "price_change_pct_1d": round(price_change_pct, 2),
                "decision_label": score_obj.decision_label if score_obj else "Mixed Signals",
                "final_score": float(score_obj.final_score) if score_obj else 0.50,
            })
            
        return output
    except Exception as e:
        logger.error(f"Failed listing stocks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{ticker}")
async def get_stock(ticker: str, db: AsyncSession = Depends(get_db)):
    """Returns static information and sector context for a specific stock ticker."""
    ticker_upper = ticker.upper()
    q = select(Stock).where(Stock.ticker == ticker_upper)
    res = await db.execute(q)
    stock = res.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker_upper} is not currently monitored.")
        
    return {
        "ticker": stock.ticker,
        "company_name": stock.company_name,
        "sector": stock.sector,
        "industry": stock.industry,
        "market_cap": stock.market_cap,
        "is_active": stock.is_active
    }

@router.post("/{ticker}/refresh")
async def trigger_refresh(ticker: str, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    """Triggers background data re-ingestion, technical indicator calculations, and re-scoring."""
    ticker_upper = ticker.upper()
    q = select(Stock).where(Stock.ticker == ticker_upper)
    res = await db.execute(q)
    stock = res.scalar_one_or_none()
    
    if not stock:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker_upper} is not monitored.")
        
    async def run_refresh_job():
        # Get settings to check if mock is active
        # Run individual stock pipelines in the background
        async with db.begin_nested() if db.in_transaction() else db:
            pass # clear transaction states
        try:
            await run_single_stock_pipeline(db, stock.ticker, force_mock=settings.mock_mode)
        except Exception as err:
            logger.error(f"Manual background refresh failed for {stock.ticker}: {err}")
            
    background_tasks.add_task(run_refresh_job)
    return {"message": f"Manual scoring evaluation and crawling refresh triggered for {ticker_upper} in background."}

@router.get("/{ticker}/quote")
async def get_quote(ticker: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    ticker_upper = ticker.upper()
    result = await db.execute(
        text("""
        SELECT
            p.close as ltp,
            p.close - LAG(p.close) OVER (PARTITION BY p.ticker ORDER BY p.date) as change,
            p.open, p.high as day_high, p.low as day_low,
            p.volume,
            t.rsi_14, t.macd, t.macd_signal, t.macd_hist,
            t.bb_upper, t.bb_mid, t.bb_lower,
            t.ma_20, t.ma_50, t.ma_200,
            t.volume_ma_20,
            f.pe_ratio, f.eps, f.roe, f.debt_to_equity
        FROM price_data p
        LEFT JOIN technical_indicators t ON t.ticker = p.ticker AND t.date = p.date
        LEFT JOIN fundamentals f ON f.ticker = p.ticker
        WHERE p.ticker = :ticker
        ORDER BY p.date DESC
        LIMIT 1
        """),
        {"ticker": ticker_upper}
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Quote data not found")
        
    stock_q = await db.execute(select(Stock).where(Stock.ticker == ticker_upper))
    stock = stock_q.scalar_one_or_none()
    
    # Mocking missing fields for quote
    change = float(row.change or 0)
    ltp = float(row.ltp or 0)
    prev_close = ltp - change
    
    vol = float(row.volume or 0)
    vol_ma = float(row.volume_ma_20 or 1)
    
    return {
        "ticker": ticker_upper,
        "company_name": stock.company_name if stock else ticker_upper,
        "exchange": "NSE",  # default mock
        "ltp": ltp,
        "change": change,
        "change_pct": (change / prev_close * 100) if prev_close != 0 else 0,
        "open": float(row.open or 0),
        "prev_close": prev_close,
        "atp": ltp, # mock
        "day_high": float(row.day_high or ltp),
        "day_low": float(row.day_low or ltp),
        "week52_high": ltp * 1.2, # mock
        "week52_low": ltp * 0.8, # mock
        "week52_position_pct": 50.0, # mock
        "volume": int(vol),
        "avg_volume_20d": int(vol_ma),
        "volume_ratio": float(vol / vol_ma) if vol_ma else 1.0,
        "turnover": ltp * vol,
        "market_cap": stock.market_cap if stock else 0,
        "bid_price": ltp * 0.999,
        "bid_qty": 100,
        "bid_orders": 5,
        "ask_price": ltp * 1.001,
        "ask_qty": 100,
        "ask_orders": 5,
        "depth": [
            {"bid_orders": 5, "bid_qty": 100, "bid_price": ltp * 0.999, "ask_price": ltp * 1.001, "ask_qty": 120, "ask_orders": 4},
            {"bid_orders": 2, "bid_qty": 50, "bid_price": ltp * 0.998, "ask_price": ltp * 1.002, "ask_qty": 80, "ask_orders": 2},
            {"bid_orders": 10, "bid_qty": 500, "bid_price": ltp * 0.997, "ask_price": ltp * 1.003, "ask_qty": 300, "ask_orders": 6},
            {"bid_orders": 1, "bid_qty": 10, "bid_price": ltp * 0.996, "ask_price": ltp * 1.004, "ask_qty": 50, "ask_orders": 1},
            {"bid_orders": 4, "bid_qty": 200, "bid_price": ltp * 0.995, "ask_price": ltp * 1.005, "ask_qty": 150, "ask_orders": 3},
        ],
        "ltt": "15:30:00"
    }

@router.get("/{ticker}/history")
async def get_price_history(ticker: str, period: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    ticker_upper = ticker.upper()
    days_map = {"1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365}
    days = days_map.get(period, 30)
    # Since sqlite doesn't support INTERVAL easily in raw text without conditionals, we can use Python dates or just a simple filter if needed
    # For cross-compatibility, it's better to fetch via SQLAlchemy core.
    import datetime
    cutoff_date = datetime.date.today() - datetime.timedelta(days=days)
    
    q = select(PriceData).where(
        PriceData.ticker == ticker_upper,
        PriceData.date >= cutoff_date
    ).order_by(PriceData.date.asc())
    
    res = await db.execute(q)
    rows = res.scalars().all()
    
    # If period == "1D" we just mock some intraday data based on the latest date to satisfy the frontend requirement
    if period == "1D" and len(rows) > 0:
        last_row = rows[-1]
        base_price = float(last_row.open or last_row.close or 0)
        import random
        intraday = []
        for i in range(20):
            time_str = f"{9 + i//4:02d}:{(i%4)*15:02d}"
            p = base_price * (1 + random.uniform(-0.01, 0.01))
            intraday.append({
                "datetime": time_str,
                "open": p,
                "high": p * 1.005,
                "low": p * 0.995,
                "close": p,
                "volume": int(float(last_row.volume or 1000) / 20)
            })
        return intraday

    return [{
        "datetime": r.date.isoformat(),
        "open": float(r.open or 0),
        "high": float(r.high or 0),
        "low": float(r.low or 0),
        "close": float(r.close or 0),
        "volume": int(r.volume or 0)
    } for r in rows]

@router.get("/{ticker}/technicals")
async def get_technicals(ticker: str, db: AsyncSession = Depends(get_db)):
    from scoring.technical_scorer import compute_signal_flags
    ticker_upper = ticker.upper()
    
    q = select(TechnicalIndicator).where(TechnicalIndicator.ticker == ticker_upper).order_by(TechnicalIndicator.date.desc()).limit(1)
    res = await db.execute(q)
    ti = res.scalar_one_or_none()
    
    if not ti:
        raise HTTPException(status_code=404, detail="Technical indicators not found")
        
    # We also need 'close' for bb_position computation
    pq = select(PriceData).where(PriceData.ticker == ticker_upper, PriceData.date == ti.date).limit(1)
    pres = await db.execute(pq)
    pd_row = pres.scalar_one_or_none()
    
    row_dict = {
        "rsi_14": float(ti.rsi_14 or 0),
        "macd": float(ti.macd or 0),
        "macd_signal": float(ti.macd_signal or 0),
        "macd_hist": float(ti.macd_hist or 0),
        "bb_upper": float(ti.bb_upper or 0),
        "bb_mid": float(ti.bb_mid or 0),
        "bb_lower": float(ti.bb_lower or 0),
        "ma_20": float(ti.ma_20 or 0),
        "ma_50": float(ti.ma_50 or 0),
        "ma_200": float(ti.ma_200 or 0),
        "volume_ma_20": int(ti.volume_ma_20 or 0),
        "atr_14": float(ti.atr_14 or 0),
        "close": float(pd_row.close or 0) if pd_row else 0,
        "volume": int(pd_row.volume or 0) if pd_row else 0
    }
    
    flags = compute_signal_flags(row_dict)
    
    return {**row_dict, **flags}

@router.get("/{ticker}/technicals/history")
async def get_technicals_history(ticker: str, days: int, db: AsyncSession = Depends(get_db)):
    ticker_upper = ticker.upper()
    import datetime
    cutoff = datetime.date.today() - datetime.timedelta(days=days)
    
    q = select(TechnicalIndicator).where(TechnicalIndicator.ticker == ticker_upper, TechnicalIndicator.date >= cutoff).order_by(TechnicalIndicator.date.asc())
    res = await db.execute(q)
    rows = res.scalars().all()
    
    pq = select(PriceData).where(PriceData.ticker == ticker_upper, PriceData.date >= cutoff).order_by(PriceData.date.asc())
    pres = await db.execute(pq)
    price_rows = {p.date: p for p in pres.scalars().all()}
    
    out = []
    for r in rows:
        p = price_rows.get(r.date)
        out.append({
            "date": r.date.isoformat(),
            "rsi_14": float(r.rsi_14 or 0),
            "macd": float(r.macd or 0),
            "macd_signal": float(r.macd_signal or 0),
            "macd_hist": float(r.macd_hist or 0),
            "bb_upper": float(r.bb_upper or 0),
            "bb_mid": float(r.bb_mid or 0),
            "bb_lower": float(r.bb_lower or 0),
            "ma_20": float(r.ma_20 or 0),
            "ma_50": float(r.ma_50 or 0),
            "ma_200": float(r.ma_200 or 0),
            "close": float(p.close or 0) if p else 0,
            "volume": int(p.volume or 0) if p else 0
        })
    return out

@router.get("/{ticker}/fundamentals")
async def get_fundamentals(ticker: str, db: AsyncSession = Depends(get_db)):
    ticker_upper = ticker.upper()
    
    q = select(Fundamental).where(Fundamental.ticker == ticker_upper).order_by(Fundamental.id.desc()).limit(1)
    res = await db.execute(q)
    f = res.scalar_one_or_none()
    
    if not f:
        raise HTTPException(status_code=404, detail="Fundamentals not found")
        
    return {
        "pe_ratio": float(f.pe_ratio or 0),
        "pb_ratio": float(f.pb_ratio or 0),
        "ps_ratio": float(f.ps_ratio or 0),
        "eps": float(f.eps or 0),
        "revenue": int(f.revenue or 0),
        "net_income": int(f.net_income or 0),
        "debt_to_equity": float(f.debt_to_equity or 0),
        "free_cash_flow": int(f.free_cash_flow or 0),
        "roe": float(f.roe or 0),
        "profit_margin": float(f.profit_margin or 0),
        "dividend_yield": 1.5, # mock since it's not in DB
        "sector_pe": 20.0,     # mock
        "sector_pb": 3.0,      # mock
        "eps_growth_yoy": 10.0 # mock
    }
