from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict


class TaskStatus(str, Enum):
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    not_found = "not_found"


class DetectionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")

    po_id: str | int | None = None
    vendor_id: str | None = None
    item_id: str | None = None
    unit_price: float | None = None
    qty: float | int | None = None
    total: float | None = None
    date: str | None = None
    contract_id: str | None = None
    contract_unit_price: float | None = None
    price_drift: float | None = None
    gemini_summary: str | None = None


class DetectionTaskCreateResponse(BaseModel):
    task_id: str
    status: TaskStatus


class DetectionTaskStatusResponse(BaseModel):
    status: TaskStatus
    result: list[dict[str, Any]] | None = None
    error: str | None = None


class SimulationResponse(BaseModel):
    status: str
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str


class VendorRankResult(BaseModel):
    model_config = ConfigDict(extra="allow")

    vendor_id: str | int
    weighted_score: float
    rank: int
    weight_profile: str


class VendorRankingExplanationResponse(BaseModel):
    explanation: str
