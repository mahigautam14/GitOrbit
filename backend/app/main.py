import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---- App ----
app = FastAPI(title="GitOrbit API")

# ---- CORS ----
# Comma-separated list from env:
# CORS_ORIGINS=http://localhost:3000,https://git-orbit.vercel.app
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",  # preview/prod deploys
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Health check ----
@app.get("/")
def root():
    return {"status": "ok", "service": "GitOrbit backend"}

# ======================================================
# IMPORTANT:
# Agar tumhare routes alag files me hain, unko yahan include karo.
# Prefix "/api" tab use karo jab tumhare route files me /api already nahi hai.
# ======================================================

# Example imports (apne actual file names ke hisaab se adjust karo):
# from app.routes.profile import router as profile_router
# from app.routes.repos import router as repos_router
# from app.routes.followers import router as followers_router
# from app.routes.contributions import router as contributions_router

# Example:
# app.include_router(profile_router, prefix="/api")
# app.include_router(repos_router, prefix="/api")
# app.include_router(followers_router, prefix="/api")
# app.include_router(contributions_router, prefix="/api")
