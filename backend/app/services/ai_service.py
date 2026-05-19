from google import genai
import os
from dotenv import load_dotenv
from app.engine import engine, WorkflowContext

load_dotenv()

# Configure Gemini for any unmigrated functions (like interview scorecard)
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

async def generate_job_description(
    title: str, 
    department: str, 
    seniority: str, 
    raw_context: str, 
    org_name: str, 
    org_description: str,
    org_mission: str,
    org_culture: str,
    tone: str = "professional"
) -> str:
    """Delegates to AIEngine jd_generator agent."""
    ctx = WorkflowContext({
        "title": title,
        "department": department,
        "seniority": seniority,
        "raw_context": raw_context,
        "org_name": org_name,
        "org_description": org_description,
        "org_mission": org_mission,
        "org_culture": org_culture,
        "tone": tone
    })
    return await engine.run_agent("jd_generator", ctx)

async def parse_candidate_resume(file_path: str) -> dict:
    """Delegates to AIEngine ingestion agent."""
    ctx = WorkflowContext({
        "resume_file_path": file_path
    })
    await engine.run_agent("ingestion", ctx)
    return ctx.get("parsed_data", {})

async def score_candidate_match(resume_text: str, job_description: str) -> dict:
    """Delegates to AIEngine analysis agent."""
    ctx = WorkflowContext({
        "resume_text": resume_text,
        "job_description": job_description
    })
    await engine.run_agent("analysis", ctx)
    return ctx.get("match_analysis", {})


def generate_interview_scorecard(resume_text: str, job_description: str, interview_notes: str, interview_type: str) -> dict:
    """
    Generates an AI-powered scorecard after an interview.
    """
    prompt = f"""
    You are an expert technical recruiter and talent assessor. Analyze the following interview data and generate a detailed AI Scorecard.
    
    ### Role: {interview_type} Interview
    
    ### Job Description:
    {job_description}
    
    ### Candidate Resume Summary:
    {resume_text}
    
    ### Interviewer's Raw Notes:
    {interview_notes}
    
    ### Instructions:
    - Evaluate technical proficiency vs role requirements.
    - Identify culture fit indicators from notes.
    - Spot potential inconsistencies between resume and notes.
    
    Return a JSON object with:
    - overall_score (0-100)
    - key_strengths (list of strings)
    - red_flags (list of strings)
    - recommendation (Strong Hire, Hire, Borderline, No Hire)
    - summary (a 3-4 sentence professional assessment)
    
    Return ONLY raw JSON.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config={"response_mime_type": "application/json"}
    )
    
    import json
    try:
        return json.loads(response.text)
    except:
        return {
            "overall_score": 0, 
            "key_strengths": [], 
            "red_flags": ["Failed to generate assessment"], 
            "recommendation": "Pending", 
            "summary": "AI processing failed."
        }
