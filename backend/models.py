from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text

from database import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)

    officers: Mapped[list["User"]] = relationship(back_populates="department")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))  # "entrepreneur" ya "officer"
    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    department: Mapped["Department | None"] = relationship(back_populates="officers")
    businesses: Mapped[list["Business"]] = relationship(back_populates="owner")


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    business_name: Mapped[str] = mapped_column(String(200))
    industry: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(120))
    project_size: Mapped[str] = mapped_column(String(120))
    stage: Mapped[str] = mapped_column(String(120))
    owner_name: Mapped[str] = mapped_column(String(120), default="")
    business_type: Mapped[str] = mapped_column(String(60), default="")
    num_members: Mapped[int] = mapped_column(Integer, default=0)
    investment_lakh: Mapped[int] = mapped_column(Integer, default=0)
    uses_hazardous: Mapped[str] = mapped_column(String(10), default="No")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="businesses")
    
class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    description: Mapped[str] = mapped_column(String(500), default="")
    why_needed: Mapped[str] = mapped_column(String(500), default="")
    sla_days: Mapped[int] = mapped_column(Integer, default=10)

    department: Mapped["Department"] = relationship()
    rules: Mapped[list["ApprovalRule"]] = relationship(back_populates="approval")
    documents: Mapped[list["ApprovalDocument"]] = relationship(back_populates="approval")


class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    approval_id: Mapped[int] = mapped_column(ForeignKey("approvals.id"))
    # field: industry / project_size / stage / location, match: text jo value mein hona chahiye
    # "*" ka matlab: sabke liye
    field: Mapped[str] = mapped_column(String(40))
    match: Mapped[str] = mapped_column(String(120))

    approval: Mapped["Approval"] = relationship(back_populates="rules")


class ApprovalDocument(Base):
    __tablename__ = "approval_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    approval_id: Mapped[int] = mapped_column(ForeignKey("approvals.id"))
    doc_name: Mapped[str] = mapped_column(String(200))

    approval: Mapped["Approval"] = relationship(back_populates="documents")

class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_id: Mapped[int] = mapped_column(ForeignKey("businesses.id"))
    approval_id: Mapped[int] = mapped_column(ForeignKey("approvals.id"))
    status: Mapped[str] = mapped_column(String(30), default="DRAFT")
    remarks: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sla_due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    business: Mapped["Business"] = relationship()
    approval: Mapped["Approval"] = relationship()

    @property
    def ref(self) -> str:
        return f"APP-{1000 + self.id}"
    
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"))
    doc_name: Mapped[str] = mapped_column(String(200))
    original_filename: Mapped[str] = mapped_column(String(300))
    stored_path: Mapped[str] = mapped_column(String(500))
    content_type: Mapped[str] = mapped_column(String(100), default="")
    verify_status: Mapped[str] = mapped_column(String(20), default="PENDING")
    verify_message: Mapped[str] = mapped_column(Text, default="")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    application: Mapped["Application"] = relationship()