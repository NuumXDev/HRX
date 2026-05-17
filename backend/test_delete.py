import requests
from app.database import SessionLocal
from app.models.candidate import Candidate

db = SessionLocal()
c = db.query(Candidate).first()
if c:
    print(f"Testing delete for: {c.id}")
    res = requests.delete(f"http://127.0.0.1:8000/api/v1/candidates/{c.id}")
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text}")
else:
    print("No candidates.")
db.close()
