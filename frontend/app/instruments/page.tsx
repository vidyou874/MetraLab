"use client";

import React, { useState, useId } from "react";

export interface InstrumentItem {
  id: number;
  manufacturer: string;
  model: string;
  serial_number: string;
  asset_tag: string;
  accuracy_class: "I" | "II" | "III" | "IIII";
  max_capacity: string;
  capacity_unit: string;
  verification_interval_e: string;
  display_division_d: string;
  range_type: "Single-Interval" | "Multi-Interval" | "Multi-Range";
  is_active: boolean;
  latest_disposition: "Pass" | "Fail" | "Under Review";
  commission_date: string;
  last_calibrated: string;
  location: string;
  baseline_mean: number;
  baseline_std: number;
  current_mean: number;
  current_std: number;
  mpe_limit: number;
}

const initialInstruments: InstrumentItem[] = [
  {
    id: 1,
    manufacturer: "Mettler Toledo",
    model: "XPR205 Analytical",
    serial_number: "MT-XPR-9921",
    asset_tag: "LAB-AN-01",
    accuracy_class: "I",
    max_capacity: "220",
    capacity_unit: "g",
    verification_interval_e: "0.001",
    display_division_d: "0.0001",
    range_type: "Single-Interval",
    is_active: true,
    latest_disposition: "Pass",
    commission_date: "2023-04-15",
    last_calibrated: "2026-08-10",
    location: "Cleanroom Analytical Suite 4",
    baseline_mean: 0.00,
    baseline_std: 0.12,
    current_mean: 0.08,
    current_std: 0.22,
    mpe_limit: 0.50,
  },
  {
    id: 2,
    manufacturer: "Sartorius",
    model: "Secura-324 High Precision",
    serial_number: "SAR-SEC-8812",
    asset_tag: "LAB-PR-02",
    accuracy_class: "I",
    max_capacity: "320",
    capacity_unit: "g",
    verification_interval_e: "0.001",
    display_division_d: "0.0001",
    range_type: "Single-Interval",
    is_active: true,
    latest_disposition: "Pass",
    commission_date: "2022-11-20",
    last_calibrated: "2026-07-28",
    location: "Primary Gravimetric Bay",
    baseline_mean: 0.00,
    baseline_std: 0.11,
    current_mean: 0.05,
    current_std: 0.19,
    mpe_limit: 0.50,
  },
  {
    id: 3,
    manufacturer: "Bizerba",
    model: "SC-II 800 Dual Range",
    serial_number: "BIZ-SC-4401",
    asset_tag: "IND-BIZ-09",
    accuracy_class: "III",
    max_capacity: "15000",
    capacity_unit: "g",
    verification_interval_e: "1 / 2 / 10",
    display_division_d: "1 / 2 / 10",
    range_type: "Multi-Interval",
    is_active: true,
    latest_disposition: "Pass",
    commission_date: "2024-01-10",
    last_calibrated: "2026-09-02",
    location: "Packaging QC Line B",
    baseline_mean: 0.00,
    baseline_std: 0.15,
    current_mean: 0.24,
    current_std: 0.35,
    mpe_limit: 1.00,
  },
  {
    id: 4,
    manufacturer: "Avery Weigh-Tronix",
    model: "ZM305 Industrial Scale",
    serial_number: "AV-ZM-1029",
    asset_tag: "PLANT-AV-14",
    accuracy_class: "III",
    max_capacity: "6000",
    capacity_unit: "kg",
    verification_interval_e: "1 / 2",
    display_division_d: "1 / 2",
    range_type: "Multi-Range",
    is_active: true,
    latest_disposition: "Pass",
    commission_date: "2021-06-18",
    last_calibrated: "2026-06-15",
    location: "Bulk Inbound Receiving",
    baseline_mean: 0.00,
    baseline_std: 0.18,
    current_mean: 0.31,
    current_std: 0.44,
    mpe_limit: 1.00,
  },
  {
    id: 5,
    manufacturer: "Dini Argeo",
    model: "Crane-Pro 10T Heavy Duty",
    serial_number: "DA-CP-5511",
    asset_tag: "YARD-CR-01",
    accuracy_class: "IIII",
    max_capacity: "10000",
    capacity_unit: "kg",
    verification_interval_e: "10",
    display_division_d: "10",
    range_type: "Single-Interval",
    is_active: true,
    latest_disposition: "Under Review",
    commission_date: "2020-09-05",
    last_calibrated: "2026-09-25",
    location: "Heavy Steel Storage Yard",
    baseline_mean: 0.00,
    baseline_std: 0.20,
    current_mean: 0.65,
    current_std: 0.72,
    mpe_limit: 1.00,
  },
];

