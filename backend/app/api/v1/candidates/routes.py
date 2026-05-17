from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
import os
import json
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateResponse, CandidateUpdate

router = APIRouter()

@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    candidate = db.query(Candidate).options(
        joinedload(Candidate.job),
        joinedload(Candidate.interviews),
        joinedload(Candidate.tokens)
    ).filter(Candidate.id == candidate_id).first()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    from .utils import enrich_candidate_metadata
    return enrich_candidate_metadata(candidate, db)

@router.patch("/{candidate_id}", response_model=CandidateResponse)
def update_candidate(candidate_id: str, payload: CandidateUpdate, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    
    candidate = db.query(Candidate).options(joinedload(Candidate.job)).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(candidate, key, value)
        
        # If moving to screening, automatically generate a token
        if key == "status" and str(value).upper() == "SCREENING":
            from app.models.candidate_token import CandidateToken
            
            # Check if an active token already exists to avoid duplicates
            existing_token = db.query(CandidateToken).filter(
                CandidateToken.candidate_id == candidate.id,
                CandidateToken.is_used == False
            ).first()
            
            if not existing_token:
                new_token = CandidateToken.generate_token(candidate_id=candidate.id)
                db.add(new_token)
                
                # In a real app, we would queue an email here.
                # SendGridEmailService.send_magic_link(candidate.email, new_token.token)
                print(f"MAGIC LINK GENERATED FOR {candidate.email}: hrx.com/p/test/{new_token.token}")
    
    db.commit()
    db.refresh(candidate)
    
    from .utils import enrich_candidate_metadata
    return enrich_candidate_metadata(candidate, db)

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    print(f"DEBUG: DELETE candidate {candidate_id} initiated.")
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            print(f"DEBUG: Candidate {candidate_id} not found.")
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        from app.models.candidate_token import CandidateToken
        from app.models.interview import Interview
        
        # 1. Manual check and deletion of all relationships to prevent SQLite constraint panics
        try:
            db.query(CandidateToken).filter(CandidateToken.candidate_id == candidate_id).delete(synchronize_session=False)
            print(f"DEBUG: Tokens for {candidate_id} deleted.")
        except Exception as te:
            print(f"DEBUG: Token delete error (ignoring): {te}")
            
        try:
            db.query(Interview).filter(Interview.candidate_id == candidate_id).delete(synchronize_session=False)
            print(f"DEBUG: Interviews for {candidate_id} deleted.")
        except Exception as ie:
            print(f"DEBUG: Interview delete error (ignoring): {ie}")

        from app.models.assessment_session import AssessmentSession
        try:
            db.query(AssessmentSession).filter(AssessmentSession.candidate_id == candidate_id).delete(synchronize_session=False)
            print(f"DEBUG: AssessmentSessions for {candidate_id} deleted.")
        except Exception as ae:
            print(f"DEBUG: AssessmentSession delete error (ignoring): {ae}")
        
        # 2. Finally delete the parent
        db.delete(candidate)
        db.commit()
        print(f"DEBUG: Candidate {candidate_id} successfully deleted from DB.")
        return None
    except Exception as e:
        db.rollback()
        print(f"CRITICAL: Failed to delete candidate {candidate_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{candidate_id}/resume")
def get_candidate_resume(candidate_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if not candidate.resume_path or not os.path.exists(candidate.resume_path):
        raise HTTPException(status_code=404, detail="Resume file not found")
    
    return FileResponse(
        path=candidate.resume_path,
        filename=f"resume_{candidate.full_name.replace(' ', '_')}{os.path.splitext(candidate.resume_path)[1]}"
    )

@router.get("/{candidate_id}/report")
def get_candidate_report(candidate_id: str, db: Session = Depends(get_db)):
    from app.services.report_generator import ReportGenerationService
    
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    try:
        pdf_path = ReportGenerationService.generate_candidate_report(candidate)
        return FileResponse(
            path=pdf_path,
            filename=f"evaluation_{candidate.full_name.replace(' ', '_')}.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

@router.get("/{candidate_id}/assessment-report")
def get_assessment_report(candidate_id: str, db: Session = Depends(get_db)):
    from app.services.report_generator import ReportGenerationService
    from app.models.assessment_session import AssessmentSession
    
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    from sqlalchemy.orm import joinedload
    assessment = db.query(AssessmentSession).options(joinedload(AssessmentSession.job)).filter(
        AssessmentSession.candidate_id == candidate_id,
        AssessmentSession.status == "COMPLETED"
    ).order_by(AssessmentSession.created_at.desc()).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Completed assessment not found")
        
    try:
        pdf_path = ReportGenerationService.generate_assessment_report(candidate, assessment)
        return FileResponse(
            path=pdf_path,
            filename=f"assessment_{candidate.full_name.replace(' ', '_')}.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate assessment report: {str(e)}")
