from decimal import Decimal

from pydantic import BaseModel, Field


class InstrumentCreateRequest(BaseModel):
    manufacturer: str = Field(min_length=1, max_length=160)
    model: str = Field(min_length=1, max_length=160)
    serial_number: str = Field(min_length=1, max_length=160)
    asset_tag: str | None = Field(default=None, max_length=160)
    accuracy_class: str = Field(pattern=r"^(I|II|III|IIII)$")
    max_capacity: Decimal = Field(gt=0, max_digits=24, decimal_places=10)
    capacity_unit: str = Field(min_length=1, max_length=20)
    verification_interval_e: Decimal | None = Field(
        default=None, gt=0, max_digits=24, decimal_places=10
    )
    display_division_d: Decimal | None = Field(default=None, gt=0, max_digits=24, decimal_places=10)
    ranges: dict | None = None


class InstrumentResponse(InstrumentCreateRequest):
    id: int
    laboratory_scope: str
    is_active: bool

    model_config = {"from_attributes": True}


class CalibrationDistributionStats(BaseModel):
    baseline_mean: float
    baseline_std: float
    current_mean: float
    current_std: float
    mean_drift: float
    std_change_percent: float
    table6_mpe_limit: float
    compliance_status: str


class InstrumentDetailResponse(InstrumentResponse):
    reports_count: int = 0
    latest_disposition: str = "Pass"
    calibration_stats: CalibrationDistributionStats | None = None


class InstrumentBatchRequest(BaseModel):
    instruments: list[InstrumentCreateRequest]


class InstrumentBatchResponse(BaseModel):
    created_count: int
    skipped_count: int
    created_ids: list[int]
