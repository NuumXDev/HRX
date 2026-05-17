import asyncio
import sys
import os
import json

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal
from app.models.job import Job
from app.models.organization import Organization

async def test_regeneration_logic():
    print("Testing Job JD Regeneration Logic...")
    db = SessionLocal()
    try:
        # Get a sample job and org
        job = db.query(Job).first()
        org = db.query(Organization).filter(Organization.id == job.org_id).first()
        
        if not job or not org:
            print("Missing jobs or orgs for test.")
            return

        print(f"Testing for Job: {job.title} in Org: {org.name}")
        
        # Simulate route logic
        from app.services.ai_service import generate_job_description
        
        content = generate_job_description(
            title=job.title,
            department=job.department or "Engineering",
            seniority="Senior",
            raw_context=job.jd_raw_context or "General requirements",
            org_name=org.name,
            org_description=org.description or "A leading innovator.",
            org_mission="Innovation",
            org_culture="Collab",
            tone="professional"
        )
        
        print("\n--- REGENERATED CONTENT START ---\n")
        print(content[:200] + "...")
        print("\n--- REGENERATED CONTENT END ---\n")
        print("Success: Regeneration logic confirmed.")

    except Exception as e:
        print(f"Test Failed: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_regeneration_logic())
