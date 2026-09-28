from datetime import UTC, datetime
from decimal import Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import api_error, forbidden, not_found
from app.domain.calculations.metrology import (
    calculate_indication_error,
    calculate_repeatability,
    indication_error_not_configured,
    resolve_scale_interval,
)
from app.domain.calculations.results import Outcome
from app.domain.calculations.statistics import descriptive_statistics
from app.models.instrument import Instrument
from app.models.procedure import ProcedureConfiguration
from app.models.report import Measurement, MeasurementPoint, TestReport
from app.models.user import User
from app.schemas.common import ReportStatus, ResultDisposition, UserRole
from app.schemas.reports import MeasurementCreateRequest, ReportActionRequest, ReportCreateRequest
from app.services.audit import record_audit_event


def _next_report_number(db: Session) -> str:
    count = db.scalar(select(TestReport.id).order_by(TestReport.id.desc()).limit(1))
    next_id = (count or 0) + 1
    return f"ML-{datetime.now(UTC):%Y}-{next_id:05d}"


def create_report(db: Session, actor: User, payload: ReportCreateRequest) -> TestReport:
    instrument = db.get(Instrument, payload.instrument_id)
    if instrument is None or not instrument.is_active:
        raise api_error(422, "invalid_instrument", "An active instrument is required")

    procedure = db.get(ProcedureConfiguration, payload.procedure_configuration_id)
    if procedure is None or not procedure.is_active:
        raise api_error(422, "invalid_procedure", "An active procedure configuration is required")

    report = TestReport(
        report_number=_next_report_number(db),
        instrument_id=instrument.id,
        technician_id=actor.id,
        procedure_configuration_id=procedure.id,
        procedure_configuration_version=procedure.configuration_version,
        status=ReportStatus.DRAFT,
        conditions=payload.conditions,
        comments=payload.comments,
    )
    db.add(report)
    db.flush()
    record_audit_event(
        db,
        actor=actor,
        event_type="report.created",
        target_type="report",
        target_id=report.id,
        revision=str(report.revision),
        summary="Draft report created",
    )
    db.commit()
    db.refresh(report)
    return report


def get_report_or_404(db: Session, report_id: int) -> TestReport:
    report = db.get(TestReport, report_id)
    if report is None:
        raise not_found("Report")
    return report


def can_view_report(actor: User, report: TestReport) -> bool:
    return (
        actor.role in {UserRole.ADMINISTRATOR, UserRole.REVIEWER, UserRole.AUDITOR}
        or report.technician_id == actor.id
    )


def add_measurement(
    db: Session, actor: User, report: TestReport, payload: MeasurementCreateRequest
) -> Measurement:
    if report.status not in {ReportStatus.DRAFT, ReportStatus.RETURNED}:
        raise api_error(
            409, "report_read_only", "Measurements can only be changed on Draft or Returned reports"
        )
    if actor.role == UserRole.TECHNICIAN and report.technician_id != actor.id:
        raise forbidden("Only the assigned technician can edit this report")

    instrument = db.get(Instrument, report.instrument_id)
    if instrument is None:
        raise api_error(422, "invalid_instrument", "Report instrument is unavailable")
    if payload.nominal_load > instrument.max_capacity:
        raise api_error(422, "capacity_exceeded", "Nominal load exceeds the instrument capacity")
    if payload.nominal_load_unit != instrument.capacity_unit:
        raise api_error(
            422, "unsupported_unit", "Nominal load unit must match the instrument capacity unit"
        )

    point = db.scalar(
        select(MeasurementPoint).where(
            MeasurementPoint.report_id == report.id,
            MeasurementPoint.test_type == payload.test_type,
            MeasurementPoint.sequence == payload.point_sequence,
        )
    )
    if point is None:
        point = MeasurementPoint(
            report_id=report.id,
            test_type=payload.test_type,
            sequence=payload.point_sequence,
            nominal_load=payload.nominal_load,
            nominal_load_unit=payload.nominal_load_unit,
            context=payload.context,
        )
        db.add(point)
        db.flush()
    elif (
        point.nominal_load != payload.nominal_load
        or point.nominal_load_unit != payload.nominal_load_unit
    ):
        raise api_error(
            422, "point_mismatch", "Existing point sequence uses a different nominal load or unit"
        )

    duplicate = db.scalar(
        select(Measurement.id).where(
            Measurement.measurement_point_id == point.id,
            Measurement.sequence == payload.measurement_sequence,
        )
    )
    if duplicate is not None:
        raise api_error(
            409, "duplicate_sequence", "Measurement sequence already exists for this point"
        )

    measurement = Measurement(
        measurement_point_id=point.id,
        sequence=payload.measurement_sequence,
        entered_indication=payload.indication,
        indication_unit=payload.indication_unit,
        entered_precision=payload.indication_precision,
        capture_time=payload.capture_time,
        note=payload.note,
        creator_id=actor.id,
    )
    db.add(measurement)
    report.row_version += 1
    record_audit_event(
        db,
        actor=actor,
        event_type="measurement.created",
        target_type="report",
        target_id=report.id,
        revision=str(report.revision),
        summary="Measurement added to draft report",
    )
    db.commit()
    db.refresh(measurement)
    return measurement


