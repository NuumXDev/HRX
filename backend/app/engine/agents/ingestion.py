import json
from google.genai import types
from ..base import BaseAgent, Registry
from ..context import WorkflowContext

@Registry.register("ingestion")
class IngestionAgent(BaseAgent):
    async def run(self, context: WorkflowContext) -> dict:
        self.log("Parsing Candidate Resume...")
        
        file_path = context.get("resume_file_path")
        if not file_path:
            raise ValueError("Resume file path is required in context for IngestionAgent.")
            
        try:
            with open(file_path, "rb") as doc_file:
                doc_data = doc_file.read()
        except Exception as e:
            self.log(f"Failed to read file: {e}")
            return self._get_fallback_data()
            
        mime_type = "application/pdf"
        if file_path.endswith(".docx"):
            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif file_path.endswith(".txt"):
            mime_type = "text/plain"

        prompt = """
        You are an AI resume parser. Extract information from this resume and return it in VALID JSON format.
        Required fields:
        - full_name (string)
        - email (string)
        - phone (string or null)
        - headline (short professional summary, string)
        - skills (list of strings)
        - summary (detailed professional summary, string)
        - education (list of objects with: institution, degree, year, gpa)
        - certifications (list of strings)
        - experience (list of objects with: company, job_title, duration, description)
        
        Return ONLY the raw JSON.
        """
        
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
            context.set("parsed_data", result)
            return result
        except Exception as e:
            self.log(f"Resume Parsing Error: {e}")
            fallback = self._get_fallback_data()
            context.set("parsed_data", fallback)
            return fallback
            
    def _get_fallback_data(self):
        return {
            "full_name": "Unknown",
            "email": "unknown@example.com",
            "phone": None,
            "headline": "Resume processing failed",
            "skills": [],
            "summary": "We were unable to parse this resume automatically.",
            "education": [],
            "certifications": [],
            "experience": []
        }
