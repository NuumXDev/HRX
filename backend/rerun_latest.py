import sys
import json
from app.database import SessionLocal
from app.models.candidate import Candidate
from app.models.job import Job
from app.engine.orchestrator import engine
from app.engine.context import WorkflowContext

db = SessionLocal()
last_candidate = db.query(Candidate).order_by(Candidate.created_at.desc()).first()
job = db.query(Job).filter(Job.id == last_candidate.job_id).first()

print(f"Re-running AI deep analysis for {last_candidate.full_name}...")

ctx = WorkflowContext()
ctx.set("resume_file_path", last_candidate.resume_path)
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

last_candidate.parsed_json = json.dumps(final_payload)
last_candidate.match_score = float(ctx.get("match_score", 0))

db.commit()
print("Done! Updated Candidate JSON in Database.")
db.close()
