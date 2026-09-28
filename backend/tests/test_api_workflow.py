from fastapi.testclient import TestClient

from tests.conftest import sign_in


def create_instrument(client: TestClient) -> int:
    response = client.post(
        "/api/instruments",
        json={
            "manufacturer": "Metra",
            "model": "NWI-300",
            "serial_number": "SN-001",
            "accuracy_class": "III",
            "max_capacity": "30000",
            "capacity_unit": "g",
            "verification_interval_e": "10",
            "display_division_d": "10",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def create_procedure(client: TestClient) -> int:
    response = client.post(
        "/api/procedures",
        json={
            "name": "Repeatability",
            "procedure_revision": "1.0",
            "standard_reference": "OIML R76",
            "supported_test_type": "repeatability",
            "configuration_version": "1.0.0",
            "rules": {"repeatability_range_limit": "10", "repeatability_range_unit": "g"},
            "approved_by": "technical.owner@example.com",
            "is_active": True,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_technician_can_capture_and_submit_a_report(client: TestClient) -> None:
    sign_in(client, "admin@example.com")
    instrument_id = create_instrument(client)
    procedure_id = create_procedure(client)

    sign_in(client, "tech@example.com")
    response = client.post(
        "/api/reports",
        json={
            "instrument_id": instrument_id,
            "procedure_configuration_id": procedure_id,
            "conditions": {"temperature_c": "22.0"},
        },
    )
    assert response.status_code == 201
    report = response.json()

    for sequence, indication in enumerate(["10000", "10005", "10002"], start=1):
        response = client.post(
            f"/api/reports/{report['id']}/measurements",
            json={
                "test_type": "repeatability",
                "point_sequence": 1,
                "measurement_sequence": sequence,
                "nominal_load": "10000",
                "nominal_load_unit": "g",
                "indication": indication,
                "indication_unit": "g",
                "indication_precision": "1 g",
            },
        )
        assert response.status_code == 201

    preview = client.get(f"/api/reports/{report['id']}/calculation-preview")
    assert preview.status_code == 200
    range_result = next(
        item for item in preview.json()["results"] if item["result_key"] == "repeatability_range"
    )
    assert range_result["outcome"] == "Pass"
    assert range_result["value"] == "5.0000000000"

    response = client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 4},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "Submitted"


def test_finalization_is_blocked_when_required_rule_is_not_evaluated(client: TestClient) -> None:
    sign_in(client, "admin@example.com")
    instrument_id = create_instrument(client)
    procedure_id = create_procedure(client)
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
            "nominal_load": "10000",
            "nominal_load_unit": "g",
            "indication": "10000",
            "indication_unit": "g",
            "indication_precision": "1 g",
        },
    )
    submitted = client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 2},
    )
    assert submitted.status_code == 200

    sign_in(client, "reviewer@example.com")
    response = client.post(
        f"/api/reports/{report['id']}/finalize",
        json={"expected_row_version": 3},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "not_evaluated"


def test_return_requires_reason_and_is_audited(client: TestClient) -> None:
    sign_in(client, "admin@example.com")
    instrument_id = create_instrument(client)
    procedure_id = create_procedure(client)
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
            "nominal_load": "10000",
            "nominal_load_unit": "g",
            "indication": "10000",
            "indication_unit": "g",
            "indication_precision": "1 g",
        },
    )
    client.post(f"/api/reports/{report['id']}/submit", json={"expected_row_version": 2})
    sign_in(client, "reviewer@example.com")

    missing_reason = client.post(
        f"/api/reports/{report['id']}/return", json={"expected_row_version": 3}
    )
    assert missing_reason.status_code == 422

    returned = client.post(
        f"/api/reports/{report['id']}/return",
        json={"expected_row_version": 3, "reason": "Please verify load setup"},
    )
    assert returned.status_code == 200
    audit = client.get(f"/api/reports/{report['id']}/audit")
    assert any(event["event_type"] == "report.returned" for event in audit.json())


def test_approved_oiml_r76_report_can_be_finalized(client: TestClient) -> None:
    sign_in(client, "admin@example.com")
    instrument_id = create_instrument(client)

    # Create approved OIML R76 procedure configuration
    proc_res = client.post(
        "/api/procedures",
        json={
            "name": "OIML R76 Approved Verification",
            "procedure_revision": "2006.1",
            "standard_reference": "OIML R76-1: 2006",
            "supported_test_type": "weighing",
            "configuration_version": "2.0.0",
            "rules": {
                "indication_error_approved": True,
                "indication_error_rule": "oiml_r76",
                "error_method": "uncorrected",
                "repeatability_range_limit": "10",
                "repeatability_range_unit": "g",
            },
            "approved_by": "technical.director@example.com",
            "is_active": True,
        },
    )
    assert proc_res.status_code == 201
    procedure_id = proc_res.json()["id"]

    sign_in(client, "tech@example.com")
    report = client.post(
        "/api/reports",
        json={"instrument_id": instrument_id, "procedure_configuration_id": procedure_id},
    ).json()

    # Add weighing measurement
    client.post(
        f"/api/reports/{report['id']}/measurements",
        json={
            "test_type": "weighing",
            "point_sequence": 1,
            "measurement_sequence": 1,
            "nominal_load": "10000",
            "nominal_load_unit": "g",
            "indication": "10001",
            "indication_unit": "g",
            "indication_precision": "1 g",
        },
    )

    # Add repeatability measurement to satisfy repeatability rule
    client.post(
        f"/api/reports/{report['id']}/measurements",
        json={
            "test_type": "weighing",
            "point_sequence": 1,
            "measurement_sequence": 2,
            "nominal_load": "10000",
            "nominal_load_unit": "g",
            "indication": "10002",
            "indication_unit": "g",
            "indication_precision": "1 g",
        },
    )

    # Preview calculations - indication error must be evaluated as Pass (error 1g <= MPE 10g)
    preview = client.get(f"/api/reports/{report['id']}/calculation-preview").json()
    assert any(
        res["result_key"].startswith("indication_error") and res["outcome"] == "Pass"
        for res in preview["results"]
    )

    # Submit report
    submit_res = client.post(
        f"/api/reports/{report['id']}/submit",
        json={"expected_row_version": 3},
    )
    assert submit_res.status_code == 200

    # Finalize report by reviewer
    sign_in(client, "reviewer@example.com")
    finalize_res = client.post(
        f"/api/reports/{report['id']}/finalize",
        json={"expected_row_version": 4},
    )
    assert finalize_res.status_code == 200
    finalized = finalize_res.json()
    assert finalized["status"] == "Finalized"
    assert finalized["disposition"] == "Pass"
