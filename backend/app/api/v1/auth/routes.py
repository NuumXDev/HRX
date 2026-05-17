from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import OrganizationCreate, UserLogin, UserResponse, UserJoin
from app.models.organization import Organization
from app.models.user import User
from app.models.invitation import Invitation
from app.core.security import get_password_hash, verify_password
import re

router = APIRouter()

def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_company(payload: OrganizationCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Generate slug for organization
    base_slug = generate_slug(payload.company_name)
    slug = base_slug
    counter = 1
    # Ensure unique slug
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
        
    # Create Organization
    db_org = Organization(
        name=payload.company_name,
        slug=slug,
        brand_colors='{"primary": "#8b5cf6"}'
    )
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    
    # Create Super Admin User
    db_user = User(
        org_id=db_org.id,
        email=payload.email,
        full_name=payload.admin_name,
        hashed_password=get_password_hash(payload.password),
        role="super_admin"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/verify-invite/{token}")
def verify_invite(token: str, db: Session = Depends(get_db)):
    db_invite = db.query(Invitation).filter(
        Invitation.token == token,
        Invitation.status == "pending"
    ).first()
    
    if not db_invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")
    
    # Get organization name
    db_org = db.query(Organization).filter(Organization.id == db_invite.org_id).first()
    
    return {
        "email": db_invite.email,
        "role": db_invite.role,
        "org_name": db_org.name if db_org else "Unknown Organization",
        "org_id": db_invite.org_id
    }

@router.post("/join", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def join_team(payload: UserJoin, db: Session = Depends(get_db)):
    # Verify Invitation
    db_invite = db.query(Invitation).filter(
        Invitation.token == payload.token,
        Invitation.status == "pending"
    ).first()
    
    if not db_invite:
        raise HTTPException(status_code=404, detail="Invalid or expired invitation")
    
    # Check if user already exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create User
    db_user = User(
        org_id=db_invite.org_id,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=db_invite.role
    )
    db.add(db_user)
    
    # Mark invitation as accepted
    db_invite.status = "accepted"
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == payload.email).first()
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
        
    if not verify_password(payload.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
        
    return db_user
