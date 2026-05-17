"""
AssessmentSession Database Model

Stores the state of each AI technical assessment session.
The memory_json field contains the serialized SessionMemory,
making sessions fully resumable.
"""

import uuid
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AssessmentSession(Base):
    __tablename__ = "assessment_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)

    # Session state
    status = Column(String, default="ACTIVE")  # ACTIVE, PAUSED, COMPLETED
    memory_json = Column(Text, nullable=True)  # Serialized SessionMemory
    
    # Final outputs
    report_json = Column(Text, nullable=True)  # Serialized AssessmentReport
    overall_score = Column(Float, nullable=True)
    final_verdict = Column(String, nullable=True)  # STRONG_HIRE, HIRE, BORDERLINE, NO_HIRE

    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    candidate = relationship("Candidate", back_populates="assessment_sessions")
    job = relationship("Job", backref="assessment_sessions")
