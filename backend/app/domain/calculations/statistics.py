from decimal import Decimal
from statistics import mean, median, stdev, variance


def descriptive_statistics(values: list[Decimal]) -> dict[str, Decimal | int | None | str]:
    if not values:
        return {"count": 0, "reason": "No readings provided"}

    result: dict[str, Decimal | int | None | str] = {
        "count": len(values),
        "mean": Decimal(str(mean(values))),
        "median": Decimal(str(median(values))),
        "minimum": min(values),
        "maximum": max(values),
        "range": max(values) - min(values),
        "formula_basis": "sample standard deviation and sample variance",
    }

    if len(values) < 2:
        result["sample_standard_deviation"] = None
        result["sample_variance"] = None
        result["reason"] = "At least two readings are required for sample deviation/variance"
        return result

    result["sample_standard_deviation"] = Decimal(str(stdev(values)))
    result["sample_variance"] = Decimal(str(variance(values)))
    return result
