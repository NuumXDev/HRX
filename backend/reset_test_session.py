
from app.database import SessionLocal
from app.models.candidate_token import CandidateToken
from app.models.assessment_session import AssessmentSession

def reset_test():
    db = SessionLocal()
    token_str = "1HIUhJMTC8VUIR3kSl4-4Cey89wOyHjsYMqf5j5aAkM"
    
    token = db.query(CandidateToken).filter(CandidateToken.token == token_str).first()
    if not token:
        print("Token not found")
        return

    # 1. Reset token
    token.is_used = False
    
    # 2. Delete existing sessions for this candidate
    db.query(AssessmentSession).filter(AssessmentSession.candidate_id == token.candidate_id).delete()
    
    db.commit()
    print(f"Successfully reset session for candidate {token.candidate_id}")

if __name__ == "__main__":
    reset_test()
