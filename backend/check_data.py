import json
from app.database import SessionLocal
from app.models.candidate import Candidate

def check():
    db = SessionLocal()
    c = db.query(Candidate).filter(Candidate.full_name == "Som Pande").first()
    if c and c.parsed_json:
        data = json.loads(c.parsed_json)
        print(f"Candidate: {c.full_name}")
        print(f"Experience keys: {list(data.get('experience', [{}])[0].keys())}")
        print(f"Experience count: {len(data.get('experience', []))}")
        print(f"Matrix keys: {list(data.get('comparison_matrix', [{}])[0].keys())}")
        print(f"Matrix count: {len(data.get('comparison_matrix', []))}")
    else:
        print("Candidate not found or no parsed_json.")
    db.close()

if __name__ == "__main__":
    check()
