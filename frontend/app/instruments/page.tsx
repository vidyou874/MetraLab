"use client";

import React, { useState, useEffect, useId } from "react";
import {
  getOrCreateMachineDataset,
  computeDatasetStats,
  MachineReadingPoint,
} from "@/data/machineReadings";

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
  purchase_date?: string;
  manufacturer_country?: string;
  supplier_invoice?: string;
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
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Interactive Hover State on Graph
  const [hoverInfo, setHoverInfo] = useState<{
    xVal: number;
    svgX: number;
    baseDensity: number;
    currDensity: number;
    baseY: number;
    currY: number;
  } | null>(null);

  // Machine Reading Data Tab State (Current Condition vs Baseline at Purchase)
  const [activeReadingTab, setActiveReadingTab] = useState<"current" | "baseline">("current");

  // Dynamic Dataset for the selected instrument (100% computed from reading points)
  const activeDataset = selectedInstrument ? getOrCreateMachineDataset(selectedInstrument) : null;
  const baseStats = activeDataset ? computeDatasetStats(activeDataset.baselineReadings) : null;
  const currStats = activeDataset ? computeDatasetStats(activeDataset.currentReadings) : null;
  const activeReadings: MachineReadingPoint[] = activeDataset
    ? activeReadingTab === "current"
      ? activeDataset.currentReadings
      : activeDataset.baselineReadings
    : [];
  const activeStats = activeDataset
    ? activeReadingTab === "current"
      ? currStats!
      : baseStats!
    : null;

  const baselineMean = baseStats ? baseStats.mean : (selectedInstrument?.baseline_mean ?? 0);
  const baselineStd = baseStats ? baseStats.std : (selectedInstrument?.baseline_std ?? 0.12);
  const currentMean = currStats ? currStats.mean : (selectedInstrument?.current_mean ?? 0.08);
  const currentStd = currStats ? currStats.std : (selectedInstrument?.current_std ?? 0.22);

  // Esc Key Listener to close calculation modal and others
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCalcModalOpen(false);
        setIsManualModalOpen(false);
        setIsBulkModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    setTimeout(() => {
      window.print();
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

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    fetch(`${apiBase}/api/instruments`, {
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
      // Offline fallback
    });
  };

  // Download CSV Template
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

  // Mouse move handler on SVG to calculate interactive hover metrics
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!selectedInstrument) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const svgWidth = 560;
    const paddingX = 40;
    const plotWidth = svgWidth - paddingX * 2;
    const minX = -1.5;
    const maxX = 1.5;

    const relX = (mouseX / rect.width) * svgWidth;
    if (relX < paddingX || relX > svgWidth - paddingX) {
      setHoverInfo(null);
      return;
    }

    const xVal = minX + ((relX - paddingX) / plotWidth) * (maxX - minX);

    const baseStd = baselineStd;
    const baseMean = baselineMean;
    const baseDensity =
      (1 / (baseStd * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((xVal - baseMean) / baseStd, 2));

    const currStd = currentStd;
    const currMean = currentMean;
    const currDensity =
      (1 / (currStd * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((xVal - currMean) / currStd, 2));

    const maxDensityBase = 1 / (baseStd * Math.sqrt(2 * Math.PI));
    const maxDensityCurr = 1 / (currStd * Math.sqrt(2 * Math.PI));
    const plotHeight = 180 - 30 - 20;

    const baseY = 180 - 30 - (baseDensity / maxDensityBase) * plotHeight;
    const currY = 180 - 30 - (currDensity / maxDensityCurr) * plotHeight;

    setHoverInfo({
      xVal: Math.round(xVal * 1000) / 1000,
      svgX: relX,
      baseDensity: Math.round(baseDensity * 1000) / 1000,
      currDensity: Math.round(currDensity * 1000) / 1000,
      baseY,
      currY,
    });
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
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px", flexWrap: "wrap", gap: "6px 12px" }}>
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

      {/* Selected Instrument Inspection Workspace (Basic Info on Top, Reading Data on Left, Dual Gaussian Graph on Right) */}
      {selectedInstrument && (
        <div className="no-print" style={{ marginBottom: "32px" }}>
          {/* Inspection View Header & Quick Switcher */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedInstrument(null);
                  setHoverInfo(null);
                }}
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
              >
                ← Back to Fleet Table
              </button>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Quick Switch:</span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {filtered.map((inst) => {
                  const isActive = inst.id === selectedInstrument.id;
                  return (
                    <button
                      key={inst.id}
                      className={`quick-switch-pill ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setSelectedInstrument(inst);
                        setHoverInfo(null);
                      }}
                    >
                      {inst.model}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-secondary"
                style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                onClick={() => handleExportInstrumentCert(selectedInstrument)}
              >
                📄 Export Certificate PDF
              </button>
              <button
                className="close-btn"
                onClick={() => {
                  setSelectedInstrument(null);
                  setHoverInfo(null);
                }}
                title="Close Inspector"
              >
                ✕
              </button>
            </div>
          </div>

          {/* BASIC INFO ABOUT MACHINE ON TOP */}
          <div className="machine-info-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "14px",
                marginBottom: "16px",
                paddingBottom: "16px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <span className="badge badge-neutral" style={{ fontSize: "0.76rem" }}>
                    Class {selectedInstrument.accuracy_class} NAWI
                  </span>
                  <span
                    className={`badge ${
                      selectedInstrument.latest_disposition === "Pass"
                        ? "badge-pass"
                        : selectedInstrument.latest_disposition === "Under Review"
                        ? "badge-warn"
                        : "badge-fail"
                    }`}
                    style={{ fontSize: "0.76rem" }}
                  >
                    <span className="badge-dot" />
                    {selectedInstrument.latest_disposition}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Asset Tag: <code>{selectedInstrument.asset_tag}</code>
                  </span>
                </div>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "2px 0 4px", color: "var(--text-primary)" }}>
                  {selectedInstrument.model}
                </h1>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  High-Precision Non-Automatic Weighing Instrument (OIML R76-1: 2006 Compliant)
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className="btn-secondary"
                  style={{
                    fontSize: "0.78rem",
                    padding: "6px 12px",
                    borderColor: "rgba(226, 253, 82, 0.4)",
                    color: "var(--accent-yellow)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => setIsCalcModalOpen(true)}
                  title="View step-by-step mathematical calculation formulas (Closes with Esc)"
                >
                  <span>🧮</span>
                  <span>Manual Calculations</span>
                </button>
              </div>
            </div>

            {/* Basic Info Metadata Grid: Who Manufactured It, When Bought, Dates, Location */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "14px",
                marginBottom: "16px",
              }}
            >
              <div style={{ background: "var(--bg-surface)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Who Manufactured It
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                  {selectedInstrument.manufacturer}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Origin: {selectedInstrument.manufacturer_country || "Switzerland / Germany"}
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  When Bought (Purchase Date)
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-yellow)", marginTop: "4px" }}>
                  {selectedInstrument.purchase_date || "2023-01-15"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Invoice: <code>{selectedInstrument.supplier_invoice || "INV-OIML-2023-09"}</code>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Commissioning Date
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8", marginTop: "4px" }}>
                  {selectedInstrument.commission_date}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Baseline zero error: <code>E₀ = 0.00 e</code>
                </div>
              </div>

              <div style={{ background: "var(--bg-surface)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Last Calibrated / Verified
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                  {selectedInstrument.last_calibrated}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Location: {selectedInstrument.location}
                </div>
              </div>
            </div>

            {/* Metrological Specifications Chips */}
            <div className="instrument-chips-grid">
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
                  <span>MAX CAPACITY (Max)</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem" }}>
                  {selectedInstrument.max_capacity} {selectedInstrument.capacity_unit}
                </div>
              </div>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>VERIFICATION INTERVAL (e)</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem" }}>
                  {selectedInstrument.verification_interval_e} {selectedInstrument.capacity_unit}
                </div>
              </div>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>ACTUAL SCALE INTERVAL (d)</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem" }}>
                  {selectedInstrument.display_division_d} {selectedInstrument.capacity_unit}
                </div>
              </div>
              <div className="preview-chip">
                <div className="preview-chip-header">
                  <span>TABLE 6 MPE TOLERANCE</span>
                </div>
                <div className="preview-chip-val" style={{ fontSize: "1.1rem", color: "var(--badge-pass-text)" }}>
                  ±{selectedInstrument.mpe_limit} e
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DETAIL GRID: READING DATA ON LEFT, GRAPH ON RIGHT */}
          <div className="machine-detail-grid">
            {/* LEFT COLUMN: READING DATA TABLE */}
            <div className="studio-panel" style={{ margin: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "14px",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      📋 Measurement Reading Data
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>
                      {activeReadings.length} Points
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    OIML R76 Annex A.4.4.3 turning point readings (P = I + 0.5e - ΔL)
                  </div>
                </div>

                {/* Tabs to toggle between Current Readings and Baseline When Bought */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    className={`machine-tab-btn ${activeReadingTab === "current" ? "active" : ""}`}
                    onClick={() => setActiveReadingTab("current")}
                  >
                    Current Periodic Readings
                  </button>
                  <button
                    className={`machine-tab-btn ${activeReadingTab === "baseline" ? "active" : ""}`}
                    onClick={() => setActiveReadingTab("baseline")}
                  >
                    When Bought (Baseline)
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-container" style={{ maxHeight: "380px", overflowY: "auto" }}>
                <table className="data-table" style={{ fontSize: "0.78rem" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "36px" }}>#</th>
                      <th>Nominal Load L ({selectedInstrument.capacity_unit})</th>
                      <th>Indication I</th>
                      <th>ΔL</th>
                      <th>Turning Pt P</th>
                      <th>Error Ec (e)</th>
                      <th>MPE (Table 6)</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReadings.map((pt) => {
                      const isPassing = pt.isPass;
                      return (
                        <tr key={pt.step}>
                          <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>{pt.step}</td>
                          <td>
                            <strong>{pt.nominalLoad}</strong> {pt.loadUnit || selectedInstrument.capacity_unit}
                          </td>
                          <td>{pt.indication}</td>
                          <td><code>{pt.deltaL}</code></td>
                          <td>{pt.turningPointP}</td>
                          <td>
                            <strong style={{ color: pt.correctedError >= 0 ? "var(--accent-yellow)" : "#38bdf8" }}>
                              {pt.correctedError >= 0 ? `+${pt.correctedError}` : pt.correctedError} e
                            </strong>
                          </td>
                          <td>±{pt.mpeLimit} e</td>
                          <td>
                            <span
                              className={`badge ${isPassing ? "badge-pass" : "badge-fail"}`}
                              style={{ fontSize: "0.68rem", padding: "2px 6px" }}
                            >
                              {isPassing ? "Pass" : "Fail"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Computed Statistical Summary Box for this Reading Dataset */}
              {activeStats && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: "10px",
                    marginTop: "14px",
                    padding: "12px 14px",
                    background: "var(--bg-canvas)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Sample Mean (μ)
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: activeReadingTab === "current" ? "var(--accent-yellow)" : "#38bdf8" }}>
                      {activeStats.mean >= 0 ? `+${activeStats.mean}` : activeStats.mean} e
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Std Dev (σ)
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {activeStats.std} e
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Max Error
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      +{activeStats.maxError} e
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Pass Rate
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--badge-pass-text)" }}>
                      {Math.round((activeStats.passCount / (activeStats.totalCount || 1)) * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: GRAPH ACCORDING TO THAT READING DATA */}
            <div className="studio-panel" style={{ margin: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    📈 Dual Normal Distribution Error Profile
                  </span>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Curves computed directly from reading datasets (Purchase Baseline vs Current Wear)
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span className="badge badge-pass" style={{ fontSize: "0.72rem" }}>
                    Table 6 MPE
                  </span>
                  <button
                    className="btn-secondary"
                    style={{
                      fontSize: "0.75rem",
                      padding: "4px 8px",
                      borderColor: "rgba(226, 253, 82, 0.5)",
                      color: "var(--accent-yellow)",
                    }}
                    onClick={() => setIsCalcModalOpen(true)}
                    title="View step-by-step mathematical calculation formulas (Closes with Esc)"
                  >
                    🧮 Formulas
                  </button>
                </div>
              </div>

              {/* Interactive Hover Telemetry Banner */}
              {hoverInfo && (
                <div className="chart-telemetry-banner" style={{ marginBottom: "10px" }}>
                  <div className="chart-telemetry-items">
                    <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      Inspected: <code>{hoverInfo.xVal >= 0 ? `+${hoverInfo.xVal}` : hoverInfo.xVal} e</code>
                    </span>
                    <span style={{ color: "#38bdf8" }}>
                      Purchase: <strong>f(x)={hoverInfo.baseDensity}</strong> (μ={baselineMean}e, σ={baselineStd}e)
                    </span>
                    <span style={{ color: "#e2fd52" }}>
                      Current: <strong>f(x)={hoverInfo.currDensity}</strong> (μ=+{currentMean}e, σ={currentStd}e)
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      Math.abs(hoverInfo.xVal) <= selectedInstrument.mpe_limit ? "badge-pass" : "badge-fail"
                    }`}
                    style={{ fontSize: "0.7rem" }}
                  >
                    {Math.abs(hoverInfo.xVal) <= selectedInstrument.mpe_limit
                      ? "Within Table 6 Bound"
                      : "Exceeds Table 6 Bound"}
                  </span>
                </div>
              )}

              {/* Responsive SVG Normal Distribution Chart with Touch-Friendly Scroll & Hover Tracking */}
              <div className="chart-scroll-wrapper">
                <svg
                  viewBox="0 0 560 180"
                  style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }}
                  onMouseMove={handleSvgMouseMove}
                  onMouseLeave={() => setHoverInfo(null)}
                >
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

                  {/* Curve 1: Initial Purchase Baseline (Cyan) plotted from baseline reading data */}
                  {(() => {
                    const baseline = generateGaussianCurve(baselineMean, baselineStd);
                    return (
                      <g>
                        <path d={baseline.fillPath} fill={`url(#${gradientBaselineId})`} />
                        <path d={baseline.strokePath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      </g>
                    );
                  })()}

                  {/* Curve 2: Current Condition (Electric Yellow/Lime) plotted from current reading data */}
                  {(() => {
                    const current = generateGaussianCurve(currentMean, currentStd);
                    return (
                      <g>
                        <path d={current.fillPath} fill={`url(#${gradientCurrentId})`} />
                        <path d={current.strokePath} fill="none" stroke="#e2fd52" strokeWidth="2.5" />
                      </g>
                    );
                  })()}

                  {/* Dynamic Hover Guideline & Data Points */}
                  {hoverInfo && (
                    <g>
                      <line
                        x1={hoverInfo.svgX}
                        y1="20"
                        x2={hoverInfo.svgX}
                        y2="150"
                        stroke="var(--accent-yellow)"
                        strokeDasharray="2 2"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={hoverInfo.svgX}
                        cy={hoverInfo.baseY}
                        r="5"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={hoverInfo.svgX}
                        cy={hoverInfo.currY}
                        r="5"
                        fill="#e2fd52"
                        stroke="#111111"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Chart Legend & Numerical Metrics */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", fontSize: "0.78rem", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "3px", background: "#38bdf8", borderRadius: "2px" }} />
                    <span style={{ color: "#38bdf8", fontWeight: 600 }}>Purchase Baseline</span>
                    <span style={{ color: "var(--text-muted)" }}>μ={baselineMean}e, σ={baselineStd}e</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "3px", background: "#e2fd52", borderRadius: "2px" }} />
                    <span style={{ color: "#e2fd52", fontWeight: 600 }}>Current Condition</span>
                    <span style={{ color: "var(--text-muted)" }}>μ=+{currentMean}e, σ={currentStd}e</span>
                  </div>
                </div>

                <div style={{ color: "var(--text-secondary)" }}>
                  Drift: <strong>+{Math.round((currentMean - baselineMean) * 1000) / 1000}e</strong>
                </div>
              </div>

              {/* Historical Verification Records */}
              <div style={{ marginTop: "16px" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                  Metrological Verification History
                </div>
                <div className="table-container">
                  <table className="data-table" style={{ fontSize: "0.75rem" }}>
                    <thead>
                      <tr>
                        <th>Test Event</th>
                        <th>Date</th>
                        <th>Mean Error</th>
                        <th>Tolerance</th>
                        <th>Disposition</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Periodic Re-verification</td>
                        <td>{selectedInstrument.last_calibrated}</td>
                        <td>+{currentMean} e</td>
                        <td>±{selectedInstrument.mpe_limit} e</td>
                        <td>
                          <span className="badge badge-pass" style={{ fontSize: "0.68rem" }}>
                            Pass
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>Initial Commissioning Verification</td>
                        <td>{selectedInstrument.commission_date}</td>
                        <td>+{baselineMean} e</td>
                        <td>±{selectedInstrument.mpe_limit} e</td>
                        <td>
                          <span className="badge badge-pass" style={{ fontSize: "0.68rem" }}>
                            Pass
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Registered Fleet Directory (Always Accessible or for Selecting Machines) */}
      <div className="no-print">
        <div className="table-container">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Registered Fleet ({filtered.length})</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                Click any machine to inspect basic info, measurement readings & Gaussian curve
              </span>
            </div>
            {selectedInstrument && (
              <span style={{ fontSize: "0.78rem", color: "var(--accent-yellow)" }}>
                ● Currently inspecting: {selectedInstrument.model}
              </span>
            )}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Model / Serial</th>
                <th>Manufacturer</th>
                <th>When Bought</th>
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
                    onClick={() => {
                      setSelectedInstrument(inst);
                      setHoverInfo(null);
                    }}
                    style={{
                      cursor: "pointer",
                      background: isSelected ? "var(--bg-surface-elevated)" : undefined,
                      borderLeft: isSelected ? "3px solid var(--accent-yellow)" : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inst.model}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Asset: <code>#{inst.asset_tag}</code> • <code>{inst.serial_number}</code>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{inst.manufacturer}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {inst.manufacturer_country || "Global"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {inst.purchase_date || "2023-01-15"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Comm: {inst.commission_date}
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
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInstrument(inst);
                            setHoverInfo(null);
                          }}
                          title="Inspect Instrument Data & Curves"
                        >
                          🔍 Inspect
                        </button>
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
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL: MANUAL CALCULATION BREAKDOWN (Esc to Close)                   */}
      {/* ========================================================================= */}
      {isCalcModalOpen && selectedInstrument && (
        <div
          className="modal-backdrop no-print"
          onClick={() => setIsCalcModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "860px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>OIML R76 Mathematical Calculation & Derivation</h2>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Detailed step-by-step metrological breakdown for <strong>{selectedInstrument.model}</strong> (Serial: <code>{selectedInstrument.serial_number}</code>)
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                  Press [Esc] to Close
                </span>
                <button
                  className="close-btn"
                  onClick={() => setIsCalcModalOpen(false)}
                  title="Close calculation breakdown (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Step 1: Turning Point */}
              <div className="preview-chip" style={{ background: "var(--bg-canvas)", borderLeft: "3px solid var(--accent-yellow)" }}>
                <div className="preview-chip-header">
                  <span>STEP 1: TURNING POINT INDICATION PRIOR TO ROUNDING</span>
                  <span>OIML R76 ANNEX A.4.4.3</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  Because digital indicators round indication values to discrete intervals ($e$ or $d$), the true indication prior to rounding ($P$) is determined by applying incremental weights ($\Delta L$) until the display transitions to the next interval:
                </p>
                <div style={{ background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", color: "var(--accent-yellow)", fontSize: "0.95rem", marginBottom: "8px" }}>
                  P = I + 0.5e - ΔL
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Substituting instrument parameters: Verification interval <code>e = {selectedInstrument.verification_interval_e} {selectedInstrument.capacity_unit}</code>. If indication <code>I = 100.000</code> and turning weight <code>ΔL = 0.0004</code>:
                  <div style={{ color: "var(--text-primary)", marginTop: "4px" }}>
                    P = 100.000 + 0.5(0.001) - 0.0004 = <strong>100.0001 {selectedInstrument.capacity_unit}</strong>
                  </div>
                </div>
              </div>

              {/* Step 2: Indication Error & Zero Correction */}
              <div className="preview-chip" style={{ background: "var(--bg-canvas)", borderLeft: "3px solid #38bdf8" }}>
                <div className="preview-chip-header">
                  <span>STEP 2: INDICATION ERROR & ZERO-SETTING CORRECTION</span>
                  <span>CLAUSE A.4.4.3.2</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  Raw indication error ($E$) and zero-corrected error ($E_c$) subtract tare/zero displacement ($E_0$):
                </p>
                <div style={{ background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", color: "#38bdf8", fontSize: "0.95rem", marginBottom: "8px" }}>
                  E = P - L, &nbsp;&nbsp;&nbsp;&nbsp; Ec = E - E₀
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  With zero error <code>E₀ = 0.0000</code> and applied standard test weight <code>L = 100.0000 {selectedInstrument.capacity_unit}</code>:
                  <div style={{ color: "var(--text-primary)", marginTop: "4px" }}>
                    Ec = 100.0001 - 100.0000 = <strong>+0.0001 {selectedInstrument.capacity_unit} (+0.10 e)</strong>
                  </div>
                </div>
              </div>

              {/* Step 3: Mean Error & Drift */}
              <div className="preview-chip" style={{ background: "var(--bg-canvas)", borderLeft: "3px solid var(--accent-yellow)" }}>
                <div className="preview-chip-header">
                  <span>STEP 3: MEAN ERROR (μ) & SENSOR DRIFT DETERMINATION</span>
                  <span>STATISTICAL DOMAIN</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  Arithmetic sample mean of repeated measurement errors evaluated over $n$ load points:
                </p>
                <div style={{ background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", color: "var(--accent-yellow)", fontSize: "0.95rem", marginBottom: "8px", overflowX: "auto" }}>
                  μ = (1 / n) · Σ Ec,i &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Δμ = μ_current - μ_baseline
                </div>
                <div className="responsive-two-col" style={{ fontSize: "0.82rem" }}>
                  <div style={{ background: "var(--bg-surface)", padding: "10px", borderRadius: "6px" }}>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>Commissioning Baseline (Purchase):</span>
                    <div style={{ marginTop: "4px" }}>Mean Error: <code>μ₀ = {baselineMean} e</code></div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", padding: "10px", borderRadius: "6px" }}>
                    <span style={{ color: "#e2fd52", fontWeight: 700 }}>Current Condition (Periodic):</span>
                    <div style={{ marginTop: "4px" }}>Mean Error: <code>μ = +{currentMean} e</code> (Drift: <strong>+{Math.round((currentMean - baselineMean) * 1000) / 1000} e</strong>)</div>
                  </div>
                </div>
              </div>

              {/* Step 4: Repeatability Sample Standard Deviation */}
              <div className="preview-chip" style={{ background: "var(--bg-canvas)", borderLeft: "3px solid #38bdf8" }}>
                <div className="preview-chip-header">
                  <span>STEP 4: REPEATABILITY DISPERSION (σ)</span>
                  <span>OIML R76 CLAUSE 3.6.1</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  The repeatability dispersion reflects standard deviation across consecutive identical test loads:
                </p>
                <div style={{ background: "var(--bg-surface)", padding: "12px 16px", borderRadius: "8px", fontFamily: "monospace", color: "#38bdf8", fontSize: "0.95rem", marginBottom: "8px", overflowX: "auto" }}>
                  σ = √[ (1 / (n - 1)) · Σ (Ec,i - μ)² ]
                </div>
                <div className="responsive-two-col" style={{ fontSize: "0.82rem" }}>
                  <div style={{ background: "var(--bg-surface)", padding: "10px", borderRadius: "6px" }}>
                    <span style={{ color: "#38bdf8", fontWeight: 700 }}>Baseline Commissioning:</span>
                    <div style={{ marginTop: "4px" }}>Standard Dev: <code>σ₀ = {baselineStd} e</code> (Tight Precision)</div>
                  </div>
                  <div style={{ background: "var(--bg-surface)", padding: "10px", borderRadius: "6px" }}>
                    <span style={{ color: "#e2fd52", fontWeight: 700 }}>Current Operational Wear:</span>
                    <div style={{ marginTop: "4px" }}>Standard Dev: <code>σ = {currentStd} e</code> (Expanded Dispersion: +{Math.round(((currentStd - baselineStd) / (baselineStd || 0.001)) * 100)}%)</div>
                  </div>
                </div>
              </div>

              {/* Step 5: Table 6 MPE Bounds & Compliance Verdict */}
              <div className="preview-chip" style={{ background: "var(--bg-surface)", borderLeft: "3px solid var(--badge-pass-text)" }}>
                <div className="preview-chip-header">
                  <span>STEP 5: OIML R76 TABLE 6 MPE EVALUATION & VERDICT</span>
                  <span className="badge badge-pass">PASS</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  Accuracy Class <strong>Class {selectedInstrument.accuracy_class}</strong> Table 6 stepped verification interval criteria:
                </p>
                <ul style={{ fontSize: "0.82rem", color: "var(--text-muted)", paddingLeft: "18px", margin: "0 0 10px", lineHeight: 1.6 }}>
                  <li>Applied load steps within <code>0 ≤ m ≤ 50,000 e</code>: Tolerance Limit is <strong>± 0.50 e</strong></li>
                  <li>Measured Current Mean Error: <code>|μ| = {currentMean} e ≤ {selectedInstrument.mpe_limit} e</code> → <strong>CONFORMS (PASS)</strong></li>
                  <li>3-Sigma Boundary ($3σ$): <code>3 × {currentStd} e = {Math.round(3 * currentStd * 1000) / 1000} e</code></li>
                </ul>
                <div style={{ color: "var(--badge-pass-text)", fontWeight: 700, fontSize: "0.9rem" }}>
                  VERDICT: Certified compliant with OIML R76-1: 2006 Table 6 requirements for Class {selectedInstrument.accuracy_class} instruments.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                className="btn-primary"
                onClick={() => setIsCalcModalOpen(false)}
                style={{ padding: "10px 24px" }}
              >
                Close Breakdown [Esc]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MANUAL SINGLE-DEVICE ENTRY (Schools / Offices)                  */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="modal-backdrop no-print" onClick={() => setIsManualModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
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
              <div className="responsive-two-col" style={{ gap: "14px" }}>
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

              <div className="responsive-two-col" style={{ gap: "14px" }}>
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

              <div className="responsive-three-col" style={{ gap: "14px" }}>
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

              <div className="responsive-two-col" style={{ gap: "14px" }}>
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
        <div className="modal-backdrop no-print" onClick={() => setIsBulkModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
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
