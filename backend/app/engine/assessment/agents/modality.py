"""
Modality Agent

Decides the best assessment format (MCQ, TEXT, CODE) for a specific gap/topic.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING

from app.core.config import settings
from app.engine.assessment.memory import AssessmentModality, SyllabusItem, SessionMemory, SyllabusState

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

MODALITY_PROMPT = """You are an assessment architect determining the best format to test a specific topic.

## Topic Details
- **Topic**: {topic}
- **Difficulty**: {difficulty}
- **Requirement**: {requirement_text}
- **Candidate Skills**: {skills}
- **Modality History so far**: {history}

## Modality Options
1. `MCQ` - Multiple Choice. Best for knowledge checks, definitions, procedures, and fundamentals.
2. `TEXT` - Short/Long Answer. Best for behavioral questions, situational judgment, trade-offs, and explanations.
3. `CODE` - Monaco Code Editor. Only for algorithm implementation, data manipulation, or writing actual code.

## Decision Rules (apply in order)

### Rule 1 — Role Detection (MOST IMPORTANT)
Read the topic carefully. If the topic is about:
- Hospitality, food & beverage, customer service, sales, HR, operations, healthcare support, or any non-software domain → **NEVER use CODE. Choose MCQ or TEXT only.**
- Behavioral traits (communication, teamwork, conflict, leadership) → **Always use TEXT.**
- Software, algorithms, data structures, APIs, databases, or infrastructure → CODE is allowed if budget permits.

### Rule 2 — CODE Budget
You have a maximum budget of **2 CODE questions** for the entire session.
If "CODE" appears 2 or more times in the Modality History → you MUST choose MCQ or TEXT.

### Rule 3 — Difficulty
- FUNDAMENTAL → Strongly prefer MCQ.
- CORE → MCQ or TEXT (CODE only if clearly a coding topic).
- ADVANCED → TEXT or CODE (if coding topic and budget allows).

## Output Format
Return ONLY valid JSON. No markdown.
{{
    "modality": "MCQ" | "TEXT" | "CODE",
    "rationale": "One sentence explaining the choice."
}}
"""

class ModalityAgent:
    """Decides the assessment format for a given syllabus topic."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def decide_modality(self, topic_item: SyllabusItem, memory: SessionMemory) -> AssessmentModality:
        """Determines the modality (MCQ, TEXT, CODE) for the topic."""
        
        # Build history string
        history = []
        for t in memory.syllabus:
            if t.status != SyllabusState.PENDING and t.modality:
                history.append(t.modality.value)
        
        history_str = ", ".join(history) if history else "None"

        prompt = MODALITY_PROMPT.format(
            topic=topic_item.topic,
            difficulty=topic_item.difficulty_tier.value,
            requirement_text=topic_item.requirement_text,
            skills=", ".join([s.get("skill", "") for s in memory.candidate_profile.scored_skills]),
            history=history_str
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
            modality_str = result.get("modality", "TEXT").upper()
            
            if modality_str in ["MCQ", "TEXT", "CODE"]:
                return AssessmentModality(modality_str)
            return AssessmentModality.TEXT

        except Exception as e:
            logger.error(f"ModalityAgent failed: {e}")
            return AssessmentModality.TEXT
