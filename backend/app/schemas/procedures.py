from datetime import datetime

from pydantic import BaseModel, Field


class ProcedureCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    procedure_revision: str = Field(min_length=1, max_length=80)
    standard_reference: str = Field(min_length=1, max_length=180)
    supported_test_type: str = Field(min_length=1, max_length=120)
    configuration_version: str = Field(min_length=1, max_length=80)
    rules: dict = Field(default_factory=dict)
    approved_by: str | None = Field(default=None, max_length=320)
    approved_at: datetime | None = None
    effective_from: datetime | None = None
    effective_to: datetime | None = None
    is_active: bool = False


class ProcedureResponse(ProcedureCreateRequest):
    id: int

    model_config = {"from_attributes": True}
