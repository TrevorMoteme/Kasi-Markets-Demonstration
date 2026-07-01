"""
Recommendation Engine - Scoring Algorithm

This is the core of the personalized feed. It calculates relevance scores
for posts based on user preferences, location, and engagement.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import math


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate distance between two coordinates in kilometers.
    
    Uses the Haversine formula for accurate distance calculation.
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def calculate_relevance_score(
    post: Dict[str, Any],
    user_location: Optional[Tuple[float, float]],
    max_distance_km: float,
    preferred_categories: List[str]
) -> Dict[str, Any]:
    """
    Calculate a relevance score for a single post.
    
    The score is based on four factors:
    1. Distance from user (35%)
    2. Category match (30%)
    3. Engagement (likes + comments) (25%)
    4. Recency (how recent the post is) (10%)
    """
    
    # Get post data
    business_lat = post.get("business_latitude")
    business_lng = post.get("business_longitude")
    business_category = post.get("business_category", "")
    likes = post.get("likes_count", 0)
    comments = post.get("comments_count", 0)
    created_at = post.get("created_at")
    
    # 1. DISTANCE SCORE (0-1)
    distance_score = 0.5
    distance_km = None
    within_range = True
    
    if user_location and business_lat and business_lng:
        distance_km = calculate_distance(
            user_location[0], user_location[1],
            business_lat, business_lng
        )
        
        if max_distance_km > 0:
            within_range = distance_km <= max_distance_km
            ratio = min(distance_km / max_distance_km, 1)
            distance_score = max(0.3, 1.0 - (ratio * 0.7))
        elif max_distance_km == 0:
            distance_score = 1.0
    
    # 2. CATEGORY SCORE (0-1)
    category_score = 0.5
    category_match = False
    
    if business_category and preferred_categories:
        business_cat_lower = business_category.lower().strip()
        
        for pref_cat in preferred_categories:
            pref_cat_lower = pref_cat.lower().strip()
            
            if pref_cat_lower == business_cat_lower:
                category_score = 1.0
                category_match = True
                break
            elif (pref_cat_lower in business_cat_lower or 
                  business_cat_lower in pref_cat_lower):
                category_score = 0.8
                category_match = True
                break
    
    # 3. ENGAGEMENT SCORE (0-1)
    engagement = likes + (comments * 2)
    if engagement > 0:
        engagement_score = min(1.0, math.log10(engagement + 1) / 2)
    else:
        engagement_score = 0.0
    
    # 4. RECENCY SCORE (0-1)
    recency_score = 0.5
    if created_at:
        try:
            if isinstance(created_at, str):
                post_time = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            else:
                post_time = created_at
            
            now = datetime.utcnow()
            hours_old = (now - post_time).total_seconds() / 3600
            
            if hours_old <= 1:
                recency_score = 1.0
            elif hours_old <= 24:
                recency_score = 0.9 * math.exp(-0.05 * (hours_old - 1))
            elif hours_old <= 168:
                recency_score = 0.5 * math.exp(-0.01 * (hours_old - 24))
            else:
                recency_score = 0.1
        except:
            recency_score = 0.5
    
    # 5. FINAL SCORE (Weighted average)
    weights = {
        "distance": 0.35,
        "category": 0.30,
        "engagement": 0.25,
        "recency": 0.10
    }
    
    final_score = (
        distance_score * weights["distance"] +
        category_score * weights["category"] +
        engagement_score * weights["engagement"] +
        recency_score * weights["recency"]
    )
    
    # 6. Format distance display
    distance_display = None
    if distance_km is not None:
        if distance_km < 1:
            distance_display = f"{distance_km * 1000:.0f} m"
        elif distance_km < 10:
            distance_display = f"{distance_km:.2f} km"
        elif distance_km < 100:
            distance_display = f"{distance_km:.1f} km"
        else:
            distance_display = f"{distance_km:.0f} km"
    
    return {
        "relevance_score": round(final_score, 4),
        "distance_km": round(distance_km, 2) if distance_km else None,
        "distance_display": distance_display,
        "category_match": category_match,
        "within_distance_range": within_range,
        "score_breakdown": {
            "distance": round(distance_score, 3),
            "category": round(category_score, 3),
            "engagement": round(engagement_score, 3),
            "recency": round(recency_score, 3)
        },
        "should_filter_out": not within_range if max_distance_km > 0 else False
    }
