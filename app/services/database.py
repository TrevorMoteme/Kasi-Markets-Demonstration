"""
Database service functions - Demonstrates data access patterns
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from supabase import create_client
import logging

from ..config.settings import settings

logger = logging.getLogger(__name__)

# Mock databases (in a real app these would be Supabase/PostgreSQL)
mock_users = {}
mock_businesses = {}
mock_posts = {}


async def db_get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email - demonstrates async database access pattern"""
    return mock_users.get(email)


async def db_get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID - demonstrates proper data access"""
    for user in mock_users.values():
        if user.get("id") == user_id:
            return user
    return None


async def db_create_user(user_data: dict) -> Dict:
    """Create a new user - demonstrates insert pattern"""
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        **user_data,
        "created_at": datetime.utcnow().isoformat(),
        "is_verified": True
    }
    mock_users[user_data["email"]] = user
    return user


async def db_get_business(business_id: str) -> Optional[Dict]:
    """Get business by ID - demonstrates data access pattern"""
    return mock_businesses.get(business_id)


async def db_get_businesses(limit: int = 20, offset: int = 0) -> List[Dict]:
    """Get all businesses with pagination - demonstrates query pattern"""
    businesses = list(mock_businesses.values())
    return businesses[offset:offset + limit]


async def db_create_business(business_data: dict, owner_id: str) -> Dict:
    """Create a new business - demonstrates transaction pattern"""
    business_id = str(uuid.uuid4())
    business = {
        "id": business_id,
        **business_data,
        "owner_id": owner_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    mock_businesses[business_id] = business
    return business


async def db_get_posts(limit: int = 20, offset: int = 0) -> List[Dict]:
    """Get posts with pagination - demonstrates query pattern"""
    posts = list(mock_posts.values())
    return posts[offset:offset + limit]


async def db_create_post(post_data: dict, business_id: str) -> Dict:
    """Create a new post - demonstrates denormalization pattern"""
    post_id = str(uuid.uuid4())
    
    # Get business for denormalized data
    business = await db_get_business(business_id)
    
    post = {
        "id": post_id,
        "business_id": business_id,
        **post_data,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "business_name": business.get("name") if business else None,
        "business_category": business.get("category") if business else None,
        "business_latitude": business.get("latitude") if business else None,
        "business_longitude": business.get("longitude") if business else None,
        "business_city": business.get("city") if business else None
    }
    mock_posts[post_id] = post
    return post
