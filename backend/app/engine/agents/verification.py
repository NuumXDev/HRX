import json
from ..base import BaseAgent, Registry
from ..context import WorkflowContext
from ..tools.serpapi import SerpAPITool

@Registry.register("social_verification")
class SocialVerificationAgent(BaseAgent):
    """
    Verifies candidates' social links (LinkedIn, GitHub) using SerpAPI.
    Summarizes findings regarding past experiences and notable projects.
    """
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Running SocialVerificationAgent (Project Alignment)...")
        extracted_data = context.get("extracted_data", {})
        social_links = extracted_data.get("social_links", [])
        full_name = extracted_data.get("full_name")
        job_details = context.get("job_details", {})
        file_path = context.get("resume_file_path")
        
        job_title = job_details.get("title", "the role")
        job_reqs = job_details.get("requirements", "")

        tool = SerpAPITool()
        results_from_links = []
        
        # Only search GitHub or portfolios if present
        if social_links:
            for link in social_links[:3]:
                if "github.com" in link.lower() or "portfolio" in link.lower() or "gitlab" in link.lower():
                    res = tool.search_exact_url(link)
                    results_from_links.append({"url": link, "results": res})
        
        # We will read the resume PDF to extract detailed project history
        try:
            with open(file_path, "rb") as doc_file:
                doc_data = doc_file.read()
            mime_type = "application/pdf"
            if file_path.endswith(".docx"):
                mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif file_path.endswith(".txt"):
                mime_type = "text/plain"
        except Exception as e:
            self.log(f"Failed to read file in Verification Agent: {e}")
            doc_data = b""
            mime_type = "text/plain"

        prompt = f"""
        You are an AI Technical Evaluator evaluating '{full_name}' for the position of '{job_title}'.
        
        Job Requirements:
        {job_reqs}
        
        Open Web / GitHub Search Results (if any):
        {json.dumps(results_from_links)}
        
        Task: Analyze the candidate's attached resume and any web search results provided. Find specific projects or past experiences they have worked on and cross-reference them with the job requirements to explain how they align with the role.
        
        Provide a JSON summary with two keys:
        - "findings": A rich, continuous paragraph detailing how their specific projects align with the role. Be very specific. Example: "Som has extensive python experience as can be seen from his backend api pipeline project mentioned in the resume, where he created a whole backend pipeline using python and FastAPI with cost optimisations."
        - "notable_projects": An array of objects, each with "name" and "description" (focus the description on how the project aligns with the required skills).
        
        Return ONLY valid JSON. Note that JSON does not support trailing commas.
        """

        try:
            from google.genai import types
            contents = []
            if doc_data:
                contents.append(types.Part.from_bytes(data=doc_data, mime_type=mime_type))
            contents.append(prompt)

            response = await self.model_client.async_generate(
                model_name="gemini-flash-latest",
                contents=contents,
                config={"response_mime_type": "application/json"}
            )
            result = json.loads(response.text)
            context.set("social_verification", result)
            return result
        except Exception as e:
            self.log(f"Verification Agent error: {e}")
            res = self._build_result("Failed to establish project alignment due to internal error.", [])
            context.set("social_verification", res)
            return res
            
    def _build_result(self, findings: str, notable_projects: list):
        return {
            "findings": findings,
            "notable_projects": notable_projects
        }
