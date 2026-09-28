"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const navigationItems = [
  { name: "Overview Studio", href: "/", icon: "⚖️" },
  { name: "Instruments Register", href: "/instruments", icon: "📋" },
  { name: "Test Reports & Entry", href: "/reports", icon: "📝" },
  { name: "Technical Review", href: "/review", icon: "🔍" },
  { name: "Configuration", href: "/admin", icon: "⚙️" },
  { name: "User Profile & Auth", href: "/profile", icon: "👤" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "MetraLab Studio / Overview & Calculations";
      case "/instruments":
        return "Instruments Register / Metrological Classes";
      case "/reports":
        return "Test Reports / Measurement Entry";
      case "/review":
        return "Technical Review / Sign-off Queue";
      case "/admin":
        return "System Configuration / OIML R76 Rules";
      case "/profile":
        return "User Profile & Authentication Hub";
      default:
        return "MetraLab / Non-Automatic Weighing Instruments";
    }
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (Phones and small screens) */}
      <div className="mobile-topbar no-print">
        <div className="brand-wrapper">
          <div className="brand-icon">M</div>
          <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)" }}>
            MetraLab
          </span>
        </div>
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Backdrop for Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="mobile-overlay no-print"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Collapsible & Responsive Sidebar */}
      <aside
        className={`sidebar no-print ${isCollapsed ? "collapsed" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="brand-wrapper">
            <div className="brand-icon">M</div>
            <div className="brand-text">
              <h1>MetraLab</h1>
              <span>OIML R76 STUDIO</span>
            </div>
          </div>
          <button
            className="collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setIsMobileOpen(false)}
                title={item.name}
              >
                <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link
            href="/profile"
            className="user-badge-link"
            onClick={() => setIsMobileOpen(false)}
            title="Click to view User Profile & Account Settings"
          >
            <div className="user-badge">
              <div className="user-avatar">A</div>
              <div className="user-info">
                <div className="user-name">Alex Vance</div>
                <div className="user-role">Lead Metrologist</div>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="main-wrapper">
        <header className="topbar no-print">
          <div className="topbar-title">{getPageTitle()}</div>
          <div className="topbar-actions">
            <span className="badge badge-pass">
              <span className="badge-dot" />
              OIML R76-1: 2006 Compliant
            </span>
          </div>
        </header>

        <main className="content-body">{children}</main>
      </div>
    </div>
  );
}

