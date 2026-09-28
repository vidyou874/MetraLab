from fastapi.testclient import TestClient

from tests.conftest import sign_in


def test_instrument_lifecycle_and_search(client: TestClient) -> None:
    sign_in(client, "admin@example.com")

    # Create instrument
    create_res = client.post(
        "/api/instruments",
        json={
            "manufacturer": "Sartorius",
            "model": "Secura-225D",
            "serial_number": "SEC-998811",
            "asset_tag": "LAB-SEC-01",
            "accuracy_class": "I",
            "max_capacity": "220",
            "capacity_unit": "g",
            "verification_interval_e": "0.001",
            "display_division_d": "0.0001",
        },
    )
    assert create_res.status_code == 201
    instrument_id = create_res.json()["id"]

    # Duplicate creation fails with 409
    dup_res = client.post(
        "/api/instruments",
        json={
            "manufacturer": "Sartorius",
            "model": "Secura-225D",
            "serial_number": "SEC-998811",
            "accuracy_class": "I",
            "max_capacity": "220",
            "capacity_unit": "g",
        },
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["detail"]["code"] == "duplicate_instrument"

    # Search by serial number
    search_res = client.get("/api/instruments?query=SEC-9988")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) == 1
    assert results[0]["id"] == instrument_id

    # Search with no match
    no_match_res = client.get("/api/instruments?query=NONEXISTENT")
    assert no_match_res.status_code == 200
    assert len(no_match_res.json()) == 0

    # Retire instrument
    retire_res = client.post(f"/api/instruments/{instrument_id}/retire")
    assert retire_res.status_code == 200
    assert retire_res.json()["is_active"] is False

    # Already retired returns 409
    retire_again = client.post(f"/api/instruments/{instrument_id}/retire")
    assert retire_again.status_code == 409
    assert retire_again.json()["detail"]["code"] == "already_retired"

    # Active-only list excludes retired
    active_res = client.get("/api/instruments")
    assert not any(item["id"] == instrument_id for item in active_res.json())

    # Include retired returns it
    all_res = client.get("/api/instruments?include_retired=true")
    assert any(item["id"] == instrument_id for item in all_res.json())


def test_procedure_configuration_lifecycle(client: TestClient) -> None:
    sign_in(client, "tech@example.com")

    # Technician cannot create a procedure configuration (requires admin)
    forbidden_res = client.post(
        "/api/procedures",
        json={
            "name": "Eccentricity",
            "procedure_revision": "1.0",
            "standard_reference": "OIML R76",
            "supported_test_type": "eccentricity",
            "configuration_version": "1.0.0",
            "rules": {},
            "is_active": True,
        },
    )
    assert forbidden_res.status_code == 403

    # Admin can create procedure configuration
    sign_in(client, "admin@example.com")
    create_res = client.post(
        "/api/procedures",
        json={
            "name": "Eccentricity",
            "procedure_revision": "1.0",
            "standard_reference": "OIML R76",
            "supported_test_type": "eccentricity",
            "configuration_version": "1.0.0",
            "rules": {"eccentricity_load_fraction": "0.33"},
            "is_active": True,
        },
    )
    assert create_res.status_code == 201
    procedure_id = create_res.json()["id"]

    # List active procedures
    list_res = client.get("/api/procedures")
    assert list_res.status_code == 200
    assert any(proc["id"] == procedure_id for proc in list_res.json())


def test_instrument_detail_and_batch_creation(client: TestClient) -> None:
    sign_in(client, "admin@example.com")

    # Batch create instruments
    batch_res = client.post(
        "/api/instruments/batch",
        json={
            "instruments": [
                {
                    "manufacturer": "Kern",
                    "model": "PCB 2500-2",
                    "serial_number": "KERN-BATCH-01",
                    "accuracy_class": "II",
                    "max_capacity": "2500",
                    "capacity_unit": "g",
                    "verification_interval_e": "0.1",
                    "display_division_d": "0.01",
                },
                {
                    "manufacturer": "Kern",
                    "model": "PCB 2500-2",
                    "serial_number": "KERN-BATCH-02",
                    "accuracy_class": "II",
                    "max_capacity": "2500",
                    "capacity_unit": "g",
                    "verification_interval_e": "0.1",
                    "display_division_d": "0.01",
                },
            ]
        },
    )
    assert batch_res.status_code == 201
    batch_data = batch_res.json()
    assert batch_data["created_count"] == 2
    inst_id = batch_data["created_ids"][0]

    # Test detail endpoint
    detail_res = client.get(f"/api/instruments/{inst_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == inst_id
    assert detail["serial_number"] == "KERN-BATCH-01"
    assert detail["calibration_stats"] is not None
    assert detail["calibration_stats"]["compliance_status"] == "PASS"
    assert "mean_drift" in detail["calibration_stats"]
