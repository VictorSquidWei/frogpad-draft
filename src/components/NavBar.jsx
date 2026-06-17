import React from "react";
import { NavLink } from "react-router-dom";
import { ROLES } from "../data/constants.js";
import { useStore } from "../lib/store.jsx";
import DataControls from "./DataControls.jsx";
import Icon from "./Icon.jsx";

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 32 32">
          <circle cx="10" cy="9" r="4.5" className="brand-eye-bg" />
          <circle cx="22" cy="9" r="4.5" className="brand-eye-bg" />
          <circle cx="10" cy="9" r="2" className="brand-eye" />
          <circle cx="22" cy="9" r="2" className="brand-eye" />
          <path
            d="M5 16c0-4 5-6 11-6s11 2 11 6-4 8-11 8S5 20 5 16z"
            className="brand-body"
          />
          <path d="M12 20q4 3 8 0" className="brand-mouth" />
        </svg>
      </span>
      <span className="brand-text">
        FrogPad<span className="brand-text-dim"> Draft</span>
      </span>
    </div>
  );
}

function SyncBadge() {
  const { sync } = useStore();
  let label = "Local";
  let cls = "local";
  if (sync.enabled && sync.connected) {
    label = "Synced";
    cls = "synced";
  } else if (sync.enabled) {
    label = "Connecting";
    cls = "pending";
  }
  return (
    <span className={`sync-badge ${cls}`} title="Where your data lives">
      <span className="sync-dot" />
      {label}
    </span>
  );
}

export default function NavBar() {
  return (
    <header className="topbar">
      <Logo />

      <nav className="tabs">
        <div className="tab-group">
          {ROLES.map((r) => (
            <NavLink
              key={r.key}
              to={`/tier/${r.key}`}
              className={({ isActive }) => `tab${isActive ? " is-active" : ""}`}
            >
              {r.label}
            </NavLink>
          ))}
        </div>
        <span className="tab-divider" />
        <div className="tab-group">
          <NavLink
            to="/comps"
            className={({ isActive }) => `tab${isActive ? " is-active" : ""}`}
          >
            Team comps
          </NavLink>
          <NavLink
            to="/matchups"
            className={({ isActive }) => `tab${isActive ? " is-active" : ""}`}
          >
            Matchups
          </NavLink>
          <NavLink
            to="/draft"
            className={({ isActive }) =>
              `tab tab-draft${isActive ? " is-active" : ""}`
            }
          >
            <Icon name="target" size={14} />
            Draft
          </NavLink>
        </div>
      </nav>

      <div className="topbar-right">
        <SyncBadge />
        <DataControls />
      </div>
    </header>
  );
}
