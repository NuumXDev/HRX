import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '..')))

from app.api.v1.public.routes import run_background_analysis
from app.database import SessionLocal
from app.models.candidate import Candidate

async def main():
    db = SessionLocal()
    candidate = db.query(Candidate).filter(Candidate.full_name == "anubha bhardwaj").first()
    if candidate:
        print(f"Re-running analysis for {candidate.full_name} (ID: {candidate.id})...")
        await run_background_analysis(candidate.id, candidate.job_id, candidate.resume_path)
        print("Analysis completed.")
    else:
        print("Candidate 'anubha bhardwaj' not found.")
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
