from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import models
from applications import app_to_dict
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/officer", tags=["officer"])


class DecisionIn(BaseModel):
    remarks: str = ""


def require_officer(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "officer":
        raise HTTPException(status_code=403, detail="Officer access only")
    return user


def sla_info(a: models.Application) -> dict:
    """SLA ka status: green / yellow / red aur kitna time bacha."""
    if a.status in ("APPROVED", "REJECTED"):
        return {"sla_state": "done", "sla_label": "Completed"}
    if not a.sla_due_at:
        return {"sla_state": "none", "sla_label": "-"}
    hours_left = (a.sla_due_at - datetime.utcnow()).total_seconds() / 3600
    if hours_left < 0:
        return {"sla_state": "red", "sla_label": f"Breached {abs(int(hours_left))}h ago"}
    if hours_left < 24:
        return {"sla_state": "yellow", "sla_label": f"{int(hours_left)}h left"}
    return {"sla_state": "green", "sla_label": f"{int(hours_left // 24)} days left"}


def officer_app_dict(a: models.Application) -> dict:
    return {**app_to_dict(a), **sla_info(a)}


def dept_query(db: Session, officer: models.User):
    q = db.query(models.Application).filter(models.Application.status != "DRAFT")
    if officer.department_id:
        q = q.join(models.Approval).filter(models.Approval.department_id == officer.department_id)
    return q


@router.get("/applications")
def officer_applications(
    officer: models.User = Depends(require_officer), db: Session = Depends(get_db)
):
    apps = dept_query(db, officer).order_by(models.Application.id.desc()).all()
    return {"applications": [officer_app_dict(a) for a in apps]}


@router.get("/dashboard")
def officer_dashboard(
    officer: models.User = Depends(require_officer), db: Session = Depends(get_db)
):
    apps = dept_query(db, officer).all()
    info = [sla_info(a)["sla_state"] for a in apps]
    return {
        "new_applications": sum(1 for a in apps if a.status == "SUBMITTED"),
        "pending": sum(1 for a in apps if a.status in ("SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED")),
        "sla_nearing": sum(1 for s in info if s == "yellow"),
        "sla_breached": sum(1 for s in info if s == "red"),
        "approved": sum(1 for a in apps if a.status == "APPROVED"),
        "department": officer.department.name if officer.department else "All Departments",
    }


def decide(app_id: int, new_status: str, remarks: str, officer: models.User, db: Session):
    app = db.get(models.Application, app_id)
    if app is None or app.status == "DRAFT":
        raise HTTPException(status_code=404, detail="Application not found")
    if officer.department_id and app.approval.department_id != officer.department_id:
        raise HTTPException(status_code=403, detail="This application belongs to another department")
    app.status = new_status
    app.remarks = remarks
    db.commit()
    db.refresh(app)
    return {"application": officer_app_dict(app)}


@router.post("/applications/{app_id}/approve")
def approve(app_id: int, body: DecisionIn, officer: models.User = Depends(require_officer), db: Session = Depends(get_db)):
    return decide(app_id, "APPROVED", body.remarks or "Approved", officer, db)


@router.post("/applications/{app_id}/reject")
def reject(app_id: int, body: DecisionIn, officer: models.User = Depends(require_officer), db: Session = Depends(get_db)):
    return decide(app_id, "REJECTED", body.remarks or "Rejected", officer, db)


@router.post("/applications/{app_id}/query")
def raise_query(app_id: int, body: DecisionIn, officer: models.User = Depends(require_officer), db: Session = Depends(get_db)):
    return decide(app_id, "QUERY_RAISED", body.remarks or "Please provide additional information", officer, db)