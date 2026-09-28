"use client";

import React, { useState } from "react";

interface UserAccount {
  email: string;
  role: string;
  fullName: string;
  desc: string;
}

const csvDemoAccounts: UserAccount[] = [
  {
    email: "admin@metralab.local",
    role: "Administrator",
    fullName: "Lab Administrator",
    desc: "Full administrative governance, procedure activation, and audit permissions.",
  },
  {
    email: "tech@metralab.local",
    role: "Technician",
    fullName: "Alex Vance",
    desc: "Conducts verifications, turning point tests, and submits measurement reports.",
  },
  {
    email: "reviewer@metralab.local",
    role: "Reviewer",
    fullName: "Elena Rostova",
    desc: "Quality manager authorized to review, return, reject, or finalize test reports.",
  },
  {
    email: "auditor@metralab.local",
    role: "Auditor",
    fullName: "Marcus Brody",
    desc: "Read-only access to audit logs, compliance dispositions, and trace records.",
  },
  {
    email: "school@science-lab.edu",
    role: "Technician",
    fullName: "Prof. Sarah Jenkins",
    desc: "University & school physics laboratory manual single-instrument testing.",
  },
  {
    email: "industry@precision-mfg.com",
    role: "Technician",
    fullName: "David Chen",
    desc: "High-throughput industrial manufacturing QA with bulk CSV ingestion.",
  },
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState({
    email: "tech@metralab.local",
    role: "Technician",
    fullName: "Alex Vance",
    status: "Active (Authenticated)",
  });

  const [inputEmail, setInputEmail] = useState("");
  const [inputPassword, setInputPassword] = useState("123");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || err.detail || "Authentication failed");
      }

      const data = await res.json();
      const match = csvDemoAccounts.find((a) => a.email.toLowerCase() === data.email.toLowerCase());
      setCurrentUser({
        email: data.email,
        role: data.role,
        fullName: match?.fullName || data.email.split("@")[0],
        status: "Active (Authenticated)",
      });
      setStatusType("success");
      setStatusMsg(`Successfully authenticated as ${data.email} (${data.role})! Account is persisted in PostgreSQL database.`);
    } catch {
      // Local fallback for client interaction
      const match = csvDemoAccounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
      if (match && password === "123") {
        setCurrentUser({
          email: match.email,
          role: match.role,
          fullName: match.fullName,
          status: "Active (Authenticated via user.csv)",
        });
        setStatusType("success");
        setStatusMsg(`Authenticated as ${match.email} (${match.role}) with default password 123.`);
      } else {
        setStatusType("error");
        setStatusMsg("Invalid email or password. Password is 123 by default for authorized accounts.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setCurrentUser({
      email: "guest@metralab.local",
      role: "Guest",
      fullName: "Guest Operator",
      status: "Logged Out",
    });
    setStatusType("success");
    setStatusMsg("You have logged out of the current session.");
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 6px" }}>Operator Profile & Auth Hub</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
          Manage your metrological authorization, view active laboratory credentials, or switch active operator accounts.
        </p>
      </div>

      {statusMsg && (
        <div
          className="preview-chip"
          style={{
            borderLeft: `4px solid ${statusType === "success" ? "var(--accent-yellow)" : "var(--badge-fail-text)"}`,
            marginBottom: "24px",
            background: "var(--bg-surface)",
          }}
        >
          <div style={{ fontWeight: 600, color: statusType === "success" ? "var(--accent-yellow)" : "var(--badge-fail-text)" }}>
            {statusMsg}
          </div>
        </div>
      )}

      <div className="profile-two-grid">
        {/* Active Profile Card */}
        <div className="studio-panel">
          <div className="panel-title">
            <span>Active Operator Credentials</span>
            <span className={`badge ${currentUser.role !== "Guest" ? "badge-pass" : "badge-neutral"}`}>
              <span className="badge-dot" />
              {currentUser.status}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--accent-yellow)",
                color: "var(--accent-yellow-text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.5rem",
              }}
            >
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {currentUser.fullName}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          <div className="preview-chip">
            <div className="preview-chip-header">
              <span>METROLOGICAL ROLE & CLEARANCE</span>
              <span>ISO/IEC 17025</span>
            </div>
            <div className="preview-chip-val" style={{ color: "var(--accent-yellow)", fontSize: "1.1rem" }}>
              {currentUser.role}
            </div>
          </div>

          <div className="preview-chip">
            <div className="preview-chip-header">
              <span>CREDENTIAL SOURCE</span>
              <span>AUTOPROVISIONED</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Authenticated via <code style={{ color: "var(--accent-yellow)" }}>~/user.csv</code> fallback, synchronized with PostgreSQL. Default password: <code style={{ color: "var(--accent-yellow)" }}>123</code>.
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button
              className="btn-secondary"
              onClick={handleLogout}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Log Out Current Session
            </button>
          </div>
        </div>

        {/* Switch Account Form */}
        <div className="studio-panel">
          <div className="panel-title">
            <span>Sign In / Switch Operator</span>
            <span className="badge badge-neutral">Password: 123</span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(inputEmail, inputPassword);
            }}
          >
            <div className="form-group">
              <label className="form-label">Operator Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. tech@metralab.local or school@science-lab.edu"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Must be an authorized email listed in <code>user.csv</code>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Default system password is <code>123</code>.
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: "100%", justifyContent: "center", marginTop: "12px" }}
            >
              {isLoading ? "Authenticating..." : "Sign In with user.csv Fallback"}
            </button>
          </form>
        </div>
      </div>

      {/* 1-Click Quick Demo Accounts from user.csv */}
      <div className="studio-panel">
        <div className="panel-title">
          <span>Authorized Accounts (user.csv Pre-Configured)</span>
          <span className="badge badge-pass">Click to 1-Click Switch</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 16px" }}>
          These accounts originate from <code>~/user.csv</code>. Clicking any card tests automatic first-time database provisioning and instant role switching.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {csvDemoAccounts.map((acc) => (
            <div
              key={acc.email}
              onClick={() => handleLogin(acc.email, "123")}
              style={{
                background: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-yellow)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                  {acc.fullName}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>
                  {acc.role}
                </span>
              </div>
              <div style={{ color: "var(--accent-yellow)", fontSize: "0.8rem", marginBottom: "8px" }}>
                {acc.email}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {acc.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
