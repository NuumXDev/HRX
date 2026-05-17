from app.database import SessionLocal
from app.models.candidate import Candidate
from app.models.candidate_token import CandidateToken

db = SessionLocal()
c = db.query(Candidate).first()

if c:
    t = CandidateToken.generate_token(candidate_id=c.id)
    db.add(t)
    db.commit()
    print(f"http://localhost:3000/p/test/{t.token}")
else:
    print("NO_CANDIDATES")
