from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

# (code, name, dept_code, why, sla_days, [rules (field, match)], [documents])
APPROVALS = [
    ("FIRE", "Fire Safety NOC", "FIRE",
     "Aag se suraksha ke liye zaroori hai.", 7,
     [("*", "*")],
     ["Building Plan", "Fire Safety Plan", "Address Proof", "PAN Card"]),
    ("MUNI_CONN", "Water & Power Setup Connection", "MUNI",
     "Plant ke liye paani aur bijli connection.", 10,
     [("*", "*")],
     ["Land Ownership Proof", "Site Plan", "PAN Card"]),
    ("SPCB", "State Pollution Control Board (SPCB) Consent", "SPCB",
     "Pradushan niyam ke hisaab se consent.", 15,
     [("industry", "Manufacturing"), ("industry", "Chemical"), ("industry", "Pharma"), ("industry", "Textiles")],
     ["Process Flow Chart", "Effluent Treatment Plan", "Site Plan", "PAN Card"]),
    ("FACT", "Factory License & Building Plan Approval", "FACT",
     "Factory chalane ka license.", 12,
     [("industry", "Manufacturing"), ("industry", "Engineering"), ("industry", "Electronics")],
     ["Building Plan", "Machinery List", "Land Ownership Proof", "PAN Card"]),
    ("TRADE", "Municipal Trade License", "MUNI",
     "Local nagar nigam ka vyapar license.", 5,
     [("project_size", "Micro")],
     ["Address Proof", "PAN Card", "Aadhaar Card"]),
]


def run():
    db = SessionLocal()
    try:
        for code, name, dept_code, why, sla, rules, docs in APPROVALS:
            if db.query(models.Approval).filter_by(code=code).first():
                continue
            dept = db.query(models.Department).filter_by(code=dept_code).first()
            approval = models.Approval(
                code=code, name=name, department_id=dept.id, why_needed=why, sla_days=sla
            )
            approval.rules = [models.ApprovalRule(field=f, match=m) for f, m in rules]
            approval.documents = [models.ApprovalDocument(doc_name=d) for d in docs]
            db.add(approval)
        db.commit()
        print("Approvals:", db.query(models.Approval).count())
        print("Seed approvals complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()