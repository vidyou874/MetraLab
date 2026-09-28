from decimal import Decimal

from app.domain.calculations.statistics import descriptive_statistics


def test_descriptive_statistics_empty_values() -> None:
    stats = descriptive_statistics([])

    assert stats["count"] == 0
    assert stats["reason"] == "No readings provided"


def test_descriptive_statistics_marks_single_value_variance_unavailable() -> None:
    stats = descriptive_statistics([Decimal("10.0")])

    assert stats["count"] == 1
    assert stats["sample_standard_deviation"] is None
    assert stats["sample_variance"] is None
    assert stats["range"] == Decimal("0.0")


def test_descriptive_statistics_returns_range() -> None:
    stats = descriptive_statistics([Decimal("10.0"), Decimal("10.2"), Decimal("9.9")])

    assert stats["count"] == 3
    assert stats["range"] == Decimal("0.3")
    assert stats["minimum"] == Decimal("9.9")
    assert stats["maximum"] == Decimal("10.2")
    assert stats["median"] == Decimal("10.0")
    assert stats["sample_standard_deviation"] is not None
    assert stats["sample_variance"] is not None
