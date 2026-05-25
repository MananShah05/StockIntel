from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.db_models import DailyScore, Stock
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Sentiment"])

@router.get("/{ticker}/trend")
async def get_sentiment_trend(ticker: str, days: int = Query(30, le=90), db: AsyncSession = Depends(get_db)):
    """
    Returns daily aggregated sentiment scores for the requested stock.
    Used to plot sentiment momentum charts on the frontend.
    """
    ticker_upper = ticker.upper()
    
    # Verify stock
    q_stock = select(Stock).where(Stock.ticker == ticker_upper)
    res_stock = await db.execute(q_stock)
    stock = res_stock.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Stock {ticker_upper} is not monitored.")
        
    try:
        start_date = date.today() - timedelta(days=days)
        q = select(DailyScore).where(
            DailyScore.ticker == ticker_upper,
            DailyScore.date >= start_date
        ).order_by(DailyScore.date.asc())
        
        res = await db.execute(q)
        scores = res.scalars().all()
        
        output = []
        for s in scores:
            output.append({
                "date": s.date.strftime("%Y-%m-%d"),
                "sentiment_score": float(s.sentiment_score or 0.50),
                "technical_score": float(s.technical_score or 0.50),
                "final_score": float(s.final_score or 0.50),
            })
            
        if not output:
            # Fallback to returning a single baseline point for today if empty
            output = [{
                "date": date.today().strftime("%Y-%m-%d"),
                "sentiment_score": 0.50,
                "technical_score": 0.50,
                "final_score": 0.50
            }]
            
        return output
    except Exception as e:
        logger.error(f"Failed fetching sentiment trend for {ticker_upper}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching sentiment trends.")
        
# Ensure datetime is imported
from datetime import date
