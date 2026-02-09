from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from yt_dlp import YoutubeDL
import os
import sys
import pickle
from dotenv import load_dotenv

# Load environment variables FIRST before any imports that need them
# Explicitly load from python/.env
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from hf_models import analyze_commit, batch_analyze_commits, analyze_sentiment
except ImportError:
    # Fallback: try importing from current package
    from .hf_models import analyze_commit, batch_analyze_commits, analyze_sentiment
from googleapiclient.discovery import build

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for Vercel/Local mix
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the prefix used by Vercel rewrites
router = APIRouter(prefix="/api/py")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
VECTORIZER = None
MODEL = None
LABEL_ENCODER = None

def load_models():
    global VECTORIZER, MODEL, LABEL_ENCODER
    try:
        vec_path = os.path.join(MODEL_DIR, "tfidf_vectorizer.pkl")
        model_path = os.path.join(MODEL_DIR, "Random Forest.pkl")
        le_path = os.path.join(MODEL_DIR, "label_encoder.pkl")

        if os.path.exists(vec_path):
            with open(vec_path, "rb") as f:
                VECTORIZER = pickle.load(f)
        if os.path.exists(model_path):
            with open(model_path, "rb") as f:
                MODEL = pickle.load(f)
        if os.path.exists(le_path):
            with open(le_path, "rb") as f:
                LABEL_ENCODER = pickle.load(f)
    except Exception as e:
        print("Model load error:", e)

load_models()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/youtube")
def youtube_data(url: str = Query(..., description="YouTube video URL")):
    try:
        with YoutubeDL({'quiet': True, 'skip_download': True}) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "title": info.get("title"),
        "channel": info.get("uploader"),
        "views": info.get("view_count"),
        "likes": info.get("like_count"),
        "duration": info.get("duration"),
        "url": info.get("webpage_url")
    }

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@router.get("/data")
def get_data():
    return {"data": "This is coming from FastAPI"}


# -------------------------
# Analysis endpoints (use models if present)
# -------------------------
class AnalyzeVideoRequest(BaseModel):
    video_url: str
    analyze_comments: Optional[bool] = False
    max_comments: Optional[int] = 100

class TextRequest(BaseModel):
    text: str

class BatchCommentsRequest(BaseModel):
    comments: List[str]


class CommitAnalysisRequest(BaseModel):
    message: str


class BatchCommitsRequest(BaseModel):
    commits: List[str]


class ChannelRequest(BaseModel):
    channel_url: str
    max_videos: Optional[int] = 50


def predict_comments(comments: List[str]) -> Dict[str, Any]:
    """
    Use loaded vectorizer/model/label encoder to predict sentiment for comments.
    Returns structure with per-comment sentiment + confidence and summary.
    """
    if VECTORIZER is None or MODEL is None:
        raise RuntimeError("Models not loaded on server")

    X = VECTORIZER.transform(comments)
    # predict labels
    preds = MODEL.predict(X)
    # predict probabilities if available
    probs = None
    try:
        probs = MODEL.predict_proba(X)
    except Exception:
        probs = None

    results = []
    for i, text in enumerate(comments):
        label = preds[i]
        confidence = 0.0
        if probs is not None:
            # take max probability for predicted class
            confidence = float(max(probs[i]))
        else:
            confidence = 0.0

        # if label encoder present, try to inverse transform
        try:
            if LABEL_ENCODER is not None:
                sentiment = LABEL_ENCODER.inverse_transform([label])[0]
            else:
                sentiment = str(label)
        except Exception:
            sentiment = str(label)

        results.append({
            "comment": text,
            "sentiment": sentiment,
            "confidence": confidence
        })

    # basic distribution summary
    dist_counts: Dict[str, int] = {}
    for r in results:
        dist_counts[r["sentiment"]] = dist_counts.get(r["sentiment"], 0) + 1
    total = len(results)
    dist_percent = {k: round(v / total * 100, 1) for k, v in dist_counts.items()}

    avg_conf = sum(r["confidence"] for r in results) / total if total else 0.0

    return {
        "count": total,
        "results": results,
        "distribution": {"counts": dist_counts, "percentages": dist_percent},
        "average_confidence": avg_conf,
        "model": MODEL.__class__.__name__ if MODEL is not None else None,
    }


