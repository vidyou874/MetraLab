"use client";

import React, { useState } from "react";

interface ReviewReport {
  id: string;
  instrumentName: string;
  serialNumber: string;
  accuracyClass: string;
  capacity: string;
  technician: string;
  submittedAt: string;
  status: "Submitted" | "Finalized" | "Returned" | "Rejected";
  disposition: "Pass" | "Fail" | "Under Review";
  points: Array<{
    name: string;
    nominalLoad: string;
    error: string;
    mpe: string;
    outcome: "Pass" | "Fail";
  }>;
}

const sampleReviewQueue: ReviewReport[] = [
  {
    id: "ML-2026-00041",
    instrumentName: "Bizerba SC-II 800 (Multi-Interval)",
    serialNumber: "BIZ-SC-4401",
    accuracyClass: "III",
    capacity: "15 kg (e1=1g, e2=2g, e3=10g)",
    technician: "Alex Vance (Lead Metrologist)",
    submittedAt: "2026-09-28 10:25 UTC",
    status: "Submitted",
    disposition: "Pass",
    points: [
      { name: "Weighing Step #1", nominalLoad: "500 g", error: "+0.2 g", mpe: "± 0.5 g", outcome: "Pass" },
      { name: "Weighing Step #2", nominalLoad: "2,000 g", error: "+0.4 g", mpe: "± 1.0 g", outcome: "Pass" },
      { name: "Weighing Step #3", nominalLoad: "10,000 g", error: "+1.2 g", mpe: "± 10.0 g", outcome: "Pass" },
      { name: "Repeatability (3 Runs)", nominalLoad: "5,000 g", error: "Range 0.8 g", mpe: "Limit: 2.0 g", outcome: "Pass" },
      { name: "Eccentricity (4 Corners)", nominalLoad: "5,000 g", error: "Max Dev 0.6 g", mpe: "Limit: 1.0 g", outcome: "Pass" },
    ],
  },
  {
    id: "ML-2026-00042",
    instrumentName: "Mettler Toledo XPR205 Analytical",
    serialNumber: "MT-XPR-9921",
    accuracyClass: "I",
    capacity: "220 g (e=0.001g, d=0.0001g)",
    technician: "Prof. Sarah Jenkins",
    submittedAt: "2026-09-28 11:10 UTC",
    status: "Submitted",
    disposition: "Pass",
    points: [
      { name: "Turning Point #1", nominalLoad: "50 g", error: "+0.0001 g", mpe: "± 0.0005 g", outcome: "Pass" },
      { name: "Turning Point #2", nominalLoad: "100 g", error: "+0.0003 g", mpe: "± 0.0010 g", outcome: "Pass" },
      { name: "Repeatability (6 Runs)", nominalLoad: "100 g", error: "Range 0.0002 g", mpe: "Limit: 0.0010 g", outcome: "Pass" },
    ],
  },
  {
    id: "ML-2026-00043",
    instrumentName: "Dini Argeo Crane-Pro 10T",
    serialNumber: "DA-CP-5511",
    accuracyClass: "IIII",
    capacity: "10,000 kg (e=10kg)",
    technician: "David Chen",
    submittedAt: "2026-09-28 11:45 UTC",
    status: "Submitted",
    disposition: "Under Review",
    points: [
      { name: "Heavy Load Point #1", nominalLoad: "2,000 kg", error: "+8 kg", mpe: "± 10 kg", outcome: "Pass" },
      { name: "Heavy Load Point #2", nominalLoad: "5,000 kg", error: "+18 kg", mpe: "± 20 kg", outcome: "Pass" },
      { name: "Heavy Load Point #3", nominalLoad: "9,000 kg", error: "+26 kg", mpe: "± 30 kg", outcome: "Pass" },
    ],
  },
];

