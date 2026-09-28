from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_roles
from app.core.errors import forbidden
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.report import Measurement, MeasurementPoint, TestReport
from app.models.user import User
from app.schemas.common import UserRole
from app.schemas.reports import (
    MeasurementCreateRequest,
    ReportActionRequest,
    ReportCreateRequest,
    ReportResponse,
)
from app.services.reports import (
    add_measurement,
    calculation_preview,
    can_view_report,
    create_report,
    get_report_or_404,
    transition_report,
)

router = APIRouter(tags=["reports"])


@router.get("", response_model=list[ReportResponse])
def list_reports(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[TestReport]:
    statement = select(TestReport).order_by(TestReport.created_at.desc())
    if current_user.role == UserRole.TECHNICIAN:
        statement = statement.where(TestReport.technician_id == current_user.id)
    return list(db.scalars(statement))


@router.post("", response_model=ReportResponse, status_code=201)
def create_report_endpoint(
    payload: ReportCreateRequest,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(UserRole.TECHNICIAN, UserRole.ADMINISTRATOR)),
) -> TestReport:
    return create_report(db, actor, payload)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TestReport:
    report = get_report_or_404(db, report_id)
    if not can_view_report(current_user, report):
        raise forbidden()
    return report


@router.post("/{report_id}/measurements", status_code=201)
def create_measurement(
    report_id: int,
    payload: MeasurementCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    report = get_report_or_404(db, report_id)
    measurement = add_measurement(db, current_user, report, payload)
    return {
        "id": measurement.id,
        "measurement_point_id": measurement.measurement_point_id,
        "sequence": measurement.sequence,
        "indication": str(measurement.entered_indication),
        "unit": measurement.indication_unit,
    }


@router.get("/{report_id}/calculation-preview")
def get_calculation_preview(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    report = get_report_or_404(db, report_id)
    if not can_view_report(current_user, report):
        raise forbidden()
    return calculation_preview(db, report)


@router.get("/{report_id}/measurements")
def list_measurements(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    report = get_report_or_404(db, report_id)
    if not can_view_report(current_user, report):
        raise forbidden()
    rows = db.execute(
        select(MeasurementPoint, Measurement)
        .join(Measurement, Measurement.measurement_point_id == MeasurementPoint.id)
        .where(MeasurementPoint.report_id == report.id)
        .order_by(MeasurementPoint.sequence, Measurement.sequence)
    )
    return [
        {
            "point_id": point.id,
            "point_sequence": point.sequence,
            "test_type": point.test_type,
            "nominal_load": str(point.nominal_load),
            "nominal_load_unit": point.nominal_load_unit,
            "sequence": measurement.sequence,
            "indication": str(measurement.entered_indication),
            "indication_unit": measurement.indication_unit,
            "entered_precision": measurement.entered_precision,
            "capture_time": measurement.capture_time,
            "note": measurement.note,
        }
        for point, measurement in rows
    ]


@router.get("/{report_id}/audit")
def report_audit_events(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    report = get_report_or_404(db, report_id)
    if not can_view_report(current_user, report):
        raise forbidden()
    events = db.scalars(
        select(AuditEvent)
        .where(AuditEvent.target_type == "report", AuditEvent.target_id == str(report.id))
        .order_by(AuditEvent.created_at)
    )
    return [
        {
            "id": event.id,
            "actor_id": event.actor_id,
            "event_type": event.event_type,
            "revision": event.revision,
            "summary": event.summary,
            "timestamp": event.created_at,
        }
        for event in events
    ]


@router.post("/{report_id}/{action}", response_model=ReportResponse)
def report_action(
    report_id: int,
    action: str,
    payload: ReportActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TestReport:
    report = get_report_or_404(db, report_id)
    return transition_report(db, current_user, report, action, payload)
