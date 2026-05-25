from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.db_models import DailyScore
from datetime import date, timedelta
import logging

logger = logging.getLogger(__name__)

async def detect_changes(db: AsyncSession, ticker: str, today_bundle) -> list[str]:
    """
    Compare today's score bundle against yesterday's stored record.
    Returns a human-readable list of what changed.
    """
    yesterday = date.today() - timedelta(days=1)

    try:
        result = await db.execute(
            select(DailyScore)
            .where(DailyScore.ticker == ticker)
            .where(DailyScore.date == yesterday)
        )
        prev = result.scalar_one_or_none()
    except Exception as e:
        logger.error(f"Error fetching yesterday's score for change detection: {e}")
        prev = None

    if not prev:
        # Fallback to fetching the most recent record that isn't today
        try:
            result = await db.execute(
                select(DailyScore)
                .where(DailyScore.ticker == ticker)
                .where(DailyScore.date < date.today())
                .order_by(DailyScore.date.desc())
                .limit(1)
            )
            prev = result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching historical scores for change detection: {e}")
            prev = None

    if not prev:
        return ["Initial evaluation context established. No previous day analysis is available for comparison."]

    changes = []
    threshold = 0.08  # Mention only changes larger than this delta

    # Fields to check: (database_field_name, user_label, positive_word, negative_word)
    checks = [
        ("sentiment_score",   "Market Sentiment",        "improved", "weakened"),
        ("technical_score",   "Chart Technical trend",   "strengthened", "softened"),
        ("fundamental_score", "Fundamental financial outlook", "strengthened", "declined"),
        ("event_score",       "Regulatory event impact", "heightened", "decreased"),
        ("risk_score",        "Internal risk level",     "receded", "increased"),  # note: risk decreasing is positive
    ]

    for field, label, pos_word, neg_word in checks:
        prev_val = getattr(prev, field, 0)
        prev_val = float(prev_val) if prev_val is not None else 0.5
        
        today_val = getattr(today_bundle, field, 0)
        today_val = float(today_val) if today_val is not None else 0.5
        
        delta = today_val - prev_val

        if abs(delta) >= threshold:
            if field == "risk_score":
                # Risk decreasing (delta < 0) is a positive development
                direction = pos_word if delta < 0 else neg_word
            else:
                direction = pos_word if delta > 0 else neg_word
            
            sign = "+" if delta > 0 else ""
            changes.append(f"{label} has {direction} ({sign}{delta:+.2f} shift)")

    # Check if the final decision label itself changed
    if prev.decision_label != today_bundle.decision_label:
        changes.append(
            f"Decision support state upgraded/downgraded from '{prev.decision_label}' to '{today_bundle.decision_label}'"
        )

    return changes if changes else ["No statistically significant deviation from yesterday's ratings."]
