"""
User models for the KASI Portfolio Demo
"""

from typing import Optional
from pydantic import BaseModel, Field, EmailStr, validator
from datetime import datetime


class UserCreate(BaseModel):
    """Model for user registration"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(...)
    password: str = Field(..., min_length=6)
    user_type: str = Field(..., pattern="^(business_owner|customer)$")

    @validator('username')
    def username_validator(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower()


class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr = Field(...)
    password: str = Field(...)


class UserResponse(BaseModel):
    """Model for user data in responses"""
    id: str
    username: str
    email: str
    user_type: str
    is_verified: bool = False
    created_at: datetime

    class Config:
        orm_mode = True


class TokenResponse(BaseModel):
    """Model for authentication token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
