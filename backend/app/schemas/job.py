from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"

class JobBase(BaseModel):
    title: str
    department: Optional[str] = None
    seniority: Optional[str] = None # Added for more context

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    status: Optional[JobStatus] = None
    jd_raw_context: Optional[str] = None
    jd_final_content: Optional[str] = None

class JobResponse(JobBase):
    id: str
    org_id: str
    status: JobStatus
    jd_raw_context: Optional[str]
    jd_final_content: Optional[str]
    candidate_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class JDGenerateRequest(BaseModel):
    title: str
    department: Optional[str] = None
    seniority: Optional[str] = None
    raw_context: str # The "bullets" or brief description from user
    tone: str = "professional" # professional, bold, etc.
