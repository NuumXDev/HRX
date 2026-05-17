import json
from app.database import SessionLocal
from app.models.candidate import Candidate

def check():
    db = SessionLocal()
    c = db.query(Candidate).filter(Candidate.full_name == "Som Pande").first()
    if c and c.parsed_json:
        data = json.loads(c.parsed_json)
        print(f"Candidate: {c.full_name}")
        print(f"Keys found: {list(data.keys())}")
        print(f"Experience count: {len(data.get('experience', []))}")
        print(f"Matrix count: {len(data.get('comparison_matrix', []))}")
    else:
        print("Candidate not found.")
    db.close()

if __name__ == "__main__":
    check()
