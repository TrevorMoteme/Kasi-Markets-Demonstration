"""
Authentication routes - Register and Login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from ..models.user import UserCreate, UserLogin, TokenResponse, UserResponse
from ..services.database import db_get_user_by_email, db_create_user
from ..services.auth import verify_password, create_access_token, get_current_user_required

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register_user(user: UserCreate):
    """Register a new user"""
    existing = await db_get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    from ..services.auth import get_password_hash
    hashed_password = get_password_hash(user.password)
    
    user_data = {
        "username": user.username,
        "email": user.email,
        "user_type": user.user_type,
        "hashed_password": hashed_password
    }
    
    created_user = await db_create_user(user_data)
    
    return {
        "message": "User registered successfully",
        "email": user.email,
        "user_type": user.user_type
    }


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Login and receive JWT token"""
    user = await db_get_user_by_email(login_data.email)
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["email"]})
    
    user_response = {k: v for k, v in user.items() if k not in ["hashed_password"]}
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_response
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user_required)):
    """Get current user information (requires authentication)"""
    return current_user
