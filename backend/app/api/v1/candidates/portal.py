from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.candidate_token import CandidateToken
from app.models.candidate import Candidate
from app.schemas.candidate_token import TokenVerificationRequest, TokenVerificationResponse, TokenCompleteRequest, TokenCompleteResponse

router = APIRouter()

@router.post("/verify-token", response_model=TokenVerificationResponse)
def verify_candidate_token(payload: TokenVerificationRequest, db: Session = Depends(get_db)):
    """
    Verifies a secure candidate token. 
    If valid, returns the candidate_id and purpose. The frontend will use this to grant access.
    """
    token_record = db.query(CandidateToken).filter(CandidateToken.token == payload.token).first()
    
    if not token_record:
        return TokenVerificationResponse(valid=False, message="Invalid token")
        
    if token_record.is_used:
        return TokenVerificationResponse(valid=False, message="Token has already been used")
        
    # Check expiration (ignoring tzinfo for simple comparison)
    now = datetime.utcnow()
    if token_record.expires_at.replace(tzinfo=None) < now:
        return TokenVerificationResponse(valid=False, message="Token has expired")
        
    candidate = db.query(Candidate).filter(Candidate.id == token_record.candidate_id).first()
    candidate_name = candidate.full_name if candidate else "Candidate"
        
    return TokenVerificationResponse(
        valid=True,
        candidate_id=token_record.candidate_id,
        candidate_name=candidate_name,
        resume_details=candidate.parsed_json if candidate else None,
        purpose=token_record.purpose
    )

@router.post("/complete-token", response_model=TokenCompleteResponse)
def complete_candidate_token(payload: TokenCompleteRequest, db: Session = Depends(get_db)):
    """
    Marks a token as used so it cannot be reused.
    """
    token_record = db.query(CandidateToken).filter(CandidateToken.token == payload.token).first()
    
    if not token_record:
        raise HTTPException(status_code=404, detail="Token not found")
        
    token_record.is_used = True
    db.commit()
    
    return TokenCompleteResponse(success=True, message="Token consumption complete")
