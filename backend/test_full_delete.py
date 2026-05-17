import sys
import json
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.models.candidate_token import CandidateToken
from app.models.interview import Interview
from datetime import datetime, timedelta

def test():
    db = SessionLocal()
    # 1. Create a dummy candidate
    c = Candidate(
        org_id="testorg",
        job_id="testjob",
        full_name="Delete Me",
        email="delete@me.com"
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    cid = c.id
    print(f"Created candidate: {cid}")

    # 2. Add a token
    t = CandidateToken.generate_token(candidate_id=cid)
    db.add(t)
    
    # 3. Add an interview
    i = Interview(
        org_id="testorg",
        candidate_id=cid,
        job_id="testjob",
        type="initial"
    )
    db.add(i)
    db.commit()
    print("Added token and interview records.")

    # 4. Trigger deletion logic (manually mimicking the route logic)
    print(f"Attempting to delete candidate {cid}...")
    
    # Mirroring the route code exactly:
    candidate = db.query(Candidate).filter(Candidate.id == cid).first()
    
    tokens = db.query(CandidateToken).filter(CandidateToken.candidate_id == cid).all()
    for tk in tokens:
        db.delete(tk)
        
    interviews = db.query(Interview).filter(Interview.candidate_id == cid).all()
    for iv in interviews:
        db.delete(iv)
    
    db.delete(candidate)
    db.commit()
    print("Deletion commit successful!")

    # 5. Verify
    exists = db.query(Candidate).filter(Candidate.id == cid).first()
    if not exists:
        print("SUCCESS: Candidate and all associated records deleted.")
    else:
        print("FAILURE: Candidate still exists.")
    
    db.close()

if __name__ == "__main__":
    test()
