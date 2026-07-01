"""
Feed routes - Personalized and fast feed endpoints
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from datetime import datetime

from ..services.database import mock_posts
from ..services.scoring import calculate_relevance_score
from ..services.auth import get_current_user_required

router = APIRouter(prefix="/feed", tags=["Feed"])


@router.get("/personalized")
async def get_personalized_feed(
    max_distance_km: Optional[float] = Query(None, ge=0, le=45000),
    preferred_categories: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user_required)
):
    """
    Get a personalized feed based on user preferences and location.
    
    This endpoint demonstrates the recommendation engine that scores
    posts based on distance, category match, and engagement.
    """
    categories = []
    if preferred_categories:
        categories = [cat.strip() for cat in preferred_categories.split(",") if cat.strip()]
    
    user_location = None
    if latitude and longitude:
        user_location = (latitude, longitude)
    
    all_posts = list(mock_posts.values())
    
    scored_posts = []
    for post in all_posts:
        score_result = calculate_relevance_score(
            post=post,
            user_location=user_location,
            max_distance_km=max_distance_km or 100,
            preferred_categories=categories
        )
        
        scored_posts.append({
            **post,
            "relevance_score": score_result["relevance_score"],
            "distance_km": score_result["distance_km"],
            "category_match": score_result["category_match"],
            "within_distance_range": score_result["within_distance_range"],
            "score_breakdown": score_result["score_breakdown"]
        })
    
    scored_posts.sort(key=lambda x: x["relevance_score"], reverse=True)
    paginated_posts = scored_posts[offset:offset + limit]
    
    return {
        "posts": paginated_posts,
        "has_more": len(scored_posts) > offset + limit,
        "next_cursor": str(offset + limit) if len(scored_posts) > offset + limit else None,
        "feed_summary": {
            "total_posts_returned": len(paginated_posts),
            "posts_considered": len(scored_posts),
            "max_distance_km": max_distance_km or 100,
            "preferred_categories": categories,
            "has_user_location": user_location is not None
        },
        "total_posts_considered": len(scored_posts),
        "total_posts_filtered": 0
    }


@router.get("/fast")
async def get_fast_feed(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """
    Fast feed endpoint - returns posts without scoring.
    Demonstrates performance optimization.
    """
    posts = list(mock_posts.values())
    paginated_posts = posts[offset:offset + limit]
    
    return {
        "posts": paginated_posts,
        "has_more": len(posts) > offset + limit,
        "next_cursor": str(offset + limit) if len(posts) > offset + limit else None
    }
