import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta

from app.database import Base

class CandidateToken(Base):
    __tablename__ = "candidate_tokens"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    
    # Store the actual secure token string
    token = Column(String, unique=True, index=True, nullable=False)
    
    # What is this token for? "assessment", "interview", etc.
    purpose = Column(String, nullable=False, default="assessment")
    
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    candidate = relationship("Candidate", back_populates="tokens")

    @classmethod
    def generate_token(cls, candidate_id: str, purpose: str = "assessment", expires_in_hours: int = 48) -> "CandidateToken":
        import secrets
        secure_token = secrets.token_urlsafe(32)
        expiration = datetime.utcnow() + timedelta(hours=expires_in_hours)
        return cls(
            candidate_id=candidate_id,
            token=secure_token,
            purpose=purpose,
            expires_at=expiration
        )
