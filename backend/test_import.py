try:
    from app.models.candidate_token import CandidateToken
    from app.models.interview import Interview
    print("Imports successful")
except Exception as e:
    print(f"Import crash: {e}")
