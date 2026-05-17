"""
Assessment REST API Routes

Endpoints for managing Smart Assessment sessions.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import json
import logging
from typing import Optional, Dict, Any

from app.database import get_db
from app.models.candidate_token import CandidateToken
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.assessment_session import AssessmentSession
from app.engine.assessment.orchestrator import AssessmentOrchestrator
from app.engine.models import ModelClient

logger = logging.getLogger(__name__)
from app.database import SessionLocal

async def generate_report_background(session_id: str, memory_json: str):
    """Background task to generate and save the final assessment report."""
    db = SessionLocal()
    try:
        # Re-initialize orchestrator with memory
        orchestrator = AssessmentOrchestrator(ModelClient())
        orchestrator.load_memory(memory_json)
        
        logger.info(f"Generating background report for session {session_id}")
        report_data = await orchestrator.generate_final_report()
        
        if report_data:
            session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
            if session:
                session.report_json = json.dumps(report_data)
                session.overall_score = report_data.get("overall_score", 0)
                final_verdict = report_data.get("final_verdict", "BORDERLINE")
                session.final_verdict = final_verdict
                
                # Update Candidate Stage based on verdict
                from app.models.candidate import Candidate
                candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
                if candidate:
                    if final_verdict == "NO_HIRE":
                        # We keep them in their current stage (Screening) so they stay visible 
                        # for the user to confirm via the "Batch Reject" button.
                        pass
                    elif final_verdict in ["STRONG_HIRE", "HIRE", "BORDERLINE"]:
                        candidate.status = "interview"

                db.commit()
                logger.info(f"Report saved for session {session_id}")
    except Exception as e:
        logger.error(f"Background report generation failed for session {session_id}: {e}")
    finally:
        db.close()

router = APIRouter()


class StartAssessmentRequest(BaseModel):
    token: str

class StartAssessmentResponse(BaseModel):
    session_id: str
    candidate_name: str
    job_title: str
    topic_count: int


class QuestionResponse(BaseModel):
    status: str
    topic: Optional[str] = None
    question: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class SubmitAnswerRequest(BaseModel):
    selected_option: Optional[str] = None
    text_answer: Optional[str] = None
    final_code: Optional[str] = None
    elapsed_seconds: int = 0

class SubmitAnswerResponse(BaseModel):
    status: str
    action: str
    score: int
    assessment_complete: bool


@router.post("/start", response_model=StartAssessmentResponse)
async def start_assessment(request: StartAssessmentRequest, db: Session = Depends(get_db)):
    """Initialize a new Smart Assessment session."""
    
    token_record = db.query(CandidateToken).filter(CandidateToken.token == request.token).first()
    if not token_record:
        raise HTTPException(status_code=404, detail="Invalid token")

    if token_record.is_used:
        # Check if active session exists to resume
        existing = db.query(AssessmentSession).filter(
            AssessmentSession.candidate_id == token_record.candidate_id,
            AssessmentSession.status == "ACTIVE"
        ).first()
        
        if existing:
            orchestrator = AssessmentOrchestrator(ModelClient())
            orchestrator.load_memory(existing.memory_json)
            memory = orchestrator.memory
            return StartAssessmentResponse(
                session_id=existing.id,
                candidate_name=memory.candidate_profile.full_name,
                job_title=memory.job_title,
                topic_count=len(memory.syllabus),
            )
        else:
            raise HTTPException(status_code=400, detail="Assessment has already been completed.")

    now = datetime.utcnow()
    expires = token_record.expires_at
    if hasattr(expires, 'tzinfo') and expires.tzinfo is not None:
        expires = expires.replace(tzinfo=None)
    if expires < now:
        raise HTTPException(status_code=400, detail="Token has expired.")

    candidate = db.query(Candidate).filter(Candidate.id == token_record.candidate_id).first()
    job = db.query(Job).filter(Job.id == candidate.job_id).first()

    parsed_json = {}
    if candidate.parsed_json:
        try:
            parsed_json = json.loads(candidate.parsed_json) if isinstance(candidate.parsed_json, str) else candidate.parsed_json
        except:
            pass

    orchestrator = AssessmentOrchestrator(ModelClient())
    memory = await orchestrator.initialize_session(
        candidate_id=candidate.id,
        job_id=job.id,
        job_title=job.title,
        job_description=job.jd_final_content or job.jd_raw_context or "",
        parsed_json=parsed_json,
        candidate_name=candidate.full_name,
        candidate_email=candidate.email or "",
    )

    session = AssessmentSession(
        id=memory.session_id,
        candidate_id=candidate.id,
        job_id=job.id,
        status="ACTIVE",
        memory_json=orchestrator.serialize_memory(),
    )
    db.add(session)
    token_record.is_used = True
    db.commit()

    return StartAssessmentResponse(
        session_id=memory.session_id,
        candidate_name=candidate.full_name,
        job_title=job.title,
        topic_count=len(memory.syllabus),
    )


@router.get("/{session_id}/question", response_model=QuestionResponse)
async def get_next_question(session_id: str, db: Session = Depends(get_db)):
    """Fetch the next question in the syllabus."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session or session.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Active session not found")

    orchestrator = AssessmentOrchestrator(ModelClient())
    orchestrator.load_memory(session.memory_json)

    question_payload = await orchestrator.get_next_question()
    
    if not question_payload:
        return QuestionResponse(status="completed", message="Assessment complete")

    # Update DB with new question state
    session.memory_json = orchestrator.serialize_memory()
    db.commit()
    
    topic = orchestrator.memory.get_current_topic()

    return QuestionResponse(
        status="success",
        topic=topic.topic,
        question=question_payload
    )


