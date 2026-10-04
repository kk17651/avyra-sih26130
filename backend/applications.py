from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from rules_engine import discover_approvals

router = APIRouter(prefix="/api/applications", tags=["applications"])


def app_to_dict(a: models.Application) -> dict:
    return {
        "id": a.id,
        "ref": a.ref,
        "approval_name": a.approval.name,
        "department": a.approval.department.name,
        "status": a.status,
        "remarks": a.remarks,
        "sla_days": a.approval.sla_days,
        "created_at": a.created_at.isoformat(),
        "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        "sla_due_at": a.sla_due_at.isoformat() if a.sla_due_at else None,
        "business_name": a.business.business_name,
    }


def get_my_business(db: Session, user: models.User) -> models.Business:
    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    if business is None:
        raise HTTPException(status_code=400, detail="Please create your business profile first")
    return business


@router.post("/generate")
def generate_applications(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Rules ke hisaab se har approval ka draft application banata hai (duplicate nahi)."""
    if user.role != "entrepreneur":
        raise HTTPException(status_code=403, detail="Only entrepreneurs can do this")
    business = get_my_business(db, user)

    existing = {
        a.approval_id
        for a in db.query(models.Application).filter_by(business_id=business.id).all()
    }
    for approval in discover_approvals(db, business):
        if approval.id not in existing:
            db.add(models.Application(business_id=business.id, approval_id=approval.id))
    db.commit()

    apps = db.query(models.Application).filter_by(business_id=business.id).order_by(models.Application.id).all()
    return {"applications": [app_to_dict(a) for a in apps]}


@router.get("")
def my_applications(
    user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    business = get_my_business(db, user)
    apps = db.query(models.Application).filter_by(business_id=business.id).order_by(models.Application.id).all()
    return {"applications": [app_to_dict(a) for a in apps]}


@router.post("/{app_id}/submit")
def submit_application(
    app_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    business = get_my_business(db, user)
    app = db.get(models.Application, app_id)
    if app is None or app.business_id != business.id:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.status != "DRAFT":
        raise HTTPException(status_code=400, detail="Only draft applications can be submitted")

    app.status = "SUBMITTED"
    app.submitted_at = datetime.utcnow()
    app.sla_due_at = app.submitted_at + timedelta(days=app.approval.sla_days)
    db.commit()
    db.refresh(app)
    return {"application": app_to_dict(app)}