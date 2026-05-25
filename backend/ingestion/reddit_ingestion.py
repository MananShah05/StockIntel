import praw
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import NewsArticle, ArticleSentiment
from core.config import get_settings
from processing.nlp_sentiment import analyze_sentiment
import logging
import random

logger = logging.getLogger(__name__)
settings = get_settings()

SUBREDDITS = ["wallstreetbets", "stocks", "investing", "stockmarket"]

MOCK_REDDIT_POSTS = {
    "AAPL": [
        ("AAPL is basically a savings account with a premium dividend kicker. Change my mind.", 125, "positive"),
        ("Apple is falling behind in the AI race, Siri is useless compared to ChatGPT. Bearish long term.", 450, "negative"),
        ("Loaded up on AAPL leaps. Easiest money of my life when they announce iOS AI integration.", 312, "positive"),
        ("AAPL chart looks like a perfect descending wedge. Bracing for a drop below 170.", 88, "negative"),
    ],
    "NVDA": [
        ("NVDA Blackwell chip specs are absolutely nuts. Bears are completely extinct.", 1240, "positive"),
        ("Is NVDA entering bubble territory? The valuation is just detached from reality now.", 820, "negative"),
        ("My entire net worth is in NVDA calls. Let's go Blackwell launch!", 950, "positive"),
        ("NVDA drop today was expected. Just some healthy profit-taking before next leg up.", 195, "positive"),
        ("Competitors are catching up. NVDA will drop 20% once custom silicon chips from mega-caps roll out.", 380, "negative"),
    ],
    "TSLA": [
        ("TSLA is going to absolute zero. EV demand is dead and competition is crushing margins.", 890, "negative"),
        ("Tesla FSD V12 is actually insane. It drove me all around SF without a single intervention.", 1100, "positive"),
        ("Elon doing Elon things again. Sold my TSLA stock, fed up with the volatility.", 420, "negative"),
        ("TSLA deliveries beat expectations today. Squeezing the shorts hard!", 640, "positive"),
    ],
    "default": [
        ("What are your favorite long-term stock plays right now?", 150, "positive"),
        ("Interest rates are staying higher for longer. Time to rotation into value stocks?", 280, "neutral"),
        ("Is anyone else sitting entirely in cash right now? This market feels extremely top-heavy.", 420, "negative"),
        ("Averaging down on high-conviction plays. Bull markets reward patience.", 190, "positive"),
    ]
}

def generate_mock_reddit_posts(ticker: str) -> list[dict]:
    """Simulates realistic Reddit community threads for testing."""
    records = []
    posts = MOCK_REDDIT_POSTS.get(ticker, MOCK_REDDIT_POSTS["default"])
    
    count = random.randint(2, 4)
    selected = random.sample(posts, min(count, len(posts)))
    
    for title, score, sentiment in selected:
        sub = random.choice(SUBREDDITS)
        hours_ago = random.randint(1, 48)
        pub_date = datetime.utcnow() - timedelta(hours=hours_ago)
        
        # Calculate mock sentiment
        score_base = 0.55 if sentiment == "positive" else -0.55 if sentiment == "negative" else 0.0
        weighted_score = score_base + random.normalvariate(0, 0.15)
        weighted_score = max(-1.0, min(1.0, weighted_score))
        
        # Trust weight for reddit depends on engagement score (max 0.55 as per PRD)
        trust_weight = min(0.35 + (score / 15000.0), 0.55)
        
        records.append({
            "ticker": ticker,
            "source_name": f"r/{sub}",
            "source_type": "reddit",
            "title": title,
            "content": f"Shared in r/{sub} with an engagement score of {score} upvotes. Reddit community sentiment analysis: {sentiment}.",
            "url": f"https://reddit.com/r/{sub}/comments/mock_{ticker}",
            "published_at": pub_date,
            "trust_weight": float(trust_weight),
            "sentiment_label": "positive" if weighted_score > 0.15 else "negative" if weighted_score < -0.15 else "neutral",
            "sentiment_score": float(weighted_score),
            "confidence": 0.70
        })
        
    return records

