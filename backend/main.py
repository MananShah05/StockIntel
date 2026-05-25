import sys
import os

# Ensure backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import get_settings
from core.database import init_db
from core.scheduler import setup_scheduler
from api.routes import stocks, scores, news, sentiment, health, auth
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger("main")
settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting StockIntel Decision Engine service...")
    try:
        # Initialize tables automatically on boot
        await init_db()
        logger.info("Service initialized database tables successfully.")
    except Exception as e:
        logger.error(f"Failed to bootstrap database tables: {e}")

    start_scheduler = getattr(app.state, "start_stockintel_scheduler", None)
    if start_scheduler:
        await start_scheduler()
        
    yield
    stop_scheduler = getattr(app.state, "stop_stockintel_scheduler", None)
    if stop_scheduler:
        await stop_scheduler()
    logger.info("StockIntel Decision Engine service shut down.")

app = FastAPI(
    title="StockIntel API Gateway",
    version="1.0.0",
    lifespan=lifespan,
    description="Core Decision Intelligence and Sentiment Scoring Pipeline Service"
)

# Enable CORS for the Next.js frontend
allowed_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
if not allowed_origins or allowed_origins == ["*"]:
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router,    prefix="/api")
app.include_router(stocks.router,    prefix="/api/stocks")
app.include_router(scores.router,    prefix="/api/scores")
app.include_router(news.router,      prefix="/api/news")
app.include_router(sentiment.router, prefix="/api/sentiment")
app.include_router(auth.router,      prefix="/api/auth", tags=["Authentication"])

# Register APScheduler daily pipelines
setup_scheduler(app)
