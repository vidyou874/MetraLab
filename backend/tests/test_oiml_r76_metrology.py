from decimal import Decimal

import pytest

from app.domain.calculations.metrology import (
    calculate_eccentricity,
    calculate_indication_error,
    calculate_mpe,
    calculate_repeatability,
    resolve_scale_interval,
)
from app.domain.calculations.results import Outcome


def test_mpe_class_iii_boundaries() -> None:
    e = Decimal("1.0")

    # <= 500 e: 0.5 e
    mpe_500, step_500 = calculate_mpe(Decimal("500"), e, "III")
    assert step_500 == Decimal("0.5")
    assert mpe_500 == Decimal("0.5")

    # > 500 e to 2000 e: 1.0 e
    mpe_501, step_501 = calculate_mpe(Decimal("501"), e, "III")
    assert step_501 == Decimal("1.0")
    assert mpe_501 == Decimal("1.0")

    mpe_2000, step_2000 = calculate_mpe(Decimal("2000"), e, "III")
    assert step_2000 == Decimal("1.0")
    assert mpe_2000 == Decimal("1.0")

    # > 2000 e: 1.5 e
    mpe_2001, step_2001 = calculate_mpe(Decimal("2001"), e, "III")
    assert step_2001 == Decimal("1.5")
    assert mpe_2001 == Decimal("1.5")


def test_mpe_service_verification_doubles_initial() -> None:
    e = Decimal("2.0")
    mpe_init, step_init = calculate_mpe(Decimal("1500"), e, "III", verification_type="initial")
    mpe_serv, step_serv = calculate_mpe(Decimal("1500"), e, "III", verification_type="service")

    assert step_init == Decimal("1.0")
    assert mpe_init == Decimal("2.0")
    assert step_serv == Decimal("2.0")
    assert mpe_serv == Decimal("4.0")


def test_mpe_all_classes() -> None:
    e = Decimal("0.01")

    # Class I
    mpe_i, _ = calculate_mpe(Decimal("400"), e, "I")  # m = 40,000 <= 50,000 -> 0.5 e
    assert mpe_i == Decimal("0.005")

    # Class II
    mpe_ii, _ = calculate_mpe(Decimal("100"), e, "II")  # m = 10,000 <= 20,000 -> 1.0 e
    assert mpe_ii == Decimal("0.01")

    # Class IIII
    mpe_iiii, _ = calculate_mpe(Decimal("1.5"), e, "IIII")  # m = 150 <= 200 -> 1.0 e
    assert mpe_iiii == Decimal("0.01")


def test_invalid_mpe_inputs_raise() -> None:
    with pytest.raises(ValueError, match="strictly positive"):
        calculate_mpe(Decimal("100"), Decimal("0"), "III")

    with pytest.raises(ValueError, match="Unknown accuracy class"):
        calculate_mpe(Decimal("100"), Decimal("1"), "INVALID")


def test_oiml_r76_annex_a443_worked_example() -> None:
    """Validate calculation against the official worked example in OIML R76 Annex A.4.4.3.

    Example: e = 5 g, L = 1000 g, I = 1000 g, delta_L = 1.5 g, E0 = +0.5 g
    P = 1000 + 2.5 - 1.5 = 1001 g
    E = 1001 - 1000 = +1 g
    Ec = +1 - (+0.5) = +0.5 g
    """
    res = calculate_indication_error(
        nominal_load=Decimal("1000"),
        indication=Decimal("1000"),
        e=Decimal("5"),
        delta_l=Decimal("1.5"),
        zero_error=Decimal("0.5"),
        accuracy_class="III",
        method="changeover",
        unit="g",
    )

    assert res.outcome == Outcome.PASS
    assert res.value == "0.5"
    assert res.inputs["indication_prior_to_rounding_p"] == "1001.0"
    assert res.inputs["uncorrected_error_e"] == "1.0"


def test_multi_interval_scale_interval_resolution() -> None:
    ranges_cfg = {
        "type": "multi_interval",
        "ranges": [
            {"max": "2000", "e": "1", "d": "1", "min": "20"},
            {"max": "5000", "e": "2", "d": "2", "min": "2000"},
            {"max": "15000", "e": "10", "d": "10", "min": "5000"},
        ],
    }

    # Load 500 g -> in partial range 1 (e = 1)
    info1 = resolve_scale_interval(Decimal("500"), Decimal("1"), ranges_config=ranges_cfg)
    assert info1.e == Decimal("1")
    assert info1.range_index == 0

    # Load 3000 g -> in partial range 2 (e = 2)
    info2 = resolve_scale_interval(Decimal("3000"), Decimal("1"), ranges_config=ranges_cfg)
    assert info2.e == Decimal("2")
    assert info2.range_index == 1

    # Load 12000 g -> in partial range 3 (e = 10)
    info3 = resolve_scale_interval(Decimal("12000"), Decimal("1"), ranges_config=ranges_cfg)
    assert info3.e == Decimal("10")
    assert info3.range_index == 2


def test_repeatability_oiml_clause_361() -> None:
    # Class III, e = 1 g, load = 500 g -> MPE = 0.5 g
    # Readings with range 0.4 g <= 0.5 g -> PASS
    pass_res = calculate_repeatability(
        indications=[Decimal("500.1"), Decimal("500.3"), Decimal("499.9")],
        nominal_load=Decimal("500"),
        e=Decimal("1"),
        accuracy_class="III",
    )
    assert pass_res.outcome == Outcome.PASS
    assert pass_res.value == "0.4"

    # Readings with range 0.8 g > 0.5 g -> FAIL
    fail_res = calculate_repeatability(
        indications=[Decimal("500.5"), Decimal("499.7")],
        nominal_load=Decimal("500"),
        e=Decimal("1"),
        accuracy_class="III",
    )
    assert fail_res.outcome == Outcome.FAIL
    assert fail_res.value == "0.8"


def test_eccentricity_loading() -> None:
    # Test 4 quadrant positions
    positions = [
        {"position": "center", "nominal_load": "100", "indication": "100.0"},
        {"position": "front-left", "nominal_load": "100", "indication": "100.2"},
        {"position": "back-right", "nominal_load": "100", "indication": "100.1"},
    ]
    results = calculate_eccentricity(
        positions_readings=positions,
        e=Decimal("1"),
        accuracy_class="III",
    )
    assert len(results) == 3
    assert all(r.outcome == Outcome.PASS for r in results)
