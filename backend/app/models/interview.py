import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class InterviewType(str, enum.Enum):
    SCREENING = "screening"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    CULTURAL = "cultural"
    FINAL = "final"

class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PENDING_FEEDBACK = "pending_feedback"

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    
    interviewer_id = Column(String, ForeignKey("users.id"), nullable=True)
    type = Column(String, default=InterviewType.TECHNICAL)
    status = Column(String, default=InterviewStatus.SCHEDULED)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    meeting_link = Column(String, nullable=True)
    location = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    ai_scorecard = Column(Text, nullable=True) # JSON string of AI assessment
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="interviews")
    candidate = relationship("Candidate", back_populates="interviews")
    interviewer = relationship("User", back_populates="interviews")
