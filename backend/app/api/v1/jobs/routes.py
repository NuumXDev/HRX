import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.job import Job, JobStatus
from app.models.organization import Organization
from app.models.candidate import Candidate
from app.schemas.job import JobCreate, JobUpdate, JobResponse, JDGenerateRequest
from app.schemas.candidate import CandidateResponse
from app.services.ai_service import generate_job_description
from app.core.config import settings

router = APIRouter()

@router.post("", response_model=JobResponse)
def create_job(payload: JobCreate, org_id: str, db: Session = Depends(get_db)):
    # Verify organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db_job = Job(
        id=str(uuid.uuid4()),
        org_id=org_id,
        title=payload.title,
        department=payload.department,
        status=JobStatus.DRAFT
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("", response_model=List[JobResponse])
def get_jobs(org_id: str, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    jobs = db.query(Job).options(joinedload(Job.candidates)).filter(Job.org_id == org_id).all()
    
    # Brute-force: Convert to dicts and inject count
    results = []
    for job in jobs:
        data = {
            "id": job.id,
            "org_id": job.org_id,
            "title": job.title,
            "department": job.department,
            "status": job.status,
            "jd_raw_context": job.jd_raw_context,
            "jd_final_content": job.jd_final_content,
            "candidate_count": len(job.candidates),
            "created_at": job.created_at,
            "updated_at": job.updated_at
        }
        results.append(data)
    
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: str, org_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.org_id == org_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: str, org_id: str, payload: JobUpdate, db: Session = Depends(get_db)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.org_id == org_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(db_job, key, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: str, org_id: str, db: Session = Depends(get_db)):
    db_job = db.query(Job).filter(Job.id == job_id, Job.org_id == org_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    db.delete(db_job)
    db.commit()
    return None

@router.post("/generate-jd")
async def generate_jd(payload: JDGenerateRequest, org_id: str, db: Session = Depends(get_db)):
    # 1. Fetch Organization Context for better prompt engineering
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 2. Extract context from recruitment_settings if available
    try:
        settings = json.loads(org.recruitment_settings) if org.recruitment_settings else {}
    except:
        settings = {}
        
    tone = payload.tone or settings.get("tone", "professional")
    
    # 3. Call Gemini AI Service
    try:
        generated_content = await generate_job_description(
            title=payload.title,
            department=payload.department or "Engineering",
            seniority=payload.seniority or "Senior",
            raw_context=payload.raw_context,
            org_name=org.name,
            org_description=org.description or "A leading innovator in the industry.",
            org_mission="Innovation and Excellence", # Placeholder if mission is not a specific field yet
            org_culture="Collaborative and Growth-oriented", # Placeholder if culture is not a specific field yet
            tone=tone
        )
        return {"content": generated_content}
    except Exception as e:
        print(f"AI Generation Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate job description: {str(e)}")

@router.post("/{job_id}/regenerate")
async def regenerate_job_jd(job_id: str, org_id: str, payload: JDGenerateRequest, db: Session = Depends(get_db)):
    # 1. Fetch Job and Organization
    job = db.query(Job).filter(Job.id == job_id, Job.org_id == org_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # 2. Update job context if provided in payload
    if payload.raw_context:
        job.jd_raw_context = payload.raw_context
        
    # 3. Extract tone from recruitment_settings
    try:
        settings = json.loads(org.recruitment_settings) if org.recruitment_settings else {}
    except:
        settings = {}
        
    tone = payload.tone or settings.get("tone", "professional")

    # 4. Call AI Service with context
    try:
        generated_content = await generate_job_description(
            title=payload.title or job.title,
            department=payload.department or job.department or "Engineering",
            seniority=payload.seniority or "Senior",
            raw_context=job.jd_raw_context or "General role requirements",
            org_name=org.name,
            org_description=org.description or "A leading innovator in the industry.",
            org_mission="Innovation and Excellence",
            org_culture="Collaborative and Growth-oriented",
            tone=tone
        )
        
        # 5. Update the job in background
        job.jd_final_content = generated_content
        db.commit()
        
        return {"content": generated_content}
    except Exception as e:
        print(f"AI Regeneration Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to regenerate JD: {str(e)}")

@router.get("/{job_id}/candidates", response_model=List[CandidateResponse])
def get_job_candidates(job_id: str, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    candidates = db.query(Candidate).options(joinedload(Candidate.job)).filter(Candidate.job_id == job_id).all()
    
    # Enrich with job title, magic links, and assessment results
    from app.models.candidate_token import CandidateToken
    for c in candidates:
        if c.job:
            c.job_title = c.job.title
            
        # 1. Fetch Magic Link
        token = db.query(CandidateToken).filter(
            CandidateToken.candidate_id == c.id,
            CandidateToken.is_used == False
        ).order_by(CandidateToken.created_at.desc()).first()
        if token:
            c.magic_link = f"{settings.FRONTEND_URL.rstrip('/')}/p/test/{token.token}"
            
        # 2. Fetch Latest Assessment Session
        if c.assessment_sessions:
            latest = sorted(c.assessment_sessions, key=lambda s: s.created_at, reverse=True)[0]
            c.assessment_status = latest.status
            c.assessment_score = latest.overall_score
            c.assessment_verdict = latest.final_verdict
            c.assessment_report = latest.report_json
            
    return candidates

@router.get("/analytics/summary")
def get_analytics_summary(org_id: str, job_id: str = None, db: Session = Depends(get_db)):
    # 1. Base Query
    query = db.query(Candidate).filter(Candidate.org_id == org_id)
    if job_id:
        query = query.filter(Candidate.job_id == job_id)
    candidates = query.all()
    
    # 2. Global Metrics
    total_candidates = len(candidates)
    
    # Pass rate: count candidates in interview/offered stages or with positive assessment verdicts
    positive_count = 0
    scored_candidates = 0
    total_score = 0.0
    
    for c in candidates:
        # Check score
        score = c.match_score
        # Check latest session score if match_score is None
        if score is None and c.assessment_sessions:
            latest = sorted(c.assessment_sessions, key=lambda s: s.created_at, reverse=True)[0]
            score = latest.overall_score
            
        if score is not None:
            scored_candidates += 1
            total_score += score
            
        # Positive verdict check
        verdict = None
        if c.assessment_sessions:
            latest = sorted(c.assessment_sessions, key=lambda s: s.created_at, reverse=True)[0]
            verdict = latest.final_verdict
        if not verdict and c.parsed_json:
            try:
                parsed = json.loads(c.parsed_json)
                verdict = parsed.get("verdict")
            except:
                pass
        
        if verdict in ["STRONG_HIRE", "HIRE", "ACCEPT"]:
            positive_count += 1
            
    avg_score = round(total_score / scored_candidates, 1) if scored_candidates > 0 else 0.0
    pass_rate = round((positive_count / total_candidates) * 100, 1) if total_candidates > 0 else 0.0
    
    # 3. Funnel Data
    stage_counts = {
        "new": 0,
        "screening": 0,
        "interview": 0,
        "offered": 0,
    }
    for c in candidates:
        status = c.status.lower() if c.status else "new"
        if status in stage_counts:
            stage_counts[status] += 1
            
    funnel_data = [
        {"stage": "Applications", "count": stage_counts["new"], "percentage": 0},
        {"stage": "Screening", "count": stage_counts["screening"], "percentage": 0},
        {"stage": "Interview", "count": stage_counts["interview"], "percentage": 0},
        {"stage": "Offered", "count": stage_counts["offered"], "percentage": 0},
    ]
    
    # Fill in funnel percentages
    for item in funnel_data:
        if total_candidates > 0:
            item["percentage"] = round((item["count"] / total_candidates) * 100, 1)
            
    # 4. Job Pipelines Comparison
    jobs = db.query(Job).filter(Job.org_id == org_id).all()
    job_pipelines = []
    for j in jobs:
        j_candidates = [c for c in candidates if c.job_id == j.id] if not job_id else [c for c in candidates if c.job_id == j.id and j.id == job_id]
        if not j_candidates and not job_id:
            # Skip jobs with 0 candidates if showing global summary, to keep dashboard clean
            continue
        jc_counts = {"new": 0, "screening": 0, "interview": 0, "offered": 0}
        for jc in j_candidates:
            status = jc.status.lower() if jc.status else "new"
            if status in jc_counts:
                jc_counts[status] += 1
        job_pipelines.append({
            "id": j.id,
            "title": j.title,
            "counts": jc_counts,
            "total": len(j_candidates)
        })
        
    # Sort pipelines by total candidate volume
    job_pipelines = sorted(job_pipelines, key=lambda p: p["total"], reverse=True)
    
    # 5. Skill Aggregation
    skill_counts = {}
    for c in candidates:
        skills = []
        if c.parsed_json:
            try:
                parsed = json.loads(c.parsed_json)
                scored = parsed.get("scored_skills", [])
                if isinstance(scored, list):
                    for s in scored:
                        if isinstance(s, dict) and s.get("skill"):
                            skills.append(s.get("skill"))
                        elif isinstance(s, str):
                            skills.append(s)
                raw_skills = parsed.get("skills", [])
                if isinstance(raw_skills, list):
                    skills.extend(raw_skills)
            except:
                pass
        unique_candidate_skills = set()
        for s in skills:
            s_name = str(s).strip().upper()
            if s_name:
                unique_candidate_skills.add(s_name)
        for s_name in unique_candidate_skills:
            skill_counts[s_name] = skill_counts.get(s_name, 0) + 1
                
    # Select top 6 skills for the radar/bar visualization
    sorted_skills = sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:6]
    top_skills = [{"skill": s, "count": count} for s, count in sorted_skills]
    
    # 6. Score Distribution
    distribution = {
        "0-20": 0,
        "21-40": 0,
        "41-60": 0,
        "61-80": 0,
        "81-100": 0
    }
    for c in candidates:
        score = c.match_score
        if score is None and c.assessment_sessions:
            latest = sorted(c.assessment_sessions, key=lambda s: s.created_at, reverse=True)[0]
            score = latest.overall_score
        if score is not None:
            if score <= 20:
                distribution["0-20"] += 1
            elif score <= 40:
                distribution["21-40"] += 1
            elif score <= 60:
                distribution["41-60"] += 1
            elif score <= 80:
                distribution["61-80"] += 1
            else:
                distribution["81-100"] += 1
                
    # 7. Top Candidates Leaderboard
    leaderboard_candidates = []
    for c in candidates:
        score = c.match_score
        if score is None and c.assessment_sessions:
            latest = sorted(c.assessment_sessions, key=lambda s: s.created_at, reverse=True)[0]
            score = latest.overall_score
        if score is not None:
            leaderboard_candidates.append({
                "id": c.id,
                "full_name": c.full_name,
                "score": score,
                "status": c.status,
                "email": c.email,
                "job_title": c.job.title if c.job else "Unknown Role"
            })
    top_candidates = sorted(leaderboard_candidates, key=lambda item: item["score"], reverse=True)[:5]
    
    # 8. Dynamic AI Pool Synthesis Report
    ai_summary = "No active candidate data is available yet to compile a synthesis report."
    if total_candidates > 0:
        high_performers = len([lc for lc in leaderboard_candidates if lc["score"] >= 80])
        role_label = f"across all active postings" if not job_id else f"for the {job_pipelines[0]['title'] if job_pipelines else 'selected'} role"
        
        if avg_score >= 75:
            quality_verdict = "exceptionally strong, with a high concentration of senior-level matching talent"
        elif avg_score >= 50:
            quality_verdict = "healthy and balanced, offering a solid foundation of qualified applicants"
        else:
            quality_verdict = "currently showing low alignment with the job specifications, indicating a potential need to refine sourcing channels"
            
        ai_summary = (
            f"The candidate pool {role_label} consists of {total_candidates} applicants, with an average overall alignment score of {avg_score}%. "
            f"Currently, {high_performers} candidates are performing at an elite level (80%+ score), suggesting a strong field of target hires. "
            f"Overall, the technical pipeline is {quality_verdict}."
        )
        
    return {
        "global_metrics": {
            "total_candidates": total_candidates,
            "assessment_pass_rate": pass_rate,
            "average_score": avg_score,
            "pipelines_count": len(job_pipelines)
        },
        "funnel_data": funnel_data,
        "job_pipelines": job_pipelines,
        "top_skills": top_skills,
        "score_distribution": [
            {"range": r, "count": count} for r, count in distribution.items()
        ],
        "top_candidates": top_candidates,
        "ai_summary": ai_summary
    }