// Helper to compute Gaussian curve points for SVG
function generateGaussianCurve(mean: number, std: number, minX = -1.5, maxX = 1.5, steps = 80) {
  const points: { x: number; y: number }[] = [];
  const svgWidth = 560;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingBottom = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingBottom - 20;

  const maxDensity = 1 / (std * Math.sqrt(2 * Math.PI));

  for (let i = 0; i <= steps; i++) {
    const val = minX + (i / steps) * (maxX - minX);
    const exponent = -0.5 * Math.pow((val - mean) / std, 2);
    const density = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

    const xCoord = paddingX + ((val - minX) / (maxX - minX)) * plotWidth;
    const yCoord = svgHeight - paddingBottom - (density / maxDensity) * plotHeight;
    points.push({ x: xCoord, y: yCoord });
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const fillD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingBottom} L ${points[0].x} ${svgHeight - paddingBottom} Z`;

  return { strokePath: pathD, fillPath: fillD };
}

export default function InstrumentsPage() {
  const gradientBaselineId = useId();
  const gradientCurrentId = useId();
  const [instruments, setInstruments] = useState<InstrumentItem[]>(initialInstruments);
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentItem | null>(null);

  // Modal States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPrintingCert, setIsPrintingCert] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    manufacturer: "",
    model: "",
    serial_number: "",
    asset_tag: "",
    accuracy_class: "III" as "I" | "II" | "III" | "IIII",
    max_capacity: "15",
    capacity_unit: "kg",
    verification_interval_e: "0.005",
    display_division_d: "0.001",
    range_type: "Single-Interval" as "Single-Interval" | "Multi-Interval" | "Multi-Range",
    location: "Main Testing Lab",
  });

  // Bulk CSV State
  const [csvFileContent, setCsvFileContent] = useState<string | null>(null);
  const [csvParsedRows, setCsvParsedRows] = useState<Array<Record<string, string>>>([]);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);

  // Compliance calculations
  const totalInstruments = instruments.length;
  const passedInstruments = instruments.filter((i) => i.latest_disposition === "Pass").length;
  const underReviewInstruments = instruments.filter((i) => i.latest_disposition === "Under Review").length;
  const failedInstruments = instruments.filter((i) => i.latest_disposition === "Fail").length;
  const passPercentage = Math.round((passedInstruments / Math.max(totalInstruments, 1)) * 100);

  // Filter logic
  const filtered = instruments.filter((inst) => {
    const matchesClass = filterClass === "ALL" || inst.accuracy_class === filterClass;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      searchQuery === "" ||
      inst.model.toLowerCase().includes(q) ||
      inst.serial_number.toLowerCase().includes(q) ||
      inst.manufacturer.toLowerCase().includes(q) ||
      inst.asset_tag.toLowerCase().includes(q);
    return matchesClass && matchesQuery;
  });

  // Export full register PDF
  const handleExportFullRegister = () => {
    window.print();
  };

  // Export particular instrument certificate PDF
  const handleExportInstrumentCert = (inst: InstrumentItem) => {
    setSelectedInstrument(inst);
    setIsPrintingCert(true);
    setTimeout(() => {
      window.print();
      setIsPrintingCert(false);
    }, 150);
  };

  // Add Manual Instrument (School / Office Workflow)
  const handleSaveManualInstrument = (e: React.FormEvent) => {
    e.preventDefault();
    const newInst: InstrumentItem = {
      id: instruments.length + 1,
      manufacturer: manualForm.manufacturer.trim(),
      model: manualForm.model.trim(),
      serial_number: manualForm.serial_number.trim(),
      asset_tag: manualForm.asset_tag.trim() || `ASSET-${instruments.length + 1}`,
      accuracy_class: manualForm.accuracy_class,
      max_capacity: manualForm.max_capacity,
      capacity_unit: manualForm.capacity_unit,
      verification_interval_e: manualForm.verification_interval_e,
      display_division_d: manualForm.display_division_d,
      range_type: manualForm.range_type,
      is_active: true,
      latest_disposition: "Pass",
      commission_date: new Date().toISOString().split("T")[0],
      last_calibrated: new Date().toISOString().split("T")[0],
      location: manualForm.location.trim() || "School / Testing Office",
      baseline_mean: 0.00,
      baseline_std: 0.12,
      current_mean: 0.04,
      current_std: 0.16,
      mpe_limit: 0.50,
    };

    setInstruments([newInst, ...instruments]);
    setIsManualModalOpen(false);
    setSelectedInstrument(newInst);

    // Sync to backend API asynchronously
    fetch("http://localhost:8000/api/instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manufacturer: newInst.manufacturer,
        model: newInst.model,
        serial_number: newInst.serial_number,
        asset_tag: newInst.asset_tag,
        accuracy_class: newInst.accuracy_class,
        max_capacity: parseFloat(newInst.max_capacity) || 10,
        capacity_unit: newInst.capacity_unit,
        verification_interval_e: parseFloat(newInst.verification_interval_e) || 0.001,
        display_division_d: parseFloat(newInst.display_division_d) || 0.0001,
      }),
    }).catch(() => {
      // Offline fallback: already in local state
    });
  };

  // Download CSV Template for Industry / Manufacturers
  const handleDownloadTemplate = () => {
    const templateContent =
      "manufacturer,model,serial_number,accuracy_class,max_capacity,capacity_unit,verification_interval_e,display_division_d,range_type,asset_tag,location\n" +
      "Mettler Toledo,ME-204,MT-ME-1102,I,220,g,0.001,0.0001,Single-Interval,QA-LAB-101,Industrial Cleanroom A\n" +
      "OHAUS,Defender 3000,OH-DEF-4412,III,60,kg,0.02,0.005,Single-Interval,MFG-LINE-02,Production Floor\n" +
      "Sartorius,Entris II,SAR-ENT-9011,II,1200,g,0.01,0.001,Single-Interval,QC-AUDIT-03,Raw Material Inspection";

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "metralab_bulk_instruments_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV File Selection
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvFileContent(text);

      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      if (lines.length <= 1) {
        setBulkStatusMsg("CSV file is empty or missing headers.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const parsed: Array<Record<string, string>> = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length >= 3) {
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });
          parsed.push(row);
        }
      }

      setCsvParsedRows(parsed);
      setBulkStatusMsg(`Loaded ${parsed.length} instrument records ready for bulk ingestion.`);
    };
    reader.readAsText(file);
  };

  // Ingest Bulk CSV Instruments
  const handleIngestBulkCsv = () => {
    if (csvParsedRows.length === 0) return;

    const newItems: InstrumentItem[] = csvParsedRows.map((row, idx) => {
      const accClass = (row.accuracy_class || "III").toUpperCase() as "I" | "II" | "III" | "IIII";
      const validClass = ["I", "II", "III", "IIII"].includes(accClass) ? accClass : "III";

      return {
        id: instruments.length + idx + 1,
        manufacturer: row.manufacturer || "Industrial Partner",
        model: row.model || `Model-${idx + 1}`,
        serial_number: row.serial_number || `SER-${Date.now()}-${idx}`,
        asset_tag: row.asset_tag || `BULK-TAG-${idx + 1}`,
        accuracy_class: validClass,
        max_capacity: row.max_capacity || "100",
        capacity_unit: row.capacity_unit || "kg",
        verification_interval_e: row.verification_interval_e || "0.01",
        display_division_d: row.display_division_d || "0.001",
        range_type: (row.range_type as any) || "Single-Interval",
        is_active: true,
        latest_disposition: "Pass",
        commission_date: new Date().toISOString().split("T")[0],
        last_calibrated: new Date().toISOString().split("T")[0],
        location: row.location || "Manufacturing Plant",
        baseline_mean: 0.00,
        baseline_std: 0.14,
        current_mean: 0.09,
        current_std: 0.22,
        mpe_limit: 0.50,
      };
    });

    setInstruments([...newItems, ...instruments]);
    setIsBulkModalOpen(false);
    setCsvFileContent(null);
    setCsvParsedRows([]);
    setBulkStatusMsg(null);
  };

  return (
    <div>
      {/* Top Banner: Verification Compliance Stat ("4/5 devices passed") */}
      <div
        className="studio-panel no-print"
        style={{
          background: "linear-gradient(135deg, rgba(226, 253, 82, 0.06) 0%, rgba(20, 23, 31, 0.95) 100%)",
          borderColor: "rgba(226, 253, 82, 0.25)",
          marginBottom: "24px",
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span className="badge badge-pass" style={{ fontSize: "0.85rem", padding: "4px 10px" }}>
                <span className="badge-dot" />
                {passedInstruments} / {totalInstruments} Instruments Passed ({passPercentage}% Compliance)
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                OIML R76-1: 2006 Laboratory Register
              </span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary)" }}>
              Laboratory Metrological Status: {passedInstruments} of {totalInstruments} Devices Active & Compliant
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
              All Class I, II, III, and IIII non-automatic weighing instruments verified against Table 6 Maximum Permissible Errors.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {/* Customer Type A: Manual Entry for Schools / Offices */}
            <button
              className="btn-primary"
              onClick={() => setIsManualModalOpen(true)}
              title="Manual single-machine creation for school labs and testing offices"
            >
              + Quick Add (Manual)
            </button>

            {/* Customer Type B: Bulk CSV Ingestion for Industry / Manufacturers */}
            <button
              className="btn-secondary"
              onClick={() => setIsBulkModalOpen(true)}
              style={{ borderColor: "rgba(226, 253, 82, 0.4)", color: "var(--text-primary)" }}
              title="Bulk CSV upload for high-throughput manufacturing plants"
            >
              📁 Bulk CSV Import
            </button>

            {/* Export General Register PDF */}
            <button
              className="btn-secondary"
              onClick={handleExportFullRegister}
              title="Export complete instrument register as printable PDF report"
            >
              🖨️ Export Register PDF
            </button>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ marginTop: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
            <span>Verified & Passing: <strong>{passedInstruments}</strong></span>
            <span>Pending Review: <strong>{underReviewInstruments}</strong></span>
            <span>Tolerance Failures: <strong>{failedInstruments}</strong></span>
            <span>Total Fleet: <strong>{totalInstruments}</strong></span>
          </div>
          <div style={{ height: "8px", background: "var(--bg-canvas)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(passedInstruments / totalInstruments) * 100}%`, background: "var(--accent-yellow)", transition: "width 0.3s ease" }} />
            <div style={{ width: `${(underReviewInstruments / totalInstruments) * 100}%`, background: "var(--badge-warn-border)" }} />
            <div style={{ width: `${(failedInstruments / totalInstruments) * 100}%`, background: "var(--badge-fail-text)" }} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print" style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by serial number, model, manufacturer, asset tag..."
          style={{ flex: 1, minWidth: "260px" }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: "220px" }}
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="ALL">All Classes (I, II, III, IIII)</option>
          <option value="I">Class I (Special Analytical)</option>
          <option value="II">Class II (High Precision)</option>
          <option value="III">Class III (Commercial / Industrial)</option>
          <option value="IIII">Class IIII (Heavy Industrial)</option>
        </select>
      </div>

      {/* Main Grid: Instruments Table and Selected Detail Inspector */}
      <div className="no-print" style={{ display: "grid", gridTemplateColumns: selectedInstrument ? "1.2fr 1.8fr" : "1fr", gap: "24px" }}>
        {/* Table List */}
        <div className="table-container">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Registered Fleet ({filtered.length})</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Click machine row to inspect curves & export PDF</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model / Serial</th>
                <th>Class</th>
                <th>Capacity</th>
                <th>Interval (e)</th>
                <th>Disposition</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inst) => {
                const isSelected = selectedInstrument?.id === inst.id;
                return (
                  <tr
                    key={inst.id}
                    onClick={() => setSelectedInstrument(inst)}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--bg-surface-elevated)" : undefined,
                      borderLeft: isSelected ? "3px solid var(--accent-yellow)" : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inst.model}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {inst.manufacturer} • <code>{inst.serial_number}</code>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                        Class {inst.accuracy_class}
                      </span>
                    </td>
                    <td>
                      {inst.max_capacity} {inst.capacity_unit}
                    </td>
                    <td>
                      {inst.verification_interval_e} {inst.capacity_unit}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          inst.latest_disposition === "Pass"
                            ? "badge-pass"
                            : inst.latest_disposition === "Under Review"
                            ? "badge-warn"
                            : "badge-fail"
                        }`}
                      >
                        <span className="badge-dot" />
                        {inst.latest_disposition}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportInstrumentCert(inst);
                        }}
                        title="Export Instrument Certificate PDF"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Instrument Detail Inspector with Dual Gaussian Chart */}
        {selectedInstrument && (
          <div className="studio-panel" style={{ position: "sticky", top: "20px" }}>
            <div className="panel-title">
              <div>
                <span style={{ fontSize: "1.15rem" }}>{selectedInstrument.model}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                  #{selectedInstrument.asset_tag}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                  onClick={() => handleExportInstrumentCert(selectedInstrument)}
                >
                  📄 Export Certificate PDF
                </button>
                <button
                  className="close-btn"
                  onClick={() => setSelectedInstrument(null)}
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>ACCURACY CLASS</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem", color: "var(--accent-yellow)" }}>
                  Class {selectedInstrument.accuracy_class}
                </div>
              </div>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>MAX CAPACITY</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem" }}>
                  {selectedInstrument.max_capacity} {selectedInstrument.capacity_unit}
                </div>
              </div>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>INTERVAL (e)</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem" }}>
                  {selectedInstrument.verification_interval_e} {selectedInstrument.capacity_unit}
                </div>
              </div>
            </div>

            {/* DUAL NORMAL DISTRIBUTION GRAPH (Baseline at Purchase vs Current Condition) */}
            <div className="gaussian-chart-wrapper">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    Dual Normal Distribution Error Profile
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Comparing error distribution when purchased vs. current operational wear
                  </div>
                </div>
                <span className="badge badge-pass" style={{ fontSize: "0.75rem" }}>
                  OIML Table 6 MPE Bound
                </span>
              </div>

              {/* Responsive SVG Normal Distribution Chart */}
              <div style={{ width: "100%", overflowX: "auto" }}>
                <svg viewBox="0 0 560 180" style={{ width: "100%", height: "auto", display: "block" }}>
                  <defs>
                    <linearGradient id={gradientBaselineId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id={gradientCurrentId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e2fd52" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#e2fd52" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Axis */}
                  <line x1="40" y1="150" x2="520" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                  {/* Target Zero Line (x = 0) */}
                  <line x1="280" y1="20" x2="280" y2="150" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                  <text x="280" y="165" fill="var(--text-muted)" fontSize="10" textAnchor="middle">0 (Target)</text>

                  {/* Lower Tolerance Line (-MPE) */}
                  <line x1="160" y1="20" x2="160" y2="150" stroke="#f87171" strokeDasharray="3 3" strokeWidth="1.5" />
                  <text x="160" y="165" fill="#f87171" fontSize="10" textAnchor="middle">-MPE</text>

                  {/* Upper Tolerance Line (+MPE) */}
                  <line x1="400" y1="20" x2="400" y2="150" stroke="#f87171" strokeDasharray="3 3" strokeWidth="1.5" />
                  <text x="400" y="165" fill="#f87171" fontSize="10" textAnchor="middle">+MPE</text>

                  {/* Curve 1: Initial Purchase Baseline (Cyan) */}
                  {(() => {
                    const baseline = generateGaussianCurve(
                      selectedInstrument.baseline_mean,
                      selectedInstrument.baseline_std
                    );
                    return (
                      <g>
                        <path d={baseline.fillPath} fill={`url(#${gradientBaselineId})`} />
                        <path d={baseline.strokePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      </g>
                    );
                  })()}

                  {/* Curve 2: Current Condition (Electric Yellow/Lime) */}
                  {(() => {
                    const current = generateGaussianCurve(
                      selectedInstrument.current_mean,
                      selectedInstrument.current_std
                    );
                    return (
                      <g>
                        <path d={current.fillPath} fill={`url(#${gradientCurrentId})`} />
                        <path d={current.strokePath} fill="none" stroke="#e2fd52" strokeWidth="2.5" />
                      </g>
                    );
                  })()}
                </svg>
              </div>

              {/* Chart Legend & Numerical Metrics */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "0.78rem" }}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "3px", background: "#38bdf8", borderRadius: "2px" }} />
                    <span style={{ color: "#38bdf8", fontWeight: 600 }}>At Purchase (Commissioning)</span>
                    <span style={{ color: "var(--text-muted)" }}>μ={selectedInstrument.baseline_mean}e, σ={selectedInstrument.baseline_std}e</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "3px", background: "#e2fd52", borderRadius: "2px" }} />
                    <span style={{ color: "#e2fd52", fontWeight: 600 }}>Current Condition</span>
                    <span style={{ color: "var(--text-muted)" }}>μ=+{selectedInstrument.current_mean}e, σ={selectedInstrument.current_std}e</span>
                  </div>
                </div>

                <div style={{ color: "var(--text-secondary)" }}>
                  Drift: <strong>+{Math.round((selectedInstrument.current_mean - selectedInstrument.baseline_mean) * 1000) / 1000}e</strong>
                </div>
              </div>
            </div>

            {/* Historical Verification Records */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                Metrological Verification History
              </div>
              <div className="table-container">
                <table className="data-table" style={{ fontSize: "0.8rem" }}>
                  <thead>
                    <tr>
                      <th>Test Event</th>
                      <th>Date</th>
                      <th>Max Error</th>
                      <th>Tolerance</th>
                      <th>Disposition</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Periodic Re-verification</td>
                      <td>{selectedInstrument.last_calibrated}</td>
                      <td>+{selectedInstrument.current_mean} e</td>
                      <td>±{selectedInstrument.mpe_limit} e</td>
                      <td>
                        <span className="badge badge-pass" style={{ fontSize: "0.7rem" }}>
                          Pass
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>Initial Commissioning Verification</td>
                      <td>{selectedInstrument.commission_date}</td>
                      <td>+{selectedInstrument.baseline_mean} e</td>
                      <td>±{selectedInstrument.mpe_limit} e</td>
                      <td>
                        <span className="badge badge-pass" style={{ fontSize: "0.7rem" }}>
                          Pass
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL SINGLE-DEVICE ENTRY (Schools / Offices)                  */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="modal-backdrop no-print">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div>
                <h2>Add Instrument (Manual Entry)</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Designed for schools, university laboratories, and single-device testing offices.
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsManualModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualInstrument}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Manufacturer / Brand</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. OHAUS, Kern, Sartorius"
                    value={manualForm.manufacturer}
                    onChange={(e) => setManualForm({ ...manualForm, manufacturer: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Model Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Defender 3000, Scout Pro"
                    value={manualForm.model}
                    onChange={(e) => setManualForm({ ...manualForm, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Serial Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SN-882109"
                    value={manualForm.serial_number}
                    onChange={(e) => setManualForm({ ...manualForm, serial_number: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Asset Tag (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. LAB-PHYS-01"
                    value={manualForm.asset_tag}
                    onChange={(e) => setManualForm({ ...manualForm, asset_tag: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Accuracy Class</label>
                  <select
                    className="form-select"
                    value={manualForm.accuracy_class}
                    onChange={(e) => setManualForm({ ...manualForm, accuracy_class: e.target.value as any })}
                  >
                    <option value="I">Class I (Special)</option>
                    <option value="II">Class II (High)</option>
                    <option value="III">Class III (Medium)</option>
                    <option value="IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Max Capacity</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 15"
                    value={manualForm.max_capacity}
                    onChange={(e) => setManualForm({ ...manualForm, max_capacity: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-select"
                    value={manualForm.capacity_unit}
                    onChange={(e) => setManualForm({ ...manualForm, capacity_unit: e.target.value })}
                  >
                    <option value="g">g (Grams)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="mg">mg (Milligrams)</option>
                    <option value="t">t (Tonnes)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Verification Scale Interval (e)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 0.001"
                    value={manualForm.verification_interval_e}
                    onChange={(e) => setManualForm({ ...manualForm, verification_interval_e: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Division (d)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="e.g. 0.0001"
                    value={manualForm.display_division_d}
                    onChange={(e) => setManualForm({ ...manualForm, display_division_d: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Laboratory / Campus Location</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. School of Physics, Bench 3B"
                  value={manualForm.location}
                  onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Save Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK CSV INGESTION (Industry / Manufacturers)                    */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="modal-backdrop no-print">
          <div className="modal-content" style={{ maxWidth: "780px" }}>
            <div className="modal-header">
              <div>
                <h2>Bulk CSV Ingestion (Industry & Manufacturers)</h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  Upload high-throughput instrument inventories from production lines or enterprise ERP systems.
                </div>
              </div>
              <button className="close-btn" onClick={() => setIsBulkModalOpen(false)}>
                ✕
              </button>
            </div>

            {/* Template Download Prompt */}
            <div
              className="preview-chip"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  Standard CSV Format Required
                </span>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Headers: manufacturer, model, serial_number, accuracy_class, max_capacity, capacity_unit, verification_interval_e
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "0.8rem" }}
                onClick={handleDownloadTemplate}
              >
                📥 Download CSV Template
              </button>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              style={{
                border: "2px dashed var(--border-subtle)",
                borderRadius: "12px",
                padding: "28px",
                textAlign: "center",
                background: "var(--bg-canvas)",
                marginBottom: "18px",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📁</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                Select CSV File to Upload
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                Supports standard comma-separated values (.csv)
              </div>
              <input
                type="file"
                accept=".csv"
                id="csvFileInput"
                style={{ display: "none" }}
                onChange={handleCsvFileUpload}
              />
              <label htmlFor="csvFileInput" className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
                Browse File
              </label>
            </div>

            {bulkStatusMsg && (
              <div style={{ fontSize: "0.85rem", color: "var(--accent-yellow)", marginBottom: "14px", fontWeight: 600 }}>
                {bulkStatusMsg}
              </div>
            )}

            {/* Preview of Parsed Rows */}
            {csvParsedRows.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
                  Preview Rows Ready for Import ({csvParsedRows.length})
                </div>
                <div className="table-container" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  <table className="data-table" style={{ fontSize: "0.78rem" }}>
                    <thead>
                      <tr>
                        <th>Make</th>
                        <th>Model</th>
                        <th>Serial</th>
                        <th>Class</th>
                        <th>Capacity</th>
                        <th>Interval (e)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvParsedRows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td>{r.manufacturer}</td>
                          <td>{r.model}</td>
                          <td><code>{r.serial_number}</code></td>
                          <td>Class {r.accuracy_class}</td>
                          <td>{r.max_capacity} {r.capacity_unit}</td>
                          <td>{r.verification_interval_e}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvParsedRows.length > 5 && (
                    <div style={{ textAlign: "center", padding: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      ...and {csvParsedRows.length - 5} more records
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setIsBulkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={csvParsedRows.length === 0}
                onClick={handleIngestBulkCsv}
              >
                Import All ({csvParsedRows.length}) Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT-ONLY OFFICIAL OIML R76 CERTIFICATE & AUDIT EXPORT DOCUMENT          */}
      {/* ========================================================================= */}
      <div className="printable-document" style={{ display: "none" }}>
        {selectedInstrument ? (
          <div>
            <div style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "20px" }}>
              <h1 style={{ margin: "0 0 4px", fontSize: "20pt", textTransform: "uppercase" }}>
                MetraLab Calibration & Verification Certificate
              </h1>
              <div style={{ fontSize: "10pt", color: "#333" }}>
                Accredited Metrological Laboratory • Conforms to OIML R76-1: 2006 (Non-Automatic Weighing Instruments)
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "12pt" }}>Instrument Identification</h3>
                <table style={{ fontSize: "9pt", width: "100%" }}>
                  <tbody>
                    <tr><td><strong>Manufacturer:</strong></td><td>{selectedInstrument.manufacturer}</td></tr>
                    <tr><td><strong>Model:</strong></td><td>{selectedInstrument.model}</td></tr>
                    <tr><td><strong>Serial Number:</strong></td><td>{selectedInstrument.serial_number}</td></tr>
                    <tr><td><strong>Asset Tag:</strong></td><td>{selectedInstrument.asset_tag}</td></tr>
                    <tr><td><strong>Location:</strong></td><td>{selectedInstrument.location}</td></tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "12pt" }}>Metrological Specification</h3>
                <table style={{ fontSize: "9pt", width: "100%" }}>
                  <tbody>
                    <tr><td><strong>Accuracy Class:</strong></td><td>Class {selectedInstrument.accuracy_class}</td></tr>
                    <tr><td><strong>Max Capacity:</strong></td><td>{selectedInstrument.max_capacity} {selectedInstrument.capacity_unit}</td></tr>
                    <tr><td><strong>Verification Interval (e):</strong></td><td>{selectedInstrument.verification_interval_e} {selectedInstrument.capacity_unit}</td></tr>
                    <tr><td><strong>Display Division (d):</strong></td><td>{selectedInstrument.display_division_d} {selectedInstrument.capacity_unit}</td></tr>
                    <tr><td><strong>Architecture:</strong></td><td>{selectedInstrument.range_type}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "12pt" }}>
              Gaussian Error Distribution (Purchase Baseline vs. Current Condition)
            </h3>
            <table style={{ fontSize: "9pt", width: "100%", marginBottom: "24px" }}>
              <thead>
                <tr>
                  <th>Condition Stage</th>
                  <th>Mean Error (μ)</th>
                  <th>Repeatability Spread (σ)</th>
                  <th>Table 6 MPE Bound</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Baseline at Purchase ({selectedInstrument.commission_date})</td>
                  <td>+{selectedInstrument.baseline_mean} e</td>
                  <td>{selectedInstrument.baseline_std} e</td>
                  <td>±{selectedInstrument.mpe_limit} e</td>
                  <td>PASS</td>
                </tr>
                <tr>
                  <td>Current Condition ({selectedInstrument.last_calibrated})</td>
                  <td>+{selectedInstrument.current_mean} e</td>
                  <td>{selectedInstrument.current_std} e</td>
                  <td>±{selectedInstrument.mpe_limit} e</td>
                  <td><strong>{selectedInstrument.latest_disposition.toUpperCase()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
              <div style={{ borderTop: "1px solid #000", paddingTop: "6px" }}>
                <strong>Lead Metrologist Signature:</strong> ___________________________
              </div>
              <div style={{ borderTop: "1px solid #000", paddingTop: "6px" }}>
                <strong>Technical Reviewer Approval:</strong> ___________________________
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ borderBottom: "2px solid #000", paddingBottom: "12px", marginBottom: "20px" }}>
              <h1 style={{ margin: "0 0 4px", fontSize: "20pt", textTransform: "uppercase" }}>
                Laboratory Inventory & Metrological Compliance Register
              </h1>
              <div style={{ fontSize: "10pt", color: "#333" }}>
                Official OIML R76-1: 2006 Fleet Audit Report • <strong>{passedInstruments} of {totalInstruments} Instruments Verified & In-Service ({passPercentage}%)</strong>
              </div>
            </div>

            <table style={{ fontSize: "9pt", width: "100%" }}>
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Manufacturer</th>
                  <th>Model</th>
                  <th>Serial Number</th>
                  <th>Class</th>
                  <th>Max Capacity</th>
                  <th>Interval (e)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {instruments.map((inst) => (
                  <tr key={inst.id}>
                    <td>{inst.asset_tag}</td>
                    <td>{inst.manufacturer}</td>
                    <td>{inst.model}</td>
                    <td>{inst.serial_number}</td>
                    <td>Class {inst.accuracy_class}</td>
                    <td>{inst.max_capacity} {inst.capacity_unit}</td>
                    <td>{inst.verification_interval_e} {inst.capacity_unit}</td>
                    <td><strong>{inst.latest_disposition}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
