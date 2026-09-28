from sqlalchemy import JSON, Boolean, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class Instrument(TimestampMixin, Base):
    __tablename__ = "instruments"
    __table_args__ = (
        UniqueConstraint(
            "laboratory_scope", "manufacturer", "serial_number", name="uq_instrument_serial_scope"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    laboratory_scope: Mapped[str] = mapped_column(String(120), default="default", index=True)
    manufacturer: Mapped[str] = mapped_column(String(160))
    model: Mapped[str] = mapped_column(String(160))
    serial_number: Mapped[str] = mapped_column(String(160), index=True)
    asset_tag: Mapped[str | None] = mapped_column(String(160), index=True)
    accuracy_class: Mapped[str] = mapped_column(String(20))
    max_capacity: Mapped[Numeric] = mapped_column(Numeric(24, 10))
    capacity_unit: Mapped[str] = mapped_column(String(20))
    verification_interval_e: Mapped[Numeric | None] = mapped_column(Numeric(24, 10))
    display_division_d: Mapped[Numeric | None] = mapped_column(Numeric(24, 10))
    ranges: Mapped[dict | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
