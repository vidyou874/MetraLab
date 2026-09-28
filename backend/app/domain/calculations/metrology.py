from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Any

from app.domain.calculations.results import CalculationResult, Outcome


class AccuracyClass:
    CLASS_I = "I"
    CLASS_II = "II"
    CLASS_III = "III"
    CLASS_IIII = "IIII"
    ALL = (CLASS_I, CLASS_II, CLASS_III, CLASS_IIII)


@dataclass(frozen=True)
class ScaleIntervalInfo:
    e: Decimal
    d: Decimal
    range_index: int = 0
    range_type: str = "single"
    min_capacity: Decimal | None = None
    max_capacity: Decimal | None = None


def resolve_scale_interval(
    load: Decimal,
    default_e: Decimal,
    default_d: Decimal | None = None,
    ranges_config: dict[str, Any] | None = None,
) -> ScaleIntervalInfo:
    """Resolve the verification interval e and actual scale interval d for an applied load.

    Supports single-interval, multi-interval (Clause 3.3), and multi-range (Clause 3.2).
    """
    d_resolved = default_d if default_d is not None else default_e

    if not ranges_config or not isinstance(ranges_config, dict):
        return ScaleIntervalInfo(e=default_e, d=d_resolved, range_index=0, range_type="single")

    config_type = ranges_config.get("type")
    ranges_list = ranges_config.get("ranges", [])

    if config_type == "multi_interval" and ranges_list:
        # Multi-interval: partial ranges ordered by max capacity
        for idx, partial in enumerate(ranges_list):
            try:
                p_max = Decimal(str(partial["max"]))
                p_e = Decimal(str(partial["e"]))
                p_d = Decimal(str(partial.get("d", p_e)))
                p_min = Decimal(str(partial["min"])) if "min" in partial else None
            except (KeyError, InvalidOperation):
                continue

            if load <= p_max or idx == len(ranges_list) - 1:
                return ScaleIntervalInfo(
                    e=p_e,
                    d=p_d,
                    range_index=idx,
                    range_type="multi_interval",
                    min_capacity=p_min,
                    max_capacity=p_max,
                )

    elif config_type == "multi_range" and ranges_list:
        # Multi-range: select range matching load or explicit range_id
        for idx, r in enumerate(ranges_list):
            try:
                r_max = Decimal(str(r["max"]))
                r_e = Decimal(str(r["e"]))
                r_d = Decimal(str(r.get("d", r_e)))
                r_min = Decimal(str(r["min"])) if "min" in r else None
            except (KeyError, InvalidOperation):
                continue

            if load <= r_max or idx == len(ranges_list) - 1:
                return ScaleIntervalInfo(
                    e=r_e,
                    d=r_d,
                    range_index=idx,
                    range_type="multi_range",
                    min_capacity=r_min,
                    max_capacity=r_max,
                )

    return ScaleIntervalInfo(e=default_e, d=d_resolved, range_index=0, range_type="single")


