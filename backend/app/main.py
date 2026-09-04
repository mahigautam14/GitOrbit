import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.followers import router as followers_router
from .routes.repos import router as repos_router
from .routes.contributions import router as contributions_router
from .scheduler import start_scheduler, stop_scheduler
from .database import close_db
from .config import CORS_ORIGINS
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()
    close_db()

app = FastAPI(title="GitHub Analytics API", lifespan=lifespan)

# --- CORS SETTINGS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,  # Ye config.py se list uthayega
    allow_origin_regex=r"https://.*\.vercel\.app", # Sabhi vercel preview domains ke liye
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(followers_router)
app.include_router(repos_router)
app.include_router(contributions_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "GitOrbit backend is running"}
