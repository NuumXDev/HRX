import asyncio
import os
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.engine.orchestrator import Registry, WorkflowContext

async def rerun_candidate(candidate_id: str):
    db: Session = SessionLocal()
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            print(f"Candidate {candidate_id} not found.")
            return

        print(f"Rerunning analysis for {candidate.full_name}...")
        
        # Get resume path
        # Try both 'resume_path' attribute and standard location
        r_path = getattr(candidate, "resume_path", None)
        if not r_path:
             print("Candidate has no resume_path recorded.")
             return

        resume_path = os.path.join("uploads", os.path.basename(r_path))
        if not os.path.exists(resume_path):
            resume_path = os.path.join(os.getcwd(), "uploads", os.path.basename(r_path))
            
        if not os.path.exists(resume_path):
            # Try one more: check if r_path itself is a valid relative path from backend
            resume_path = r_path if os.path.exists(r_path) else None

        if not resume_path:
            print(f"Could not find resume file on disk: {r_path}")
            return

        from app.engine.orchestrator import engine as ai_engine
        
        context = WorkflowContext()
        context.set("resume_file_path", resume_path)
        context.set("job_id", candidate.job_id)
        context.set("candidate_id", candidate.id)

        # Fetch Job details for complete analysis context
        from app.models.job import Job
        job = db.query(Job).filter(Job.id == candidate.job_id).first()
        if job:
            context.set("job_details", {
                "title": job.title,
                "department": job.department,
                "requirements": job.jd_final_content or job.jd_raw_context or ""
            })

        # Run the deep analysis pipeline (Now Async & Parallel)
        await ai_engine.run_pipeline("deep_candidate_analysis", context)
        
        # Use the consolidated JSON directly from orchestrator
        final_json = context.get("final_parsed_json", {})
        
        # Update DB - ensure serialization for SQLite
        import json
        candidate.parsed_json = json.dumps(final_json)
        candidate.match_score = float(context.get("match_score", 0))
        db.commit()
        print("Successfully updated candidate data with projects and matrix.")
        
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python rerun_candidate.py <candidate_id>")
        sys.exit(1)
    
    candidate_id = sys.argv[1]
    asyncio.run(rerun_candidate(candidate_id))
