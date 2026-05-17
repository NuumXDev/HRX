import requests
from app.database import SessionLocal
from app.models.candidate import Candidate
db = SessionLocal()
c = db.query(Candidate).first()
db.close()
if c:
    print(requests.delete(f"http://127.0.0.1:8000/api/v1/candidates/{c.id}").text)
