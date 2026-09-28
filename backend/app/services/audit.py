from sqlalchemy.orm import Session

from app.models.audit import AuditEvent
from app.models.user import User


def record_audit_event(
    db: Session,
    *,
    actor: User | None,
    event_type: str,
    target_type: str,
    target_id: int | str,
    revision: str | None = None,
    summary: str,
    before_after: dict | None = None,
) -> AuditEvent:
    event = AuditEvent(
        actor_id=actor.id if actor else None,
        event_type=event_type,
        target_type=target_type,
        target_id=str(target_id),
        revision=revision,
        summary=summary,
        before_after=before_after,
    )
    db.add(event)
    return event
