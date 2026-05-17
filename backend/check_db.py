import os
import sys

# Setup path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.assessment_session import AssessmentSession
from app.models.candidate import Candidate

def check_db():
    db = SessionLocal()
    try:
        candidates = db.query(Candidate).all()
        print(f"Total candidates: {len(candidates)}")
        for c in candidates:
            print(f"Candidate: {c.full_name} (ID: {c.id}) | Status: {c.status}")
            
            # Find latest assessment
            assessment = db.query(AssessmentSession).filter(AssessmentSession.candidate_id == c.id).order_by(AssessmentSession.created_at.desc()).first()
            if assessment:
                print(f"  Assessment: {assessment.id} | Status: {assessment.status} | Report JSON: {'Present' if assessment.report_json else 'Missing'}")
            else:
                print(f"  No assessment session found.")
                
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
