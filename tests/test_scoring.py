"""
Unit tests for the scoring algorithm
"""

import pytest
from datetime import datetime, timedelta
from app.services.scoring import calculate_distance, calculate_relevance_score


def test_calculate_distance():
    """Test distance calculation between two points"""
    # Johannesburg to Cape Town (approx 1260km)
    jhb_lat, jhb_lng = -26.2041, 28.0473
    ct_lat, ct_lng = -33.9249, 18.4241
    
    distance = calculate_distance(jhb_lat, jhb_lng, ct_lat, ct_lng)
    
    # Should be approximately 1260km
    assert 1200 < distance < 1300


def test_relevance_score_perfect_match():
    """Test relevance score when everything matches perfectly"""
    post = {
        "business_latitude": -26.2041,
        "business_longitude": 28.0473,
        "business_category": "Restaurant",
        "likes_count": 100,
        "comments_count": 50,
        "created_at": datetime.utcnow().isoformat()
    }
    
    user_location = (-26.2041, 28.0473)  # Same location
    
    result = calculate_relevance_score(
        post=post,
        user_location=user_location,
        max_distance_km=100,
        preferred_categories=["Restaurant"]
    )
    
    assert result["relevance_score"] > 0.8
    assert result["category_match"] == True
    assert result["within_distance_range"] == True


def test_relevance_score_category_mismatch():
    """Test relevance score when category doesn't match"""
    post = {
        "business_latitude": -26.2041,
        "business_longitude": 28.0473,
        "business_category": "Retail",
        "likes_count": 100,
        "comments_count": 50,
        "created_at": datetime.utcnow().isoformat()
    }
    
    user_location = (-26.2041, 28.0473)
    
    result = calculate_relevance_score(
        post=post,
        user_location=user_location,
        max_distance_km=100,
        preferred_categories=["Restaurant"]
    )
    
    # Should still have a score, but category match is False
    assert result["category_match"] == False
    assert result["relevance_score"] >= 0.3
