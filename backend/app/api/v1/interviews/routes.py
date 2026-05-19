from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.interview import Interview
from app.models.job import Job
from app.models.candidate import Candidate
from app.schemas.interview import InterviewCreate, InterviewResponse, InterviewUpdate
from app.services import ai_service
import json

router = APIRouter()

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def create_interview(payload: InterviewCreate, db: Session = Depends(get_db)):
    db_interview = Interview(**payload.dict())
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

@router.get("/candidate/{candidate_id}", response_model=List[InterviewResponse])
def get_candidate_interviews(candidate_id: str, db: Session = Depends(get_db)):
    return db.query(Interview).filter(Interview.candidate_id == candidate_id).order_by(Interview.start_time.asc()).all()

@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.patch("/{interview_id}", response_model=InterviewResponse)
def update_interview(interview_id: str, payload: InterviewUpdate, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(interview, key, value)
    
    db.commit()
    db.refresh(interview)
    return interview

@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    db.delete(interview)
    db.commit()
    return None

@router.post("/{interview_id}/generate-scorecard", response_model=dict)
def generate_scorecard(interview_id: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).options(
        joinedload(Interview.candidate),
        joinedload(Interview.organization)
    ).filter(Interview.id == interview_id).first()
    
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if not interview.notes:
        raise HTTPException(status_code=400, detail="Interview notes are required to generate a scorecard")
    
    # Get Job Description
    job = db.query(Job).filter(Job.id == interview.candidate.job_id).first()
    jd_content = job.jd_final_content if job and job.jd_final_content else (job.raw_context if job else "No job description available")
    
    # Get Resume Parse Summary (from candidate.parsed_json)
    resume_summary = interview.candidate.parsed_json if interview.candidate.parsed_json else "No resume data available"
    
    # Generate Scorecard using AI
    try:
        scorecard = ai_service.generate_interview_scorecard(
            resume_text=resume_summary,
            job_description=jd_content,
            interview_notes=interview.notes,
            interview_type=interview.type
        )
        
        # Save scorecard to DB
        interview.ai_scorecard = json.dumps(scorecard)
        interview.status = "completed"
        db.commit()
        
        return scorecard
    except Exception as e:
        print(f"Scorecard Generation Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate scorecard: {str(e)}")
