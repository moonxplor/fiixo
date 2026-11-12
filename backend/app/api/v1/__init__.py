from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.projects import router as projects_router
from app.api.v1.integrations import router as integrations_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(workspaces_router)
api_router.include_router(projects_router)
api_router.include_router(integrations_router)