def calculation_preview(db: Session, report: TestReport) -> dict:
    procedure = db.get(ProcedureConfiguration, report.procedure_configuration_id)
    instrument = db.get(Instrument, report.instrument_id)
    rules = procedure.rules if procedure else {}

    points = list(
        db.scalars(
            select(MeasurementPoint)
            .where(MeasurementPoint.report_id == report.id)
            .order_by(MeasurementPoint.sequence)
        )
    )

    measurements = list(
        db.scalars(
            select(Measurement)
            .join(MeasurementPoint)
            .where(MeasurementPoint.report_id == report.id)
            .order_by(MeasurementPoint.sequence, Measurement.sequence)
        )
    )
    values = [Decimal(measurement.entered_indication) for measurement in measurements]
    stats = descriptive_statistics(values)
    results: list[dict] = []

    # Indication error evaluation
    indication_error_approved = (
        rules.get("indication_error_approved") is True
        or rules.get("indication_error_rule") == "oiml_r76"
    )

    if not indication_error_approved:
        results.append(indication_error_not_configured().model_dump(mode="json"))
    elif instrument:
        weighing_points = [p for p in points if p.test_type in {"weighing", "indication_error"}]
        for p in weighing_points:
            pt_measurements = [m for m in measurements if m.measurement_point_id == p.id]
            for m in pt_measurements:
                default_e = instrument.verification_interval_e or Decimal("1")
                default_d = instrument.display_division_d or default_e
                scale_info = resolve_scale_interval(
                    p.nominal_load,
                    default_e,
                    default_d,
                    ranges_config=instrument.ranges,
                )
                delta_l = None
                if p.context and "delta_l" in p.context:
                    delta_l = Decimal(str(p.context["delta_l"]))
                elif m.note and "delta_l=" in m.note:
                    try:
                        delta_l = Decimal(m.note.split("delta_l=")[1].split()[0])
                    except (IndexError, InvalidOperation):
                        pass

                method = rules.get(
                    "error_method", "changeover" if delta_l is not None else "uncorrected"
                )
                zero_err = Decimal(str(rules.get("zero_error", "0")))
                res = calculate_indication_error(
                    nominal_load=p.nominal_load,
                    indication=Decimal(m.entered_indication),
                    e=scale_info.e,
                    d=scale_info.d,
                    delta_l=delta_l,
                    zero_error=zero_err,
                    accuracy_class=instrument.accuracy_class,
                    method=method,
                    verification_type=rules.get("verification_type", "initial"),
                    unit=m.indication_unit,
                    configuration_version=report.procedure_configuration_version,
                )
                res_dict = res.model_dump(mode="json")
                res_dict["result_key"] = f"indication_error_pt{p.sequence}_seq{m.sequence}"
                results.append(res_dict)

    # Repeatability evaluation
    units = {measurement.indication_unit for measurement in measurements}
    if not measurements:
        results.append(
            {
                "result_key": "repeatability_range",
                "formula_id": "repeatability-range-v1",
                "configuration_version": report.procedure_configuration_version,
                "engine_version": "0.1.0",
                "outcome": Outcome.INCOMPLETE,
                "reason": "At least one numeric reading is required",
                "inputs": {},
            }
        )
    elif len(units) != 1:
        results.append(
            {
                "result_key": "repeatability_range",
                "formula_id": "repeatability-range-v1",
                "configuration_version": report.procedure_configuration_version,
                "engine_version": "0.1.0",
                "outcome": Outcome.NOT_EVALUATED,
                "reason": "Readings use different units; an approved conversion rule is required",
                "inputs": {"units": sorted(units)},
            }
        )
    else:
        limit_raw = rules.get("repeatability_range_limit")
        limit_unit = rules.get("repeatability_range_unit")
        if limit_raw is not None:
            if limit_unit != next(iter(units)):
                results.append(
                    {
                        "result_key": "repeatability_range",
                        "formula_id": "repeatability-range-v1",
                        "configuration_version": report.procedure_configuration_version,
                        "engine_version": "0.1.0",
                        "outcome": Outcome.NOT_EVALUATED,
                        "reason": (
                            "Approved repeatability range limit is not configured for the "
                            "reading unit"
                        ),
                        "inputs": {"unit": next(iter(units))},
                    }
                )
            else:
                try:
                    limit = Decimal(str(limit_raw))
                except InvalidOperation:
                    limit = None
                if limit is None or limit < 0:
                    results.append(
                        {
                            "result_key": "repeatability_range",
                            "formula_id": "repeatability-range-v1",
                            "configuration_version": report.procedure_configuration_version,
                            "engine_version": "0.1.0",
                            "outcome": Outcome.NOT_EVALUATED,
                            "reason": "Configured repeatability range limit is invalid",
                            "inputs": {},
                        }
                    )
                else:
                    measured_range = stats["range"]
                    outcome = Outcome.PASS if measured_range <= limit else Outcome.FAIL
                    results.append(
                        {
                            "result_key": "repeatability_range",
                            "value": str(measured_range),
                            "unit": next(iter(units)),
                            "formula_id": "repeatability-range-v1",
                            "configuration_version": report.procedure_configuration_version,
                            "engine_version": "0.1.0",
                            "outcome": outcome,
                            "inputs": {
                                "minimum": str(stats["minimum"]),
                                "maximum": str(stats["maximum"]),
                            },
                            "limit": {"value": str(limit), "unit": limit_unit},
                        }
                    )
        elif instrument and instrument.verification_interval_e:
            rep_point = next((p for p in points if p.test_type == "repeatability"), None)
            nom_load = rep_point.nominal_load if rep_point else instrument.max_capacity
            scale_info = resolve_scale_interval(
                nom_load,
                instrument.verification_interval_e,
                instrument.display_division_d,
                ranges_config=instrument.ranges,
            )
            rep_res = calculate_repeatability(
                indications=values,
                nominal_load=nom_load,
                e=scale_info.e,
                accuracy_class=instrument.accuracy_class,
                verification_type=rules.get("verification_type", "initial"),
                unit=next(iter(units)),
                configuration_version=report.procedure_configuration_version,
            )
            results.append(rep_res.model_dump(mode="json"))
        else:
            results.append(
                {
                    "result_key": "repeatability_range",
                    "formula_id": "repeatability-range-v1",
                    "configuration_version": report.procedure_configuration_version,
                    "engine_version": "0.1.0",
                    "outcome": Outcome.NOT_EVALUATED,
                    "reason": (
                        "Repeatability range limit or instrument verification interval is not "
                        "configured"
                    ),
                    "inputs": {},
                }
            )

    return {
        "statistics": {
            key: str(value) if isinstance(value, Decimal) else value for key, value in stats.items()
        },
        "results": results,
    }


