"use client";

import React, { useState } from "react";

interface RoutingRule {
  id: string;
  technicianEmail: string;
  technicianName: string;
  reviewerEmail: string;
  reviewerName: string;
  scope: string;
  updatedAt: string;
  isActive: boolean;
}

const defaultRoutingRules: RoutingRule[] = [
  {
    id: "route-1",
    technicianEmail: "tech@metralab.local",
    technicianName: "Alex Vance (Lead Metrologist)",
    reviewerEmail: "reviewer@metralab.local",
    reviewerName: "Elena Rostova (Quality Lead)",
    scope: "Standard Commercial & Precision (Class I - III)",
    updatedAt: "2026-09-28 09:30 UTC",
    isActive: true,
  },
  {
    id: "route-2",
    technicianEmail: "school@science-lab.edu",
    technicianName: "Prof. Sarah Jenkins (Physics Lab)",
    reviewerEmail: "reviewer@metralab.local",
    reviewerName: "Elena Rostova (Quality Lead)",
    scope: "Educational & Bench Scale Calibrations",
    updatedAt: "2026-09-28 10:15 UTC",
    isActive: true,
  },
  {
    id: "route-3",
    technicianEmail: "industry@precision-mfg.com",
    technicianName: "David Chen (Industrial QA)",
    reviewerEmail: "admin@metralab.local",
    reviewerName: "Lab Administrator (Senior Clearance)",
    scope: "High-Capacity Heavy Industrial (Class IIII)",
    updatedAt: "2026-09-28 11:00 UTC",
    isActive: true,
  },
];

const availableTechnicians = [
  { email: "tech@metralab.local", name: "Alex Vance (Lead Metrologist)" },
  { email: "school@science-lab.edu", name: "Prof. Sarah Jenkins (School / Lab)" },
  { email: "industry@precision-mfg.com", name: "David Chen (Industrial QA)" },
];

const availableReviewers = [
  { email: "reviewer@metralab.local", name: "Elena Rostova (Quality Manager)" },
  { email: "admin@metralab.local", name: "Lab Administrator (Senior Sign-off)" },
  { email: "auditor@metralab.local", name: "Marcus Brody (Audit Director)" },
];

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
  { id: 1, email: "admin@metralab.local", role: "Administrator", is_active: true },
  { id: 2, email: "tech@metralab.local", role: "Technician", is_active: true },
  { id: 3, email: "reviewer@metralab.local", role: "Reviewer", is_active: true },
  { id: 4, email: "auditor@metralab.local", role: "Auditor", is_active: true },
  { id: 5, email: "school@science-lab.edu", role: "Technician", is_active: true },
  { id: 6, email: "industry@precision-mfg.com", role: "Technician", is_active: true },
];

