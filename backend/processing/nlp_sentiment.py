import logging
import re
from functools import lru_cache
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Lightweight Financial Lexicon for fallback mode
# Weighted terms tailored specifically for financial news and social media sentiment
FINANCIAL_LEXICON = {
    # Strong positive signals (weight +0.8 to +1.0)
    "outperform": 0.9,
    "bullish": 0.95,
    "upgrade": 0.9,
    "beat": 0.8,
    "beating": 0.8,
    "surge": 0.85,
    "soar": 0.85,
    "breakout": 0.9,
    "buy": 0.8,
    "strong buy": 1.0,
    "undervalued": 0.8,
    "dividend growth": 0.8,
    
    # Moderate positive signals (weight +0.4 to +0.7)
    "growth": 0.6,
    "profit": 0.7,
    "profitable": 0.7,
    "revenue": 0.4,
    "expansion": 0.6,
    "expand": 0.5,
    "gain": 0.5,
    "recovery": 0.6,
    "innovative": 0.5,
    "innovation": 0.4,
    "momentum": 0.6,
    "optimistic": 0.6,
    "positive": 0.5,
    "rebound": 0.6,
    "high-yield": 0.6,
    
    # Strong negative signals (weight -0.8 to -1.0)
    "underperform": -0.9,
    "bearish": -0.95,
    "downgrade": -0.9,
    "miss": -0.8,
    "missing": -0.8,
    "plunge": -0.85,
    "slump": -0.85,
    "sell": -0.8,
    "strong sell": -1.0,
    "overvalued": -0.8,
    "bankrupt": -1.0,
    "bankruptcy": -1.0,
    "deficit": -0.8,
    "lawsuit": -0.8,
    "investigation": -0.8,
    "default": -0.9,
    
    # Moderate negative signals (weight -0.4 to -0.7)
    "decline": -0.5,
    "loss": -0.7,
    "debt": -0.5,
    "drop": -0.5,
    "risk": -0.6,
    "risky": -0.7,
    "weakness": -0.6,
    "warning": -0.6,
    "layoff": -0.7,
    "negative": -0.5,
    "shrink": -0.5,
    "headwinds": -0.6,
    "pessimistic": -0.6,
    "slowdown": -0.5,
    "curb": -0.4,
    "disappointment": -0.7
}

# Optional FinBERT imports
HAS_TRANSFORMERS = False
try:
    from transformers import pipeline
    import torch
    HAS_TRANSFORMERS = True
except Exception as e:
    logger.info(f"Transformers pipeline load bypassed (lexicon mode enabled): {e}")
    HAS_TRANSFORMERS = False


@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    """Loads FinBERT pipeline if transformers and torch are available."""
    if not HAS_TRANSFORMERS:
        logger.info("Transformers not installed. Defaulting to Lexicon Sentiment Engine.")
        return None
    try:
        logger.info("Initializing FinBERT model (ProsusAI/finbert) on CPU...")
        return pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
            device=-1,  # CPU only
            max_length=512,
            truncation=True
        )
    except Exception as e:
        logger.warning(f"Failed to load FinBERT model: {e}. Defaulting to Lexicon Sentiment Engine.")
        return None

def analyze_lexicon_sentiment(text: str) -> Dict[str, Any]:
    """
    Calculates sentiment based on financial word matches.
    Returns: { label: 'positive'|'negative'|'neutral', score: float (0-1), weighted_score: float (-1 to +1) }
    """
    if not text:
        return {"label": "neutral", "score": 1.0, "weighted_score": 0.0}
    
    # Simple clean and split
    words = re.findall(r'\b\w+\b', text.lower())
    
    pos_score = 0.0
    neg_score = 0.0
    matches = 0
    
    # Check word groups and single words
    i = 0
    n = len(words)
    while i < n:
        match_found = False
        
        # Check two-word phrases first (e.g. "strong buy", "strong sell", "dividend growth")
        if i < n - 1:
            phrase = f"{words[i]} {words[i+1]}"
            if phrase in FINANCIAL_LEXICON:
                weight = FINANCIAL_LEXICON[phrase]
                if weight > 0:
                    pos_score += weight
                else:
                    neg_score += abs(weight)
                matches += 1
                i += 2
                match_found = True
                continue
        
        # Check single words
        word = words[i]
        if word in FINANCIAL_LEXICON:
            weight = FINANCIAL_LEXICON[word]
            if weight > 0:
                pos_score += weight
            else:
                neg_score += abs(weight)
            matches += 1
        
        i += 1
        
    if matches == 0:
        return {"label": "neutral", "score": 0.8, "weighted_score": 0.0}
        
    total_val = pos_score + neg_score
    diff = pos_score - neg_score
    
    weighted_score = diff / (pos_score + neg_score + 1.0) # slightly regularized
    
    # Cap between -1.0 and 1.0
    weighted_score = max(-1.0, min(1.0, weighted_score))
    
    if weighted_score > 0.15:
        return {"label": "positive", "score": float(weighted_score), "weighted_score": float(weighted_score)}
    elif weighted_score < -0.15:
        return {"label": "negative", "score": float(abs(weighted_score)), "weighted_score": float(weighted_score)}
    else:
        return {"label": "neutral", "score": float(1.0 - abs(weighted_score)), "weighted_score": float(weighted_score)}

def analyze_sentiment(texts: List[str], use_finbert: bool = False) -> List[Dict[str, Any]]:
    """
    Batched sentiment analysis. 
    Uses FinBERT if use_finbert=True and dependencies are present, else Lexicon.
    """
    if not texts:
        return []
        
    pipe = get_sentiment_pipeline() if (use_finbert and HAS_TRANSFORMERS) else None
    
    if pipe is not None:
        try:
            logger.info(f"Running FinBERT inference on {len(texts)} texts...")
            results = pipe(texts, batch_size=8)
            output = []
            for r in results:
                label = r["label"].lower()
                score = r["score"]
                
                # FinBERT outputs 'positive', 'negative', 'neutral'
                if label == "positive":
                    weighted = score
                elif label == "negative":
                    weighted = -score
                else:
                    weighted = 0.0
                    
                output.append({
                    "label": label,
                    "score": float(score),
                    "weighted_score": float(weighted)
                })
            return output
        except Exception as e:
            logger.error(f"FinBERT inference failed: {e}. Falling back to Lexicon Engine.")
            
    # Fallback Lexicon Mode
    return [analyze_lexicon_sentiment(text) for text in texts]
