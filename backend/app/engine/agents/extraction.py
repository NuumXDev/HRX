import json
from google.genai import types
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("data_extraction")
class DataExtractionAgent(BaseAgent):
    """
    Extracts deep structured JSON from a candidate's resume PDF.
    Output schema includes: full_name, email, phone, headline, summary, 
    education (list of objects with degree, institution, year), and social_links (list of strings).
    """
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Running DataExtractionAgent for deep resume parsing...")
        
        file_path = context.get("resume_file_path")
        if not file_path:
            raise ValueError("resume_file_path required for DataExtractionAgent.")
            
        try:
            with open(file_path, "rb") as doc_file:
                doc_data = doc_file.read()
            mime_type = "application/pdf"
            if file_path.endswith(".docx"):
                mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            elif file_path.endswith(".txt"):
                mime_type = "text/plain"
        except Exception as e:
            self.log(f"Failed to read file: {e}")
            return self._get_fallback_data()

        prompt = """
        You are a world-class executive recruiter at a top-tier tech firm. Your task is to parse this resume with extreme precision and provide a highly professional, detailed analysis.
        
        Required JSON Schema:
        {
            "full_name": "string",
            "email": "string",
            "phone": "string or null",
            "headline": "A sharp professional headline (e.g., 'Lead Backend Architect | Scale-up Expert')",
            "summary": "A 3-4 sentence comprehensive executive summary. Highlight the candidate's core value proposition, leadership style (if applicable), and major career inflection points. Avoid generic fluff; be specific about their technical and business impact.",
            "skills": ["List of 10-15 core technical skills"],
            "education": [
                {
                    "degree": "string",
                    "institution": "string",
                    "year": "string or null",
                    "gpa": "string or null"
                }
            ],
            "certifications": ["Cert 1", "Cert 2"],
            "experience": [
                {
                    "company": "Company Name",
                    "job_title": "Role Title",
                    "duration": "e.g. Jan 2020 - Present",
                    "description": "Provide a concise summary (max 3 bullet points) of the MOST impactful achievements. Focus on quantifiable metrics (e.g., 'Reduced latency by 40%', 'Managed $2M budget')."
                }
            ],
            "projects": [
                {
                    "title": "string",
                    "technologies": ["tech1", "tech2"],
                    "description": "A 2-3 sentence overview of the project's complexity and EXPLICITLY how the skills used (e.g., Python, AWS) solve a requirement from the JD."
                }
            ],
            "social_links": ["LinkedIn URL", "GitHub URL", "Portfolio URL"]
        }
        
        Strategic Selection Rules:
        1. Be thorough but concise in the experience descriptions—focus on high-signal data.
        2. PROJECTS: Do not extract every project. Select 3-5 'Notable Projects' that most strongly demonstrate alignment with the Job Description requirements.
        3. Ensure the 'summary' feels like a professional evaluation written for a C-suite executive.
        4. Do not include markdown blocks, just raw JSON.
        """
        
        import asyncio
        max_retries = 3
        retry_delay = 2 # seconds
        
        for attempt in range(max_retries):
            try:
                response = await self.model_client.async_generate(
                    model_name="gemini-flash-latest",
                    contents=[
                        types.Part.from_bytes(data=doc_data, mime_type=mime_type),
                        prompt
                    ],
                    config={"response_mime_type": "application/json"}
                )
                
                result = json.loads(response.text)
                context.set("extracted_data", result)
                return result
            except Exception as e:
                self.log(f"DataExtractionAgent Error (Attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (2 ** attempt)) # Exponential backoff
                else:
                    fallback = self._get_fallback_data()
                    context.set("extracted_data", fallback)
                    return fallback

    def _get_fallback_data(self):
        return {
            "full_name": "Unknown",
            "email": "unknown@example.com",
            "phone": None,
            "headline": "Extraction failed",
            "summary": "Failed to parse resume content.",
            "skills": [],
            "education": [],
            "certifications": [],
            "experience": [],
            "projects": [],
            "social_links": []
        }