def transition_report(
    db: Session,
    actor: User,
    report: TestReport,
    action: str,
    payload: ReportActionRequest,
) -> TestReport:
    if report.row_version != payload.expected_row_version:
        raise api_error(
            409, "edit_conflict", "Report changed since it was loaded; refresh and try again"
        )

    target_status = {
        "submit": ReportStatus.SUBMITTED,
        "return": ReportStatus.RETURNED,
        "reject": ReportStatus.REJECTED,
        "finalize": ReportStatus.FINALIZED,
    }.get(action)
    if target_status is None:
        raise api_error(422, "invalid_action", "Unsupported report action")
    expected_statuses = (
        {ReportStatus.DRAFT, ReportStatus.RETURNED}
        if action == "submit"
        else {ReportStatus.SUBMITTED}
    )
    if report.status not in expected_statuses:
        raise api_error(409, "invalid_transition", f"Cannot {action} a {report.status} report")
    if action == "submit" and report.technician_id != actor.id:
        raise forbidden("Only the assigned technician can submit this report")
    if action in {"return", "reject", "finalize"} and actor.role not in {
        UserRole.REVIEWER,
        UserRole.ADMINISTRATOR,
    }:
        raise forbidden("Reviewer permission is required")
    if action in {"return", "reject"} and not payload.reason:
        raise api_error(422, "reason_required", "A reason is required for this action")

    if action == "submit":
        preview = calculation_preview(db, report)
        if not any(
            item["outcome"] in {Outcome.PASS, Outcome.FAIL, Outcome.WARNING}
            for item in preview["results"]
        ):
            raise api_error(
                422, "report_incomplete", "Report has no evaluated or reviewable result"
            )
        report.submitted_at = datetime.now(UTC)
    if action in {"return", "reject", "finalize"}:
        report.reviewer_id = actor.id
    if action == "finalize":
        preview = calculation_preview(db, report)
        outcomes = {item["outcome"] for item in preview["results"]}
        if Outcome.INCOMPLETE in outcomes or Outcome.NOT_EVALUATED in outcomes:
            raise api_error(
                422, "not_evaluated", "A finalized report cannot have required unevaluated results"
            )
        report.disposition = (
            ResultDisposition.FAIL if Outcome.FAIL in outcomes else ResultDisposition.PASS
        )
        report.finalized_at = datetime.now(UTC)

    report.status = target_status
    report.row_version += 1
    record_audit_event(
        db,
        actor=actor,
        event_type={
            "submit": "report.submitted",
            "return": "report.returned",
            "reject": "report.rejected",
            "finalize": "report.finalized",
        }[action],
        target_type="report",
        target_id=report.id,
        revision=str(report.revision),
        summary=payload.reason or f"Report {action}ed",
    )
    db.commit()
    db.refresh(report)
    return report
