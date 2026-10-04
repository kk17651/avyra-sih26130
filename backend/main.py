from fastapi import FastAPI, Depends
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from auth import router as auth_router
from businesses import router as businesses_router
from approvals import router as approvals_router
from sqlalchemy import String, Integer, DateTime, ForeignKey,Text
from applications import router as applications_router
from officer import router as officer_router
from roadmap import router as roadmap_router
from documents import router as documents_router
from chatbot import router as chatbot_router
from database import get_db, engine, Base
import models  # noqa: F401  (taaki tables register ho jayein)

# Tables database mein bana do (agar pehle se nahi hain)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Avyra API")
app.include_router(auth_router)
app.include_router(businesses_router)
app.include_router(approvals_router)
app.include_router(applications_router)
app.include_router(officer_router)
app.include_router(roadmap_router)
app.include_router(chatbot_router)
app.include_router(documents_router)
@app.get("/api/health")
def health():
    return {"status": "ok", "message": "Avyra backend is running"}


@app.get("/api/health/db")
def health_db(db: Session = Depends(get_db)):
    version = db.execute(text("SELECT version()")).scalar()
    return {"status": "ok", "database": "connected", "version": version}


@app.get("/api/health/tables")
def health_tables():
    return {"tables": inspect(engine).get_table_names()}
