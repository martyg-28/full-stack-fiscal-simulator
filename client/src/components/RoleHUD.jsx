import React from "react";
import { ROLES } from "../lib/roles.js";
import { computePoliticalCapital, POLITICAL_CAPITAL_BUDGET } from "../lib/scoreAxes.js";
import { roleScoreBand } from "../lib/scoreLabels.js";

export default function RoleHUD({ selectedRoleId, setSelectedRoleId, policy, roleScore, onAskAtlas }) {
  const role = ROLES.find((r) => r.id === selectedRoleId) || ROLES[0];
  const capital = computePoliticalCapital(policy);
  const over = capital - POLITICAL_CAPITAL_BUDGET;
  const pct = Math.min(120, (capital / POLITICAL_CAPITAL_BUDGET) * 100);

  return (
    <section className="role-hud">
      <div className="role-hud-grid">
        <div className="role-hud-col">
          <span className="eyebrow"><span className="pip"></span>Your role</span>
          <select
            className="role-select"
            value={role.id}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            aria-label="Select your role"
          >
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>{role.goal}</p>
        </div>

        <div className="role-hud-col score-col">
          <span className="eyebrow">Role score</span>
          <strong className="num">{roleScore}</strong>
          {(() => { const b = roleScoreBand(roleScore); return (
            <span className={`band-tag tone-${b.tone}`}>{b.label}</span>
          ); })()}
          <span className="muted" style={{ fontSize: 12 }}>
            {roleScoreBand(roleScore).blurb} A {role.label} judges this package on its own terms.
          </span>
          <button type="button" className="why-btn" onClick={() => onAskAtlas?.(`I'm playing the ${role.label} role. My role score is ${roleScore}. What should I change?`)}>
            Why this score?
          </button>
        </div>

        <div className="role-hud-col">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span className="eyebrow">Political capital</span>
            <span className="num" style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500 }}>
              {capital}<small style={{ fontSize: 13, color: "var(--ink-mute)" }}> / {POLITICAL_CAPITAL_BUDGET}</small>
            </span>
          </div>
          <div className="capital-bar">
            <div
              className={`capital-fill ${over > 0 ? "over" : ""}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
            {over > 0 && (
              <div
                className="capital-fill over-tail"
                style={{ left: "100%", width: `${Math.min(20, (over / POLITICAL_CAPITAL_BUDGET) * 100)}%` }}
              />
            )}
          </div>
          <span className="muted" style={{ fontSize: 12 }}>
            {over > 0
              ? `Over budget by ${over}. Watch viability collapse.`
              : `Cost of moves from neutral. Aggressive reforms cost more.`}
          </span>
        </div>
      </div>
    </section>
  );
}
