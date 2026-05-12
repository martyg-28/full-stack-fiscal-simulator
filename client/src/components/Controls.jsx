import React from "react";
import { scenarioPresets } from "../lib/presets.js";
import { POLICY_TIERS, STRESS_TIERS, getTier } from "../lib/sliderTiers.js";

function Slider({ label, value, onChange, swatch, onAskAtlas, fieldKey, tierTable }) {
  const tier = getTier(fieldKey, value, tierTable);
  return (
    <div className="slider swatch" style={swatch ? { "--swatch": swatch } : undefined}>
      <div className="slider-head">
        <span className="slider-label">{label}</span>
        <span className="slider-value-tag">{value}</span>
      </div>
      <div className="slider-tier">
        <strong className="tier-name">{tier.label}</strong>
        <p className="tier-blurb">{tier.blurb}</p>
      </div>
      <div className="tier-pips" aria-hidden="true">
        {Array.from({ length: tier.total }).map((_, i) => (
          <span key={i} className={`tier-pip ${i <= tier.index ? "on" : ""}`} />
        ))}
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}: ${tier.label}`}
      />
      {onAskAtlas && (
        <button type="button" className="ask-atlas-link" onClick={() => onAskAtlas(label)}>
          Ask Atlas →
        </button>
      )}
    </div>
  );
}

const POLICY_SWATCHES = {
  revenueReform: "var(--pastel-mint)",
  discretionaryCuts: "var(--pastel-yellow)",
  healthcareEfficiency: "var(--pastel-rose)",
  socialSecurityReform: "var(--pastel-lavender)",
  defensePosture: "var(--pastel-blue)",
  climateResilience: "var(--pastel-mint)",
  industrialPolicy: "var(--pastel-peach)",
};

const POLICY_FIELDS = [
  { key: "revenueReform",        label: "Revenue reform" },
  { key: "discretionaryCuts",    label: "Discretionary cuts" },
  { key: "healthcareEfficiency", label: "Healthcare efficiency" },
  { key: "socialSecurityReform", label: "Social Security reform" },
  { key: "defensePosture",       label: "Defense posture" },
  { key: "climateResilience",    label: "Climate resilience" },
  { key: "industrialPolicy",     label: "Industrial policy" },
];

const STRESS_FIELDS = [
  { key: "politicalPolarization", label: "Political polarization" },
  { key: "pacPressure",           label: "PAC pressure" },
  { key: "publicSupport",         label: "Public support" },
  { key: "congressionalMargin",   label: "Congress margin" },
  { key: "fundingPressure",       label: "Funding pressure" },
  { key: "conflictShock",         label: "Conflict shock" },
  { key: "disasterShock",         label: "Disaster shock" },
  { key: "tradeDisruption",       label: "Trade disruption" },
];

export default function Controls({ policy, stress, setPolicy, setStress, onAskAtlas }) {
  const setPolicyField = (field) => (value) => setPolicy((prev) => ({ ...prev, [field]: value }));
  const setStressField = (field) => (value) => setStress((prev) => ({ ...prev, [field]: value }));

  function applyPreset(presetId) {
    const preset = scenarioPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setPolicy(preset.policy);
    setStress(preset.stress);
  }

  return (
    <>
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="panel-title">Simulation cards</h2>
            <p className="muted">Snap to a starting point, then tune the sliders below.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {scenarioPresets.map((preset) => (
              <button key={preset.id} className="btn ghost" onClick={() => applyPreset(preset.id)} title={preset.description}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2 className="panel-title">Policy builder</h2>
          <p className="muted">Each lever is named for what it actually means. Drag to change the level.</p>
          <div className="slider-grid">
            {POLICY_FIELDS.map((f) => (
              <Slider
                key={f.key}
                fieldKey={f.key}
                tierTable={POLICY_TIERS}
                label={f.label}
                value={policy[f.key]}
                onChange={setPolicyField(f.key)}
                swatch={POLICY_SWATCHES[f.key]}
                onAskAtlas={onAskAtlas}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="panel-title">Global pressure</h2>
          <p className="muted">Manual assumptions blended with live data from Treasury, BLS, and NOAA.</p>
          <div className="slider-grid">
            {STRESS_FIELDS.map((f) => (
              <Slider
                key={f.key}
                fieldKey={f.key}
                tierTable={STRESS_TIERS}
                label={f.label}
                value={stress[f.key]}
                onChange={setStressField(f.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
