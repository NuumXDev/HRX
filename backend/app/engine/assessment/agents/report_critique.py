"""
Report Critique Agent

Adversarial check on the final report to ensure the Overall Score and Verdict
are mathematically and logically sound.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from app.core.config import settings
from app.engine.assessment.memory import AssessmentReport, FinalVerdict

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

REPORT_CRITIQUE_PROMPT = """You are an adversarial hiring committee member auditing an AI-generated Report.

## Overall Score: {score} / 100
## Proposed Verdict: {verdict}
## Justification: {justification}

## Instruction
Determine if the proposed verdict matches the overall score.
- 0-45: MUST be NO_HIRE
- 46-65: Usually BORDERLINE or NO_HIRE
- 66-85: Usually HIRE or BORDERLINE
- 86-100: HIRE or STRONG_HIRE

If the evaluator proposed a "STRONG_HIRE" for a 50/100, you must override it to BORDERLINE or NO_HIRE.

## Output JSON
{{
    "validated_verdict": "STRONG_HIRE|HIRE|BORDERLINE|NO_HIRE",
    "justification": "Your reasoning"
}}
"""

class ReportCritiqueAgent:
    """Audits the Final Report."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def critique(self, report: AssessmentReport):
        """Modifies the report verdict in place if flawed."""

        prompt = REPORT_CRITIQUE_PROMPT.format(
            score=report.overall_score,
            verdict=report.final_verdict.value,
            justification=report.verdict_justification
        )

        try:
            response = await self.model_client.async_generate(
                model_name=settings.ASSESSMENT_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,
                }
            )

            result = json.loads(response.text)
            report.final_verdict = FinalVerdict(result.get("validated_verdict", report.final_verdict))
            report.verdict_justification += f" [Audit Note: {result.get('justification', 'Approved.')}]"

        except Exception as e:
            logger.error(f"ReportCritiqueAgent failed: {e}")
