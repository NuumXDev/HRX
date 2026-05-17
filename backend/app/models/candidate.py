import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class CandidateStatus(str, enum.Enum):
    NEW = "new"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFERED = "offered"
    REJECTED = "rejected"

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    status = Column(String, default=CandidateStatus.NEW)
    match_score = Column(Float, nullable=True)
    resume_path = Column(String, nullable=True)
    parsed_json = Column(String, nullable=True) # Storing as string for SQLite compatibility (can be parsed in app)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="candidates")
    job = relationship("Job", back_populates="candidates")
    interviews = relationship("Interview", back_populates="candidate", cascade="all, delete-orphan")
    tokens = relationship("CandidateToken", back_populates="candidate", cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="candidate", cascade="all, delete-orphan")
