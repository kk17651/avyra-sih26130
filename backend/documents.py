import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

import models
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api", tags=["documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def doc_to_dict(d: models.Document) -> dict:
    return {
        "id": d.id,
        "application_id": d.application_id,
        "doc_name": d.doc_name,
        "filename": d.original_filename,
        "verify_status": d.verify_status,
        "verify_message": d.verify_message,
        "uploaded_at": d.uploaded_at.isoformat(),
    }


def get_owned_application(db: Session, user: models.User, app_id: int) -> models.Application:
    app = db.get(models.Application, app_id)
    if app is None or app.business.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/applications/{app_id}/documents")
async def upload_document(
    app_id: int,
    doc_name: str = Form(...),
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = get_owned_application(db, user, app_id)

    if doc_name not in [d.doc_name for d in app.approval.documents]:
        raise HTTPException(status_code=400, detail="This document is not required for this approval")
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only PDF, JPG, PNG or WEBP files are allowed")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="File is larger than 5 MB")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".bin"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as f:
        f.write(content)

    # Same document dobara upload ho to purana replace karo
    old = (
        db.query(models.Document)
        .filter_by(application_id=app.id, doc_name=doc_name)
        .first()
    )
    if old:
        try:
            os.remove(old.stored_path)
        except OSError:
            pass
        db.delete(old)
        db.flush()

    doc = models.Document(
        application_id=app.id,
        doc_name=doc_name,
        original_filename=file.filename or stored_name,
        stored_path=os.path.join(UPLOAD_DIR, stored_name),
        content_type=file.content_type or "",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"document": doc_to_dict(doc)}


@router.get("/applications/{app_id}/documents")
def list_documents(
    app_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app = get_owned_application(db, user, app_id)
    required = [d.doc_name for d in app.approval.documents]
    docs = db.query(models.Document).filter_by(application_id=app.id).all()
    return {"required": required, "documents": [doc_to_dict(d) for d in docs]}