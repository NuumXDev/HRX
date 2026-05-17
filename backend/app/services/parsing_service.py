from app.services.ai_service import parse_candidate_resume, score_candidate_match
import os

class ParsingService:
    @staticmethod
    def process_new_application(resume_path: str, job_description: str):
        """
        Parses a resume and scores it against a job description.
        """
        # 1. Parse Resume
        parsed_data = parse_candidate_resume(resume_path)
        
        # 2. Score Match
        # We pass the summary extracted by Gemini for matching
        match_data = score_candidate_match(
            resume_text=parsed_data.get("summary", ""),
            job_description=job_description
        )
        
        return {
            "parsed": parsed_data,
            "match": match_data
        }

parsing_service = ParsingService()
