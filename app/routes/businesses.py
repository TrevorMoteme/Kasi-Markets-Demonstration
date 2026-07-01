"""
Business routes - CRUD operations for businesses
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List

from ..models.business import BusinessCreate, BusinessResponse
from ..services.database import db_get_business, db_get_businesses, db_create_business
from ..services.auth import get_current_user_required

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("/", response_model=List[BusinessResponse])
async def get_businesses(
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0)
):
    """Get all businesses with pagination"""
    businesses = await db_get_businesses(limit, offset)
    return businesses


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    """Get a specific business by ID"""
    business = await db_get_business(business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.post("/", response_model=BusinessResponse)
async def create_business(
    business: BusinessCreate,
    current_user: dict = Depends(get_current_user_required)
):
    """Create a new business (requires authentication)"""
    created_business = await db_create_business(
        business.dict(),
        current_user["id"]
    )
    return created_business
