from fastapi import APIRouter

from src.api.routes.detections import router as detections_router
from src.api.routes.health import router as health_router
from src.api.routes.simulation import router as simulation_router
from src.api.routes.vendors import router as vendors_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(detections_router, tags=["detections"])
api_router.include_router(simulation_router, tags=["simulation"])
api_router.include_router(vendors_router, tags=["vendors"])
