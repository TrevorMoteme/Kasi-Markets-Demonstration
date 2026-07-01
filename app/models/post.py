"""
Post models for the KASI Portfolio Demo
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class PostCreate(BaseModel):
    """Model for creating a post"""
    title: str = Field(..., min_length=2, max_length=200)
    content: Optional[str] = None
    post_type: str = Field("post", pattern="^(post|offer|event|announcement)$")
    hashtags: List[str] = []
    media_urls: List[str] = []


class PostResponse(BaseModel):
    """Model for post data in responses"""
    id: str
    business_id: str
    title: str
    content: Optional[str] = None
    post_type: str
    media_urls: List[str] = []
    hashtags: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    business_name: Optional[str] = None
    business_logo: Optional[str] = None
    business_category: Optional[str] = None
    business_latitude: Optional[float] = None
    business_longitude: Optional[float] = None
    
    is_liked: bool = False
    relevance_score: Optional[float] = None
    distance_km: Optional[float] = None

    class Config:
        orm_mode = True


class CommentCreate(BaseModel):
    """Model for creating a comment"""
    content: str = Field(..., min_length=1, max_length=500)


class CommentResponse(BaseModel):
    """Model for comment data in responses"""
    id: str
    post_id: str
    user_id: str
    content: str
    created_at: datetime
    updated_at: datetime
    username: Optional[str] = None

    class Config:
        orm_mode = True
