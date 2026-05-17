"""
Question Generator Agent

Dynamically generates the payload for the current syllabus topic and modality.
Outputs strict JSON conforming to the AssessmentQuestion Pydantic schema so the React
frontend can cleanly render it as a QuestionCard.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Optional

from app.core.config import settings
from app.engine.assessment.memory import AssessmentQuestion, AssessmentModality, SyllabusItem, SessionMemory

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

QUESTION_GENERATOR_PROMPT = """You are an expert assessor generating a highly specific, personalized question for a candidate.

## Context
- **Candidate Name**: {candidate_name}
- **Candidate Background**: {candidate_profile}
- **Assessment Topic**: {topic}
- **Topic Requirement**: {requirement_text}
- **Question Format**: {modality}
- **Is Follow-Up / Drill Down**: {is_followup}

## Instructions

### 1. Personalize the Question
Always reference specific details from the candidate's background.
- If they listed a specific past employer or project, mention it by name.
- Example for a barista: "At your previous role at [Cafe X], how did you handle a customer who received the wrong order during a busy rush?"
- Example for a software engineer: "In your Python data pipeline work, how would you handle backpressure if a downstream consumer is slow?"

### 2. Match the Format Exactly

**If MCQ (Multiple Choice):**
- Write a clear scenario or knowledge-check question.
- Provide exactly 4 options (A-D). Only one should be clearly correct.
- Keep options concise and unambiguous.
- Time limit: 2 minutes.

**If TEXT (Short/Long Answer):**
- Write a situational, behavioral, or conceptual question.
- Use the STAR format hint where appropriate (Situation, Task, Action, Result).
- For non-technical roles: ask about real-world customer interactions, conflict resolution, teamwork, or judgment calls.
- For technical roles: ask about trade-offs, design choices, or explaining a concept.
- Time limit: 5 minutes.

**If CODE:**
- Write a concrete programming problem with a clear input/output spec.
- Provide starter code (imports + function signature only, no solution).
- Time limit: 10 minutes.

### 3. Difficulty Ramp
- First 1-2 topics: Warm-up level — straightforward, confidence-building.
- Middle topics: Working proficiency — requires applied knowledge.
- Final topics: Advanced — complex scenarios, edge cases, or judgment under pressure.

### 4. Follow-Up Drill Down
If `Is Follow-Up` is True, dig deeper into a weak area. Reference their previous answer implicitly (e.g., "Building on what you described...") and ask for more specificity or a harder scenario.

## Output Format
Return ONLY valid JSON. No markdown. No extra keys.
{{
    "prompt": "The personalized question text...",
    "modality": "{modality}",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],  // Only if MCQ, else null
    "starter_code": "def my_func():\n    pass",            // Only if CODE, else null
    "time_limit_minutes": 5                                 // 2 for MCQ, 5 for TEXT, 10 for CODE
}}
"""


class QuestionGeneratorAgent:
    """Generates the structured JSON question payloads."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def generate_question(
        self, 
        topic_item: SyllabusItem, 
        memory: SessionMemory,
        is_followup: bool = False
    ) -> AssessmentQuestion:
        """Generates the exact payload for the UI."""
        
        prompt = QUESTION_GENERATOR_PROMPT.format(
            candidate_name=memory.candidate_profile.full_name,
            candidate_profile=str(memory.candidate_profile.scored_skills) + " | " + str(memory.candidate_profile.projects),
            topic=topic_item.topic,
            requirement_text=topic_item.requirement_text,
            modality=topic_item.modality.value if topic_item.modality else "TEXT",
            is_followup=str(is_followup)
        )

        try:
            response = await self.model_client.async_generate(
                model_name=settings.ASSESSMENT_MODEL,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.5,
                }
            )

            result = json.loads(response.text)
            
            # Sanitize arrays to prevent pydantic failure if LLM returns empty list instead of null
            options = result.get("options")
            if options is not None and len(options) == 0:
                options = None
                
            return AssessmentQuestion(
                prompt=result.get("prompt", f"Please demonstrate your knowledge of {topic_item.topic}."),
                modality=topic_item.modality or AssessmentModality.TEXT,
                options=options,
                starter_code=result.get("starter_code"),
                time_limit_minutes=int(result.get("time_limit_minutes", 5))
            )

        except Exception as e:
            logger.error(f"QuestionGeneratorAgent failed: {e}")
            return AssessmentQuestion(
                prompt=f"Please explain your experience with {topic_item.topic}.",
                modality=AssessmentModality.TEXT,
                time_limit_minutes=5
            )
