import asyncio
import json
import sys
import os

# Add the backend directory to sys.path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.ai_service import generate_job_description

async def test_generation():
    print("Testing Gemini JD Generation...")
    try:
        content = generate_job_description(
            title="Senior Generative AI Engineer",
            department="Product Engineering",
            seniority="Senior",
            raw_context="Must have experience with RAG, Vector DBs, and LLM fine-tuning. Expertise in Python and FastAPI is required.",
            org_name="The Som Company",
            org_description="A creative technology agency pushing the boundaries of AI.",
            org_mission="Innovation through Intelligence",
            org_culture="Fast-paced, creative, and collaborative",
            tone="bold"
        )
        print("\n--- GENERATED CONTENT START ---\n")
        print(content)
        print("\n--- GENERATED CONTENT END ---\n")
        print("Test Passed Successfully!")
    except Exception as e:
        print(f"Test Failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_generation())
