from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.db_models import Stock, PriceData, TechnicalIndicator, Fundamental, NewsArticle, ArticleSentiment, DailyScore, MacroData
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Scores"])

@router.get("/{ticker}/latest")
async def get_latest_score_dashboard(ticker: str, db: AsyncSession = Depends(get_db)):
    """
    Returns the comprehensive aggregated dataset for a stock dashboard.
    Combines price lists, technical snapshots, balance sheet ratios, filings, and explains.
    """
    ticker_upper = ticker.upper()
    
    # 1. Verify Stock
    q_stock = select(Stock).where(Stock.ticker == ticker_upper)
    res_stock = await db.execute(q_stock)
    stock = res_stock.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {ticker_upper} is not currently monitored.")
        
    # 2. Get latest DailyScore
    q_score = select(DailyScore).where(
        DailyScore.ticker == ticker_upper
    ).order_by(DailyScore.date.desc()).limit(1)
    res_score = await db.execute(q_score)
    score = res_score.scalar_one_or_none()
    
    if not score:
        # Stock exists but hasn't been evaluated. This shouldn't occur normally but we'll provide a default baseline bundle.
        raise HTTPException(status_code=422, detail=f"Stock {ticker_upper} has not been scored yet. Trigger a refresh or seed data.")
        
    # 3. Get Price History (last 90 days)
    q_prices = select(PriceData).where(
        PriceData.ticker == ticker_upper
    ).order_by(PriceData.date.asc())
    res_prices = await db.execute(q_prices)
    prices = res_prices.scalars().all()
    
    price_history = [
        {"date": p.date.strftime("%Y-%m-%d"), "close": float(p.close or 0), "volume": p.volume}
        for p in prices
    ]
    
    # Get current price details
    current_price = 0.0
    price_change = 0.0
    price_change_pct = 0.0
    
    if len(prices) >= 1:
        current_price = float(prices[-1].close or 0)
    if len(prices) >= 2:
        prev_close = float(prices[-2].close or 0)
        if prev_close > 0:
            price_change = current_price - prev_close
            price_change_pct = (price_change / prev_close) * 100.0

    # 4. Get latest Technical Indicators
    q_tech = select(TechnicalIndicator).where(
        TechnicalIndicator.ticker == ticker_upper
    ).order_by(TechnicalIndicator.date.desc()).limit(1)
    res_tech = await db.execute(q_tech)
    tech = res_tech.scalar_one_or_none()
    
    technicals_dict = {}
    if tech:
        technicals_dict = {
            "date": tech.date.strftime("%Y-%m-%d"),
            "rsi_14": float(tech.rsi_14) if tech.rsi_14 is not None else None,
            "macd": float(tech.macd) if tech.macd is not None else None,
            "macd_signal": float(tech.macd_signal) if tech.macd_signal is not None else None,
            "bb_upper": float(tech.bb_upper) if tech.bb_upper is not None else None,
            "bb_lower": float(tech.bb_lower) if tech.bb_lower is not None else None,
            "bb_mid": float(tech.bb_mid) if tech.bb_mid is not None else None,
            "ma_20": float(tech.ma_20) if tech.ma_20 is not None else None,
            "ma_50": float(tech.ma_50) if tech.ma_50 is not None else None,
            "ma_200": float(tech.ma_200) if tech.ma_200 is not None else None,
        }

    # 5. Get Fundamentals Snapshot
    q_fund = select(Fundamental).where(
        Fundamental.ticker == ticker_upper
    ).order_by(Fundamental.id.desc()).limit(1)
    res_fund = await db.execute(q_fund)
    fund = res_fund.scalar_one_or_none()
    
    fundamentals_dict = {}
    if fund:
        fundamentals_dict = {
            "pe_ratio": float(fund.pe_ratio) if fund.pe_ratio is not None else None,
            "pb_ratio": float(fund.pb_ratio) if fund.pb_ratio is not None else None,
            "eps": float(fund.eps) if fund.eps is not None else None,
            "revenue": fund.revenue,
            "net_income": fund.net_income,
            "debt_to_equity": float(fund.debt_to_equity) if fund.debt_to_equity is not None else None,
            "free_cash_flow": fund.free_cash_flow,
            "roe": float(fund.roe) if fund.roe is not None else None,
            "profit_margin": float(fund.profit_margin) if fund.profit_margin is not None else None,
        }

    # 6. Get News Articles (last 15) with Sentiment
    q_news = select(NewsArticle).where(
        NewsArticle.ticker == ticker_upper
    ).order_by(NewsArticle.published_at.desc()).limit(15)
    res_news = await db.execute(q_news)
    news_objs = res_news.scalars().all()
    
    news_list = []
    for n in news_objs:
        q_sent = select(ArticleSentiment).where(ArticleSentiment.article_id == n.id)
        res_sent = await db.execute(q_sent)
        sent = res_sent.scalar_one_or_none()
        
        news_list.append({
            "id": n.id,
            "title": n.title,
            "source_name": n.source_name,
            "source_type": n.source_type,
            "url": n.url,
            "published_at": n.published_at.strftime("%Y-%m-%d %H:%M:%S"),
            "trust_weight": float(n.trust_weight) if n.trust_weight is not None else 0.50,
            "sentiment_label": sent.sentiment_label if sent else "neutral",
            "sentiment_score": float(sent.sentiment_score) if sent else 0.0,
        })
        
    # 7. Sentiment History (last 15 days for sentiment trends)
    q_scores_hist = select(DailyScore).where(
        DailyScore.ticker == ticker_upper
    ).order_by(DailyScore.date.asc()).limit(15)
    res_hist = await db.execute(q_scores_hist)
    scores_hist = res_hist.scalars().all()
    
    sentiment_history = [
        {"date": sh.date.strftime("%Y-%m-%d"), "score": float(sh.sentiment_score or 0.50)}
        for sh in scores_hist
    ]
    if not sentiment_history:
        sentiment_history = [{"date": score.date.strftime("%Y-%m-%d"), "score": float(score.sentiment_score or 0.50)}]

    # Ensure factors lists conform to correct array schemas
    pos_factors = score.positive_factors.get("factors", []) if score.positive_factors else []
    neg_factors = score.negative_factors.get("factors", []) if score.negative_factors else []
    changed_today = score.what_changed.get("changes", []) if score.what_changed else []
    
    # 8. Reassemble score metadata object
    score_data = {
        "ticker": score.ticker,
        "date": score.date.strftime("%Y-%m-%d"),
        "decision_label": score.decision_label,
        "confidence_score": float(score.confidence_score or 0.50),
        "confidence_tier": "High Confidence" if (score.confidence_score or 0.50) >= 0.78 else "Moderate Confidence" if (score.confidence_score or 0.50) >= 0.55 else "Low Confidence",
        "final_score": float(score.final_score or 0.50),
        "sentiment_score": float(score.sentiment_score or 0.50),
        "technical_score": float(score.technical_score or 0.50),
        "fundamental_score": float(score.fundamental_score or 0.50),
        "event_score": float(score.event_score or 0.50),
        "risk_score": float(score.risk_score or 0.20),
        "regime_score": float(score.regime_score or 0.50),
        "thesis_summary": score.thesis_summary,
        "positive_factors": pos_factors,
        "negative_factors": neg_factors,
        "what_changed": changed_today,
        "time_horizon": score.time_horizon or "Medium Term",
        "source_summary": score.source_summary or {},
    }
    
    return {
        "ticker": stock.ticker,
        "company_name": stock.company_name,
        "sector": stock.sector,
        "current_price": round(current_price, 2),
        "price_change_1d": round(price_change, 2),
        "price_change_pct_1d": round(price_change_pct, 2),
        "score": score_data,
        "price_history": price_history,
        "news": news_list,
        "technicals": technicals_dict,
        "fundamentals": fundamentals_dict,
        "sentiment_history": sentiment_history
    }

@router.get("/{ticker}/history")
async def get_score_history(ticker: str, days: int = 30, db: AsyncSession = Depends(get_db)):
    """Returns a time series of historical scoring decisions, tracking label evolution."""
    ticker_upper = ticker.upper()
    
    q_stock = select(Stock).where(Stock.ticker == ticker_upper)
    res_stock = await db.execute(q_stock)
    stock = res_stock.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {ticker_upper} is not monitored.")
        
    start_date = date.today() - timedelta(days=days)
    q = select(DailyScore).where(
        DailyScore.ticker == ticker_upper,
        DailyScore.date >= start_date
    ).order_by(DailyScore.date.asc())
    
    res = await db.execute(q)
    history = res.scalars().all()
    
    return [
        {
            "date": h.date.strftime("%Y-%m-%d"),
            "final_score": float(h.final_score or 0.50),
            "decision_label": h.decision_label,
            "sentiment_score": float(h.sentiment_score or 0.50),
            "technical_score": float(h.technical_score or 0.50),
            "fundamental_score": float(h.fundamental_score or 0.50),
            "risk_score": float(h.risk_score or 0.20),
        }
        for h in history
    ]
