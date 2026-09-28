"""Create the initial MetraLab application schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-09-24
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("role", sa.String(40), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_is_active", "users", ["is_active"])

    op.create_table(
        "instruments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("laboratory_scope", sa.String(120), nullable=False),
        sa.Column("manufacturer", sa.String(160), nullable=False),
        sa.Column("model", sa.String(160), nullable=False),
        sa.Column("serial_number", sa.String(160), nullable=False),
        sa.Column("asset_tag", sa.String(160), nullable=True),
        sa.Column("accuracy_class", sa.String(20), nullable=False),
        sa.Column("max_capacity", sa.Numeric(24, 10), nullable=False),
        sa.Column("capacity_unit", sa.String(20), nullable=False),
        sa.Column("verification_interval_e", sa.Numeric(24, 10), nullable=True),
        sa.Column("display_division_d", sa.Numeric(24, 10), nullable=True),
        sa.Column("ranges", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint(
            "laboratory_scope", "manufacturer", "serial_number", name="uq_instrument_serial_scope"
        ),
    )
    op.create_index("ix_instruments_laboratory_scope", "instruments", ["laboratory_scope"])
    op.create_index("ix_instruments_serial_number", "instruments", ["serial_number"])
    op.create_index("ix_instruments_asset_tag", "instruments", ["asset_tag"])
    op.create_index("ix_instruments_is_active", "instruments", ["is_active"])

    op.create_table(
        "procedure_configurations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("procedure_revision", sa.String(80), nullable=False),
        sa.Column("standard_reference", sa.String(180), nullable=False),
        sa.Column("supported_test_type", sa.String(120), nullable=False),
        sa.Column("configuration_version", sa.String(80), nullable=False),
        sa.Column("rules", sa.JSON(), nullable=False),
        sa.Column("approved_by", sa.String(320), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("effective_to", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_procedure_configurations_name", "procedure_configurations", ["name"])
    op.create_index(
        "ix_procedure_configurations_supported_test_type",
        "procedure_configurations",
        ["supported_test_type"],
    )
    op.create_index(
        "ix_procedure_configurations_configuration_version",
        "procedure_configurations",
        ["configuration_version"],
    )
    op.create_index(
        "ix_procedure_configurations_is_active", "procedure_configurations", ["is_active"]
    )

    op.create_table(
        "test_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("report_number", sa.String(80), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column(
            "instrument_id",
            sa.Integer(),
            sa.ForeignKey("instruments.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "technician_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "reviewer_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=True,
        ),
        sa.Column(
            "procedure_configuration_id",
            sa.Integer(),
            sa.ForeignKey("procedure_configurations.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("procedure_configuration_version", sa.String(80), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("disposition", sa.String(40), nullable=True),
        sa.Column("conditions", sa.JSON(), nullable=False),
        sa.Column("comments", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finalized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "parent_report_id", sa.Integer(), sa.ForeignKey("test_reports.id"), nullable=True
        ),
        sa.Column("row_version", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("report_number", "revision", name="uq_report_revision"),
    )
    op.create_index("ix_test_reports_report_number", "test_reports", ["report_number"])
    op.create_index("ix_test_reports_status", "test_reports", ["status"])
    op.create_index("ix_test_reports_disposition", "test_reports", ["disposition"])

    op.create_table(
        "measurement_points",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "report_id",
            sa.Integer(),
            sa.ForeignKey("test_reports.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("test_type", sa.String(120), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("nominal_load", sa.Numeric(24, 10), nullable=False),
        sa.Column("nominal_load_unit", sa.String(20), nullable=False),
        sa.Column("context", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_measurement_points_report_id", "measurement_points", ["report_id"])
    op.create_index("ix_measurement_points_test_type", "measurement_points", ["test_type"])
    op.create_index("ix_measurement_points_sequence", "measurement_points", ["sequence"])

    op.create_table(
        "measurements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "measurement_point_id",
            sa.Integer(),
            sa.ForeignKey("measurement_points.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("entered_indication", sa.Numeric(24, 10), nullable=False),
        sa.Column("indication_unit", sa.String(20), nullable=False),
        sa.Column("entered_precision", sa.String(80), nullable=False),
        sa.Column("capture_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "creator_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.UniqueConstraint("measurement_point_id", "sequence", name="uq_measurement_sequence"),
    )
    op.create_index(
        "ix_measurements_measurement_point_id", "measurements", ["measurement_point_id"]
    )
    op.create_index("ix_measurements_sequence", "measurements", ["sequence"])

    op.create_table(
        "calculation_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "report_id",
            sa.Integer(),
            sa.ForeignKey("test_reports.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("scope", sa.JSON(), nullable=False),
        sa.Column("result_key", sa.String(120), nullable=False),
        sa.Column("value", sa.String(120), nullable=True),
        sa.Column("unit", sa.String(20), nullable=True),
        sa.Column("formula_id", sa.String(160), nullable=False),
        sa.Column("configuration_version", sa.String(80), nullable=False),
        sa.Column("engine_version", sa.String(80), nullable=False),
        sa.Column("rounding_metadata", sa.JSON(), nullable=True),
        sa.Column("limit_metadata", sa.JSON(), nullable=True),
        sa.Column("outcome", sa.String(40), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_calculation_records_report_id", "calculation_records", ["report_id"])
    op.create_index("ix_calculation_records_result_key", "calculation_records", ["result_key"])
    op.create_index("ix_calculation_records_outcome", "calculation_records", ["outcome"])

    op.create_table(
        "audit_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("event_type", sa.String(120), nullable=False),
        sa.Column("target_type", sa.String(120), nullable=False),
        sa.Column("target_id", sa.String(120), nullable=False),
        sa.Column("revision", sa.String(80), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("before_after", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_audit_events_actor_id", "audit_events", ["actor_id"])
    op.create_index("ix_audit_events_event_type", "audit_events", ["event_type"])
    op.create_index("ix_audit_events_target_type", "audit_events", ["target_type"])
    op.create_index("ix_audit_events_target_id", "audit_events", ["target_id"])


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("calculation_records")
    op.drop_table("measurements")
    op.drop_table("measurement_points")
    op.drop_table("test_reports")
    op.drop_table("procedure_configurations")
    op.drop_table("instruments")
    op.drop_table("users")
