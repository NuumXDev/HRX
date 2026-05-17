import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
from app.database import Base
import enum

class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"

class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    status = Column(String, default=JobStatus.DRAFT)
    
    # AI Context
    jd_raw_context = Column(Text, nullable=True)
    jd_final_content = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    organization = relationship("Organization", back_populates="jobs")
    candidates = relationship("Candidate", back_populates="job")

    @hybrid_property
    def candidate_count(self) -> int:
        return len(self.candidates)
