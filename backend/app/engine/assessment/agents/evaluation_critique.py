"""
Evaluation Critique Agent

Adversarial check on the ResponseEvaluator score to prevent LLM hallucination
or excessive leniency.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from app.core.config import settings
from app.engine.assessment.memory import EvaluationResult, SyllabusItem

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

CRITIQUE_PROMPT = """You are an adversarial Senior Principal Engineer auditing an interviewer's grade.

## Topic: {topic}
## The Question: {prompt}
## The Candidate's Submission:
Selected Option: {selected_option}
Text Answer: {text_answer}
Final Code: {final_code}

## The Suggested Grade
Score: {score} / 10
Justification: {reasoning}

## Your Job
Audite this score. Is the interviewer being too nice? Did the candidate actually write syntactically invalid code but get a 7? Did the candidate state a blatantly wrong fact but get partial credit? Or was the candidate harshly punished for a minor typo?

## Instruction
If the score is fair, keep it. 
If the score is flawed, adjust it up or down aggressively to reflect strict technical reality.

## Output Format (strict JSON)
{{
    "validated_score": <0-10 integer>,
    "critique_adjusted": true/false,
    "critique_notes": "Why you adjusted it (or why you agreed)."
}}
"""

class EvaluationCritiqueAgent:
    """Adversarial check on prompt grading."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def critique(
        self,
        topic_item: SyllabusItem,
        evaluation: EvaluationResult
    ) -> dict:
        """Modifies the evaluation in place if needed."""
        
        q = topic_item.question
        sub = topic_item.submissions[-1] if topic_item.submissions else None

        if not q or not sub:
            return {"adjusted": False}

        prompt = CRITIQUE_PROMPT.format(
            topic=topic_item.topic,
            prompt=q.prompt,
            selected_option=sub.selected_option or "N/A",
            text_answer=sub.text_answer or "N/A",
            final_code=sub.final_code or "N/A",
            score=evaluation.score,
            reasoning=evaluation.reasoning
        )

        try:
            response = await self.model_client.async_generate(
                model_name=settings.ASSESSMENT_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.2,
                }
            )

            result = json.loads(response.text)
            
            validated = max(0, min(10, int(result.get("validated_score", evaluation.score))))
            
            if validated != evaluation.score:
                evaluation.score = validated
                evaluation.critique_adjusted = True
                evaluation.critique_notes = result.get("critique_notes", "")
                
            return { "adjusted": evaluation.critique_adjusted }

        except Exception as e:
            logger.error(f"EvaluationCritiqueAgent failed: {e}")
            return { "adjusted": False }
