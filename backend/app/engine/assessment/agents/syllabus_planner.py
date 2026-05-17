"""
Syllabus Planner Agent

Analyzes the candidate's profile vs the Job Description to generate a role-appropriate
assessment syllabus. Adapts topic types (technical, behavioral, situational) based
on the nature of the role — not just technical skills.
"""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, List

from app.core.config import settings
from app.engine.assessment.memory import SessionMemory, SyllabusItem, GapCriticality, DifficultyTier

if TYPE_CHECKING:
    from app.engine.models import ModelClient

logger = logging.getLogger(__name__)

SYLLABUS_PLANNER_PROMPT = """You are an expert recruiter and assessment architect.
Your goal is to design a well-rounded, role-appropriate assessment syllabus based on the job description and a candidate's background.

## Context
- **Job Title**: {job_title}
- **Job Description**: {job_description}
- **Candidate Name**: {candidate_name}
- **Candidate Profile**:
{candidate_profile}

## Instructions

### Step 1 — Classify the Role
First, determine the nature of this job from the Job Title and Job Description:
- **TECHNICAL**: Software engineering, data science, DevOps, IT, machine learning, etc. Heavily dependent on code, systems, and algorithms.
- **SEMI_TECHNICAL**: Product manager, data analyst, QA tester, digital marketer, designer — mix of domain knowledge and soft skills.
- **NON_TECHNICAL**: Hospitality, service, sales, HR, operations, barista, customer support, retail, healthcare support, etc. Primarily behavioral, situational, and role-specific knowledge.

### Step 2 — Design the Syllabus
Based on the role type, generate exactly 5 to 7 specific, testable topics:

**If TECHNICAL:**
- Topics focus on technical skills, code quality, system design, algorithms, and best practices.
- Examples: "REST API Design", "SQL Query Optimization", "React State Management", "Docker Containerization".
- CODE modality questions are appropriate for CORE and ADVANCED topics.

**If SEMI_TECHNICAL:**
- Mix of domain knowledge, analytical thinking, and behavioral competencies.
- Examples: "Data Interpretation", "Stakeholder Communication", "Product Requirements Prioritization", "A/B Test Analysis".
- Prefer MCQ and TEXT. Avoid CODE questions entirely.

**If NON_TECHNICAL:**
- Topics MUST be grounded in the actual job duties, customer interaction, teamwork, situational judgment, and role-specific knowledge from the Job Description.
- For a barista: "Espresso & Coffee Preparation Techniques", "Customer Complaint Handling", "Rush Hour Order Prioritization", "Coffee Menu & Allergen Knowledge", "Teamwork During Peak Hours".
- For a sales rep: "Objection Handling", "Product Knowledge", "CRM Usage", "Target Achievement Mindset", "Cold Outreach Strategy".
- NEVER generate software, coding, or algorithm topics for non-technical roles.
- NEVER use CODE modality. Use MCQ for knowledge checks, TEXT for situational and behavioral questions.

### Step 3 — Apply Difficulty Tiers
For ALL role types, apply this ramp (ordered FUNDAMENTAL → CORE → ADVANCED):
- **FUNDAMENTAL**: Basic knowledge, definitions, standard procedures (minimum 2 topics).
- **CORE**: Practical application in realistic scenarios (minimum 2 topics).
- **ADVANCED**: Complex situations, judgment calls, edge cases, leadership, or design decisions.

### Step 4 — Cite the Resume
For every topic, note which part of the candidate's background (a past role, project, or stated skill) you are validating or probing.

## Output Format
Return ONLY a valid JSON array. No markdown, no explanation.
[
    {{
        "topic": "...",
        "requirement_text": "Why this topic matters for this specific role",
        "difficulty_tier": "FUNDAMENTAL" | "CORE" | "ADVANCED",
        "criticality": "HIGH" | "MEDIUM" | "LOW",
        "cite_resume_source": "Which part of the candidate profile this validates"
    }}
]
"""


class SyllabusPlannerAgent:
    """Plans the role-appropriate assessment syllabus based on job type and candidate profile."""

    def __init__(self, model_client: "ModelClient"):
        self.model_client = model_client

    async def generate_syllabus(self, memory: SessionMemory) -> List[SyllabusItem]:
        """
        Generates the assessment syllabus, adapting to the role type.
        """
        profile = memory.candidate_profile
        
        # Build profile summary for prompt
        profile_text = (
            f"Headline: {profile.headline}\n\n"
            f"Experience: {profile.experience if profile.experience else 'None'}\n\n"
            f"Key Projects: {profile.projects if profile.projects else 'None'}\n\n"
            f"Scored Skills: {profile.scored_skills}"
        )

        prompt = SYLLABUS_PLANNER_PROMPT.format(
            job_title=memory.job_title,
            job_description=memory.job_description,
            candidate_name=profile.full_name,
            candidate_profile=profile_text
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

            results = json.loads(response.text)
            syllabus = []
            
            for item in results:
                criticality_str = str(item.get("criticality", "MEDIUM")).upper()
                if criticality_str not in ["HIGH", "MEDIUM", "LOW"]:
                    criticality_str = "MEDIUM"
                
                tier_str = str(item.get("difficulty_tier", "CORE")).upper()
                if tier_str not in ["FUNDAMENTAL", "CORE", "ADVANCED"]:
                    tier_str = "CORE"
                    
                syllabus.append(
                    SyllabusItem(
                        topic=str(item.get("topic", "Role Knowledge")),
                        requirement_text=str(item.get("requirement_text", "Role requirement")),
                        criticality=GapCriticality(criticality_str),
                        difficulty_tier=DifficultyTier(tier_str),
                        cite_resume_source=str(item.get("cite_resume_source", "General background"))
                    )
                )
                
            return syllabus

        except Exception as e:
            logger.error(f"SyllabusPlannerAgent failed: {e}")
            # Generic role-agnostic fallback
            return [
                SyllabusItem(
                    topic="Role Fundamentals",
                    requirement_text="Core knowledge and responsibilities for this position",
                    criticality=GapCriticality.HIGH,
                    difficulty_tier=DifficultyTier.FUNDAMENTAL
                ),
                SyllabusItem(
                    topic="Communication & Collaboration",
                    requirement_text="Interpersonal skills and ability to work effectively with others",
                    criticality=GapCriticality.MEDIUM,
                    difficulty_tier=DifficultyTier.FUNDAMENTAL
                ),
                SyllabusItem(
                    topic="Situational Judgment",
                    requirement_text="Handling real-world challenges and unexpected situations in this role",
                    criticality=GapCriticality.HIGH,
                    difficulty_tier=DifficultyTier.CORE
                ),
            ]
