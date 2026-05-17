from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Dict, List

class OrganizationUpdateOnboarding(BaseModel):
    name: Optional[str] = None
    website_url: Optional[str] = None
    hq_location: Optional[str] = None
    company_size: Optional[str] = None
    description: Optional[str] = None
    industry: str = Field(..., description="Industry of the company")
    brand_color: str = Field(..., description="Hex color code for primary brand color")
    recruitment_tone: str = "professional"
    logo_file: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    logo_s3_key: Optional[str]
    brand_colors: Optional[str]
    website_url: Optional[str]
    hq_location: Optional[str]
    company_size: Optional[str]
    description: Optional[str]
    industry: Optional[str]
    recruitment_settings: Optional[str]
    onboarding_completed: bool
    plan: str
    
    class Config:
        from_attributes = True
