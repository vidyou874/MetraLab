from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.common import ReportStatus, ResultDisposition


class ReportCreateRequest(BaseModel):
    instrument_id: int = Field(gt=0)
    procedure_configuration_id: int = Field(gt=0)
    conditions: dict = Field(default_factory=dict)
    comments: str | None = None


class MeasurementCreateRequest(BaseModel):
    test_type: str = Field(min_length=1, max_length=120)
    point_sequence: int = Field(gt=0)
    measurement_sequence: int = Field(gt=0)
    nominal_load: Decimal = Field(gt=0, max_digits=24, decimal_places=10)
    nominal_load_unit: str = Field(min_length=1, max_length=20)
    indication: Decimal = Field(max_digits=24, decimal_places=10)
    indication_unit: str = Field(min_length=1, max_length=20)
    indication_precision: str = Field(min_length=1, max_length=80)
    capture_time: datetime | None = None
    note: str | None = None
    context: dict | None = None


class ReportActionRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=5000)
    expected_row_version: int = Field(gt=0)


class ReportResponse(BaseModel):
    id: int
    report_number: str
    revision: int
    instrument_id: int
    technician_id: int
    reviewer_id: int | None
    procedure_configuration_id: int
    procedure_configuration_version: str
    status: ReportStatus
    disposition: ResultDisposition | None
    conditions: dict
    comments: str | None
    submitted_at: datetime | None
    finalized_at: datetime | None
    parent_report_id: int | None
    row_version: int

    model_config = {"from_attributes": True}
