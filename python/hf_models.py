"""
Hugging Face Inference API integration for commit analysis
"""
import requests
import os
from typing import Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise ValueError("HF_TOKEN environment variable not set. Get it from https://huggingface.co/settings/tokens")

# Hugging Face Inference API endpoints
HF_API_BASE = "https://api-inference.huggingface.co/models"

# Models for different analysis types
MODELS = {
    "sentiment": "piyushcoderhack/Commit_analysis",  # Your custom model
    "commit_classification": "bert-base-uncased",
}

headers = {
    "Authorization": f"Bearer {HF_TOKEN}",
    "Content-Type": "application/json"
}


def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of text using Hugging Face Inference API
    Returns: {"label": "POSITIVE|NEGATIVE|NEUTRAL", "score": float}
    """
    if not text or not text.strip():
        return {"label": "NEUTRAL", "score": 0.0}
    
    api_url = f"{HF_API_BASE}/{MODELS['sentiment']}"
    
    try:
        # Try with wait_for_model parameter to ensure model is loaded
        response = requests.post(
            api_url,
            headers=headers,
            json={
                "inputs": text,
                "wait_for_model": True
            },
            timeout=30  # Increased timeout for model loading
        )
        response.raise_for_status()
        
        result = response.json()
        
        # Handle list response from HF API (standard format)
        if isinstance(result, list) and len(result) > 0:
            scores = result[0]
            # Find the label with highest score
            best = max(scores, key=lambda x: x['score'])
            
            # Normalize label to uppercase
            label = best['label'].upper()
            if 'POSITIVE' in label:
                label = 'POSITIVE'
            elif 'NEGATIVE' in label:
                label = 'NEGATIVE'
            else:
                label = 'NEUTRAL'
            
            return {
                "label": label,
                "score": best['score'],
                "all_scores": scores
            }
        
        return result
        
    except Exception as e:
        raise Exception(f"Hugging Face API Error: {str(e)}")


def classify_commit_type(message: str) -> Dict[str, Any]:
    """
    Classify commit type (feature, bugfix, refactor, docs, etc.)
    Uses keyword-based classification as fallback
    """
    message_lower = message.lower()
    
    # Keyword-based classification (simple but effective)
    classifiers = {
        "bugfix": ["fix", "bug", "issue", "patch", "resolve"],
        "feature": ["add", "new", "implement", "feature", "support"],
        "refactor": ["refactor", "cleanup", "reorganize", "restructure"],
        "docs": ["doc", "documentation", "readme", "comment"],
        "test": ["test", "spec", "coverage"],
        "chore": ["chore", "deps", "update", "upgrade", "bump"],
        "perf": ["perf", "performance", "optimize", "speed"],
    }
    
    scores = {}
    for commit_type, keywords in classifiers.items():
        score = sum(1 for keyword in keywords if keyword in message_lower)
        scores[commit_type] = score
    
    if max(scores.values()) == 0:
        return {"type": "other", "confidence": 0.0}
    
    best_type = max(scores, key=scores.get)
    confidence = scores[best_type] / len(classifiers[best_type])
    
    return {
        "type": best_type,
        "confidence": min(confidence, 1.0),
        "all_scores": scores
    }


def analyze_commit(message: str) -> Dict[str, Any]:
    """
    Complete commit analysis: sentiment + type classification
    """
    sentiment = analyze_sentiment(message)
    commit_type = classify_commit_type(message)
    
    return {
        "message": message,
        "sentiment": sentiment,
        "type": commit_type,
        "quality_score": calculate_quality_score(message, sentiment, commit_type)
    }


def calculate_quality_score(message: str, sentiment: Dict, commit_type: Dict) -> float:
    """
    Calculate overall commit quality score (0-1)
    Based on: message length, sentiment, type clarity
    """
    score = 0.5  # Base score
    
    # Message length bonus (good commits are descriptive)
    if len(message) > 20:
        score += 0.2
    if len(message) > 50:
        score += 0.1
    
    # Sentiment bonus (positive sentiment = better quality)
    if sentiment.get("label") == "POSITIVE":
        score += 0.1
    
    # Type clarity bonus
    if commit_type.get("confidence", 0) > 0.5:
        score += 0.1
    
    return min(score, 1.0)


def batch_analyze_commits(messages: List[str]) -> List[Dict[str, Any]]:
    """
    Analyze multiple commits at once
    """
    return [analyze_commit(msg) for msg in messages]
