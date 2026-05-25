from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

# Initialize the scheduler
scheduler = AsyncIOScheduler(timezone="America/New_York")

def setup_scheduler(app):
    """
    Registers the daily background ingestion and scoring job.
    Runs inside the FastAPI process - APScheduler is perfect for lightweight local setups.
    """
    from core.database import AsyncSessionLocal
    from ingestion.pipeline import run_full_pipeline
    from core.config import get_settings
    
    settings = get_settings()

    async def daily_job():
        logger.info("Executing scheduled daily StockIntel ingestion + evaluation pipeline...")
        async with AsyncSessionLocal() as db:
            try:
                # Run the pipeline with smart mocks active
                await run_full_pipeline(db, force_mock=settings.mock_mode)
                logger.info("Scheduled daily StockIntel pipeline execution succeeded.")
            except Exception as e:
                logger.error(f"Scheduled daily StockIntel pipeline failed: {e}")

    # Add the cron job at 6:30 AM EST (30 mins after US pre-market opens)
    scheduler.add_job(
        daily_job,
        CronTrigger(hour=6, minute=30, timezone="America/New_York"),
        id="daily_pipeline_job",
        replace_existing=True,
        max_instances=1,
    )

    async def run_initial_seed_in_background():
        logger.info("No scores found in database. Starting initial background seed and score calculations...")
        async with AsyncSessionLocal() as db:
            try:
                await run_full_pipeline(db, force_mock=settings.mock_mode)
                logger.info("Initial background seed and score calculations completed successfully.")
            except Exception as e:
                logger.error(f"Initial background seed failed: {e}")

    @app.on_event("startup")
    async def start_scheduler():
        try:
            # Check if database has scores to see if seed is required
            async with AsyncSessionLocal() as db:
                from models.db_models import DailyScore
                from sqlalchemy import select
                q = select(DailyScore).limit(1)
                res = await db.execute(q)
                has_scores = res.scalar_one_or_none() is not None
                
                if not has_scores:
                    logger.info("No scores found in database. Triggering background seed task...")
                    asyncio.create_task(run_initial_seed_in_background())
                    
        except Exception as e:
            logger.error(f"Failed to check seed/run initial scores: {e}")
            
        if not scheduler.running:
            scheduler.start()
            logger.info("APScheduler background scheduler started.")

    @app.on_event("shutdown")
    async def stop_scheduler():
        if scheduler.running:
            scheduler.shutdown()
            logger.info("APScheduler background scheduler stopped.")

    app.state.start_stockintel_scheduler = start_scheduler
    app.state.stop_stockintel_scheduler = stop_scheduler
        
# Ensure asyncio is imported
import asyncio
