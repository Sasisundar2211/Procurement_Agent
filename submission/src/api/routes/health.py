from fastapi import APIRouter

from src.models.schemas import HealthResponse
from src.utils.settings import get_settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(status="ok", version=settings.app_version)
