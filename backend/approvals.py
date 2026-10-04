from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from rules_engine import discover_approvals

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def approval_to_dict(a: models.Approval) -> dict:
    return {
        "id": a.id,
        "code": a.code,
        "name": a.name,
        "department": a.department.name,
        "why_needed": a.why_needed,
        "sla_days": a.sla_days,
        "documents": [d.doc_name for d in a.documents],
    }


@router.get("")
def list_approvals(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return {"approvals": [approval_to_dict(a) for a in db.query(models.Approval).all()]}


@router.post("/discover")
def discover(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    if business is None:
        raise HTTPException(status_code=400, detail="Pehle business profile banao")
    approvals = discover_approvals(db, business)
    return {"approvals": [approval_to_dict(a) for a in approvals]}