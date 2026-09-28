from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.procedure import ProcedureConfiguration
from app.models.user import User
from app.schemas.common import UserRole
from app.schemas.procedures import ProcedureCreateRequest, ProcedureResponse
from app.services.audit import record_audit_event

router = APIRouter(tags=["procedures"])


@router.get("", response_model=list[ProcedureResponse])
def list_procedures(
    active_only: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ProcedureConfiguration]:
    statement = select(ProcedureConfiguration).order_by(
        ProcedureConfiguration.name, ProcedureConfiguration.configuration_version
    )
    if active_only:
        statement = statement.where(ProcedureConfiguration.is_active.is_(True))
    return list(db.scalars(statement))


@router.post("", response_model=ProcedureResponse, status_code=201)
def create_procedure(
    payload: ProcedureCreateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.ADMINISTRATOR)),
) -> ProcedureConfiguration:
    procedure = ProcedureConfiguration(**payload.model_dump())
    db.add(procedure)
    db.flush()
    record_audit_event(
        db,
        actor=actor,
        event_type="procedure.created",
        target_type="procedure_configuration",
        target_id=procedure.id,
        revision=procedure.configuration_version,
        summary="Procedure configuration created",
    )
    db.commit()
    db.refresh(procedure)
    return procedure
