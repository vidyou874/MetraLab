from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class TestReport(TimestampMixin, Base):
    __tablename__ = "test_reports"
    __table_args__ = (UniqueConstraint("report_number", "revision", name="uq_report_revision"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    report_number: Mapped[str] = mapped_column(String(80), index=True)
    revision: Mapped[int] = mapped_column(default=1)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id", ondelete="RESTRICT"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    reviewer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    procedure_configuration_id: Mapped[int] = mapped_column(
        ForeignKey("procedure_configurations.id", ondelete="RESTRICT")
    )
    procedure_configuration_version: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(40), index=True)
    disposition: Mapped[str | None] = mapped_column(String(40), index=True)
    conditions: Mapped[dict] = mapped_column(JSON)
    comments: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    parent_report_id: Mapped[int | None] = mapped_column(ForeignKey("test_reports.id"))
    row_version: Mapped[int] = mapped_column(default=1)


class MeasurementPoint(TimestampMixin, Base):
    __tablename__ = "measurement_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("test_reports.id", ondelete="CASCADE"), index=True
    )
    test_type: Mapped[str] = mapped_column(String(120), index=True)
    sequence: Mapped[int] = mapped_column(index=True)
    nominal_load: Mapped[Numeric] = mapped_column(Numeric(24, 10))
    nominal_load_unit: Mapped[str] = mapped_column(String(20))
    context: Mapped[dict | None] = mapped_column(JSON)


class Measurement(TimestampMixin, Base):
    __tablename__ = "measurements"
    __table_args__ = (
        UniqueConstraint("measurement_point_id", "sequence", name="uq_measurement_sequence"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    measurement_point_id: Mapped[int] = mapped_column(
        ForeignKey("measurement_points.id", ondelete="CASCADE"), index=True
    )
    sequence: Mapped[int] = mapped_column(index=True)
    entered_indication: Mapped[Numeric] = mapped_column(Numeric(24, 10))
    indication_unit: Mapped[str] = mapped_column(String(20))
    entered_precision: Mapped[str] = mapped_column(String(80))
    capture_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    note: Mapped[str | None] = mapped_column(Text)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))


class CalculationRecord(TimestampMixin, Base):
    __tablename__ = "calculation_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    report_id: Mapped[int] = mapped_column(
        ForeignKey("test_reports.id", ondelete="CASCADE"), index=True
    )
    scope: Mapped[dict] = mapped_column(JSON)
    result_key: Mapped[str] = mapped_column(String(120), index=True)
    value: Mapped[str | None] = mapped_column(String(120))
    unit: Mapped[str | None] = mapped_column(String(20))
    formula_id: Mapped[str] = mapped_column(String(160))
    configuration_version: Mapped[str] = mapped_column(String(80))
    engine_version: Mapped[str] = mapped_column(String(80))
    rounding_metadata: Mapped[dict | None] = mapped_column(JSON)
    limit_metadata: Mapped[dict | None] = mapped_column(JSON)
    outcome: Mapped[str] = mapped_column(String(40), index=True)
