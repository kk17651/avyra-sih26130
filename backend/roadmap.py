from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from demo_ai import WHEN, build_summary, explain_document, how_steps, personal_reason
from rules_engine import discover_approvals

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.get("/roadmap")
def roadmap(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "entrepreneur":
        raise HTTPException(status_code=403, detail="Only entrepreneurs can view a roadmap")

    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    if business is None:
        raise HTTPException(status_code=400, detail="Please create your business profile first")

    approvals = discover_approvals(db, business)

    items = []
    for a in approvals:
        items.append(
            {
                "code": a.code,
                "name": a.name,
                "department": a.department.name,
                "sla_days": a.sla_days,
                "what": a.why_needed,
                "why_you": personal_reason(a.code, business),
                "when": WHEN.get(a.code, "Before starting operations."),
                "how": how_steps(a.name),
                "documents": [explain_document(d.doc_name) for d in a.documents],
            }
        )

    total_days = max((a.sla_days for a in approvals), default=0)
    longest = max(approvals, key=lambda a: a.sla_days).name if approvals else "-"

    return {
        "summary": build_summary(business, len(approvals), total_days, longest),
        "total_approvals": len(approvals),
        "estimated_days": total_days,
        "approvals": items,
    }