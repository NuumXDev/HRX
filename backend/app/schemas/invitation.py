from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from app.models.user import UserRole

class InvitationCreate(BaseModel):
    email: EmailStr
    role: UserRole

class InvitationResponse(BaseModel):
    id: str
    org_id: str
    email: str
    role: str
    status: str
    created_at: datetime
    token: Optional[str] = None

    class Config:
        from_attributes = True

class TeamInvitePayload(BaseModel):
    invites: List[InvitationCreate]
