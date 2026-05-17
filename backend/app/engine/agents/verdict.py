import json
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("verdict_engine")
class VerdictAgent(BaseAgent):
    """
    Synthesizes the parsed data, skill match scores, and social verifications 
    into a Final Verdict (ACCEPT/REJECT) and Rationale.
    """
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Running VerdictAgent synthesis...")
        
        extracted_data = context.get("extracted_data", {})
        social_verif = context.get("social_verification", {})
        match_score = context.get("match_score", 0)
        
        prompt = f"""
        You are the Hiring Committee Lead AI. Make a final determination on this candidate based on the aggregated data.
        
        Extracted Data: {json.dumps(extracted_data)}
        Social Verification Findings: {json.dumps(social_verif)}
        Overall Match Score: {match_score}%
        
        Based on this data, provide a Final Verdict and a concise Rationale (max 3 sentences) explaining the decision.
        Return ONLY valid JSON in this schema:
        {{
            "verdict": "ACCEPT",
            "rationale": "Explanation here..."
        }}
        Note: verdict must be exactly "ACCEPT" or "REJECT".
        """

        try:
            response = await self.model_client.async_generate(
                model_name="gemini-flash-latest",
                contents=[prompt],
                config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            verdict = result.get("verdict", "REJECT")
            rationale = result.get("rationale", "Could not determine.")
            context.set("verdict", verdict)
            context.set("rationale", rationale)
            
            # Reconstruct the master parsed structure for the database
            final_payload = {**extracted_data}
            final_payload["social_verification"] = social_verif
            final_payload["verdict"] = verdict
            final_payload["rationale"] = rationale
            # Pass the scored_skills instead of raw skills strings if available
            scored_skills = context.get("scored_skills")
            if scored_skills:
                # We can store them back into 'skills' or leave it as a separate field
                # Our frontend expects 'skills' as strings. Wait, no, we need to adapt the frontend.
                # Actually, the orchestrator handles final payload molding.
                pass

            return result
        except Exception as e:
            self.log(f"VerdictAgent error: {e}")
            fallback = {"verdict": "REJECT", "rationale": "Internal synthesis error during final verdict phase."}
            context.set("verdict", fallback["verdict"])
            context.set("rationale", fallback["rationale"])
            return fallback
