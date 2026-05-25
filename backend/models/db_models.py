from sqlalchemy import String, Integer, BigInteger, Numeric, Boolean, Date, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from core.database import Base

class Stock(Base):
    __tablename__ = "stocks"

    ticker: Mapped[str] = mapped_column(String(10), primary_key=True)
    company_name: Mapped[Optional[str]] = mapped_column(String(255))
    sector: Mapped[Optional[str]] = mapped_column(String(100))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    market_cap: Mapped[Optional[int]] = mapped_column(BigInteger)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    prices: Mapped[List["PriceData"]] = relationship("PriceData", back_populates="stock", cascade="all, delete-orphan")
    technicals: Mapped[List["TechnicalIndicator"]] = relationship("TechnicalIndicator", back_populates="stock", cascade="all, delete-orphan")
    fundamentals: Mapped[List["Fundamental"]] = relationship("Fundamental", back_populates="stock", cascade="all, delete-orphan")
    news: Mapped[List["NewsArticle"]] = relationship("NewsArticle", back_populates="stock", cascade="all, delete-orphan")
    scores: Mapped[List["DailyScore"]] = relationship("DailyScore", back_populates="stock", cascade="all, delete-orphan")

class PriceData(Base):
    __tablename__ = "price_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    high: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    low: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    close: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    volume: Mapped[Optional[int]] = mapped_column(BigInteger)
    adj_close: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="prices")

class TechnicalIndicator(Base):
    __tablename__ = "technical_indicators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    rsi_14: Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    macd: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    macd_signal: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    macd_hist: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    bb_upper: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    bb_lower: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    bb_mid: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    ma_20: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    ma_50: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    ma_200: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    volume_ma_20: Mapped[Optional[int]] = mapped_column(BigInteger)
    atr_14: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="technicals")

class Fundamental(Base):
    __tablename__ = "fundamentals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False)
    period: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g., "2026-Q1"
    pe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    pb_ratio: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    ps_ratio: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    eps: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    revenue: Mapped[Optional[int]] = mapped_column(BigInteger)
    net_income: Mapped[Optional[int]] = mapped_column(BigInteger)
    debt_to_equity: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    free_cash_flow: Mapped[Optional[int]] = mapped_column(BigInteger)
    roe: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    profit_margin: Mapped[Optional[float]] = mapped_column(Numeric(10, 4))
    beta: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="fundamentals")

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False)
    source_name: Mapped[str] = mapped_column(String(100))
    source_type: Mapped[str] = mapped_column(String(50))  # 'newsapi', 'sec', 'reddit'
    title: Mapped[str] = mapped_column(Text)
    content: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    trust_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.50)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="news")
    sentiment: Mapped[Optional["ArticleSentiment"]] = relationship("ArticleSentiment", back_populates="article", cascade="all, delete-orphan")

class ArticleSentiment(Base):
    __tablename__ = "article_sentiment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    article_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("news_articles.id", ondelete="CASCADE"), nullable=False)
    sentiment_label: Mapped[str] = mapped_column(String(20))  # 'positive', 'negative', 'neutral'
    sentiment_score: Mapped[float] = mapped_column(Numeric(6, 4))  # -1.0 to 1.0
    confidence: Mapped[float] = mapped_column(Numeric(6, 4))
    model_used: Mapped[str] = mapped_column(String(50), default="lexicon")

    # Relationships
    article: Mapped["NewsArticle"] = relationship("NewsArticle", back_populates="sentiment")

class DailyScore(Base):
    __tablename__ = "daily_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticker: Mapped[str] = mapped_column(String(10), ForeignKey("stocks.ticker", ondelete="CASCADE"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    sentiment_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    technical_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    fundamental_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    event_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    risk_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    regime_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    confidence_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    final_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    decision_label: Mapped[str] = mapped_column(String(50))
    time_horizon: Mapped[str] = mapped_column(String(20), default="Medium Term")
    thesis_summary: Mapped[Optional[str]] = mapped_column(Text)
    positive_factors: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)  # SQLite & PG compatible JSON
    negative_factors: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    what_changed: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)
    source_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON)

    # Relationships
    stock: Mapped["Stock"] = relationship("Stock", back_populates="scores")

class MacroData(Base):
    __tablename__ = "macro_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, unique=True)
    fed_funds_rate: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    cpi_yoy: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    unemployment: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    sp500_return_1d: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    vix: Mapped[Optional[float]] = mapped_column(Numeric(8, 3))
    regime_label: Mapped[str] = mapped_column(String(50), default="Neutral")

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
