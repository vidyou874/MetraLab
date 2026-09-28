"use client";

import React, { useState } from "react";

interface MeasurementRecord {
  id: number;
  testType: string;
  nominalLoad: string;
  indication: string;
  deltaL: string;
  turningPointP: string;
  correctedError: string;
  mpe: string;
  outcome: "Pass" | "Fail";
}

interface ReportSummary {
  id: number;
  report_number: string;
  instrument: string;
  class: "I" | "II" | "III" | "IIII";
  interval_e: number;
  technician: string;
  status: "Draft" | "Submitted" | "Returned" | "Finalized";
  points_count: number;
  last_outcome: "Pass" | "Fail" | "Not evaluated";
  measurements: MeasurementRecord[];
}

const initialReports: ReportSummary[] = [
  {
    id: 101,
    report_number: "ML-2026-00042",
    instrument: "Mettler Toledo XPR205 Analytical",
    class: "I",
    interval_e: 0.001,
    technician: "Alex Vance",
    status: "Draft",
    points_count: 3,
    last_outcome: "Pass",
    measurements: [
      { id: 1, testType: "Weighing", nominalLoad: "50", indication: "50.000", deltaL: "0.0004", turningPointP: "50.0001", correctedError: "+0.0001", mpe: "± 0.0005", outcome: "Pass" },
      { id: 2, testType: "Weighing", nominalLoad: "100", indication: "100.000", deltaL: "0.0002", turningPointP: "100.0003", correctedError: "+0.0003", mpe: "± 0.0010", outcome: "Pass" },
      { id: 3, testType: "Repeatability", nominalLoad: "100", indication: "100.000", deltaL: "0.0003", turningPointP: "100.0002", correctedError: "+0.0002", mpe: "± 0.0010", outcome: "Pass" },
    ],
  },
  {
    id: 102,
    report_number: "ML-2026-00041",
    instrument: "Bizerba SC-II 800 (Multi-Interval)",
    class: "III",
    interval_e: 1.0,
    technician: "Alex Vance",
    status: "Submitted",
    points_count: 4,
    last_outcome: "Pass",
    measurements: [
      { id: 1, testType: "Weighing", nominalLoad: "500", indication: "500", deltaL: "0.3", turningPointP: "500.2", correctedError: "+0.2", mpe: "± 0.5", outcome: "Pass" },
      { id: 2, testType: "Weighing", nominalLoad: "2000", indication: "2000", deltaL: "0.1", turningPointP: "2000.4", correctedError: "+0.4", mpe: "± 1.0", outcome: "Pass" },
      { id: 3, testType: "Weighing", nominalLoad: "10000", indication: "10001", deltaL: "0.3", turningPointP: "10001.2", correctedError: "+1.2", mpe: "± 10.0", outcome: "Pass" },
      { id: 4, testType: "Eccentricity", nominalLoad: "5000", indication: "5000", deltaL: "0.2", turningPointP: "5000.3", correctedError: "+0.3", mpe: "± 1.0", outcome: "Pass" },
    ],
  },
  {
    id: 103,
    report_number: "ML-2026-00039",
    instrument: "Dini Argeo Crane-Pro",
    class: "IIII",
    interval_e: 10.0,
    technician: "David Chen",
    status: "Finalized",
    points_count: 2,
    last_outcome: "Pass",
    measurements: [
      { id: 1, testType: "Weighing", nominalLoad: "2000", indication: "2000", deltaL: "2", turningPointP: "2003", correctedError: "+3", mpe: "± 10", outcome: "Pass" },
      { id: 2, testType: "Weighing", nominalLoad: "5000", indication: "5010", deltaL: "4", turningPointP: "5011", correctedError: "+11", mpe: "± 20", outcome: "Pass" },
    ],
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>(initialReports);
  const [selectedReportId, setSelectedReportId] = useState<number>(101);
  const [testType, setTestType] = useState<"weighing" | "repeatability" | "eccentricity">("weighing");
  const [load, setLoad] = useState<string>("100");
  const [indication, setIndication] = useState<string>("100.000");
  const [deltaL, setDeltaL] = useState<string>("0.0003");
  const [notice, setNotice] = useState<string | null>(null);

  // New Draft Modal
  const [isNewDraftModalOpen, setIsNewDraftModalOpen] = useState(false);
  const [newDraftForm, setNewDraftForm] = useState({
    instrument: "Mettler Toledo XPR205 Analytical",
    class: "I" as "I" | "II" | "III" | "IIII",
    interval_e: "0.001",
    technician: "Alex Vance",
    ambientTemp: "21.5",
    relativeHumidity: "48",
  });

  const selectedReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  // Dynamic Metrology Calculations according to OIML R76 Annex A.4.4.3
  const L = parseFloat(load) || 0;
  const I = parseFloat(indication) || 0;
  const dL = parseFloat(deltaL) || 0;
  const e = selectedReport.interval_e;

  // Turning Point Formula: P = I + 0.5e - dL
  const P = Math.round((I + 0.5 * e - dL) * 10000) / 10000;
  const Ec = Math.round((P - L) * 10000) / 10000;

  // Table 6 MPE
  const m = e > 0 ? L / e : 0;
  let mpeMultiplier = 0.5;
  if (selectedReport.class === "I") {
    if (m <= 50000) mpeMultiplier = 0.5;
    else if (m <= 200000) mpeMultiplier = 1.0;
    else mpeMultiplier = 1.5;
  } else if (selectedReport.class === "II") {
    if (m <= 5000) mpeMultiplier = 0.5;
    else if (m <= 20000) mpeMultiplier = 1.0;
    else mpeMultiplier = 1.5;
  } else if (selectedReport.class === "III") {
    if (m <= 500) mpeMultiplier = 0.5;
    else if (m <= 2000) mpeMultiplier = 1.0;
    else mpeMultiplier = 1.5;
  } else {
    if (m <= 50) mpeMultiplier = 0.5;
    else if (m <= 200) mpeMultiplier = 1.0;
    else mpeMultiplier = 1.5;
  }
  const mpeValue = Math.round(mpeMultiplier * e * 10000) / 10000;
  const isPass = Math.abs(Ec) <= mpeValue;

  const handleAddMeasurement = () => {
    const newPt: MeasurementRecord = {
      id: selectedReport.measurements.length + 1,
      testType: testType === "weighing" ? "Weighing" : testType === "repeatability" ? "Repeatability" : "Eccentricity",
      nominalLoad: load,
      indication: indication,
      deltaL: deltaL,
      turningPointP: P.toString(),
      correctedError: (Ec >= 0 ? "+" : "") + Ec.toString(),
      mpe: `± ${mpeValue}`,
      outcome: isPass ? "Pass" : "Fail",
    };

    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? {
              ...r,
              points_count: r.points_count + 1,
              last_outcome: isPass ? "Pass" : "Fail",
              measurements: [...r.measurements, newPt],
            }
          : r
      )
    );

    setNotice(`✓ Measurement reading #${newPt.id} added! P=${P}, Ec=${newPt.correctedError}, Outcome=${newPt.outcome}`);
  };

  const handleSubmitForReview = () => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === selectedReport.id
          ? { ...r, status: "Submitted" }
          : r
      )
    );
    setNotice(`✓ Report #${selectedReport.report_number} submitted to Technical Review Queue!`);
  };

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = Date.now();
    const newRep: ReportSummary = {
      id: newId,
      report_number: `ML-2026-${String(reports.length + 45).padStart(5, "0")}`,
      instrument: newDraftForm.instrument,
      class: newDraftForm.class,
      interval_e: parseFloat(newDraftForm.interval_e) || 0.001,
      technician: newDraftForm.technician,
      status: "Draft",
      points_count: 0,
      last_outcome: "Not evaluated",
      measurements: [],
    };

    setReports([newRep, ...reports]);
    setSelectedReportId(newRep.id);
    setIsNewDraftModalOpen(false);
    setNotice(`New draft report #${newRep.report_number} created for ${newRep.instrument}.`);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 4px" }}>Test Report Studio</h1>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
            Capture raw measurements, record turning points (Annex A.4.4.3), and preview Table 6 compliance in real time.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsNewDraftModalOpen(true)}>
          + Create New Draft
        </button>
      </div>

      {notice && (
        <div
          className="preview-chip"
          style={{
            borderLeft: "4px solid var(--accent-yellow)",
            marginBottom: "20px",
            background: "rgba(226, 253, 82, 0.08)",
          }}
        >
          <span style={{ fontWeight: 600, color: "var(--accent-yellow)" }}>{notice}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.9fr", gap: "24px" }}>
        {/* Reports Queue List */}
        <div>
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "12px" }}>Active Reports Queue ({reports.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {reports.map((rep) => {
              const isSelected = selectedReport.id === rep.id;
              return (
                <div
                  key={rep.id}
                  onClick={() => {
                    setSelectedReportId(rep.id);
                    setNotice(null);
                  }}
                  className="stat-card"
                  style={{
                    cursor: "pointer",
                    borderLeft: isSelected ? "3px solid var(--accent-yellow)" : "1px solid var(--border-subtle)",
                    background: isSelected ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{rep.report_number}</span>
                    <span
                      className={`badge ${
                        rep.status === "Finalized"
                          ? "badge-pass"
                          : rep.status === "Submitted"
                          ? "badge-warn"
                          : "badge-neutral"
                      }`}
                    >
                      <span className="badge-dot" />
                      {rep.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    {rep.instrument} • Class {rep.class}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Technician: {rep.technician} • {rep.points_count} test points recorded
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Report Workspace & Capture Form */}
        <div className="studio-panel">
          <div className="panel-title">
            <div>
              <span>Report Workspace: {selectedReport.report_number}</span>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                {selectedReport.instrument} (Class {selectedReport.class}, e={selectedReport.interval_e})
              </div>
            </div>
            <span
              className={`badge ${
                selectedReport.status === "Finalized"
                  ? "badge-pass"
                  : selectedReport.status === "Submitted"
                  ? "badge-warn"
                  : "badge-neutral"
              }`}
            >
              <span className="badge-dot" />
              {selectedReport.status}
            </span>
          </div>

          {/* Test Type Tabs */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
            <button
              onClick={() => setTestType("weighing")}
              className={testType === "weighing" ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              Weighing Test (A.4.4)
            </button>
            <button
              onClick={() => setTestType("repeatability")}
              className={testType === "repeatability" ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              Repeatability (3.6.1)
            </button>
            <button
              onClick={() => setTestType("eccentricity")}
              className={testType === "eccentricity" ? "btn-primary" : "btn-secondary"}
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              Eccentricity (3.6.2)
            </button>
          </div>

          {/* Measurement Entry Inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label">Nominal Load (L)</label>
              <input
                type="text"
                className="form-input"
                value={load}
                onChange={(e) => setLoad(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Indication (I)</label>
              <input
                type="text"
                className="form-input"
                value={indication}
                onChange={(e) => setIndication(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Turning Load (ΔL)</label>
              <input
                type="text"
                className="form-input"
                value={deltaL}
                onChange={(e) => setDeltaL(e.target.value)}
              />
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div
            className="preview-chip"
            style={{
              borderLeft: `3px solid ${isPass ? "var(--badge-pass-text)" : "var(--badge-fail-text)"}`,
              marginBottom: "20px",
            }}
          >
            <div className="preview-chip-header">
              <span>LIVE OIML R76 PREVIEW (P = I + 0.5e - ΔL)</span>
              <span className={`badge ${isPass ? "badge-pass" : "badge-fail"}`}>
                <span className="badge-dot" />
                {isPass ? "CONFORMS TO TABLE 6" : "EXCEEDS TABLE 6 TOLERANCE"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "8px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TURNING POINT (P)</div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{P}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CORRECTED ERROR (Ec)</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: isPass ? "var(--badge-pass-text)" : "var(--badge-fail-text)" }}>
                  {Ec >= 0 ? `+${Ec}` : Ec}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TABLE 6 MPE LIMIT</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--accent-yellow)" }}>
                  ± {mpeValue} ({mpeMultiplier} e)
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleAddMeasurement}
            >
              + Add Measurement Reading
            </button>
            <button
              className="btn-secondary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleSubmitForReview}
              disabled={selectedReport.status === "Submitted" || selectedReport.status === "Finalized"}
            >
              {selectedReport.status === "Submitted" ? "✓ Already Submitted" : "Submit for Technical Review"}
            </button>
          </div>

          {/* Measurements List in Current Report */}
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
              Recorded Measurement Points ({selectedReport.measurements.length})
            </div>
            <div className="table-container">
              <table className="data-table" style={{ fontSize: "0.8rem" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Load</th>
                    <th>Indication</th>
                    <th>P</th>
                    <th>Error (Ec)</th>
                    <th>MPE</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.measurements.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{m.testType}</td>
                      <td>{m.nominalLoad}</td>
                      <td>{m.indication}</td>
                      <td>{m.turningPointP}</td>
                      <td style={{ fontWeight: 600 }}>{m.correctedError}</td>
                      <td>{m.mpe}</td>
                      <td>
                        <span className={`badge ${m.outcome === "Pass" ? "badge-pass" : "badge-fail"}`}>
                          {m.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {selectedReport.measurements.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                        No measurements recorded yet. Enter nominal load and indication above to add points.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Draft Report */}
      {isNewDraftModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "560px" }}>
            <div className="modal-header">
              <h2>Create New Test Report Draft</h2>
              <button className="close-btn" onClick={() => setIsNewDraftModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDraft}>
              <div className="form-group">
                <label className="form-label">Instrument Under Test</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDraftForm.instrument}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, instrument: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Accuracy Class</label>
                  <select
                    className="form-select"
                    value={newDraftForm.class}
                    onChange={(e) => setNewDraftForm({ ...newDraftForm, class: e.target.value as any })}
                  >
                    <option value="I">Class I (Special)</option>
                    <option value="II">Class II (High)</option>
                    <option value="III">Class III (Medium)</option>
                    <option value="IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Interval (e)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={newDraftForm.interval_e}
                    onChange={(e) => setNewDraftForm({ ...newDraftForm, interval_e: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Responsible Metrologist / Technician</label>
                <input
                  type="text"
                  className="form-input"
                  value={newDraftForm.technician}
                  onChange={(e) => setNewDraftForm({ ...newDraftForm, technician: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Ambient Temp (°C)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={newDraftForm.ambientTemp}
                    onChange={(e) => setNewDraftForm({ ...newDraftForm, ambientTemp: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relative Humidity (%)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    value={newDraftForm.relativeHumidity}
                    onChange={(e) => setNewDraftForm({ ...newDraftForm, relativeHumidity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setIsNewDraftModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