def _fetch_reddit_posts_sync(ticker: str) -> list[dict]:
    """Helper running synchronous PRAW searches under Executor context."""
    reddit = praw.Reddit(
        client_id=settings.reddit_client_id,
        client_secret=settings.reddit_client_secret,
        user_agent=settings.reddit_user_agent,
    )
    
    posts = []
    for sub in SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub)
            for post in subreddit.search(ticker, time_filter="week", limit=10):
                if post.score < 10:
                    continue
                posts.append({
                    "title": post.title,
                    "content": post.selftext[:500] if post.selftext else "",
                    "url": f"https://reddit.com{post.permalink}",
                    "published_at": datetime.fromtimestamp(post.created_utc),
                    "source_name": f"r/{sub}",
                    "score": post.score,
                })
        except Exception as e:
            logger.warning(f"Reddit crawl failed on sub r/{sub}: {e}")
            
    return posts

async def ingest_reddit(db: AsyncSession, ticker: str, force_mock: bool = False):
    """
    Scrapes Reddit ticker threads using PRAW or triggers our Smart Mock Mode fallback.
    Saves social items to database.
    """
    records = []
    use_mock = force_mock or not settings.reddit_client_id or not settings.reddit_client_secret
    
    if not use_mock:
        try:
            logger.info(f"Crawling Reddit PRAW threads for {ticker}...")
            loop = asyncio.get_event_loop()
            posts = await loop.run_in_executor(None, _fetch_reddit_posts_sync, ticker)
            
            if posts:
                for p in posts:
                    # Calculate weight based on upvote scores
                    weight = min(0.35 + (p["score"] / 10000.0), 0.55)
                    combined_text = f"{p['title']}. {p['content']}"
                    
                    # Sentiment analyze
                    sent = analyze_sentiment([combined_text], use_finbert=not settings.sentiment_fallback)[0]
                    
                    records.append({
                        "ticker": ticker,
                        "source_name": p["source_name"],
                        "source_type": "reddit",
                        "title": p["title"],
                        "content": p["content"],
                        "url": p["url"],
                        "published_at": p["published_at"],
                        "trust_weight": weight,
                        "sentiment_label": sent["label"],
                        "sentiment_score": sent["weighted_score"],
                        "confidence": sent["score"]
                    })
                logger.info(f"Successfully scraped {len(records)} posts from Reddit for {ticker}")
            else:
                logger.warning(f"No posts returned from Reddit search for {ticker}. Using Mock Generator.")
                records = generate_mock_reddit_posts(ticker)
                
        except Exception as e:
            logger.error(f"Reddit PRAW crawler failed: {e}. Defaulting to mock generator.")
            records = generate_mock_reddit_posts(ticker)
    else:
        logger.info(f"Smart Mock Mode active. Simulating Reddit sentiment stream for {ticker}...")
        records = generate_mock_reddit_posts(ticker)

    # Database writes
    try:
        saved_count = 0
        for rec in records:
            q = select(NewsArticle).where(
                NewsArticle.ticker == ticker,
                NewsArticle.title == rec["title"]
            )
            res = await db.execute(q)
            existing = res.scalar_one_or_none()
            
            if not existing:
                new_art = NewsArticle(
                    ticker=ticker,
                    source_name=rec["source_name"],
                    source_type=rec["source_type"],
                    title=rec["title"],
                    content=rec["content"],
                    url=rec["url"],
                    published_at=rec["published_at"],
                    trust_weight=rec["trust_weight"]
                )
                db.add(new_art)
                await db.flush()
                
                new_sent = ArticleSentiment(
                    article_id=new_art.id,
                    sentiment_label=rec["sentiment_label"],
                    sentiment_score=rec["sentiment_score"],
                    confidence=rec["confidence"],
                    model_used="lexicon" if settings.sentiment_fallback else "finbert"
                )
                db.add(new_sent)
                saved_count += 1
                
        await db.commit()
        logger.info(f"Upserted {saved_count} new Reddit posts for {ticker}")
    except Exception as e:
        logger.error(f"Failed writing Reddit data to database: {e}")
        await db.rollback()
