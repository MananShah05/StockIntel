from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from models.db_models import NewsArticle, ArticleSentiment, Stock
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["News"])

@router.get("/{ticker}")
async def get_ticker_news(ticker: str, limit: int = Query(20, le=100), db: AsyncSession = Depends(get_db)):
    """
    Returns recent news articles, SEC filings, and Reddit social threads for a ticker.
    Includes trust weight levels and sentiment analysis breakdowns.
    """
    ticker_upper = ticker.upper()
    
    # Verify stock exists
    q_stock = select(Stock).where(Stock.ticker == ticker_upper)
    res_stock = await db.execute(q_stock)
    stock = res_stock.scalar_one_or_none()
    if not stock:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker_upper} is not monitored.")
        
    try:
        q_news = select(NewsArticle).where(
            NewsArticle.ticker == ticker_upper
        ).order_by(NewsArticle.published_at.desc()).limit(limit)
        
        res_news = await db.execute(q_news)
        articles = res_news.scalars().all()
        
        output = []
        for art in articles:
            # Query sentiment
            q_sent = select(ArticleSentiment).where(ArticleSentiment.article_id == art.id)
            res_sent = await db.execute(q_sent)
            sent = res_sent.scalar_one_or_none()
            
            output.append({
                "id": art.id,
                "ticker": art.ticker,
                "source_name": art.source_name,
                "source_type": art.source_type,
                "title": art.title,
                "content": art.content,
                "url": art.url,
                "published_at": art.published_at.strftime("%Y-%m-%d %H:%M:%S"),
                "trust_weight": float(art.trust_weight) if art.trust_weight is not None else 0.50,
                "sentiment_label": sent.sentiment_label if sent else "neutral",
                "sentiment_score": float(sent.sentiment_score) if sent else 0.0,
            })
            
        return output
    except Exception as e:
        logger.error(f"Failed to fetch news for {ticker_upper}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching news feed.")
