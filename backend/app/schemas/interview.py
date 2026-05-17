from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.interview import InterviewType, InterviewStatus

class InterviewBase(BaseModel):
    type: str = InterviewType.TECHNICAL
    status: str = InterviewStatus.SCHEDULED
    start_time: datetime
    end_time: Optional[datetime] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class InterviewCreate(InterviewBase):
    candidate_id: str
    job_id: str
    org_id: str
    interviewer_id: Optional[str] = None

class InterviewUpdate(BaseModel):
    type: Optional[str] = None
    status: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    meeting_link: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    ai_scorecard: Optional[str] = None
    interviewer_id: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: str
    org_id: str
    candidate_id: str
    job_id: str
    interviewer_id: Optional[str] = None
    ai_scorecard: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
