from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CandidateTokenCreate(BaseModel):
    candidate_id: str
    purpose: str = "assessment"
    expires_in_hours: int = 48

class CandidateTokenResponse(BaseModel):
    token: str
    expires_at: datetime
    purpose: str

class TokenVerificationRequest(BaseModel):
    token: str

class TokenVerificationResponse(BaseModel):
    valid: bool
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    resume_details: Optional[str] = None
    purpose: Optional[str] = None
    message: Optional[str] = None

class TokenCompleteRequest(BaseModel):
    token: str

class TokenCompleteResponse(BaseModel):
    success: bool
    message: Optional[str] = None
