from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class ProcedureConfiguration(TimestampMixin, Base):
    __tablename__ = "procedure_configurations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    procedure_revision: Mapped[str] = mapped_column(String(80))
    standard_reference: Mapped[str] = mapped_column(String(180))
    supported_test_type: Mapped[str] = mapped_column(String(120), index=True)
    configuration_version: Mapped[str] = mapped_column(String(80), index=True)
    rules: Mapped[dict] = mapped_column(JSON)
    approved_by: Mapped[str | None] = mapped_column(String(320))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    effective_to: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