@router.post("/{session_id}/submit", response_model=SubmitAnswerResponse)
async def submit_answer(
    session_id: str, 
    request: SubmitAnswerRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Grade submission and trigger state threshold pivot."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session or session.status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Active session not found")

    orchestrator = AssessmentOrchestrator(ModelClient())
    orchestrator.load_memory(session.memory_json)

    result = await orchestrator.process_submission(request.model_dump())
    
    if result.get("assessment_complete"):
        session.status = "COMPLETED"
        session.completed_at = datetime.utcnow()
        
    # Always update memory before commit
    final_memory = orchestrator.serialize_memory()
    session.memory_json = final_memory
    db.commit()

    # Trigger background report generation if complete
    if result.get("assessment_complete"):
        background_tasks.add_task(generate_report_background, session_id, final_memory)

    return SubmitAnswerResponse(
        status=result["status"],
        action=result["action"],
        score=result["score_assigned"],
        assessment_complete=result["assessment_complete"]
    )


@router.get("/{session_id}/report")
async def get_report(session_id: str, db: Session = Depends(get_db)):
    """Generate or retrieve final report."""
    session = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Assessment not completed yet")

    if session.report_json:
        return json.loads(session.report_json)

    # Generate Report
    orchestrator = AssessmentOrchestrator(ModelClient())
    orchestrator.load_memory(session.memory_json)
    
    report = await orchestrator.generate_final_report()
    if not report:
        raise HTTPException(status_code=500, detail="Failed to generate report")

    # Store final values
    session.memory_json = orchestrator.serialize_memory()
    session.report_json = json.dumps(report)
    session.overall_score = report.get("overall_score", 0)
    final_verdict = report.get("final_verdict", "BORDERLINE")
    session.final_verdict = final_verdict
    
    # Update Candidate Stage based on verdict
    candidate = db.query(Candidate).filter(Candidate.id == session.candidate_id).first()
    if candidate:
        if final_verdict == "NO_HIRE":
            # Keep in current stage for manual batch rejection
            pass
        elif final_verdict in ["STRONG_HIRE", "HIRE", "BORDERLINE"]:
            candidate.status = "interview"
            
    db.commit()

    return report