@router.post("/analyze/comments/batch")
def analyze_comments_batch(payload: BatchCommentsRequest):
    try:
        if not payload.comments:
            return {"count": 0, "results": []}
        out = predict_comments(payload.comments)
        return out
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/commit")
def analyze_single_commit(payload: CommitAnalysisRequest):
    try:
        result = analyze_commit(payload.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Commit analysis failed: {str(e)}")


@router.post("/analyze/commits/batch")
def analyze_commits_batch(payload: BatchCommitsRequest):
    try:
        if not payload.commits:
            return {"count": 0, "results": []}
        
        results = batch_analyze_commits(payload.commits)
        
        sentiments = [r["sentiment"]["label"] for r in results if "label" in r["sentiment"]]
        types = [r["type"]["type"] for r in results]
        quality_scores = [r["quality_score"] for r in results]
        
        sentiment_dist = {}
        for s in sentiments:
            sentiment_dist[s] = sentiment_dist.get(s, 0) + 1
        
        type_dist = {}
        for t in types:
            type_dist[t] = type_dist.get(t, 0) + 1
        
        return {
            "count": len(results),
            "results": results,
            "statistics": {
                "sentiment_distribution": sentiment_dist,
                "type_distribution": type_dist,
                "average_quality_score": sum(quality_scores) / len(quality_scores) if quality_scores else 0,
                "total_commits": len(results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@router.post("/analyze/sentiment")
def analyze_text_sentiment(payload: TextRequest):
    try:
        result = analyze_sentiment(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis failed: {str(e)}")


@router.post("/analyze/video")
def analyze_video(payload: AnalyzeVideoRequest):
    try:
        with YoutubeDL({'quiet': True, 'skip_download': True}) as ydl:
            info = ydl.extract_info(payload.video_url, download=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    result = {
        "title": info.get("title"),
        "channel": info.get("uploader"),
        "views": info.get("view_count"),
        "likes": info.get("like_count"),
        "duration": info.get("duration"),
        "url": info.get("webpage_url"),
        "analysis": {
            "sentiment": "neutral",
            "keywords": []
        }
    }

    # Try to fetch comments using yt_dlp if requested
    if payload.analyze_comments:
        comments_texts: List[str] = []
        # yt_dlp may expose comments under 'comments' key depending on extractor
        raw_comments = info.get("comments") or []
        # raw_comments items may be dicts with 'text' or strings
        for c in raw_comments[: payload.max_comments]:
            if isinstance(c, dict):
                text = c.get("text") or c.get("content") or c.get("comment") or ""
            else:
                text = str(c)
            if text:
                comments_texts.append(text)

        # If no comments from yt_dlp, inform user (frontend can send comments directly)
        if not comments_texts:
            result["comments_analysis"] = {
                "analyzed": 0,
                "summary": "Could not fetch comments from yt_dlp extractor. You can POST comments to /analyze/comments/batch for model analysis.",
            }
            return result

        # If model loaded, run predictions
        try:
            analysis_out = predict_comments(comments_texts)
            result["comments_analysis"] = {
                "analyzed": analysis_out["count"],
                "summary": "Comments analyzed using server ML model",
                "distribution": analysis_out["distribution"],
                "average_confidence": analysis_out["average_confidence"],
                "sample_results": analysis_out["results"][:20],
                "model_used": analysis_out["model"],
            }
        except RuntimeError as e:
            result["comments_analysis"] = {
                "analyzed": 0,
                "summary": f"Model not available on server: {str(e)}. You can POST comments to /analyze/comments/batch to analyze using a remote model service.",
            }

    return result


@router.post("/youtube/channel")
def fetch_channel_videos(payload: ChannelRequest):
    """Fetch REAL videos from YouTube channel using YouTube Data API"""
    try:
        if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == "your_youtube_api_key_here":
            raise HTTPException(status_code=400, detail="YouTube API key not configured. Get one from https://console.cloud.google.com/ and enable YouTube Data API v3")
        
        channel_url = payload.channel_url
        max_videos = payload.max_videos or 10
        
        # Extract channel ID from URL
        channel_id = None
        if '/@' in channel_url:
            channel_handle = channel_url.split('/@')[1].split('?')[0]
            print(f"DEBUG: Looking up channel handle: {channel_handle}")
            try:
                # Need to look up channel ID from handle
                youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
                request = youtube.search().list(
                    part='snippet',
                    q=channel_handle,
                    type='channel',
                    maxResults=1
                )
                response = request.execute()
                print(f"DEBUG: Search response: {response}")
                if response.get('items'):
                    channel_id = response['items'][0]['id']['channelId']
                    print(f"DEBUG: Found channel ID: {channel_id}")
            except Exception as e:
                print(f"DEBUG: Error during channel lookup: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Failed to find channel: {str(e)}")
        elif '/channel/' in channel_url:
            channel_id = channel_url.split('/channel/')[1].split('?')[0]
            print(f"DEBUG: Extracted channel ID from URL: {channel_id}")
        
        if not channel_id:
            raise HTTPException(status_code=400, detail="Could not extract channel ID from URL. Use format: https://www.youtube.com/@channelname or https://www.youtube.com/channel/UCXXXXXX")
        
        print(f"DEBUG: Fetching videos for channel: {channel_id}")
        
        # Get channel videos
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        # Get uploads playlist ID
        request = youtube.channels().list(
            part='contentDetails',
            id=channel_id
        )
        response = request.execute()
        print(f"DEBUG: Channels response: {response}")
        
        if not response.get('items'):
            raise HTTPException(status_code=400, detail="Channel not found or API key doesn't have access")
        
        uploads_playlist_id = response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
        print(f"DEBUG: Uploads playlist ID: {uploads_playlist_id}")
        
        # Get videos from uploads playlist
        videos = []
        request = youtube.playlistItems().list(
            part='snippet',
            playlistId=uploads_playlist_id,
            maxResults=min(max_videos, 50)
        )
        
        while request and len(videos) < max_videos:
            response = request.execute()
            print(f"DEBUG: Playlist items response count: {len(response.get('items', []))}")
            
            for item in response.get('items', []):
                if len(videos) >= max_videos:
                    break
                
                snippet = item['snippet']
                video_id = snippet['resourceId']['videoId']
                
                # Get video statistics
                video_request = youtube.videos().list(
                    part='statistics,contentDetails',
                    id=video_id
                )
                video_response = video_request.execute()
                
                if video_response.get('items'):
                    stats = video_response['items'][0]['statistics']
                    videos.append({
                        'id': video_id,
                        'title': snippet['title'],
                        'description': snippet['description'],
                        'view_count': int(stats.get('viewCount', 0)),
                        'like_count': int(stats.get('likeCount', 0)),
                        'published_at': snippet['publishedAt'][:10],
                        'thumbnail': snippet['thumbnails']['high']['url'],
                    })
            
            # Get next page
            if 'nextPageToken' in response and len(videos) < max_videos:
                request = youtube.playlistItems().list(
                    part='snippet',
                    playlistId=uploads_playlist_id,
                    pageToken=response['nextPageToken'],
                    maxResults=min(max_videos - len(videos), 50)
                )
            else:
                request = None
        
        print(f"DEBUG: Fetched {len(videos)} videos")
        return {
            'success': True,
            'videos': videos,
            'count': len(videos)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Exception in fetch_channel_videos: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to fetch channel: {str(e)}")

app.include_router(router)
