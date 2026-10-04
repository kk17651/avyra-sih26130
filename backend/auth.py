import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from security import hash_password, verify_password

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
TOKEN_HOURS = 24 * 7
DEMO_LOGIN = os.getenv("DEMO_LOGIN", "true").lower() == "true"

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginIn(BaseModel):
    email: str = Field(min_length=1, max_length=200)
    password: str = ""
    role: str = "entrepreneur"
    name: str = ""


def create_token(user: models.User) -> str:
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def user_to_dict(user: models.User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department.name if user.department else None,
        "department_code": user.department.code if user.department else None,
    }


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Login required")
    try:
        data = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(data["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again")

    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def pick_department_code(email: str) -> str:
    e = email.lower()
    if "pollution" in e or "spcb" in e:
        return "SPCB"
    if "factor" in e:
        return "FACT"
    if "muni" in e:
        return "MUNI"
    return "FIRE"


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(status_code=409, detail="This email is already registered")

    user = models.User(
        name=body.name,
        email=email,
        password_hash=hash_password(body.password),
        role="entrepreneur",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_token(user), "user": user_to_dict(user)}


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    email = body.email.strip().lower()
    user = db.query(models.User).filter_by(email=email).first()

    if DEMO_LOGIN:
        # Prototype mode: koi bhi email/password chalega
        if user is None:
            role = "officer" if body.role == "officer" else "entrepreneur"
            dept_id = None
            if role == "officer":
                dept = db.query(models.Department).filter_by(code=pick_department_code(email)).first()
                dept_id = dept.id if dept else None
            user = models.User(
                name=body.name.strip() or email.split("@")[0].replace(".", " ").title() or "Demo User",
                email=email,
                password_hash=hash_password(body.password or "demo"),
                role=role,
                department_id=dept_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return {"token": create_token(user), "user": user_to_dict(user)}

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": create_token(user), "user": user_to_dict(user)}


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {"user": user_to_dict(user)}