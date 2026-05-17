from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.schemas.interview import InterviewResponse
from app.schemas.candidate_token import CandidateTokenResponse

class CandidateBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    headline: Optional[str] = None
    status: str = "new"
    match_score: Optional[float] = None

class CandidateCreate(CandidateBase):
    job_id: str
    org_id: str

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    status: Optional[str] = None
    match_score: Optional[float] = None

class CandidateResponse(CandidateBase):
    id: str
    org_id: str
    job_id: str
    job_title: Optional[str] = None
    resume_path: Optional[str] = None
    parsed_json: Optional[str] = None
    magic_link: Optional[str] = None
    
    # Assessment Data
    assessment_status: Optional[str] = None
    assessment_score: Optional[float] = None
    assessment_report: Optional[str] = None # JSON string of Report
    assessment_verdict: Optional[str] = None
    assessment_details: Optional[List[Dict[str, Any]]] = None # List of topics + scores
    
    created_at: datetime
    
    interviews: List[InterviewResponse] = []
    tokens: List[CandidateTokenResponse] = []

    class Config:
        from_attributes = True
