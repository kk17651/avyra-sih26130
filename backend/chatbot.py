from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db
from demo_ai import WHEN, personal_reason
from rules_engine import discover_approvals

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

SUGGESTIONS = [
    "What should I do next?",
    "Which documents are missing?",
    "Where is my application?",
    "Why do I need these approvals?",
]


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=500)


def has(text: str, words: list[str]) -> bool:
    return any(w in text for w in words)


def reply(text: str) -> dict:
    return {"reply": text, "suggestions": SUGGESTIONS}


def officer_reply(text: str, user: models.User, db: Session) -> dict:
    from officer import dept_query, sla_info

    apps = dept_query(db, user).all()
    pending = [a for a in apps if a.status in ("SUBMITTED", "UNDER_REVIEW", "QUERY_RAISED")]
    breached = [a for a in pending if sla_info(a)["sla_state"] == "red"]
    nearing = [a for a in pending if sla_info(a)["sla_state"] == "yellow"]

    if not apps:
        return reply("No applications have been submitted to your department yet.")
    lines = [f"You have {len(pending)} pending application(s)."]
    if breached:
        lines.append(f"{len(breached)} have crossed the SLA deadline: " + ", ".join(a.ref for a in breached) + ".")
    if nearing:
        lines.append(f"{len(nearing)} are close to the deadline: " + ", ".join(a.ref for a in nearing) + ".")
    if not breached and not nearing:
        lines.append("All pending applications are within their SLA.")
    return {"reply": " ".join(lines), "suggestions": []}


@router.post("/chat")
def chat(body: ChatIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    text = body.message.lower().strip()

    if user.role == "officer":
        return officer_reply(text, user, db)

    business = db.query(models.Business).filter_by(owner_id=user.id).first()
    if business is None:
        return reply("Please complete your business profile first. After that I can tell you exactly which approvals you need.")

    approvals = discover_approvals(db, business)
    apps = (
        db.query(models.Application)
        .filter_by(business_id=business.id)
        .order_by(models.Application.id)
        .all()
    )

    # Har application ke missing documents
    missing_by_app = {}
    for a in apps:
        required = [d.doc_name for d in a.approval.documents]
        uploaded = {
            d.doc_name for d in db.query(models.Document).filter_by(application_id=a.id).all()
        }
        missing_by_app[a.id] = [d for d in required if d not in uploaded]

    # Greeting
    if has(text, ["hello", "hi ", "hii", "namaste", "hey"]) or text in ("hi", "hey"):
        return reply(f"Hello! I am your approval assistant for {business.business_name}. Ask me what to do next, which documents are missing, or where your applications stand.")

    # Next step
    if has(text, ["next", "agla", "aage", "kya karna", "what should", "what do i do", "start"]):
        if not apps:
            return reply("Open your Dashboard once. It will create your application checklist, then you can start uploading documents.")
        for a in apps:
            if a.status == "QUERY_RAISED":
                return reply(f"The officer raised a query on {a.approval.name} ({a.ref}): \"{a.remarks}\". Please respond to it.")
        for a in apps:
            if a.status == "DRAFT" and missing_by_app[a.id]:
                m = missing_by_app[a.id]
                return reply(f"Your {a.approval.name} application has {len(m)} missing document(s): {', '.join(m)}. Upload them from the Dashboard to continue.")
        for a in apps:
            if a.status == "DRAFT":
                return reply(f"All documents for {a.approval.name} ({a.ref}) are uploaded. You can submit it now from the Dashboard.")
        return reply("All your applications are submitted. Now the departments are reviewing them. I will tell you if any action is needed from your side.")

    # Missing documents
    if has(text, ["missing", "document", "documents", "kaunse doc", "kya doc", "docs", "papers"]):
        parts = [f"{a.approval.name}: {', '.join(missing_by_app[a.id])}" for a in apps if missing_by_app[a.id]]
        if not apps:
            return reply("Open your Dashboard once so your application checklist is created. Then I can list the documents.")
        if not parts:
            return reply("Great news. No documents are missing for any of your applications.")
        return reply("Documents still needed. " + " | ".join(parts))

    # Status
    if has(text, ["status", "where", "kahan", "pending", "track", "application"]):
        if not apps:
            return reply("You do not have any applications yet. Open the Dashboard to generate them.")
        lines = [f"{a.ref} {a.approval.name}: {a.status.replace('_', ' ').title()}" for a in apps]
        return reply("Your applications. " + " | ".join(lines))

    # Why
    if has(text, ["why", "kyun", "kyu", "reason", "zaroorat", "required"]):
        if not approvals:
            return reply("No approvals matched your profile yet.")
        lines = [f"{a.name}: {personal_reason(a.code, business)}" for a in approvals]
        return reply(" | ".join(lines))

    # List approvals
    if has(text, ["approval", "approvals", "clearance", "license", "kaunse", "which"]):
        if not approvals:
            return reply("No approvals matched your profile yet.")
        return reply(f"Based on your profile you need {len(approvals)} approvals: " + ", ".join(a.name for a in approvals) + ".")

    # Time / SLA
    if has(text, ["time", "days", "kitna", "sla", "deadline", "how long", "kab"]):
        if not approvals:
            return reply("No approvals matched your profile yet.")
        lines = [f"{a.name}: about {a.sla_days} days" for a in approvals]
        longest = max(a.sla_days for a in approvals)
        return reply(" | ".join(lines) + f". If you apply in parallel, expect roughly {longest} days overall. These are estimates, not guaranteed dates.")

    # When
    if has(text, ["when", "apply"]):
        return reply(" | ".join(f"{a.name}: {WHEN.get(a.code, 'Before starting operations.')}" for a in approvals))

    # Scheme
    if has(text, ["scheme", "subsidy", "loan", "incentive", "yojana"]):
        return reply("Demo suggestion: since you are a new industrial unit, check MSME benefits after your Udyam registration. A full scheme finder is coming soon.")

    return reply("I can help with your approvals, missing documents, application status and timelines. Try one of the questions below.")