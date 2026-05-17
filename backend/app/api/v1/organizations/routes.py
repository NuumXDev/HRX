import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.organization import Organization
from app.models.invitation import Invitation
from app.schemas.organization import OrganizationUpdateOnboarding, OrganizationResponse
from app.schemas.invitation import InvitationCreate, InvitationResponse, TeamInvitePayload
from app.schemas.candidate import CandidateResponse

router = APIRouter()

@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(org_id: str, db: Session = Depends(get_db)):
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return db_org

@router.put("/{org_id}/onboarding", response_model=OrganizationResponse)
def complete_onboarding(org_id: str, payload: OrganizationUpdateOnboarding, db: Session = Depends(get_db)):
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Branding & Configuration
    brand_colors = {"primary": payload.brand_color}
    recruitment_settings = {
        "tone": payload.recruitment_tone,
        "stages": ["Initial Screen", "Technical", "Final Interview"]
    }

    db_org.brand_colors = json.dumps(brand_colors)
    db_org.recruitment_settings = json.dumps(recruitment_settings)
    
    # Context & Identity
    if payload.name:
        db_org.name = payload.name
        
    db_org.website_url = payload.website_url
    db_org.hq_location = payload.hq_location
    db_org.company_size = payload.company_size
    db_org.description = payload.description
    db_org.industry = payload.industry
    
    # Logo Handling
    if payload.logo_file:
        db_org.logo_s3_key = f"org_{org_id}/logo.png" # Placeholder
        
    db_org.onboarding_completed = True
    
    db.commit()
    db.refresh(db_org)
    return db_org

@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(org_id: str, payload: OrganizationUpdateOnboarding, db: Session = Depends(get_db)):
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")

    if payload.name: db_org.name = payload.name
    if payload.website_url: db_org.website_url = payload.website_url
    if payload.hq_location: db_org.hq_location = payload.hq_location
    if payload.company_size: db_org.company_size = payload.company_size
    if payload.description: db_org.description = payload.description
    if payload.industry: db_org.industry = payload.industry
    
    if payload.brand_color:
        db_org.brand_colors = json.dumps({"primary": payload.brand_color})
    
    if payload.recruitment_tone:
        settings = json.loads(db_org.recruitment_settings)
        settings["tone"] = payload.recruitment_tone
        db_org.recruitment_settings = json.dumps(settings)

    db.commit()
    db.refresh(db_org)
    return db_org

@router.post("/{org_id}/invites", response_model=List[InvitationResponse])
def create_invites(org_id: str, payload: TeamInvitePayload, db: Session = Depends(get_db)):
    db_org = db.query(Organization).filter(Organization.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")

    new_invites = []
    for invite in payload.invites:
        db_invite = Invitation(
            org_id=org_id,
            email=invite.email,
            role=invite.role
        )
        db.add(db_invite)
        new_invites.append(db_invite)
        
        # MOCK EMAIL NOTIFICATION
        print(f"📧 [EMAIL SERVICE] Sending invitation to {invite.email} with link: http://127.0.0.1:3000/invite/{db_invite.token}")
    
    db.commit()
    for inv in new_invites:
        db.refresh(inv)
    return new_invites

@router.get("/{org_id}/invites", response_model=List[InvitationResponse])
def get_invites(org_id: str, db: Session = Depends(get_db)):
    return db.query(Invitation).filter(Invitation.org_id == org_id).all()

@router.delete("/{org_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(org_id: str, invite_id: str, db: Session = Depends(get_db)):
    db_invite = db.query(Invitation).filter(
        Invitation.id == invite_id,
        Invitation.org_id == org_id
    ).first()
    
    if not db_invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    db.delete(db_invite)
    db.commit()
    return None

@router.get("/{org_id}/users", response_model=List[dict])
def get_team_members(org_id: str, db: Session = Depends(get_db)):
    from app.models.user import User
    users = db.query(User).filter(User.org_id == org_id).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role} for u in users]

@router.put("/{org_id}/users/{user_id}", response_model=dict)
def update_team_member(org_id: str, user_id: str, payload: dict, db: Session = Depends(get_db)):
    from app.models.user import User
    db_user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if "role" in payload:
        db_user.role = payload["role"]
    if "full_name" in payload:
        db_user.full_name = payload["full_name"]
    
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "email": db_user.email, "full_name": db_user.full_name, "role": db_user.role}

@router.delete("/{org_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(org_id: str, user_id: str, db: Session = Depends(get_db)):
    from app.models.user import User
    db_user = db.query(User).filter(User.id == user_id, User.org_id == org_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(db_user)
    db.commit()
    return None

@router.get("/{org_id}/stats", response_model=dict)
def get_organization_stats(org_id: str, db: Session = Depends(get_db)):
    from app.models.job import Job
    from app.models.candidate import Candidate
    
    # Real counts from DB
    total_candidates = db.query(Candidate).filter(Candidate.org_id == org_id).count()
    active_jobs = db.query(Job).filter(Job.org_id == org_id, Job.status.in_(["active", "draft"])).count()
    
    # New applications in last 24h
    from datetime import datetime, timedelta
    last_24h = datetime.now() - timedelta(hours=24)
    new_apps_24h = db.query(Candidate).filter(Candidate.org_id == org_id, Candidate.created_at >= last_24h).count()
    
    return {
        "total_candidates": total_candidates,
        "active_jobs": active_jobs,
        "interviews_scheduled": 0,
        "time_to_hire": "0d",
        "my_active_jobs": active_jobs,
        "new_apps_24h": new_apps_24h,
        "pending_review": db.query(Candidate).filter(Candidate.org_id == org_id, Candidate.status == "new").count(),
        "phone_calls_today": 0,
        "candidate_reviews_due": 0,
        "interviews_today": 0,
        "feedback_due": 0
    }

@router.get("/{org_id}/recommendations", response_model=List[dict])
def get_organization_recommendations(org_id: str, db: Session = Depends(get_db)):
    from app.models.candidate import Candidate
    from app.models.job import Job
    
    # Logic: High score candidates in 'new' or 'screening' status
    top_candidates = db.query(Candidate).filter(
        Candidate.org_id == org_id,
        Candidate.match_score >= 80,
        Candidate.status.in_(["new", "screening"])
    ).order_by(Candidate.match_score.desc()).limit(5).all()
    
    recommendations = []
    for c in top_candidates:
        recommendations.append({
            "type": "high_match",
            "title": "Top Match Found",
            "message": f"{c.full_name} is a {int(c.match_score)}% match for the {c.job.title if c.job else 'Job'}",
            "candidate_id": c.id,
            "job_id": c.job_id
        })
        
    # If no top candidates, add some generic welcoming ones or leave empty
    if not recommendations:
        recommendations.append({
            "type": "info",
            "title": "Ready for Applicants",
            "message": "Start sharing your job links to see AI recommendations here.",
            "candidate_id": None,
            "job_id": None
        })
        
    return recommendations

@router.get("/{org_id}/candidates", response_model=List[CandidateResponse])
def get_organization_candidates(org_id: str, db: Session = Depends(get_db)):
    from app.models.candidate import Candidate
    from app.models.job import Job
    from sqlalchemy.orm import joinedload
    
    candidates = db.query(Candidate).options(joinedload(Candidate.job)).filter(Candidate.org_id == org_id).order_by(Candidate.created_at.desc()).all()
    
    # Enrich with job titles and magic links
    from app.models.candidate_token import CandidateToken
    
    from app.api.v1.candidates.utils import enrich_candidate_metadata
    for c in candidates:
        enrich_candidate_metadata(c, db)
            
    return candidates
