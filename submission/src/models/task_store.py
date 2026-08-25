from __future__ import annotations

from dataclasses import dataclass, field
from threading import Lock
from typing import Any


@dataclass
class InMemoryTaskStore:
    _tasks: dict[str, dict[str, Any]] = field(default_factory=dict)
    _lock: Lock = field(default_factory=Lock)

    def upsert(self, task_id: str, payload: dict[str, Any]) -> None:
        with self._lock:
            self._tasks[task_id] = payload

    def get(self, task_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._tasks.get(task_id)
