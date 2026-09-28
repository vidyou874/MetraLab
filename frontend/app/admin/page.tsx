"use client";

import React from "react";

const procedureConfigs = [
  {
    id: 1,
    name: "OIML R76 Standard Verification",
    revision: "2006.1",
    standard: "OIML R76-1: 2006",
    test_type: "weighing, repeatability, eccentricity",
    version: "2.0.0",
    approved_by: "technical.director@example.com",
    is_active: true,
  },
  {
    id: 2,
    name: "Repeatability Screening (Non-destructive)",
    revision: "1.2",
    standard: "OIML R76-1: 2006",
    test_type: "repeatability",
    version: "1.2.0",
    approved_by: "qa.manager@example.com",
    is_active: true,
  },
  {
    id: 3,
    name: "Draft High-Capacity Weighbridge Procedure",
    revision: "0.9-draft",
    standard: "OIML R76-1: 2006",
    test_type: "weighing",
    version: "0.9.0",
    approved_by: "Pending sign-off",
    is_active: false,
  },
];

const labUsers = [
  { id: 1, email: "admin@example.com", role: "Administrator", is_active: true },
  { id: 2, email: "tech@example.com", role: "Technician", is_active: true },
  { id: 3, email: "reviewer@example.com", role: "Reviewer", is_active: true },
  { id: 4, email: "auditor@example.com", role: "Auditor", is_active: true },
];

export default function AdminPage() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 4px" }}>System Configuration & Access</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
            Manage approved OIML R76 procedure configurations, rule sets, and user authorization roles.
          </p>
        </div>
        <button className="btn-primary">+ New Procedure Configuration</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: "24px" }}>
        {/* Approved Procedures Table */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>
            Approved Procedure Configurations
          </h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Procedure Name</th>
                  <th>Standard Reference</th>
                  <th>Version</th>
                  <th>Approved By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {procedureConfigs.map((proc) => (
                  <tr key={proc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{proc.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Supported tests: {proc.test_type}
                      </div>
                    </td>
                    <td>{proc.standard}</td>
                    <td>
                      <span className="badge badge-neutral">v{proc.version}</span>
                    </td>
                    <td style={{ fontSize: "0.82rem" }}>{proc.approved_by}</td>
                    <td>
                      <span className={`badge ${proc.is_active ? "badge-pass" : "badge-neutral"}`}>
                        <span className="badge-dot" />
                        {proc.is_active ? "Active" : "Draft"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Access Controls */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px" }}>Laboratory Access & Roles</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {labUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.email}</td>
                    <td>
                      <span className="badge badge-neutral">{user.role}</span>
                    </td>
                    <td>
                      <span className="badge badge-pass">
                        <span className="badge-dot" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stat-card" style={{ marginTop: "16px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "0.95rem" }}>Security & Audit Policy</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 }}>
              All configuration changes, role assignments, report submissions, returns, and finalizations are immutably
              recorded to the database audit log with user identity, timestamp, and before/after state diffs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
