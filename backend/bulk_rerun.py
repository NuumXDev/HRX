import sys
import json
import time
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.models.job import Job
from app.engine.orchestrator import engine
from app.engine.context import WorkflowContext

def rerun_all():
    db = SessionLocal()
    candidates = db.query(Candidate).all()
    print(f"Starting bulk re-analysis for {len(candidates)} candidates...")

    for i, candidate in enumerate(candidates):
        try:
            print(f"[{i+1}/{len(candidates)}] Processing {candidate.full_name}...")
            job = db.query(Job).filter(Job.id == candidate.job_id).first()
            if not job:
                print(f"  Skipping: No job found for candidate.")
                continue

            ctx = WorkflowContext()
            ctx.set("resume_file_path", candidate.resume_path)
            ctx.set("job_details", {
                "title": job.title,
                "department": job.department,
                "requirements": job.jd_final_content or job.jd_raw_context or ""
            })

            # Run the updated pipeline
            engine.run_pipeline("deep_candidate_analysis", ctx)

            extracted_data = ctx.get("extracted_data", {})
            final_payload = {**extracted_data}
            final_payload["social_verification"] = ctx.get("social_verification", {})
            final_payload["verdict"] = ctx.get("verdict", "REJECT")
            final_payload["rationale"] = ctx.get("rationale", "")
            final_payload["scored_skills"] = ctx.get("scored_skills", [])

            match_data = ctx.get("match_analysis", {})
            final_payload["comparison_matrix"] = match_data.get("comparison_matrix", [])

            candidate.parsed_json = json.dumps(final_payload)
            candidate.match_score = float(ctx.get("match_score", 0))

            db.commit()
            print(f"  Success: Updated JSON and Match Score ({candidate.match_score}%)")
            
            # Brief sleep to avoid hitting rate limits too hard if applicable
            time.sleep(1)
        except Exception as e:
            print(f"  Failed: {e}")
            db.rollback()

    db.close()
    print("Bulk re-analysis complete.")

if __name__ == "__main__":
    rerun_all()
