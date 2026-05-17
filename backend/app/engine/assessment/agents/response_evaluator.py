"""
Response Evaluator Agent

Evaluates MCQ, TEXT, and CODE submissions uniformly, returning a strict
0-10 integer score.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from app.core.config import settings
from app.engine.assessment.memory import (
    EvaluationResult,
    DepthLevel,
    SyllabusItem,
    SessionMemory,
)

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

EVALUATOR_PROMPT = """You are a rigorous technical interview evaluator. Assess the candidate's exact submission against the question prompt.

## Context
- **Gap Topic**: {topic}
- **Question Modality**: {modality}
- **Time Taken**: {elapsed_seconds} seconds

## The Question
Prompt: {prompt}
{options_block}
{starter_code_block}

## Candidate's Submission
Selected Option: {selected_option}
Text Answer: {text_answer}
Final Code: {final_code}

## Evaluation Criteria
Provide a strict integer score (0-10) based on these rubrics:
### If MCQ:
- Score 10 if correct. Score 0 if incorrect. Simple deterministic grading based on the obvious correct answer.

### If TEXT / Thought Process:
- 0-3: Fundamentally wrong or completely vague/empty.
- 4-5: Surface-level understanding or partially addresses prompt.
- 6-7: Working knowledge, mostly correct but lacks deep reasoning or trade-offs.
- 8-9: Deep understanding with specific technical details.
- 10: Perfect, comprehensive explanation.

### If CODE:
- 0-3: Does not run, syntactically broken, or completely misses the objective.
- 4-5: Attempts solution but logic is flawed or fails basic examples.
- 6-7: Solves the happy path but misses edge cases or is highly inefficient.
- 8-9: Solves efficiently, handles edge cases, good readability.
- 10: Production-grade code.

## Rules
- Be STRICT. Do not inflate scores. Give 0-3 for bad answers.
- The `correctness` flag should simply be `true` if score >= 6, else `false`.
- Depth: `surface`, `working`, or `deep`.

## Output Format (strict JSON)
{{
    "score": <0-10>,
    "depth": "surface|working|deep",
    "correctness": true/false,
    "reasoning": "2-3 sentence technical justification of the score."
}}
"""


class ResponseEvaluatorAgent:
    """Grades the candidate submission."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def evaluate(
        self,
        topic_item: SyllabusItem,
        memory: SessionMemory,
    ) -> EvaluationResult:
        """Evaluates the latest submission for this topic."""
        
        q = topic_item.question
        sub = topic_item.submissions[-1] if topic_item.submissions else None

        if not q or not sub:
            raise ValueError("Evaluator requires a question and submission")
            
        options_block = f"Options: {q.options}" if q.options else ""
        starter_code_block = f"Starter Code: {q.starter_code}" if q.starter_code else ""

        prompt = EVALUATOR_PROMPT.format(
            topic=topic_item.topic,
            modality=q.modality.value,
            elapsed_seconds=sub.elapsed_seconds,
            prompt=q.prompt,
            options_block=options_block,
            starter_code_block=starter_code_block,
            selected_option=sub.selected_option or "N/A",
            text_answer=sub.text_answer or "N/A",
            final_code=sub.final_code or "N/A",
        )

        try:
            response = await self.model_client.async_generate(
                model_name=settings.ASSESSMENT_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.1,  # Low temp for grading
                }
            )

            result = json.loads(response.text)

            return EvaluationResult(
                score=max(0, min(10, int(result.get("score", 0)))),
                depth=DepthLevel(result.get("depth", "surface")),
                correctness=result.get("correctness", False),
                reasoning=result.get("reasoning", ""),
            )

        except Exception as e:
            logger.error(f"ResponseEvaluatorAgent failed: {e}")
            return EvaluationResult(
                score=0,
                depth=DepthLevel.SURFACE,
                correctness=False,
                reasoning=f"Evaluation execution failed: {str(e)}",
            )
