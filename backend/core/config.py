import os
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    # Database configuration - defaults to local async SQLite
    database_url: str = "sqlite+aiosqlite:///../stockintel.db"

    # API Keys (optional for local, defaults to mock fallback)
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "StockIntel/1.0"
    news_api_key: str = ""
    fred_api_key: str = ""
    alpha_vantage_key: str = ""

    # Application Mode Configuration
    # If True, dynamically generates rich synthetic data when API keys are absent or errors occur.
    mock_mode: bool = False
    
    # If True, uses our custom rule-based Financial Lexicon instead of FinBERT to ensure instant runtimes.
    sentiment_fallback: bool = True

    environment: str = "development"
    allowed_origins: str = "*"
    model_path: str = "./ml/model_store"
    cache_ttl_seconds: int = 3600
    log_level: str = "INFO"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "protected_namespaces": (),
        "extra": "ignore"
    }


@lru_cache
def get_settings() -> Settings:
    # If we are in the backend folder, make sure sqlite database is created in the right workspace directory
    settings = Settings()
    # Allow overriding the DB via environment variables (Neon/Postgres).
    # Prefer `NEON_DATABASE_URL` then `DATABASE_URL` if provided.
    neon_url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
    if neon_url:
        settings.database_url = neon_url
    # Ensure database URL falls back to local sqlite when nothing is provided
    if not settings.database_url:
        settings.database_url = "sqlite+aiosqlite:///../stockintel.db"
    return settings
