from pydantic import BaseModel
from typing import Dict, Any

class OrganizationStats(BaseModel):
    total_candidates: int
    active_jobs: int
    interviews_scheduled: int
    time_to_hire: str
    
    # Role-specific subsets can be added here
    my_active_jobs: Optional[int] = None
    new_apps_24h: Optional[int] = None
    pending_review: Optional[int] = None
    phone_calls_today: Optional[int] = None
    
    candidate_reviews_due: Optional[int] = None
    interviews_today: Optional[int] = None
    feedback_due: Optional[int] = None
