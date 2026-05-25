import httpx
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import NewsArticle, ArticleSentiment
from core.config import get_settings
from processing.nlp_sentiment import analyze_sentiment
import logging
import random

logger = logging.getLogger(__name__)
settings = get_settings()

SOURCE_WEIGHTS = {
    "Reuters": 0.90,
    "Bloomberg": 0.90,
    "The Wall Street Journal": 0.88,
    "Financial Times": 0.88,
    "CNBC": 0.80,
    "MarketWatch": 0.78,
    "Barron's": 0.80,
    "Investopedia": 0.70,
    "Yahoo Finance": 0.72,
    "Seeking Alpha": 0.60,
    "default": 0.50,
}

MOCK_HEADLINES = {
    "AAPL": [
        ("Apple launches advanced AI features in new iOS update", "positive"),
        ("Apple supplier shipments slow down, prompting iPhone sales concern", "negative"),
        ("Wall Street bullish on Apple's services revenue expansion plan", "positive"),
        ("EU antitrust commission levels multi-million dollar fine against Apple", "negative"),
        ("Apple shares hit new record high amid strong quarterly earnings guide", "positive"),
    ],
    "NVDA": [
        ("NVIDIA unveils next-generation Blackwell AI chip architecture", "positive"),
        ("Competitors expand open-source alternatives, posing risk to NVIDIA's AI monopoly", "negative"),
        ("NVIDIA posts blockbuster revenue beat, guidance exceeds top analyst estimates", "positive"),
        ("US trade curbs on chip shipments spark demand concerns for NVIDIA", "negative"),
        ("Analysts upgrade NVIDIA as capital spending on AI infrastructure accelerates", "positive"),
    ],
    "TSLA": [
        ("Tesla rolls out updated Full Self-Driving software beta package", "positive"),
        ("Tesla recalls thousands of vehicles over software security concern", "negative"),
        ("Tesla expanding Gigafactory construction to boost Model Y production capacity", "positive"),
        ("Concerns mount over profit margins as EV price competition intensifies", "negative"),
        ("Tesla quarterly delivery figures exceed analysts' worst fears, stock rallies", "positive"),
    ],
    "default": [
        ("Shares gain momentum as market indices hit all-time highs", "positive"),
        ("Analysts warn of inflation headwinds impacting quarterly growth outlook", "negative"),
        ("Strategic merger highlights sector consolidation momentum", "positive"),
        ("Regulatory guidelines introduce compliance costs for tech industry", "negative"),
        ("Quarterly profit beats expectations, driving dividends higher", "positive"),
    ]
}

def generate_mock_news(ticker: str) -> list[dict]:
    """Generates ticker-specific mock news articles with varied sources and timestamps."""
    headlines = MOCK_HEADLINES.get(ticker, MOCK_HEADLINES["default"])
    sources = list(SOURCE_WEIGHTS.keys())[:-1] # omit 'default'
    records = []
    
    # Generate 4-6 articles scattered across the last 3 days
    count = random.randint(4, 6)
    selected_indices = random.sample(range(len(headlines)), min(count, len(headlines)))
    
    for idx in selected_indices:
        headline, sentiment = headlines[idx]
        source = random.choice(sources)
        hours_ago = random.randint(2, 72)
        pub_date = datetime.utcnow() - timedelta(hours=hours_ago)
        
        # Add slight variance to mock sentiment scores
        score_base = 0.65 if sentiment == "positive" else -0.65
        score = score_base + random.normalvariate(0, 0.12)
        score = max(-1.0, min(1.0, score))
        
        records.append({
            "ticker": ticker,
            "source_name": source,
            "source_type": "newsapi",
            "title": headline,
            "content": f"A comprehensive coverage from {source} examining how {headline.lower()} impacts market momentum for {ticker}.",
            "url": f"https://finance.yahoo.com/quote/{ticker}",
            "published_at": pub_date,
            "trust_weight": float(SOURCE_WEIGHTS.get(source, 0.50)),
            "sentiment_label": "positive" if score > 0 else "negative",
            "sentiment_score": float(score),
            "confidence": 0.85
        })
        
    return records

