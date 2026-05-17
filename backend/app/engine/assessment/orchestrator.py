"""
Assessment Orchestrator — REST API Controller

Owns the assessment session lifecycle for the Smart Assessment platform.
Responsibilites:
- Initializing the Syllabus
- Fetching JSON questions
- Processing submissions and applying threshold logic
- Generating final reports
"""

from __future__ import annotations

import logging
import json
from typing import TYPE_CHECKING, Dict, Any, Optional
import uuid
from datetime import datetime

from .memory import (
    SessionMemory,
    CandidateProfile,
    SessionState,
    SyllabusState,
    CandidateSubmission,
    AssessmentModality
)

from .agents.syllabus_planner import SyllabusPlannerAgent
from .agents.modality import ModalityAgent
from .agents.question_generator import QuestionGeneratorAgent
from .agents.response_evaluator import ResponseEvaluatorAgent
from .agents.evaluation_critique import EvaluationCritiqueAgent
from .agents.report_generator import ReportGeneratorAgent
from .agents.report_critique import ReportCritiqueAgent

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)


class AssessmentOrchestrator:
    """The central REST controller for an AI assessment session."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client
        self.memory: Optional[SessionMemory] = None

        # Instantiate the 7 core agents
        self.syllabus_planner = SyllabusPlannerAgent(model_client)
        self.modality_agent = ModalityAgent(model_client)
        self.question_generator = QuestionGeneratorAgent(model_client)
        self.evaluator = ResponseEvaluatorAgent(model_client)
        self.eval_critique = EvaluationCritiqueAgent(model_client)
        self.report_generator = ReportGeneratorAgent(model_client)
        self.report_critique = ReportCritiqueAgent(model_client)

    def load_memory(self, memory_json: str):
        """Loads session state from DB JSON."""
        self.memory = SessionMemory.model_validate_json(memory_json)

    def serialize_memory(self) -> str:
        """Serializes session state to save to DB."""
        return self.memory.model_dump_json()

    async def initialize_session(
        self,
        candidate_id: str,
        job_id: str,
        job_title: str,
        job_description: str,
        parsed_json: Dict[str, Any],
        candidate_name: str,
        candidate_email: str = "",
    ) -> SessionMemory:
        """Bootstraps a new session by running the SyllabusPlannerAgent."""
        
        session_id = str(uuid.uuid4())
        
        profile = CandidateProfile(
            full_name=candidate_name,
            email=candidate_email,
            headline=parsed_json.get("summary", parsed_json.get("headline", "")),
            experience=parsed_json.get("experience", []),
            projects=parsed_json.get("projects", []),
            education=parsed_json.get("education", []),
            scored_skills=parsed_json.get("scored_skills", []),
            social_links=parsed_json.get("social_links", [])
        )

        self.memory = SessionMemory(
            session_id=session_id,
            candidate_id=candidate_id,
            job_id=job_id,
            job_title=job_title,
            job_description=job_description,
            candidate_profile=profile,
            session_state=SessionState.INIT,
            started_at=datetime.utcnow(),
        )

        # Generate Syllabus!
        syllabus = await self.syllabus_planner.generate_syllabus(self.memory)
        self.memory.syllabus = syllabus
        self.memory.session_state = SessionState.ASSESSING
        
        # TOKEN OPTIMIZATION: Clear JD context as it's no longer needed after syllabus is built
        self.memory.job_description = ""

        return self.memory


    async def get_next_question(self) -> Optional[dict]:
        """Runs Modality/Question generators to fetch the active question payload."""
        if not self.memory or self.memory.session_state == SessionState.COMPLETED:
            return None
            
        topic = self.memory.get_current_topic()
        if not topic:
            return None

        # If a question has already been generated for this try, return it to save tokens
        if topic.question:
            return topic.question.model_dump()

        topic.status = SyllabusState.ACTIVE

        # 1. Decide Modality
        modality = await self.modality_agent.decide_modality(topic, self.memory)
        topic.modality = modality

        # 2. Generate Question
        is_followup = topic.drill_downs_used > 0
        topic.question = await self.question_generator.generate_question(topic, self.memory, is_followup)

        return topic.question.model_dump()


    async def process_submission(self, submission_data: dict) -> dict:
        """Takes user submission, runs Evaluation+Critique, and applies Threshold logic."""
        if not self.memory or self.memory.session_state == SessionState.COMPLETED:
            return {"status": "error", "message": "Session completed"}
            
        topic = self.memory.get_current_topic()
        if not topic or not topic.question:
            return {"status": "error", "message": "No active question"}

        # 1. Record Submission
        submission = CandidateSubmission(
            selected_option=submission_data.get("selected_option"),
            text_answer=submission_data.get("text_answer"),
            final_code=submission_data.get("final_code"),
            elapsed_seconds=submission_data.get("elapsed_seconds", 0)
        )
        topic.submissions.append(submission)

        # 2. Evaluate
        evaluation = await self.evaluator.evaluate(topic, self.memory)
        
        # TOKEN OPTIMIZATION: Skip critique for MCQ as it's deterministic right/wrong
        if topic.modality != AssessmentModality.MCQ:
            await self.eval_critique.critique(topic, evaluation)
            
        topic.evaluations.append(evaluation)

        # 3. Apply Decision Thresholds
        score = evaluation.score
        action = ""

        # EARLY TERMINATION TRACKING
        if score <= 3:
            self.memory.consecutive_low_scores += 1
        else:
            self.memory.consecutive_low_scores = 0
        
        if score >= 8:
            topic.status = SyllabusState.MASTERED
            action = "PASS -> Pivot"
            self.memory.advance_topic()
        elif score <= 3:
            topic.status = SyllabusState.FAILED
            action = "FAIL -> Pivot"
            
            # ADAPTIVE LOGIC: If we fail a Fundamental/Core topic, skip ADVANCED
            if topic.difficulty_tier in ["FUNDAMENTAL", "CORE"]:
                # Mark subsequent ADVANCED topics as SKIPPED
                for next_topic in self.memory.syllabus[self.memory.current_topic_index + 1:]:
                    if next_topic.difficulty_tier == "ADVANCED":
                        next_topic.status = SyllabusState.SKIPPED
            
            self.memory.advance_topic()
        else:
            # Medium score: Drill down
            if topic.drill_downs_used >= 1:
                # Reached max drill downs, move on
                topic.status = SyllabusState.MASTERED if score >= 6 else SyllabusState.FAILED
                action = "MAX DRILL DOWN -> Pivot"
                self.memory.advance_topic()
            else:
                topic.drill_downs_used += 1
                topic.question = None # Nullify the question so a new follow-up generates
                action = "DRILL DOWN -> Follow up"

        # Check for consecutive failures early termination
        if self.memory.consecutive_low_scores >= 3:
            self.memory.early_terminated = True
            self.memory.session_state = SessionState.COMPLETED
            self.memory.completed_at = datetime.utcnow()
            action = "EARLY TERMINATION -> Consecutive Failures"

        # Check if we completed
        completed = self.memory.session_state == SessionState.COMPLETED
        
        return {
            "status": "success", 
            "score_assigned": score,
            "action": action,
            "assessment_complete": completed
        }


    async def generate_final_report(self) -> Optional[dict]:
        """Runs the Report Generator + Critique and saves it to memory."""
        if not self.memory or self.memory.session_state != SessionState.COMPLETED:
            return None

        if self.memory.report:
            return self.memory.report.model_dump()

        report = await self.report_generator.generate_report(self.memory)
        await self.report_critique.critique(report)
        
        self.memory.report = report
        
        return json.loads(report.model_dump_json())
