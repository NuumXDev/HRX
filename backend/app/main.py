from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.auth import routes as auth_routes
from app.api.v1.organizations import routes as org_routes
from app.api.v1.jobs import routes as job_routes
from app.api.v1.public import routes as public_routes
from app.api.v1.candidates import routes as candidate_routes
from app.api.v1.candidates import portal as portal_routes
from app.api.v1.interviews import routes as interview_routes
from app.api.v1.assessment import routes as assessment_routes

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(org_routes.router, prefix=f"{settings.API_V1_STR}/organizations", tags=["organizations"])
app.include_router(job_routes.router, prefix=f"{settings.API_V1_STR}/jobs", tags=["jobs"])
app.include_router(public_routes.router, prefix=f"{settings.API_V1_STR}/public", tags=["public"])
app.include_router(candidate_routes.router, prefix=f"{settings.API_V1_STR}/candidates", tags=["candidates"])
app.include_router(portal_routes.router, prefix=f"{settings.API_V1_STR}/candidates/portal", tags=["candidate_portal"])
app.include_router(interview_routes.router, prefix=f"{settings.API_V1_STR}/interviews", tags=["interviews"])
app.include_router(assessment_routes.router, prefix=f"{settings.API_V1_STR}/assessment", tags=["assessment"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
