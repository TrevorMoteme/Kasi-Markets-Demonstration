"""
KASI Backend Portfolio - Main Application
A demonstration of my backend development skills using FastAPI.
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from typing import Optional, List
import os
import uuid
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# 1. CONFIGURATION
# ============================================================================

class Settings:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "https://example.supabase.co")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "your-supabase-key")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
    JWT_ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:8000"]

settings = Settings()

# ============================================================================
# 2. MODELS (Pydantic)
# ============================================================================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    user_type: str = Field(..., pattern="^(business_owner|customer)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    user_type: str
    created_at: datetime

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BusinessCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: str
    description: str = Field(..., min_length=10)
    address: str
    city: str
    state: str
    zip_code: str
    phone: str
    email: EmailStr
    website: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class BusinessResponse(BaseModel):
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
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PostCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    content: Optional[str] = None
    post_type: str = Field("post", pattern="^(post|offer|event|announcement)$")
    hashtags: List[str] = []

class PostResponse(BaseModel):
    id: str
    business_id: str
    title: str
    content: Optional[str]
    post_type: str
    hashtags: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    created_at: datetime
    updated_at: datetime
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    business_latitude: Optional[float] = None
    business_longitude: Optional[float] = None
    is_liked: bool = False

    class Config:
        orm_mode = True

# ============================================================================
# 3. SECURITY
# ============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
        return {"id": "user123", "email": email, "username": "demo_user"}
    except jwt.JWTError:
        return None

# ============================================================================
# 4. MOCK DATABASE (Demonstrates data structure)
# ============================================================================

mock_users = {}
mock_businesses = {}
mock_posts = {}

# ============================================================================
# 5. DATABASE FUNCTIONS (Mock)
# ============================================================================

async def db_get_user_by_email(email: str):
    """Mock database function - demonstrates proper async pattern"""
    return mock_users.get(email)

async def db_create_user(user_data: dict):
    """Mock database function - shows proper error handling"""
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        **user_data,
        "created_at": datetime.utcnow().isoformat(),
        "is_verified": True
    }
    mock_users[user_data["email"]] = user
    return user

async def db_get_business(business_id: str):
    """Get business by ID - demonstrates proper data access pattern"""
    return mock_businesses.get(business_id)

async def db_get_businesses(limit: int = 20, offset: int = 0):
    """Get all businesses with pagination"""
    businesses = list(mock_businesses.values())
    return businesses[offset:offset + limit]

async def db_create_business(business_data: dict, owner_id: str):
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

async def db_get_posts(limit: int = 20, offset: int = 0):
    """Get posts with pagination - demonstrates query pattern"""
    posts = list(mock_posts.values())
    return posts[offset:offset + limit]

async def db_create_post(post_data: dict, business_id: str):
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

# ============================================================================
# 6. SCORING ALGORITHM (Recommendation Engine)
# ============================================================================

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometers"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

def calculate_relevance_score(
    post: dict,
    user_location: Optional[tuple],
    max_distance_km: float,
    preferred_categories: List[str]
) -> dict:
    """
    Calculate relevance score for a post.
    
    This is the core recommendation algorithm.
    It balances distance, category match, and engagement.
    """
    distance_score = 0.5
    category_score = 0.5
    engagement_score = 0.0
    recency_score = 0.5
    
    # 1. Distance Score
    distance_km = None
    within_range = True
    
    if user_location and post.get("business_latitude") and post.get("business_longitude"):
        distance_km = calculate_distance(
            user_location[0], user_location[1],
            post["business_latitude"], post["business_longitude"]
        )
        
        if max_distance_km > 0:
            within_range = distance_km <= max_distance_km
            ratio = min(distance_km / max_distance_km, 1)
            distance_score = max(0.3, 1.0 - (ratio * 0.7))
        else:
            distance_score = 1.0
    
    # 2. Category Score
    business_category = post.get("business_category", "")
    if business_category and preferred_categories:
        for pref in preferred_categories:
            if pref.lower() == business_category.lower():
                category_score = 1.0
                break
            elif pref.lower() in business_category.lower():
                category_score = 0.8
                break
    
    # 3. Engagement Score
    engagement = post.get("likes_count", 0) + (post.get("comments_count", 0) * 2)
    if engagement > 0:
        import math
        engagement_score = min(1.0, math.log10(engagement + 1) / 2)
    
    # 4. Recency Score
    if post.get("created_at"):
        try:
            post_time = datetime.fromisoformat(post["created_at"])
            hours_old = (datetime.utcnow() - post_time).total_seconds() / 3600
            if hours_old < 1:
                recency_score = 1.0
            elif hours_old < 24:
                recency_score = 0.9
            elif hours_old < 168:
                recency_score = 0.5
            else:
                recency_score = 0.2
        except:
            recency_score = 0.5
    
    # 5. Final Score (Weighted)
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
    
    return {
        "relevance_score": round(final_score, 4),
        "distance_km": round(distance_km, 2) if distance_km else None,
        "category_match": category_score >= 0.7,
        "within_distance_range": within_range,
        "score_breakdown": {
            "distance": round(distance_score, 3),
            "category": round(category_score, 3),
            "engagement": round(engagement_score, 3),
            "recency": round(recency_score, 3)
        }
    }

# ============================================================================
# 7. API ROUTES
# ============================================================================

app = FastAPI(
    title="KASI Backend API",
    description="A full-stack web application with personalized content feeds",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 7.1 AUTHENTICATION ROUTES
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "KASI Backend API is running",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": "development"
    }

@app.post("/register", response_model=dict)
async def register_user(user: UserCreate):
    """Register a new user"""
    existing = await db_get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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

@app.post("/login", response_model=TokenResponse)
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

# ============================================================================
# 7.2 BUSINESS ROUTES
# ============================================================================

@app.get("/businesses", response_model=List[BusinessResponse])
async def get_businesses(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """Get all businesses with pagination"""
    businesses = await db_get_businesses(limit, offset)
    return businesses

@app.get("/businesses/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    """Get a specific business by ID"""
    business = await db_get_business(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@app.post("/businesses", response_model=BusinessResponse)
async def create_business(
    business: BusinessCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new business (requires authentication)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    created_business = await db_create_business(
        business.dict(),
        current_user["id"]
    )
    return created_business

# ============================================================================
# 7.3 POST ROUTES
# ============================================================================

@app.get("/posts", response_model=List[PostResponse])
async def get_posts(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """Get all posts with pagination"""
    posts = await db_get_posts(limit, offset)
    return posts

@app.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    business_id: str = Query(..., description="Business ID"),
    current_user: dict = Depends(get_current_user)
):
    """Create a new post (requires authentication)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    created_post = await db_create_post(post.dict(), business_id)
    return created_post

@app.post("/posts/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Like a post (requires authentication)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    post = mock_posts.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post["likes_count"] = post.get("likes_count", 0) + 1
    return {"message": "Post liked successfully", "likes_count": post["likes_count"]}

@app.delete("/posts/{post_id}/like")
async def unlike_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unlike a post (requires authentication)"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    post = mock_posts.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post["likes_count"] = max(0, post.get("likes_count", 0) - 1)
    return {"message": "Post unliked successfully", "likes_count": post["likes_count"]}

# ============================================================================
# 7.4 FEED ROUTES
# ============================================================================

@app.get("/feed/personalized")
async def get_personalized_feed(
    max_distance_km: Optional[float] = Query(None, ge=0, le=45000),
    preferred_categories: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
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

@app.get("/feed/fast")
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

# ============================================================================
# 8. ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": True,
        "status_code": exc.status_code,
        "detail": exc.detail
    }

# ============================================================================
# 9. RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
