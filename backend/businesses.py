from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


class BusinessIn(BaseModel):
    business_name: str = Field(min_length=2, max_length=200)
    industry: str = Field(max_length=120)
    location: str = Field(max_length=120)
    project_size: str = Field(max_length=120)
    stage: str = Field(max_length=120)
    owner_name: str = Field(default="", max_length=120)
    business_type: str = Field(default="", max_length=60)
    num_members: int = Field(default=0, ge=0, le=100000)
    investment_lakh: int = Field(default=0, ge=0, le=100000000)
    uses_hazardous: str = Field(default="No", max_length=10)


def business_to_dict(b: models.Business) -> dict:
    return {
        "id": b.id,
        "business_name": b.business_name,
        "industry": b.industry,
        "location": b.location,
        "project_size": b.project_size,
        "stage": b.stage,
        "owner_name": b.owner_name,
        "business_type": b.business_type,
        "num_members": b.num_members,
        "investment_lakh": b.investment_lakh,
        "uses_hazardous": b.uses_hazardous,
    }


@router.post("")
def save_business(
    body: BusinessIn,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "entrepreneur":
        raise HTTPException(status_code=403, detail="Only entrepreneurs can create a business profile")

    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    if business is None:
        business = models.Business(owner_id=user.id, **body.model_dump())
        db.add(business)
    else:
        for key, value in body.model_dump().items():
            setattr(business, key, value)

    db.commit()
    db.refresh(business)
    return {"business": business_to_dict(business)}


@router.get("/me")
def my_business(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    return {"business": business_to_dict(business) if business else None}