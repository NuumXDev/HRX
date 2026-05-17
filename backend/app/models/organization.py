import uuid
from sqlalchemy import Boolean, Column, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    # SQLite string UUID storage
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    logo_s3_key = Column(String, nullable=True)
    brand_colors = Column(String, default='{"primary": "#8b5cf6"}')
    website_url = Column(String, nullable=True)
    hq_location = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    description = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    recruitment_settings = Column(String, default='{"tone": "professional", "stages": ["Initial Screen", "Technical", "Final Interview"]}')
    onboarding_completed = Column(Boolean, default=False)
    plan = Column(String, default="trial")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="organization")
    jobs = relationship("Job", back_populates="organization")
    candidates = relationship("Candidate", back_populates="organization")
    interviews = relationship("Interview", back_populates="organization")