export default function ReviewPage() {
  const [reports, setReports] = useState<ReviewReport[]>(sampleReviewQueue);
  const [selectedReportId, setSelectedReportId] = useState<string>("ML-2026-00041");
  const [reviewNote, setReviewNote] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleFinalize = () => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? { ...r, status: "Finalized", disposition: "Pass" }
          : r
      )
    );
    setActionNotice(
      `✓ Test Report #${selectedReport.id} successfully finalized! Official OIML R76 Conformity Certificate issued.`
    );
    setReviewNote("");
  };

  const handleReturn = () => {
    if (!reviewNote.trim()) {
      alert("Please provide a return explanation note per laboratory quality assurance policy.");
      return;
    }
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? { ...r, status: "Returned" }
          : r
      )
    );
    setActionNotice(
      `↩ Report #${selectedReport.id} returned to technician for corrections. Reason: "${reviewNote.trim()}"`
    );
    setReviewNote("");
  };

  const handleReject = () => {
    if (!reviewNote.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? { ...r, status: "Rejected", disposition: "Fail" }
          : r
      )
    );
    setActionNotice(
      `✕ Report #${selectedReport.id} marked as Rejected. Notice logged to ISO 17025 audit trail.`
    );
    setReviewNote("");
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header Section with Generous Spacing */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
          Technical Review & Metrological Sign-Off
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.92rem", lineHeight: 1.5 }}>
          Inspect submitted test points against Table 6 Maximum Permissible Errors, review turning-point calculations, and execute controlled certification actions.
        </p>
      </div>

      {actionNotice && (
        <div
          className="preview-chip"
          style={{
            borderLeft: "4px solid var(--accent-yellow)",
            marginBottom: "28px",
            background: "rgba(226, 253, 82, 0.08)",
            padding: "16px 20px",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--accent-yellow)", fontSize: "0.95rem" }}>
            {actionNotice}
          </span>
        </div>
      )}

      {/* Review Queue Selector Bar */}
      <div
        className="studio-panel"
        style={{
          marginBottom: "28px",
          padding: "18px 24px",
          background: "var(--bg-surface)",
        }}
      >
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
          Submitted Reports Queue ({reports.length})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
          {reports.map((r) => {
            const isCurrent = r.id === selectedReport.id;
            return (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedReportId(r.id);
                  setActionNotice(null);
                }}
                style={{
                  background: isCurrent ? "var(--bg-surface-elevated)" : "var(--bg-canvas)",
                  border: isCurrent ? "2px solid var(--accent-yellow)" : "1px solid var(--border-subtle)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                    #{r.id}
                  </span>
                  <span
                    className={`badge ${
                      r.status === "Finalized"
                        ? "badge-pass"
                        : r.status === "Returned"
                        ? "badge-warn"
                        : r.status === "Rejected"
                        ? "badge-fail"
                        : "badge-warn"
                    }`}
                  >
                    <span className="badge-dot" />
                    {r.status}
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, marginBottom: "4px" }}>
                  {r.instrumentName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  By {r.technician} • {r.submittedAt}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Review Workspace Layout with Enhanced Spacing */}
      <div className="review-card-container" style={{ gap: "32px", marginBottom: "40px" }}>
        {/* Left Column: Measurement Verification Data */}
        <div className="studio-panel" style={{ padding: "28px" }}>
          <div className="panel-title" style={{ marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>Report #{selectedReport.id}</span>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Serial: <code>{selectedReport.serialNumber}</code> • Accuracy Class {selectedReport.accuracyClass}
              </div>
            </div>
            <span
              className={`badge ${
                selectedReport.disposition === "Pass"
                  ? "badge-pass"
                  : selectedReport.disposition === "Under Review"
                  ? "badge-warn"
                  : "badge-fail"
              }`}
              style={{ fontSize: "0.85rem", padding: "6px 12px" }}
            >
              <span className="badge-dot" />
              Disposition: {selectedReport.disposition}
            </span>
          </div>

          <div className="preview-chip" style={{ marginBottom: "24px", padding: "16px" }}>
            <div className="preview-chip-header">
              <span>TEST INSTRUMENT & ARCHITECTURE</span>
              <span>VERIFICATION SPAN</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "4px" }}>
              {selectedReport.instrumentName}
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              {selectedReport.capacity}
            </div>
          </div>

          {/* Test Points Table */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              Measured Test Points & OIML Tolerance Compliance
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test Point</th>
                    <th>Nominal Load</th>
                    <th>Error Recorded</th>
                    <th>Table 6 Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.points.map((pt, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{pt.name}</td>
                      <td>{pt.nominalLoad}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{pt.error}</td>
                      <td style={{ color: "var(--text-muted)" }}>{pt.mpe}</td>
                      <td>
                        <span className="badge badge-pass" style={{ fontSize: "0.75rem" }}>
                          {pt.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            className="preview-chip"
            style={{
              background: "var(--bg-surface-elevated)",
              padding: "18px",
              borderLeft: "3px solid var(--accent-yellow)",
            }}
          >
            <div className="preview-chip-header">
              <span>METROLOGICAL COMPLIANCE SUMMARY</span>
              <span>ANNEX A.4.4.3</span>
            </div>
            <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              All {selectedReport.points.length} verification steps fall strictly within Table 6 limits. Zero-setting tare correction ($E_0$) verified, and repeatability range does not exceed absolute MPE.
            </div>
          </div>
        </div>

        {/* Right Column: Review Decisions & Actions */}
        <div className="studio-panel" style={{ padding: "28px" }}>
          <div className="panel-title" style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>Reviewer Decision</span>
            <span className="badge badge-neutral">ISO 17025 Lead</span>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label className="form-label" style={{ marginBottom: "8px" }}>
              Technical Justification & Return / Rejection Reason
            </label>
            <textarea
              className="form-input"
              rows={5}
              placeholder="Enter formal notes, observations, or required corrections for the technician..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              style={{ width: "100%", lineHeight: 1.5, resize: "vertical" }}
            />
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
              Required when returning for re-measurement or rejecting a test report.
            </div>
          </div>

          {/* Action Buttons with Clear Spacing */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <button
              className="btn-primary"
              style={{ justifyContent: "center", padding: "14px", fontSize: "0.95rem" }}
              onClick={handleFinalize}
            >
              ✓ Finalize and Issue Conformity Certificate
            </button>

            <button
              className="btn-secondary"
              style={{
                justifyContent: "center",
                padding: "12px",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "var(--badge-warn-border)",
              }}
              onClick={handleReturn}
            >
              ↩ Return to Technician for Re-Testing
            </button>

            <button
              className="btn-secondary"
              style={{
                justifyContent: "center",
                padding: "12px",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "var(--badge-fail-text)",
              }}
              onClick={handleReject}
            >
              ✕ Reject Report (Tolerance Violation)
            </button>
          </div>

          {/* Audit Trail Section */}
          <div style={{ paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
              Audit Trail & Verification Timestamps
            </div>
            <ul style={{ fontSize: "0.78rem", color: "var(--text-secondary)", paddingLeft: "16px", margin: 0, lineHeight: 1.6 }}>
              <li>Submitted by {selectedReport.technician} at {selectedReport.submittedAt}</li>
              <li>Calculations verified against OIML R76-1: 2006 Table 6</li>
              <li>Status: <strong>{selectedReport.status}</strong> • Disposition: <strong>{selectedReport.disposition}</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
