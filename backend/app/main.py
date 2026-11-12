import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
import app.models # ensure all models are registered with Base metadata

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist in dev/sqlite mode
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Fiixo AI-Powered Repository Revival and Developer Companion SaaS API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/healthz", tags=["Health"], status_code=status.HTTP_200_OK)
async def healthz():
    """Health check endpoint for Render zero-downtime deployment verification."""
    return {"status": "healthy", "service": "fiixo-backend", "environment": settings.ENVIRONMENT}

# Mount v1 API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve Frontend static assets from dist/ if present
# Looks for frontend/dist or ../frontend/dist
CURRENT_DIR = Path(__file__).resolve().parent
POSSIBLE_DIST_PATHS = [
    CURRENT_DIR.parent.parent / "frontend" / "dist",
    CURRENT_DIR.parent / "frontend" / "dist",
    CURRENT_DIR.parent / "dist",
    CURRENT_DIR.parent.parent / "dist"
]

DIST_DIR = None
for p in POSSIBLE_DIST_PATHS:
    if p.exists() and (p / "index.html").exists():
        DIST_DIR = p
        break

if DIST_DIR:
    # Mount assets folder
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Catch-all route to serve SPA index.html for any frontend route
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/", tags=["Health"])
    async def root():
        return {
            "product": "Fiixo",
            "tagline": "Understand. Explain. Repair. Teach.",
            "version": "1.0.0",
            "docs": "/docs"
        }
