"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function HomePage() {
  // Interactive OIML Calculator state
  const [accuracyClass, setAccuracyClass] = useState<"I" | "II" | "III" | "IIII">("III");
  const [deviceType, setDeviceType] = useState<"single" | "multi_interval" | "multi_range">("single");
  const [verificationType, setVerificationType] = useState<"initial" | "service">("initial");
  const [load, setLoad] = useState<number>(1000);
  const [indication, setIndication] = useState<number>(1000.5);
  const [eVal, setEVal] = useState<number>(1);
  const [useChangeover, setUseChangeover] = useState<boolean>(true);
  const [deltaL, setDeltaL] = useState<number>(0.3);
  const [zeroError, setZeroError] = useState<number>(0);

  // Multi-interval definition example: e1=1g up to 2000g, e2=2g up to 5000g, e3=10g up to 15000g
  const resolveEffectiveE = () => {
    if (deviceType === "multi_interval") {
      if (load <= 2000) return 1;
      if (load <= 5000) return 2;
      return 10;
    }
    if (deviceType === "multi_range") {
      if (load <= 3000) return 1;
      return 5;
    }
    return eVal;
  };

  const effectiveE = resolveEffectiveE();
  const m = effectiveE > 0 ? load / effectiveE : 0;

  // Calculate Table 6 MPE step
  const getMpeStep = (cls: string, intervals: number) => {
    switch (cls) {
      case "I":
        if (intervals <= 50000) return 0.5;
        if (intervals <= 200000) return 1.0;
        return 1.5;
      case "II":
        if (intervals <= 5000) return 0.5;
        if (intervals <= 20000) return 1.0;
        return 1.5;
      case "III":
        if (intervals <= 500) return 0.5;
        if (intervals <= 2000) return 1.0;
        return 1.5;
      case "IIII":
        if (intervals <= 50) return 0.5;
        if (intervals <= 200) return 1.0;
        return 1.5;
      default:
        return 1.0;
    }
  };

  const baseStep = getMpeStep(accuracyClass, m);
  const mpeMultiplier = verificationType === "service" ? baseStep * 2 : baseStep;
  const mpe = mpeMultiplier * effectiveE;

  // Indication prior to rounding and errors per Clause A.4.4.3
  const p = useChangeover ? indication + 0.5 * effectiveE - deltaL : indication;
  const rawError = p - load;
  const correctedError = rawError - zeroError;
  const isConforming = Math.abs(correctedError) <= mpe;

  return (
    <div>
      {/* Header section */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Metrology Laboratory Dashboard
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.95rem" }}>
          Deterministic OIML R76 test record capture, conformity calculations, and review studio.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-label">Supported Classes</div>
          <div className="stat-value">Class I – IIII</div>
          <div className="stat-subtext">Special, High, Medium, Ordinary</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Architectures</div>
          <div className="stat-value">3 Types</div>
          <div className="stat-subtext">Single, Multi-Interval, Multi-Range</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Conformity Engine</div>
          <div className="stat-value">OIML R76-1</div>
          <div className="stat-subtext">Table 6 & Clause A.4.4.3 Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Quick Navigation</div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <Link href="/instruments" className="btn-primary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
              Instruments
            </Link>
            <Link href="/reports" className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Studio Panel */}
      <div className="studio-panel" style={{ marginBottom: "28px" }}>
        <div className="panel-title">
          <span>Live OIML R76 Calculation Studio</span>
          <span className={`badge ${isConforming ? "badge-pass" : "badge-fail"}`}>
            <span className="badge-dot" />
            {isConforming ? "CONFORMING (PASS)" : "EXCEEDS MPE (FAIL)"}
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "-8px", marginBottom: "24px" }}>
          Simulate loads, verification intervals, and turning points to inspect Table 6 MPE steps and Clause A.4.4.3 rounding corrections in real-time.
        </p>

        <div className="studio-grid">
          {/* Left Column: Form Controls */}
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Accuracy Class</label>
                <select
                  className="form-select"
                  value={accuracyClass}
                  onChange={(e) => setAccuracyClass(e.target.value as any)}
                >
                  <option value="I">Class I (Special)</option>
                  <option value="II">Class II (High)</option>
                  <option value="III">Class III (Medium)</option>
                  <option value="IIII">Class IIII (Ordinary)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Device Architecture</label>
                <select
                  className="form-select"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as any)}
                >
                  <option value="single">Single-Interval</option>
                  <option value="multi_interval">Multi-Interval (e1, e2, e3)</option>
                  <option value="multi_range">Multi-Range</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Verification Type</label>
                <select
                  className="form-select"
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value as any)}
                >
                  <option value="initial">Initial Verification (1x MPE)</option>
                  <option value="service">In-Service (2x MPE)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Interval e (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={deviceType === "single" ? eVal : effectiveE}
                  disabled={deviceType !== "single"}
                  onChange={(e) => setEVal(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Applied Load L (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={load}
                  onChange={(e) => setLoad(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Indication I (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={indication}
                  step="0.1"
                  onChange={(e) => setIndication(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={useChangeover}
                    onChange={(e) => setUseChangeover(e.target.checked)}
                    style={{ marginRight: "8px" }}
                  />
                  Changeover ΔL Method
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={deltaL}
                  step="0.01"
                  disabled={!useChangeover}
                  onChange={(e) => setDeltaL(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Zero Error E0 (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={zeroError}
                  step="0.01"
                  onChange={(e) => setZeroError(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Live Results */}
          <div>
            <div className="preview-chip">
              <div className="preview-chip-header">
                <span>MAXIMUM PERMISSIBLE ERROR (TABLE 6)</span>
                <span className="badge badge-neutral">Load m = {m.toFixed(1)} e</span>
              </div>
              <div className="preview-chip-val" style={{ color: "var(--accent-yellow)" }}>
                ± {mpe.toFixed(4)} g ({mpeMultiplier} e)
              </div>
            </div>

            <div className="preview-chip">
              <div className="preview-chip-header">
                <span>TRUE INDICATION PRIOR TO ROUNDING (P)</span>
                <span>{useChangeover ? "P = I + 0.5e - ΔL" : "P = I"}</span>
              </div>
              <div className="preview-chip-val">{p.toFixed(4)} g</div>
            </div>

            <div className="preview-chip">
              <div className="preview-chip-header">
                <span>CORRECTED INDICATION ERROR (Ec)</span>
                <span>Ec = (P - L) - E0</span>
              </div>
              <div
                className="preview-chip-val"
                style={{ color: isConforming ? "var(--badge-pass-text)" : "var(--badge-fail-text)" }}
              >
                {correctedError >= 0 ? `+${correctedError.toFixed(4)}` : correctedError.toFixed(4)} g
              </div>
            </div>

            <div className="preview-chip">
              <div className="preview-chip-header">
                <span>CONFORMITY STATUS</span>
                <span>|Ec| ≤ |MPE|</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  {isConforming ? "Passes OIML R76 Limits" : "Fails OIML R76 Tolerances"}
                </span>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Margin: {(mpe - Math.abs(correctedError)).toFixed(4)} g
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Navigation Cards */}
      <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>Core Workflow Modules</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <article className="stat-card">
          <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Instrument Register</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "16px" }}>
            Register and manage Class I–IIII weighing instruments, configure intervals, and multi-range parameters.
          </p>
          <Link href="/instruments" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Open Register →
          </Link>
        </article>

        <article className="stat-card">
          <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Test Report Studio</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "16px" }}>
            Capture draft measurements for weighing, repeatability, and eccentricity with live calculation previews.
          </p>
          <Link href="/reports" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Open Reports →
          </Link>
        </article>

        <article className="stat-card">
          <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Technical Review</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "16px" }}>
            Review submitted records, inspect calculations, verify warnings, and finalize or return reports.
          </p>
          <Link href="/review" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Open Review →
          </Link>
        </article>

        <article className="stat-card">
          <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Configuration & Rules</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "16px" }}>
            Manage approved procedure configurations, Table 6 rule sets, and access control allowlists.
          </p>
          <Link href="/admin" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            Open Admin →
          </Link>
        </article>
      </div>
    </div>
  );
}
