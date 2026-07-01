"""
Business models for the KASI Portfolio Demo
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class BusinessCreate(BaseModel):
    """Model for creating a business"""
    name: str = Field(..., min_length=2, max_length=100)
    category: str
    description: str = Field(..., min_length=10, max_length=500)
    address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: str
    website: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    tags: List[str] = []


class BusinessResponse(BaseModel):
    """Model for business data in responses"""
    id: str
    name: str
    category: str
    description: str
    address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: str
    website: Optional[str] = None
    latitude: float
    longitude: float
    tags: List[str] = []
    logo_url: Optional[str] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime
    follower_count: int = 0
    post_count: int = 0
    is_following: bool = False

    class Config:
        orm_mode = True
