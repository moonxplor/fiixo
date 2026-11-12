from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Render health check
@app.get("/healthz", tags=["Health"], status_code=status.HTTP_200_OK)
async def healthz():
    """Health check endpoint for Render zero-downtime deployment verification."""
    return {"status": "healthy", "service": "fiixo-backend", "environment": settings.ENVIRONMENT}

@app.get("/", tags=["Health"])
async def root():
    return {
        "product": "Fiixo",
        "tagline": "Understand. Explain. Repair. Teach.",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENVIRONMENT != "production" else "disabled"
    }

# Mount v1 API
app.include_router(api_router, prefix=settings.API_V1_STR)