def calculate_mpe(
    load: Decimal,
    e: Decimal,
    accuracy_class: str,
    verification_type: str = "initial",
) -> tuple[Decimal, Decimal]:
    """Calculate the Maximum Permissible Error (MPE) in load units and the step multiplier.

    Table 6 defines MPE on initial verification for loads m expressed in intervals e:
    - Class I:
        0 <= m <= 50,000      -> +/- 0.5 e
        50,000 < m <= 200,000  -> +/- 1.0 e
        200,000 < m            -> +/- 1.5 e
    - Class II:
        0 <= m <= 5,000        -> +/- 0.5 e
        5,000 < m <= 20,000    -> +/- 1.0 e
        20,000 < m <= 100,000  -> +/- 1.5 e
    - Class III:
        0 <= m <= 500          -> +/- 0.5 e
        500 < m <= 2,000       -> +/- 1.0 e
        2,000 < m <= 10,000    -> +/- 1.5 e
    - Class IIII:
        0 <= m <= 50           -> +/- 0.5 e
        50 < m <= 200          -> +/- 1.0 e
        200 < m <= 1,000       -> +/- 1.5 e

    In service (Clause 3.5.2): MPE is twice initial verification MPE.
    """
    if e <= 0:
        raise ValueError("Verification scale interval 'e' must be strictly positive.")

    m = abs(load) / e

    match accuracy_class.upper():
        case "I":
            if m <= 50_000:
                step = Decimal("0.5")
            elif m <= 200_000:
                step = Decimal("1.0")
            else:
                step = Decimal("1.5")
        case "II":
            if m <= 5_000:
                step = Decimal("0.5")
            elif m <= 20_000:
                step = Decimal("1.0")
            else:
                step = Decimal("1.5")
        case "III":
            if m <= 500:
                step = Decimal("0.5")
            elif m <= 2_000:
                step = Decimal("1.0")
            else:
                step = Decimal("1.5")
        case "IIII":
            if m <= 50:
                step = Decimal("0.5")
            elif m <= 200:
                step = Decimal("1.0")
            else:
                step = Decimal("1.5")
        case _:
            raise ValueError(
                f"Unknown accuracy class: {accuracy_class}. Expected I, II, III, or IIII."
            )

    if verification_type == "service":
        step = step * Decimal("2")

    mpe = step * e
    return mpe, step


def calculate_indication_error(
    nominal_load: Decimal,
    indication: Decimal,
    e: Decimal,
    d: Decimal | None = None,
    delta_l: Decimal | None = None,
    zero_error: Decimal = Decimal("0"),
    accuracy_class: str = "III",
    method: str = "changeover",
    verification_type: str = "initial",
    unit: str = "g",
    configuration_version: str = "1.0.0",
) -> CalculationResult:
    """Calculate indication error and conformity per OIML R76 Clause A.4.4.3 and Table 6.

    Changeover point method (Clause A.4.4.3):
      P = I + 0.5 * e - delta_l   (indication prior to rounding)
      E = P - L                   (error prior to rounding)
      Ec = E - E0                 (corrected error)

    Uncorrected method:
      E = I - L
      Ec = E - E0
    """
    mpe, mpe_step = calculate_mpe(nominal_load, e, accuracy_class, verification_type)
    d_val = d if d is not None else e

    if method == "changeover":
        if delta_l is None:
            return CalculationResult(
                result_key="indication_error",
                formula_id="oiml-r76-changeover-v1",
                configuration_version=configuration_version,
                outcome=Outcome.INCOMPLETE,
                reason=(
                    "Additional load delta_l is required for changeover-point rounding correction"
                ),
                inputs={
                    "nominal_load": str(nominal_load),
                    "indication": str(indication),
                    "e": str(e),
                    "d": str(d_val),
                },
            )
        p = indication + (Decimal("0.5") * e) - delta_l
        e_raw = p - nominal_load
        formula_id = "oiml-r76-a443-changeover-v1"
    else:
        p = indication
        e_raw = indication - nominal_load
        formula_id = "oiml-r76-uncorrected-v1"

    e_corrected = e_raw - zero_error
    passed = abs(e_corrected) <= mpe

    return CalculationResult(
        result_key="indication_error",
        value=str(e_corrected),
        unit=unit,
        formula_id=formula_id,
        configuration_version=configuration_version,
        outcome=Outcome.PASS if passed else Outcome.FAIL,
        inputs={
            "nominal_load": str(nominal_load),
            "indication": str(indication),
            "delta_l": str(delta_l) if delta_l is not None else None,
            "indication_prior_to_rounding_p": str(p),
            "uncorrected_error_e": str(e_raw),
            "zero_error_e0": str(zero_error),
            "e": str(e),
            "d": str(d_val),
            "load_in_e_m": str(nominal_load / e),
        },
        reason=(
            f"Corrected error {e_corrected} {unit} is within MPE +/-{mpe} {unit}"
            if passed
            else f"Corrected error {e_corrected} {unit} exceeds MPE +/-{mpe} {unit}"
        ),
    )


