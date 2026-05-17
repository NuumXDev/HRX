import json
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("analysis")
class AnalysisAgent(BaseAgent):
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Scoring Candidate Match...")
        
        resume_text = context.get("resume_text")
        job_description = context.get("job_description")
        
        if not resume_text:
            extracted_data = context.get("extracted_data")
            if extracted_data:
                resume_text = json.dumps(extracted_data)
        
        if not job_description:
            job_details = context.get("job_details")
            if job_details:
                job_description = job_details.get("requirements")
        
        if not resume_text or not job_description:
            return self._get_fallback_data()
        
        prompt = f"""
        Role: Senior Engineering Lead / Technical Assessor
        Candidate Dossier: {resume_text}
        Job Requirements: {job_description}
        
        Task:
        Perform a high-fidelity technical gap analysis.
        
        Return JSON:
        {{
            "score": <0-100 based on core requirement alignment>,
            "reasoning": "Executive-level technical assessment of the candidate's ceiling and cultural alignment.",
            "missing_skills": ["List of critical gaps"],
            "comparison_matrix": [
                {{
                    "requirement": "Requirement name",
                    "alignment": "Met | Partial | Not Met",
                    "candidate_qualification": "Specific evidence from the resume or 'No relevant evidence found in the provided document.'"
                }}
            ]
        }}
        
        Guidelines:
        1. Ensure 'candidate_qualification' is a concise, impact-focused extract or summary of their work.
        2. Be conservative. If a skill is not explicitly evidenced, mark as 'Not Met'.
        """
        
        try:
            response = await self.model_client.async_generate(
                model_name="gemini-flash-latest",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            
            result = json.loads(response.text)
            context.set("match_analysis", result)
            return result
        except Exception as e:
            self.log(f"Match Scoring Error: {e}")
            fallback = self._get_fallback_data()
            context.set("match_analysis", fallback)
            return fallback

    def _get_fallback_data(self):
        return {
            "score": 0, 
            "reasoning": "AI analysis was skipped or failed.",
            "missing_skills": [],
            "comparison_matrix": []
        }
