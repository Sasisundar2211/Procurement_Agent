from __future__ import annotations

import uuid

import pandas as pd
from fastapi import BackgroundTasks

from src.models.schemas import TaskStatus
from src.models.task_store import InMemoryTaskStore
from src.services.detection_service import detect_public_only
from src.utils.serialization import dataframe_to_records


class DetectionTaskService:
    def __init__(self, store: InMemoryTaskStore | None = None) -> None:
        self.store = store or InMemoryTaskStore()

    def enqueue_detection(self, background_tasks: BackgroundTasks) -> str:
        task_id = str(uuid.uuid4())
        self.store.upsert(task_id, {"status": TaskStatus.in_progress.value})
        background_tasks.add_task(self._run_detection, task_id)
        return task_id

    def _run_detection(self, task_id: str) -> None:
        try:
            drifts = detect_public_only()
            self.store.upsert(
                task_id,
                {
                    "status": TaskStatus.completed.value,
                    "result": dataframe_to_records(drifts),
                },
            )
        except FileNotFoundError as exc:
            self.store.upsert(
                task_id,
                {
                    "status": TaskStatus.failed.value,
                    "error": f"Data file not found: {exc}",
                },
            )
        except pd.errors.EmptyDataError as exc:
            self.store.upsert(
                task_id,
                {
                    "status": TaskStatus.failed.value,
                    "error": f"Data file is empty: {exc}",
                },
            )
        except Exception as exc:  # noqa: BLE001
            self.store.upsert(
                task_id,
                {
                    "status": TaskStatus.failed.value,
                    "error": f"Unexpected error during detection: {exc}",
                },
            )

    def get_task_status(self, task_id: str) -> dict:
        return self.store.get(task_id) or {"status": TaskStatus.not_found.value}


detection_task_service = DetectionTaskService()
