from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class OrganizationCreate(BaseModel):
    company_name: str
    admin_name: str
    email: EmailStr
    password: str

class UserJoin(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    token: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    org_id: str
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    org_id: Optional[str] = None
    role: Optional[str] = "recruiter"
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
