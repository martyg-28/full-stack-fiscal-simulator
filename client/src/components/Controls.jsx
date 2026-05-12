import React from "react";
import { scenarioPresets } from "../lib/presets.js";

function Slider({ label, value, help, onChange, swatch, onAskAtlas }) {
  return (
    <div className="slider swatch" style={swatch ? { "--swatch": swatch } : undefined}>
      <div className="slider-row">
        <div>
          <label>{label}</label>
          <small>{help}</small>
        </div>
        <strong>{value}</strong>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} />
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
          <h2 className="panel-title">Policy Builder</h2>
          <p className="muted">Each lever is a policy paint swatch. Drag, watch the trajectory respond.</p>
          <div className="slider-grid">
            <Slider label="Revenue reform" value={policy.revenueReform} onChange={setPolicyField("revenueReform")} help="Broaden the tax base and adjust rates. Tradeoff: revenue gain vs. political resistance." swatch={POLICY_SWATCHES.revenueReform} onAskAtlas={onAskAtlas} />
            <Slider label="Discretionary cuts" value={policy.discretionaryCuts} onChange={setPolicyField("discretionaryCuts")} help="Annual appropriations and agency budgets." swatch={POLICY_SWATCHES.discretionaryCuts} onAskAtlas={onAskAtlas} />
            <Slider label="Healthcare efficiency" value={policy.healthcareEfficiency} onChange={setPolicyField("healthcareEfficiency")} help="Medicare payment and care reforms. Strong long-run lever." swatch={POLICY_SWATCHES.healthcareEfficiency} onAskAtlas={onAskAtlas} />
            <Slider label="Social Security reform" value={policy.socialSecurityReform} onChange={setPolicyField("socialSecurityReform")} help="Benefit formula and payroll cap. Slow but durable." swatch={POLICY_SWATCHES.socialSecurityReform} onAskAtlas={onAskAtlas} />
            <Slider label="Defense posture" value={policy.defensePosture} onChange={setPolicyField("defensePosture")} help="50 is neutral; higher costs more." swatch={POLICY_SWATCHES.defensePosture} onAskAtlas={onAskAtlas} />
            <Slider label="Climate resilience" value={policy.climateResilience} onChange={setPolicyField("climateResilience")} help="Near-term cost, later disaster savings." swatch={POLICY_SWATCHES.climateResilience} onAskAtlas={onAskAtlas} />
            <Slider label="Industrial policy" value={policy.industrialPolicy} onChange={setPolicyField("industrialPolicy")} help="Chips, energy, supply-chain resilience." swatch={POLICY_SWATCHES.industrialPolicy} onAskAtlas={onAskAtlas} />
          </div>
        </div>

        <div className="card">
          <h2 className="panel-title">Global pressure controls</h2>
          <p className="muted">Manual assumptions are blended with live-data adjustments.</p>
          <div className="slider-grid">
            <Slider label="Political polarization" value={stress.politicalPolarization} onChange={setStressField("politicalPolarization")} help="Implementation drag" />
            <Slider label="PAC pressure" value={stress.pacPressure} onChange={setStressField("pacPressure")} help="Organized interest resistance" />
            <Slider label="Public support" value={stress.publicSupport} onChange={setStressField("publicSupport")} help="Voter tolerance for reform" />
            <Slider label="Congress margin" value={stress.congressionalMargin} onChange={setStressField("congressionalMargin")} help="Legislative room" />
            <Slider label="Funding pressure" value={stress.fundingPressure} onChange={setStressField("fundingPressure")} help="Treasury/refinancing strain" />
            <Slider label="Conflict shock" value={stress.conflictShock} onChange={setStressField("conflictShock")} help="War and security pressure" />
            <Slider label="Disaster shock" value={stress.disasterShock} onChange={setStressField("disasterShock")} help="Disaster relief and resilience" />
            <Slider label="Trade disruption" value={stress.tradeDisruption} onChange={setStressField("tradeDisruption")} help="Tariffs and supply shocks" />
          </div>
        </div>
      </div>
    </>
  );
}
