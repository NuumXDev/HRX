import json
from sqlalchemy.orm import Session
from app.models.candidate import Candidate
from app.models.assessment_session import AssessmentSession
from app.models.candidate_token import CandidateToken
from app.core.config import settings

def enrich_candidate_metadata(candidate: Candidate, db: Session):
    """
    Enriches a Candidate model instance with virtual attributes:
    - job_title
    - magic_link
    - assessment_status
    - assessment_score
    - assessment_report
    - assessment_verdict
    - assessment_details
    """
    if candidate.job:
        candidate.job_title = candidate.job.title
        
    # 1. Check for active assessment magic link
    token_record = db.query(CandidateToken).filter(
        CandidateToken.candidate_id == candidate.id,
        CandidateToken.is_used == False
    ).first()
    if token_record:
        candidate.magic_link = f"{settings.FRONTEND_URL.rstrip('/')}/p/test/{token_record.token}"

    # 2. Fetch latest assessment session data
    assessment = db.query(AssessmentSession).filter(
        AssessmentSession.candidate_id == candidate.id
    ).order_by(AssessmentSession.created_at.desc()).first()
    
    if assessment:
        candidate.assessment_status = assessment.status
        candidate.assessment_score = assessment.overall_score
        candidate.assessment_report = assessment.report_json
        candidate.assessment_verdict = assessment.final_verdict
        
        # Extract topic breakdown from memory_json
        if assessment.memory_json:
            try:
                mem = json.loads(assessment.memory_json)
                candidate.assessment_details = [
                    {
                        "topic": t.get("topic"),
                        "score": t["evaluations"][-1]["score"] if t.get("evaluations") else 0,
                        "modality": t.get("modality"),
                    }
                    for t in mem.get("syllabus", [])
                ]
            except Exception:
                candidate.assessment_details = []
    else:
        candidate.assessment_status = None
        candidate.assessment_score = None
        candidate.assessment_report = None
        candidate.assessment_verdict = None
        candidate.assessment_details = []

    return candidate