export default function AdminPage() {
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(defaultRoutingRules);
  const [selectedTech, setSelectedTech] = useState<string>(availableTechnicians[0].email);
  const [selectedReviewer, setSelectedReviewer] = useState<string>(availableReviewers[0].email);
  const [routingScope, setRoutingScope] = useState<string>("All OIML R76 Test Reports");
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleAssignRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const tech = availableTechnicians.find((t) => t.email === selectedTech);
    const rev = availableReviewers.find((r) => r.email === selectedReviewer);
    if (!tech || !rev) return;

    // Check if route exists for this technician
    const existingIndex = routingRules.findIndex((r) => r.technicianEmail === tech.email);
    const newRule: RoutingRule = {
      id: existingIndex >= 0 ? routingRules[existingIndex].id : `route-${Date.now()}`,
      technicianEmail: tech.email,
      technicianName: tech.name,
      reviewerEmail: rev.email,
      reviewerName: rev.name,
      scope: routingScope,
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16) + " UTC",
      isActive: true,
    };

    let updatedRules: RoutingRule[];
    if (existingIndex >= 0) {
      updatedRules = [...routingRules];
      updatedRules[existingIndex] = newRule;
    } else {
      updatedRules = [newRule, ...routingRules];
    }

    setRoutingRules(updatedRules);
    setFeedbackNotice(
      `✓ Routing Rule Saved: When ${tech.name} submits a report, it will be directed to ${rev.name} for technical review.`
    );
  };

  const handleToggleRoute = (id: string) => {
    setRoutingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  };

  const handleDeleteRoute = (id: string) => {
    setRoutingRules((prev) => prev.filter((r) => r.id !== id));
    setFeedbackNotice("Routing rule removed.");
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
          System Configuration & Access Governance
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.92rem" }}>
          Configure reviewer routing rules, manage approved OIML R76 procedures, and review authorized laboratory personnel.
        </p>
      </div>

      {feedbackNotice && (
        <div
          className="preview-chip"
          style={{
            borderLeft: "4px solid var(--accent-yellow)",
            marginBottom: "24px",
            background: "rgba(226, 253, 82, 0.08)",
            padding: "16px 20px",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--accent-yellow)", fontSize: "0.92rem" }}>
            {feedbackNotice}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEWER ROUTING & WORKFLOW ASSIGNMENT (Admin Feature)                   */}
      {/* ========================================================================= */}
      <div
        className="studio-panel"
        style={{
          marginBottom: "32px",
          background: "linear-gradient(135deg, rgba(20, 23, 31, 0.98) 0%, rgba(27, 32, 44, 0.95) 100%)",
          border: "1px solid rgba(226, 253, 82, 0.25)",
        }}
      >
        <div className="panel-title" style={{ marginBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              Technical Review Routing & Reviewer Assignment
            </span>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "3px" }}>
              Specify which authorized Reviewer (Account B) receives and reviews test reports when submitted by a specific Technician (Account A).
            </div>
          </div>
          <span className="badge badge-pass" style={{ fontSize: "0.78rem" }}>
            Active Workflow Rules: {routingRules.filter((r) => r.isActive).length}
          </span>
        </div>

        {/* Configuration Form */}
        <form
          onSubmit={handleAssignRoute}
          style={{
            background: "var(--bg-canvas)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div className="admin-form-grid">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ color: "var(--accent-yellow)" }}>
                1. Submitting Technician (Account A)
              </label>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
              >
                {availableTechnicians.map((t) => (
                  <option key={t.email} value={t.email}>
                    {t.name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ color: "var(--accent-yellow)" }}>
                2. Designated Reviewer (Account B)
              </label>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
              >
                {availableReviewers.map((r) => (
                  <option key={r.email} value={r.email}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                3. Scope / Condition
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%" }}
                value={routingScope}
                onChange={(e) => setRoutingScope(e.target.value)}
                placeholder="e.g. All reports, High Priority, Class I"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: "10px 18px", height: "42px", whiteSpace: "nowrap" }}
            >
              + Save Routing Rule
            </button>
          </div>
        </form>

        {/* Active Routing Rules Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Submitting Operator (Account A)</th>
                <th>Assigned Reviewer (Account B)</th>
                <th>Verification Scope</th>
                <th>Last Configured</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routingRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{rule.technicianName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}><code>{rule.technicianEmail}</code></div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--accent-yellow)" }}>{rule.reviewerName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}><code>{rule.reviewerEmail}</code></div>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{rule.scope}</span>
                  </td>
                  <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {rule.updatedAt}
                  </td>
                  <td>
                    <span className={`badge ${rule.isActive ? "badge-pass" : "badge-neutral"}`} style={{ fontSize: "0.72rem" }}>
                      <span className="badge-dot" />
                      {rule.isActive ? "Active Route" : "Paused"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={() => handleToggleRoute(rule.id)}
                      >
                        {rule.isActive ? "Pause" : "Resume"}
                      </button>
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem", color: "var(--badge-fail-text)" }}
                        onClick={() => handleDeleteRoute(rule.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Approved Procedures & User Access Roles */}
      <div className="admin-split-grid">
        {/* Approved Procedures Table */}
        <div className="studio-panel">
          <div className="panel-title">
            <span>Approved OIML Procedures</span>
            <span className="badge badge-pass">Controlled Documents</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Procedure Name</th>
                  <th>Standard Reference</th>
                  <th>Version</th>
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
        <div className="studio-panel">
          <div className="panel-title">
            <span>Authorized Personnel</span>
            <span className="badge badge-neutral">user.csv Synchronized</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {labUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.85rem" }}>
                      {user.email}
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>{user.role}</span>
                    </td>
                    <td>
                      <span className="badge badge-pass" style={{ fontSize: "0.72rem" }}>
                        <span className="badge-dot" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="preview-chip"
            style={{ marginTop: "18px", background: "var(--bg-canvas)", borderLeft: "3px solid var(--accent-yellow)" }}
          >
            <div className="preview-chip-header">
              <span>ISO/IEC 17025 POLICY</span>
              <span>AUDIT COMPLIANT</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
              All configuration changes, role assignments, report submissions, returns, and finalizations are immutably
              recorded to the database audit log with user identity, timestamp, and before/after state diffs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
