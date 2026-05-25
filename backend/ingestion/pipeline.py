from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date, datetime, timedelta
import logging
import asyncio

# Ingestion Scrapers
from ingestion.market_data import ingest_all_market_data, TRACKED_TICKERS
from ingestion.news_ingestion import ingest_news

from ingestion.reddit_ingestion import ingest_reddit
from ingestion.sec_edgar import ingest_sec_filings
from ingestion.macro_data import ingest_macro

# Computations and Scorers
from processing.technical_features import compute_technicals
from explainability.change_detector import detect_changes
from scoring.final_scorer import (
    ScoreBundle,
    compute_final_score,
    score_sentiment_layer,
    score_technical_layer,
    score_fundamental_layer,
    score_event_layer,
    score_regime_layer,
    score_risk_layer,
    score_confidence_layer
)

# Models
from models.db_models import PriceData, TechnicalIndicator, Fundamental, NewsArticle, ArticleSentiment, DailyScore, MacroData, Stock

logger = logging.getLogger(__name__)

def generate_thesis(label: str, ticker: str, final_score: float) -> str:
    """Generates an extremely professional, context-specific thesis summary based on scores."""
    thesis_map = {
        "Strong Setup": (
            f"{ticker} displays an exceptional alignment of bullish signals across multiple decision layers. "
            f"Long-term support parameters hold firm above the 200MA, backed by robust fundamental return profiles and highly optimistic market news channels. "
            f"Risk indicators remain highly constrained, creating an exceptionally favorable technical and fundamental entry window."
        ),
        "Watchlist": (
            f"The underlying business metrics for {ticker} remain fundamentally sound, but near-term momentum indicators suggest waiting for consolidation. "
            f"While capital return ratios are healthy, short-term news sentiment spikes or trading volume drifts warrant holding the ticker closely on watch "
            f"to capitalize on the next structural trend breakout."
        ),
        "Mixed Signals": (
            f"Indicator readings for {ticker} exhibit a high degree of conflict. "
            f"Short-term sentiment remains optimistic, but price action faces overhead resistance and balance sheet leverage parameters are elevated. "
            f"A neutral posture is recommended until technical price trends and fundamental variables converge."
        ),
        "High Risk": (
            f"Multiple warning flags are triggered across {ticker}'s operational profile. "
            f"Relative daily trading volatility (ATR) is severe and balance sheet leverage margins are highly stretched. "
            f"Bearish moving average crossings and negative media coverage introduce near-term downward pressure."
        ),
        "Avoid": (
            f"{ticker} exhibits severe bearish alignments. Price action is trading structurally below its 200-day moving average, "
            f"compounded by high debt-to-equity ratios and net income contractions. "
            f"The news stream indicates substantial reputational or operational headwind. Re-evaluation is advised only after structural changes occur."
        )
    }
    return thesis_map.get(label, f"Evaluation score of {final_score:.2f} suggests a neutral investment posture for {ticker}.")

