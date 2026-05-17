import json
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("skill_match")
class SkillMatchAgent(BaseAgent):
    """
    Evaluates Candidate skills against Job requirements to generate an Out-of-5 score 
    for each skill and an overall percentage proxy.
    """
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Running SkillMatchAgent...")
        job_details = context.get("job_details")
        extracted_data = context.get("extracted_data", {})
        
        if not job_details:
            self.log("No job details, cannot score skills against requirements.")
            fallback = {"match_score": 0, "scored_skills": extracted_data.get("skills", [])}
            context.set("match_score", 0)
            context.set("scored_skills", fallback["scored_skills"])
            return fallback

        candidate_skills = extracted_data.get("skills", [])
        job_requirements = job_details.get("requirements", "")
        
        prompt = f"""
        Expert Technical Assessment:
        Job Requirements: {job_requirements}
        Candidate's Extracted Skills: {json.dumps(candidate_skills)}
        
        Task:
        1. FILTER: Only include skills that are explicitly mentioned in or critically relevant to the Job Requirements.
        2. SCORE: Evaluated each filtered skill out of 5 based on candidates' depth (implied from resume) relative to the seniority level required.
        
        Return JSON:
        {{
            "overall_match_percentage": <0-100>,
            "scored_skills": [
                {{"skill": "<skill_name>", "score": <1.0-5.0>}}
            ]
        }}
        """

        try:
            response = await self.model_client.async_generate(
                model_name="gemini-flash-latest",
                contents=[prompt],
                config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            context.set("match_score", result.get("overall_match_percentage", 0))
            context.set("scored_skills", result.get("scored_skills", []))
            return result
        except Exception as e:
            self.log(f"SkillMatchAgent error: {e}")
            fallback = {"match_score": 0, "scored_skills": [{"skill": s, "score": 3.0} for s in candidate_skills]}
            context.set("match_score", 0)
            context.set("scored_skills", fallback["scored_skills"])
            return fallback
