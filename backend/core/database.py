from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool, QueuePool
from core.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Auto-adjust standard postgres:// and postgresql:// connection strings to postgresql+asyncpg:// for async execution
db_url = settings.database_url.strip('"').strip("'")
connect_args = {}

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)


# Strip ?sslmode=... from the URL and pass ssl=require in connect_args for asyncpg stability
if "?" in db_url:
    base_url, query = db_url.split("?", 1)
    # If the URL contains query params, pull out sslmode. For Neon/Postgres
    # we'll enable SSL unless explicitly disabled (sslmode=disable).
    if "sslmode" in query:
        # remove query from the db_url for SQLAlchemy and set ssl flag
        db_url = base_url
        # simple parse of sslmode value
        try:
            parts = [p for p in query.split("&") if p]
            kv = dict(p.split("=", 1) for p in parts if "=" in p)
            sslmode = kv.get("sslmode", "require").lower()
        except Exception:
            sslmode = "require"
        connect_args["ssl"] = False if sslmode == "disable" else True

# Production Postgres benefits from NullPool to prevent connection leaks on free dynos
is_sqlite = db_url.startswith("sqlite")

engine_options = {}
if is_sqlite:
    engine_options["poolclass"] = NullPool
else:
    engine_options["poolclass"] = NullPool
    engine_options["connect_args"] = connect_args

engine = create_async_engine(
    db_url,
    echo=False,  # Set to True for DB debugging
    **engine_options
)

# Log which DB URL we are using (mask credentials)
try:
    import re
    def _mask_url(u: str) -> str:
        # mask between // and @
        return re.sub(r"//([^:@]+):([^@]+)@", "//***:***@", u)
    logger.info(f"Using database URL: {_mask_url(db_url)} (sqlite={is_sqlite})")
except Exception:
    logger.info("Using database URL (could not mask) for debugging.")



AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    try:
        async with engine.begin() as conn:
            # Import models to ensure they are registered with Base metadata
            from models.db_models import Base as ModelsBase
            await conn.run_sync(ModelsBase.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
        raise e
