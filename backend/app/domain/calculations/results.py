from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class Outcome(StrEnum):
    PASS = "Pass"
    FAIL = "Fail"
    WARNING = "Warning"
    NOT_EVALUATED = "Not evaluated"
    INCOMPLETE = "Incomplete"


class CalculationResult(BaseModel):
    result_key: str
    value: str | None = None
    unit: str | None = None
    formula_id: str
    configuration_version: str
    engine_version: str = "0.1.0"
    outcome: Outcome
    reason: str | None = None
    inputs: dict[str, Any] = Field(default_factory=dict)
