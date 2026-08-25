from fastapi import APIRouter, BackgroundTasks

from src.models.schemas import (
    DetectionResult,
    DetectionTaskCreateResponse,
    DetectionTaskStatusResponse,
    TaskStatus,
)
from src.services.detection_service import detect_public_only_records
from src.services.task_service import detection_task_service

router = APIRouter()


@router.post("/run-detection", response_model=DetectionTaskCreateResponse)
async def run_detection(background_tasks: BackgroundTasks) -> DetectionTaskCreateResponse:
    task_id = detection_task_service.enqueue_detection(background_tasks)
    return DetectionTaskCreateResponse(task_id=task_id, status=TaskStatus.in_progress)


@router.get("/run-detection/{task_id}", response_model=DetectionTaskStatusResponse)
async def get_task_status(task_id: str) -> DetectionTaskStatusResponse:
    payload = detection_task_service.get_task_status(task_id)
    return DetectionTaskStatusResponse(
        status=TaskStatus(payload["status"]),
        result=payload.get("result"),
        error=payload.get("error"),
    )


@router.get("/leaks", response_model=list[DetectionResult])
async def get_leaks(drift_threshold: float | None = None) -> list[DetectionResult]:
    records = detect_public_only_records(drift_threshold=drift_threshold)
    return [DetectionResult.model_validate(record) for record in records]
