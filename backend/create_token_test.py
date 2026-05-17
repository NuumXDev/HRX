import sys
import os

# Add the backend root directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import app.models

from app.database import SessionLocal
from app.models.interview import Interview
from app.models.candidate import Candidate
from app.models.candidate_token import CandidateToken

db = SessionLocal()
c = db.query(Candidate).first()

if c:
    t = CandidateToken.generate_token(candidate_id=c.id)
    db.add(t)
    db.commit()
    print(f"✅ Success! Your magic link is ready to test:")
    print(f"\nhttp://localhost:3000/p/test/{t.token}")
else:
    print("❌ No candidates found in database.")
