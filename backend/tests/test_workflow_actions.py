from fastapi.testclient import TestClient

from tests.conftest import sign_in


def setup_base_entities(client: TestClient) -> tuple[int, int]:
    sign_in(client, "admin@example.com")
    inst = client.post(
        "/api/instruments",
        json={
            "manufacturer": "Mettler",
            "model": "XP205",
            "serial_number": f"XP-{id(client)}",
            "accuracy_class": "I",
            "max_capacity": "200",
            "capacity_unit": "g",
            "verification_interval_e": "0.001",
            "display_division_d": "0.0001",
        },
    ).json()

    proc = client.post(
        "/api/procedures",
        json={
            "name": "Repeatability Flow",
            "procedure_revision": "1.0",
            "standard_reference": "OIML R76",
            "supported_test_type": "repeatability",
            "configuration_version": "1.0.0",
            "rules": {"repeatability_range_limit": "0.005", "repeatability_range_unit": "g"},
            "is_active": True,
        },
    ).json()

    return inst["id"], proc["id"]


def test_optimistic_locking_conflict(client: TestClient) -> None:
    instrument_id, procedure_id = setup_base_entities(client)

    sign_in(client, "tech@example.com")
    report = client.post(
        "/api/reports",
        json={"instrument_id": instrument_id, "procedure_configuration_id": procedure_id},
    ).json()

    # Add a measurement to bump row_version from 1 to 2
    client.post(
        f"/api/reports/{report['id']}/measurements",
        json={
            "test_type": "repeatability",
            "point_sequence": 1,
            "measurement_sequence": 1,
            "nominal_load": "100",
            "nominal_load_unit": "g",
            "indication": "100.0001",
            "indication_unit": "g",
            "indication_precision": "0.0001 g",
        },
    )

    # Submitting with stale expected_row_version=1 should trigger 409 conflict
    stale_submit = client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 1},
    )
    assert stale_submit.status_code == 409
    assert stale_submit.json()["detail"]["code"] == "edit_conflict"

    # Submitting with correct row_version=2 succeeds
    valid_submit = client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 2},
    )
    assert valid_submit.status_code == 200
    assert valid_submit.json()["status"] == "Submitted"


def test_reject_report_workflow(client: TestClient) -> None:
    instrument_id, procedure_id = setup_base_entities(client)

    sign_in(client, "tech@example.com")
    report = client.post(
        "/api/reports",
        json={"instrument_id": instrument_id, "procedure_configuration_id": procedure_id},
    ).json()

    client.post(
        f"/api/reports/{report['id']}/measurements",
        json={
            "test_type": "repeatability",
            "point_sequence": 1,
            "measurement_sequence": 1,
            "nominal_load": "100",
            "nominal_load_unit": "g",
            "indication": "100.0001",
            "indication_unit": "g",
            "indication_precision": "0.0001 g",
        },
    )

    client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 2},
    )

    # Reviewer tries to reject without reason -> 422
    sign_in(client, "reviewer@example.com")
    missing_reason = client.post(
        f"/api/reports/{report['id']}/reject",
        json={"expected_row_version": 3},
    )
    assert missing_reason.status_code == 422
    assert missing_reason.json()["detail"]["code"] == "reason_required"

    # Reviewer rejects with reason
    rejected = client.post(
        f"/api/reports/{report['id']}/reject",
        json={"expected_row_version": 3, "reason": "Environment temperature out of specification"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "Rejected"


def test_list_measurements_endpoint(client: TestClient) -> None:
    instrument_id, procedure_id = setup_base_entities(client)

    sign_in(client, "tech@example.com")
    report = client.post(
        "/api/reports",
        json={"instrument_id": instrument_id, "procedure_configuration_id": procedure_id},
    ).json()

    client.post(
        f"/api/reports/{report['id']}/measurements",
        json={
            "test_type": "repeatability",
            "point_sequence": 1,
            "measurement_sequence": 1,
            "nominal_load": "50",
            "nominal_load_unit": "g",
            "indication": "50.0000",
            "indication_unit": "g",
            "indication_precision": "0.0001 g",
            "note": "First run",
        },
    )

    meas_res = client.get(f"/api/reports/{report['id']}/measurements")
    assert meas_res.status_code == 200
    items = meas_res.json()
    assert len(items) == 1
    assert items[0]["test_type"] == "repeatability"
    assert items[0]["note"] == "First run"