async def run_single_stock_pipeline(db: AsyncSession, ticker: str, force_mock: bool = False):
    """
    Ingests all content sources for a single stock, computes technical indicators,
    calculates layers, scores them, runs change detection, and saves the final result.
    """
    logger.info(f"--- RUNNING SCORING PIPELINE FOR {ticker} ---")
    today_date = date.today()
    
    # 1. Ingest all stock specific inputs
    # Market data is pre-ingested by ingest_all_market_data, but we pull textual data in real-time
    q_stock = select(Stock).where(Stock.ticker == ticker)
    res_stock = await db.execute(q_stock)
    stock_obj = res_stock.scalar_one()
    company_name = stock_obj.company_name or ticker
    
    # Run text scrapers
    await ingest_news(db, ticker, company_name, force_mock=force_mock)
    await ingest_reddit(db, ticker, force_mock=force_mock)
    await ingest_sec_filings(db, ticker, force_mock=force_mock)
    
    # Calculate indicators
    await compute_technicals(db, ticker)
    
    # 2. Retrieve all computed items from database for scoring
    # Price History
    q_prices = select(PriceData).where(PriceData.ticker == ticker).order_by(PriceData.date.asc())
    res_prices = await db.execute(q_prices)
    prices_list = [{"date": p.date, "close": float(p.close or 0)} for p in res_prices.scalars().all()]
    
    # Technical Indicators (latest)
    q_tech = select(TechnicalIndicator).where(TechnicalIndicator.ticker == ticker).order_by(TechnicalIndicator.date.desc()).limit(1)
    res_tech = await db.execute(q_tech)
    tech_obj = res_tech.scalar_one_or_none()
    tech_dict = None
    if tech_obj:
        tech_dict = {
            "rsi_14": float(tech_obj.rsi_14) if tech_obj.rsi_14 is not None else None,
            "macd": float(tech_obj.macd) if tech_obj.macd is not None else None,
            "macd_signal": float(tech_obj.macd_signal) if tech_obj.macd_signal is not None else None,
            "macd_hist": float(tech_obj.macd_hist) if tech_obj.macd_hist is not None else None,
            "bb_upper": float(tech_obj.bb_upper) if tech_obj.bb_upper is not None else None,
            "bb_lower": float(tech_obj.bb_lower) if tech_obj.bb_lower is not None else None,
            "bb_mid": float(tech_obj.bb_mid) if tech_obj.bb_mid is not None else None,
            "ma_20": float(tech_obj.ma_20) if tech_obj.ma_20 is not None else None,
            "ma_50": float(tech_obj.ma_50) if tech_obj.ma_50 is not None else None,
            "ma_200": float(tech_obj.ma_200) if tech_obj.ma_200 is not None else None,
            "atr_14": float(tech_obj.atr_14) if tech_obj.atr_14 is not None else None,
        }
        
    # Fundamentals (latest)
    q_fund = select(Fundamental).where(Fundamental.ticker == ticker).order_by(Fundamental.id.desc()).limit(1)
    res_fund = await db.execute(q_fund)
    fund_obj = res_fund.scalar_one_or_none()
    fund_dict = None
    if fund_obj:
        fund_dict = {
            "pe_ratio": float(fund_obj.pe_ratio) if fund_obj.pe_ratio is not None else None,
            "pb_ratio": float(fund_obj.pb_ratio) if fund_obj.pb_ratio is not None else None,
            "ps_ratio": float(fund_obj.ps_ratio) if fund_obj.ps_ratio is not None else None,
            "eps": float(fund_obj.eps) if fund_obj.eps is not None else None,
            "revenue": fund_obj.revenue,
            "net_income": fund_obj.net_income,
            "debt_to_equity": float(fund_obj.debt_to_equity) if fund_obj.debt_to_equity is not None else None,
            "free_cash_flow": fund_obj.free_cash_flow,
            "roe": float(fund_obj.roe) if fund_obj.roe is not None else None,
            "profit_margin": float(fund_obj.profit_margin) if fund_obj.profit_margin is not None else None,
            "beta": float(fund_obj.beta) if fund_obj.beta is not None else None,
        }
        
    # Ingested news/reddit/SEC articles in the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    q_articles = select(NewsArticle).where(
        NewsArticle.ticker == ticker,
        NewsArticle.published_at >= seven_days_ago
    )
    res_articles = await db.execute(q_articles)
    articles_obj_list = res_articles.scalars().all()
    
    articles_list = []
    for art in articles_obj_list:
        # Load sentiment if exists
        q_sent = select(ArticleSentiment).where(ArticleSentiment.article_id == art.id)
        res_sent = await db.execute(q_sent)
        sent_obj = res_sent.scalar_one_or_none()
        
        articles_list.append({
            "source_name": art.source_name,
            "source_type": art.source_type,
            "title": art.title,
            "trust_weight": float(art.trust_weight) if art.trust_weight is not None else 0.50,
            "sentiment_score": float(sent_obj.sentiment_score) if sent_obj else 0.0,
            "sentiment_label": sent_obj.sentiment_label if sent_obj else "neutral",
        })
        
    # Macro data (latest today)
    q_macro = select(MacroData).order_by(MacroData.date.desc()).limit(1)
    res_macro = await db.execute(q_macro)
    macro_obj = res_macro.scalar_one_or_none()
    macro_dict = None
    if macro_obj:
        macro_dict = {
            "vix": float(macro_obj.vix) if macro_obj.vix is not None else 14.0,
            "regime_label": macro_obj.regime_label or "Neutral"
        }

    # 3. Execute layer scoring calculations
    sentiment_score, source_counts, sentiment_factors = score_sentiment_layer(articles_list)
    technical_score, tech_pos, tech_neg = score_technical_layer(tech_dict, prices_list)
    fundamental_score, fund_pos, fund_neg = score_fundamental_layer(fund_dict)
    event_score = score_event_layer(articles_list)
    regime_score = score_regime_layer(macro_dict)
    risk_score, risk_factors = score_risk_layer(tech_dict, fund_dict, articles_list, sentiment_score)
    confidence_score = score_confidence_layer(articles_list, sentiment_score, technical_score)
    
    # 4. Aggregate score calculations
    bundle = ScoreBundle(
        sentiment_score=sentiment_score,
        technical_score=technical_score,
        fundamental_score=fundamental_score,
        event_score=event_score,
        risk_score=risk_score,
        regime_score=regime_score,
        confidence_score=confidence_score
    )
    
    final_score, decision_label, confidence_tier = compute_final_score(bundle)
    
    # Consolidate explanation lists
    positive_factors = sentiment_factors + tech_pos + fund_pos
    negative_factors = risk_factors + tech_neg + fund_neg
    
    # Deduplicate lists and slice
    positive_factors = list(dict.fromkeys(positive_factors))[:5]
    negative_factors = list(dict.fromkeys(negative_factors))[:5]
    
    # Ensure they are not empty
    if not positive_factors:
        positive_factors = ["Stable operational parameters"]
    if not negative_factors:
        negative_factors = ["Normal market risk profile holds"]
        
    thesis = generate_thesis(decision_label, ticker, final_score)
    
    # 5. Check what changed today compared to yesterday
    temp_today_score = DailyScore(
        ticker=ticker,
        date=today_date,
        sentiment_score=sentiment_score,
        technical_score=technical_score,
        fundamental_score=fundamental_score,
        event_score=event_score,
        risk_score=risk_score,
        regime_score=regime_score,
        confidence_score=confidence_score,
        final_score=final_score,
        decision_label=decision_label
    )
    changes = await detect_changes(db, ticker, temp_today_score)

    # 6. Save aggregate results to DailyScore database records
    try:
        q_score = select(DailyScore).where(
            DailyScore.ticker == ticker,
            DailyScore.date == today_date
        )
        res_score = await db.execute(q_score)
        existing_score = res_score.scalar_one_or_none()
        
        # Build score dict
        score_record_dict = {
            "sentiment_score": sentiment_score,
            "technical_score": technical_score,
            "fundamental_score": fundamental_score,
            "event_score": event_score,
            "risk_score": risk_score,
            "regime_score": regime_score,
            "confidence_score": confidence_score,
            "final_score": final_score,
            "decision_label": decision_label,
            "time_horizon": "Medium Term",
            "thesis_summary": thesis,
            "positive_factors": {"factors": positive_factors},
            "negative_factors": {"factors": negative_factors},
            "what_changed": {"changes": changes},
            "source_summary": source_counts,
        }
        
        if existing_score:
            for k, v in score_record_dict.items():
                setattr(existing_score, k, v)
        else:
            new_score = DailyScore(
                ticker=ticker,
                date=today_date,
                **score_record_dict
            )
            db.add(new_score)
            
        await db.commit()
        logger.info(f"Saved aggregates for {ticker}. Score: {final_score} ({decision_label})")
    except Exception as e:
        logger.error(f"Failed to save aggregate DailyScore for {ticker}: {e}")
        await db.rollback()

async def run_full_pipeline(db: AsyncSession, force_mock: bool = False):
    """
    Main background process orchestration.
    Loads economic parameters, downloads stock prices, executes scoring pipelines.
    """
    logger.info("==============================================")
    logger.info("STARTING STOCKINTEL INGESTION & SCORING PIPELINE")
    logger.info("==============================================")
    
    # 1. Scraping macroeconomic snapshots first
    await ingest_macro(db, force_mock=force_mock)
    
    # 2. Ingesting stock price + fundamental models in bulk
    await ingest_all_market_data(db, force_mock=force_mock)
    
    # 3. Parallel individual scoring calculations
    for ticker in TRACKED_TICKERS:
        try:
            await run_single_stock_pipeline(db, ticker, force_mock=force_mock)
        except Exception as e:
            logger.error(f"Fatal error running evaluation for ticker {ticker}: {e}")
            
    logger.info("==============================================")
    logger.info("STOCKINTEL INGESTION & SCORING PIPELINE COMPLETE")
    logger.info("==============================================")
