import sys
import requests
from app.database import SessionLocal
from app.models.candidate import Candidate

db = SessionLocal()
c = db.query(Candidate).order_by(Candidate.created_at.desc()).first()
if c:
    print(f"Candidate found: {c.id}", flush=True)
    try:
        res = requests.delete(f"http://127.0.0.1:8000/api/v1/candidates/{c.id}")
        print(f"Status: {res.status_code}", flush=True)
        print(f"Body: {res.text}", flush=True)
    except Exception as e:
        print(f"Request failed: {e}", flush=True)
else:
    print("No candidates available.", flush=True)
