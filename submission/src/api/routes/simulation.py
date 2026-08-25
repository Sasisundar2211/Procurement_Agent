from fastapi import APIRouter, BackgroundTasks

from src.models.schemas import SimulationResponse
from src.services.simulation_service import simulate_traffic

router = APIRouter()


@router.post("/simulate-traffic", response_model=SimulationResponse)
async def simulate(background_tasks: BackgroundTasks) -> SimulationResponse:
    background_tasks.add_task(simulate_traffic)
    return SimulationResponse(
        status="simulation_started",
        message="Generating 50 new transactions...",
    )
