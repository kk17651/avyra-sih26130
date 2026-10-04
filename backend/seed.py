from database import SessionLocal, engine, Base
import models
from security import hash_password

Base.metadata.create_all(bind=engine)

DEPARTMENTS = [
    ("Fire & Safety Department", "FIRE"),
    ("Pollution Control Board", "SPCB"),
    ("Directorate of Factories", "FACT"),
    ("Municipal Corporation", "MUNI"),
]

OFFICERS = [
    ("Fire Officer (Demo)", "fire.officer@demo.gov.in", "FIRE"),
    ("Pollution Officer (Demo)", "pollution.officer@demo.gov.in", "SPCB"),
    ("Factories Officer (Demo)", "factories.officer@demo.gov.in", "FACT"),
    ("Municipal Officer (Demo)", "municipal.officer@demo.gov.in", "MUNI"),
]

DEMO_PASSWORD = "Demo@1234"


def run():
    db = SessionLocal()
    try:
        # Departments
        for name, code in DEPARTMENTS:
            if not db.query(models.Department).filter_by(code=code).first():
                db.add(models.Department(name=name, code=code))
        db.commit()

        # Officers
        for name, email, code in OFFICERS:
            if db.query(models.User).filter_by(email=email).first():
                continue
            dept = db.query(models.Department).filter_by(code=code).first()
            db.add(
                models.User(
                    name=name,
                    email=email,
                    password_hash=hash_password(DEMO_PASSWORD),
                    role="officer",
                    department_id=dept.id,
                )
            )
        db.commit()

        print("Departments:", db.query(models.Department).count())
        print("Users:", db.query(models.User).count())
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()