async def ingest_news(db: AsyncSession, ticker: str, company_name: str, force_mock: bool = False):
    """
    Fetch news from NewsAPI or fallback to dynamic mock data generator.
    Processes sentiment immediately and saves articles to the database.
    """
    articles_data = []
    
    # Determine whether we should use mock data
    use_mock = force_mock or not settings.news_api_key
    
    if not use_mock:
        query = f'"{ticker}" OR "{company_name}" stock'
        from_date = (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d")
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "from": from_date,
            "sortBy": "relevancy",
            "language": "en",
            "pageSize": 12,
            "apiKey": settings.news_api_key,
        }
        
        try:
            logger.info(f"Ingesting live financial news via NewsAPI for {ticker}...")
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    articles = data.get("articles", [])
                    
                    # Convert to db items
                    for art in articles:
                        if not art.get("title") or "[Removed]" in art.get("title", ""):
                            continue
                        source = art.get("source", {}).get("name", "Unknown")
                        weight = float(SOURCE_WEIGHTS.get(source, SOURCE_WEIGHTS["default"]))
                        
                        # Process sentiment
                        title_text = art.get("title", "")
                        content_text = art.get("description", "") or art.get("content", "")
                        combined_text = f"{title_text}. {content_text}"
                        
                        # Calculate sentiment using our dual sentiment engine
                        sent = analyze_sentiment([combined_text], use_finbert=not settings.sentiment_fallback)[0]
                        
                        pub_at_str = art.get("publishedAt", "")
                        try:
                            pub_at = datetime.fromisoformat(pub_at_str.replace("Z", "+00:00"))
                        except ValueError:
                            pub_at = datetime.utcnow()
                            
                        articles_data.append({
                            "ticker": ticker,
                            "source_name": source,
                            "source_type": "newsapi",
                            "title": title_text,
                            "content": content_text,
                            "url": art.get("url", ""),
                            "published_at": pub_at,
                            "trust_weight": weight,
                            "sentiment_label": sent["label"],
                            "sentiment_score": sent["weighted_score"],
                            "confidence": sent["score"]
                        })
                    logger.info(f"Retrieved {len(articles_data)} articles from NewsAPI for {ticker}")
                else:
                    logger.warning(f"NewsAPI query returned status {resp.status_code}. Defaulting to news generator.")
                    articles_data = generate_mock_news(ticker)
        except Exception as e:
            logger.error(f"NewsAPI ingestion failed for {ticker}: {e}. Defaulting to news generator.")
            articles_data = generate_mock_news(ticker)
    else:
        logger.info(f"Smart Mock Mode active. Simulating news feed for {ticker}...")
        articles_data = generate_mock_news(ticker)

    # Save to database
    try:
        saved_count = 0
        for art in articles_data:
            # Avoid duplicate articles based on exact title match in database
            q = select(NewsArticle).where(
                NewsArticle.ticker == ticker,
                NewsArticle.title == art["title"]
            )
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            
            if not existing:
                new_art = NewsArticle(
                    ticker=ticker,
                    source_name=art["source_name"],
                    source_type=art["source_type"],
                    title=art["title"],
                    content=art["content"],
                    url=art["url"],
                    published_at=art["published_at"],
                    trust_weight=art["trust_weight"]
                )
                db.add(new_art)
                await db.flush()  # flush to generate article id for sentiment linkage
                
                new_sent = ArticleSentiment(
                    article_id=new_art.id,
                    sentiment_label=art["sentiment_label"],
                    sentiment_score=art["sentiment_score"],
                    confidence=art["confidence"],
                    model_used="lexicon" if settings.sentiment_fallback else "finbert"
                )
                db.add(new_sent)
                saved_count += 1
                
        await db.commit()
        logger.info(f"Upserted {saved_count} new news articles + sentiment profiles for {ticker}")
    except Exception as e:
        logger.error(f"Failed to write news articles to database: {e}")
        await db.rollback()
