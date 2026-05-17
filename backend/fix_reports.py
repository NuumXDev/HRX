import os
import sys
import json
import asyncio

# Setup path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database import SessionLocal
from app.models.assessment_session import AssessmentSession
from app.engine.assessment.orchestrator import AssessmentOrchestrator
from app.engine.models import ModelClient

async def fix_missing_reports():
    db = SessionLocal()
    try:
        # Find completed sessions without reports
        sessions = db.query(AssessmentSession).filter(
            AssessmentSession.status == "COMPLETED",
            AssessmentSession.report_json == None
        ).all()
        
        print(f"Found {len(sessions)} sessions missing reports.")
        
        for session in sessions:
            print(f"Generating report for session {session.id}...")
            orchestrator = AssessmentOrchestrator(ModelClient())
            orchestrator.load_memory(session.memory_json)
            
            report_data = await orchestrator.generate_final_report()
            if report_data:
                session.report_json = json.dumps(report_data)
                session.overall_score = report_data.get("overall_score", 0)
                session.final_verdict = report_data.get("final_verdict", "BORDERLINE")
                print(f"Successfully generated report for {session.id}")
            else:
                print(f"Failed to generate report for {session.id}")
        
        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(fix_missing_reports())
