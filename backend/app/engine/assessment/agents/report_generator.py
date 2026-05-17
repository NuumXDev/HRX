"""
Report Generator Agent

Aggregates the topic scores into a final HR Assessment Report.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from app.core.config import settings
from app.engine.assessment.memory import AssessmentReport, FinalVerdict, DimensionScore, SessionMemory

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

REPORT_PROMPT = """You are a Senior Technical Hiring Manager finalizing an Assessment Report.

## Candidate: {candidate_name}
## Job Title: {job_title}
## Session Duration: {duration} minutes

## Assessment Syllabus Results
{syllabus_results}

## Instructions
Based on the scores (0-10) for each topic in the syllabus, generate the final report.

1. **candidate_summary**: A 3-4 sentence professional summary of the candidate's performance across the test.
2. **dimension_scores**: Provide exactly 4 dimensions (e.g., "Fundamentals", "Problem Solving", "System Design", "Code Quality"). Score each from 0-100 based on the syllabus results. Weight them HIGH, MEDIUM, or LOW based on the role.
3. **overall_score**: 0-100 mathematical average of dimension scores.
4. **final_verdict**: "STRONG_HIRE", "HIRE", "BORDERLINE", or "NO_HIRE".
5. **verdict_justification**: 2 sentences explaining the verdict.

## Output Schema (strict JSON)
{{
    "candidate_summary": "...",
    "dimension_scores": [
        {{ "dimension": "...", "score": 85, "weight": "HIGH", "rationale": "..." }}
    ],
    "overall_score": 85,
    "final_verdict": "STRONG_HIRE",
    "verdict_justification": "..."
}}
"""

class ReportGeneratorAgent:
    """Generates the final hiring report."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def generate_report(self, memory: SessionMemory) -> AssessmentReport:
        """Generates the final PDF-ready report."""
        
        # Build Syllabus string
        results = []
        for topic in memory.syllabus:
            score = topic.evaluations[-1].score if topic.evaluations else 0
            depth = topic.evaluations[-1].depth.value if topic.evaluations else "N/A"
            correct = "YES" if (topic.evaluations[-1].correctness if topic.evaluations else False) else "NO"
            modality = topic.modality.value if topic.modality else "N/A"
            results.append(f"Topic: {topic.topic} | Modality: {modality} | Score: {score}/10 | Depth: {depth} | Correct: {correct}")
            
        syllabus_text = "\n".join(results)
        
        duration = 0.0
        if memory.started_at and memory.completed_at:
            duration = round((memory.completed_at - memory.started_at).total_seconds() / 60, 1)

        prompt = REPORT_PROMPT.format(
            candidate_name=memory.candidate_profile.full_name,
            job_title=memory.job_title,
            duration=duration,
            syllabus_results=syllabus_text
        )

        try:
            response = await self.model_client.async_generate(
                model_name=settings.ASSESSMENT_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.4,
                }
            )

            result = json.loads(response.text)
            
            return AssessmentReport(
                candidate_summary=result.get("candidate_summary", ""),
                overall_score=result.get("overall_score", 0),
                final_verdict=FinalVerdict(result.get("final_verdict", "BORDERLINE")),
                verdict_justification=result.get("verdict_justification", ""),
                session_duration_minutes=duration,
                dimension_scores=[
                    DimensionScore(**d) for d in result.get("dimension_scores", [])
                ]
            )

        except Exception as e:
            logger.error(f"ReportGeneratorAgent failed: {e}")
            return AssessmentReport(
                candidate_summary="Failed to generate report.",
                overall_score=0.0,
                final_verdict=FinalVerdict.NO_HIRE
            )
