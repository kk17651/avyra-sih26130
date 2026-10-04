from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

NEW_DEPARTMENTS = [
    ("Petroleum & Explosives Safety Org.", "PESO"),
    ("State Drug Control Department", "DRUG"),
    ("Ministry of MSME", "MSME"),
]

# (code, name, dept_code, why, sla_days, [rules (field, match)], [documents])
NEW_APPROVALS = [
    ("PESO", "Petroleum & Explosives Safety License (PESO)", "PESO",
     "Required when hazardous or explosive material is stored or used.", 20,
     [("uses_hazardous", "Yes")],
     ["Storage Layout Plan", "Material Safety Data Sheet", "Fire Safety Plan", "PAN Card"]),
    ("DRUG", "State FDA Manufacturing License", "DRUG",
     "Required to manufacture pharmaceutical products.", 25,
     [("industry", "Pharma")],
     ["Qualified Person Certificate", "Plant Layout Plan", "Machinery List", "PAN Card"]),
    ("UDYAM", "GST & MSME Udyam Registration", "MSME",
     "Needed for tax compliance and MSME benefits.", 3,
     [("*", "*")],
     ["PAN Card", "Aadhaar Card", "Bank Account Details"]),
    ("LABOUR", "Labour & Employee Registration (ESI/PF)", "FACT",
     "Required once the workforce crosses 20 employees.", 10,
     [("num_members", ">=20")],
     ["Employee List", "Company PAN Card", "Address Proof"]),
]


def run():
    db = SessionLocal()
    try:
        for name, code in NEW_DEPARTMENTS:
            if not db.query(models.Department).filter_by(code=code).first():
                db.add(models.Department(name=name, code=code))
        db.commit()

        for code, name, dept_code, why, sla, rules, docs in NEW_APPROVALS:
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

        print("Departments:", db.query(models.Department).count())
        print("Approvals:", db.query(models.Approval).count())
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    run()