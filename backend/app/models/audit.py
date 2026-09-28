from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import TimestampMixin


class AuditEvent(TimestampMixin, Base):
    __tablename__ = "audit_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    target_type: Mapped[str] = mapped_column(String(120), index=True)
    target_id: Mapped[str] = mapped_column(String(120), index=True)
    revision: Mapped[str | None] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(Text)
    before_after: Mapped[dict | None] = mapped_column(JSON)
