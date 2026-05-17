import json
from app.database import SessionLocal
from app.models.candidate import Candidate

db = SessionLocal()
last_candidate = db.query(Candidate).order_by(Candidate.created_at.desc()).first()
print(f"Candidate: {last_candidate.full_name}")
print("Parsed JSON:")
if last_candidate.parsed_json:
    try:
        parsed = json.loads(last_candidate.parsed_json)
        print(json.dumps(parsed, indent=2))
    except Exception as e:
        print(f"Invalid JSON: {e}")
else:
    print("No JSON found.")

db.close()