def calculate_repeatability(
    indications: list[Decimal],
    nominal_load: Decimal,
    e: Decimal,
    accuracy_class: str = "III",
    verification_type: str = "initial",
    custom_limit: Decimal | None = None,
    unit: str = "g",
    configuration_version: str = "1.0.0",
) -> CalculationResult:
    """Calculate repeatability conformity per OIML R76 Clause 3.6.1.

    Clause 3.6.1:
      The difference between the results of several weighings of the same load
      shall not be greater than the absolute value of the maximum permissible error
      of the instrument for that load: R = max(I) - min(I) <= |MPE|.
    """
    if len(indications) < 2:
        return CalculationResult(
            result_key="repeatability_range",
            formula_id="oiml-r76-repeatability-v1",
            configuration_version=configuration_version,
            outcome=Outcome.INCOMPLETE,
            reason="At least two readings are required for repeatability evaluation",
            inputs={"count": len(indications)},
        )

    measured_range = max(indications) - min(indications)

    if custom_limit is not None:
        limit = custom_limit
        formula_id = "repeatability-custom-limit-v1"
        limit_desc = f"{limit} {unit}"
    else:
        limit, _ = calculate_mpe(nominal_load, e, accuracy_class, verification_type)
        formula_id = "oiml-r76-clause-361-v1"
        limit_desc = f"|MPE| = {limit} {unit}"

    passed = measured_range <= limit

    return CalculationResult(
        result_key="repeatability_range",
        value=str(measured_range),
        unit=unit,
        formula_id=formula_id,
        configuration_version=configuration_version,
        outcome=Outcome.PASS if passed else Outcome.FAIL,
        inputs={
            "nominal_load": str(nominal_load),
            "minimum": str(min(indications)),
            "maximum": str(max(indications)),
            "count": len(indications),
            "limit": str(limit),
        },
        reason=(
            f"Measured range {measured_range} {unit} <= {limit_desc}"
            if passed
            else f"Measured range {measured_range} {unit} exceeds {limit_desc}"
        ),
    )


def calculate_eccentricity(
    positions_readings: list[dict[str, Any]],
    e: Decimal,
    accuracy_class: str = "III",
    zero_error: Decimal = Decimal("0"),
    verification_type: str = "initial",
    unit: str = "g",
    configuration_version: str = "1.0.0",
) -> list[CalculationResult]:
    """Calculate eccentricity conformity per OIML R76 Clause 3.6.2 and A.4.7.

    Evaluates off-center loading on quadrant/support points against Table 6 MPE.
    """
    results: list[CalculationResult] = []
    for item in positions_readings:
        pos = item.get("position", "unspecified")
        load = Decimal(str(item["nominal_load"]))
        ind = Decimal(str(item["indication"]))
        delta_l = Decimal(str(item["delta_l"])) if item.get("delta_l") is not None else None

        res = calculate_indication_error(
            nominal_load=load,
            indication=ind,
            e=e,
            delta_l=delta_l,
            zero_error=zero_error,
            accuracy_class=accuracy_class,
            method="changeover" if delta_l is not None else "uncorrected",
            verification_type=verification_type,
            unit=unit,
            configuration_version=configuration_version,
        )
        res.result_key = f"eccentricity_{pos}"
        res.formula_id = "oiml-r76-clause-362-eccentricity-v1"
        results.append(res)

    return results


def indication_error_not_configured() -> CalculationResult:
    return CalculationResult(
        result_key="indication_error",
        formula_id="not-configured",
        configuration_version="unapproved",
        outcome=Outcome.NOT_EVALUATED,
        reason=(
            "Approved indication-error formula, rounding correction, and MPE rule are not "
            "configured"
        ),
    )


def simple_indication_error(indication: Decimal, reference_load: Decimal) -> Decimal:
    """Uncorrected E = I - L helper for tests and previews only."""
    return indication - reference_load
