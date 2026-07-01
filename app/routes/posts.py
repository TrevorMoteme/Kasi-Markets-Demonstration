"""
Post routes - CRUD operations for posts
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from ..models.post import PostCreate, PostResponse
from ..services.database import db_get_posts, db_create_post
from ..services.auth import get_current_user_required

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("/", response_model=List[PostResponse])
async def get_posts(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """Get all posts with pagination"""
    posts = await db_get_posts(limit, offset)
    return posts


@router.post("/", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    business_id: str = Query(..., description="Business ID"),
    current_user: dict = Depends(get_current_user_required)
):
    """Create a new post (requires authentication)"""
    created_post = await db_create_post(post.dict(), business_id)
    return created_post


@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: dict = Depends(get_current_user_required)
):
    """Like a post (requires authentication)"""
    from ..services.database import mock_posts
    
    post = mock_posts.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post["likes_count"] = post.get("likes_count", 0) + 1
    return {"message": "Post liked successfully", "likes_count": post["likes_count"]}


@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: str,
    current_user: dict = Depends(get_current_user_required)
):
    """Unlike a post (requires authentication)"""
    from ..services.database import mock_posts
    
    post = mock_posts.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post["likes_count"] = max(0, post.get("likes_count", 0) - 1)
    return {"message": "Post unliked successfully", "likes_count": post["likes_count"]}
