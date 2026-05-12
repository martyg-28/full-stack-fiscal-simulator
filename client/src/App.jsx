import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  runProjection,
  applyRealDataToStress,
  passageProbability,
  fundingStressScore,
  balanceScore,
  fmtPct,
} from "./lib/simulation.js";
import { buildRegionalData } from "./lib/regions.js";
import { scenarioPresets } from "./lib/presets.js";
import { optionsDeficitDeltaPctGdp, selectedTenYearTotalBillions } from "./lib/policyOptions.js";
import { useGovernmentData } from "./hooks/useGovernmentData.js";
import { useScenarioPersistence } from "./hooks/useScenarioPersistence.js";
import Globe from "./components/Globe.jsx";
import GovernmentPanel from "./components/GovernmentPanel.jsx";
import Controls from "./components/Controls.jsx";
import Charts from "./components/Charts.jsx";
import PersistencePanel from "./components/PersistencePanel.jsx";
import PolicyOptionsPanel from "./components/PolicyOptionsPanel.jsx";
import ClassMissionCard from "./components/ClassMissionCard.jsx";
import AtlasMentor from "./components/AtlasMentor.jsx";
import EditorialMasthead from "./components/EditorialMasthead.jsx";
import FlatTransmissionMap from "./components/FlatTransmissionMap.jsx";
import USPressureMap from "./components/USPressureMap.jsx";
import HistoricalDebtChart from "./components/HistoricalDebtChart.jsx";
import Tutorial from "./components/Tutorial.jsx";
import RoleHUD from "./components/RoleHUD.jsx";
import TradeoffRadar from "./components/TradeoffRadar.jsx";
import ScenarioStory from "./components/ScenarioStory.jsx";
import PrecedentTimeline from "./components/PrecedentTimeline.jsx";
import { ROLES, rolesById } from "./lib/roles.js";
import { computeAxes } from "./lib/scoreAxes.js";

const initialPolicy = scenarioPresets[0].policy;
const initialStress = scenarioPresets[0].stress;

function DossierEntry({ figure, label, value, detail, onWhy }) {
  return (
    <motion.div className="entry" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <span className="figure-no">{figure}</span>
      <span className="label">{label}</span>
      <span className="value num">{value}</span>
      <span className="detail">{detail}</span>
      {onWhy && (
        <button type="button" className="why-btn" onClick={onWhy} title="Ask Atlas">
          Why?
        </button>
      )}
    </motion.div>
  );
}

function RegionList({ regions, selectedRegionId, onSelect }) {
  return (
    <div className="region-list">
      {regions.map((region, i) => (
        <button
          key={region.id}
          type="button"
          className={`region-cell ${region.id === selectedRegionId ? "active" : ""}`}
          onClick={() => onSelect(region.id)}
        >
          <span className="num-stamp">No. {String(i + 1).padStart(2, "0")} · {region.risk}</span>
          <strong>{region.label}</strong>
          <div className="ch">{region.short}</div>
          <div className="impact-row">
            <span className="num-stamp">Impact</span>
            <span className="impact-num num">{region.impact}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [policy, setPolicy] = useState(initialPolicy);
  const [stress, setStress] = useState(initialStress);
  const [selectedRegionId, setSelectedRegionId] = useState("middle-east");
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [externalAsk, setExternalAsk] = useState(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(ROLES[0].id);

  const govData = useGovernmentData();
  const derivedStress = useMemo(() => applyRealDataToStress(stress, govData.metrics), [stress, govData.metrics]);
  const optionsDelta = useMemo(() => optionsDeficitDeltaPctGdp(selectedOptionIds), [selectedOptionIds]);
  const rows = useMemo(
    () => runProjection(policy, derivedStress, optionsDelta),
    [policy, derivedStress, optionsDelta]
  );
  const final = rows[rows.length - 1];
  const tenYear = rows.find((row) => row.year === 2036);
  const probability = passageProbability(policy, derivedStress);
  const fundingStress = fundingStressScore(rows, derivedStress);
  const score = balanceScore(rows, probability, fundingStress);
  const regions = useMemo(() => buildRegionalData(policy, derivedStress), [policy, derivedStress]);
  const highestRiskRegion = [...regions].sort((a, b) => b.impact - a.impact)[0];
  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  const optionsTenYear = selectedTenYearTotalBillions(selectedOptionIds);
  const presetLabel = scenarioPresets.find((p) =>
    JSON.stringify(p.policy) === JSON.stringify(policy) && JSON.stringify(p.stress) === JSON.stringify(stress)
  )?.label;

  const selectedRole = rolesById[selectedRoleId] || ROLES[0];
  const roleContext = {
    policy,
    derivedStress,
    summary: {
      sustainabilityScore: Number(score.toFixed(1)),
      politicalViability: Number(probability.toFixed(1)),
      fundingStress: Number(fundingStress.toFixed(1)),
      debtToGdp2056: final.debtToGdp,
      deficitToGdp2056: final.deficitToGdp,
    },
  };
  const roleScore = selectedRole.score(roleContext);
  const tradeoffAxes = computeAxes(roleContext);

  const atlasContext = {
    policy,
    manualStress: stress,
    derivedStress,
    selectedRegion: selectedRegion?.label,
    selectedRole: selectedRole.label,
    scenarioPreset: presetLabel,
    summary: {
      sustainabilityScore: Number(score.toFixed(1)),
      politicalViability: Number(probability.toFixed(1)),
      debtToGdp2036: tenYear?.debtToGdp,
      debtToGdp2056: final.debtToGdp,
      deficitToGdp2056: final.deficitToGdp,
      fundingStress: Number(fundingStress.toFixed(1)),
      highestRiskRegion: highestRiskRegion?.label,
    },
  };

  function askAtlas(question, mode = "explain") {
    setExternalAsk({ question, mode, t: Date.now() });
  }

  const snapshot = {
    name: "Studium scenario",
    policy,
    manualStress: stress,
    derivedStress,
    liveData: { status: govData.status, metrics: govData.metrics },
    regions,
    selectedOptions: selectedOptionIds,
    summary: {
      fiscalBalanceScore: Number(score.toFixed(1)),
      sustainabilityScore: Number(score.toFixed(1)),
      politicalViability: Number(probability.toFixed(1)),
      passageProbability: Number(probability.toFixed(1)),
      debtToGdp2036: tenYear?.debtToGdp,
      debtToGdp2056: final.debtToGdp,
      deficitToGdp2056: final.deficitToGdp,
      fundingStress: Number(fundingStress.toFixed(1)),
      borrowingPressure: Number(fundingStress.toFixed(1)),
      highestRiskRegion: highestRiskRegion?.label,
      optionsTenYearBillions: optionsTenYear,
      optionsDeltaPctGdp: Number(optionsDelta.toFixed(2)),
    },
  };

  const persistence = useScenarioPersistence(snapshot);

  return (
    <main className="app">
      <EditorialMasthead onOpenTour={() => setTutorialOpen(true)} />

      <div className="shell">
        <section className="hero">
          <div>
            <span className="eyebrow"><span className="pip"></span>Vol. I — The Policy Simulation Studio</span>
            <h1 className="display">Policy Palette</h1>
            <p className="subtitle">Build policy. Stress-test tradeoffs. Debate the future.</p>
            <p className="lede">
              A classroom atlas for fiscal policy. Build a package, run it through global shocks,
              and trace the result across the long-run debt path — through 2056.
            </p>
            <div className="hero-cta">
              <button className="btn" onClick={() => setTutorialOpen(true)}>
                Take the tour
              </button>
              <button className="btn ghost" onClick={() => document.querySelector('.options-head')?.scrollIntoView({ behavior: "smooth" })}>
                Begin simulation
              </button>
              <button className="btn ghost" onClick={() => askAtlas("Give me a 30-minute teacher activity outline for this simulation.", "professor-prompt")}>
                Teacher guide
              </button>
            </div>
            <button className="tour-hint" onClick={() => setTutorialOpen(true)} type="button">
              New here? · 5-step walkthrough
            </button>
          </div>
          <div className="balance-card">
            <small>Sustainability score</small>
            <strong className="num">{score.toFixed(0)}</strong>
            <span className="balance-tag">Index, 0–100 · higher is more sustainable</span>
          </div>
        </section>

        <ClassMissionCard />

        <section className="dossier">
          <DossierEntry
            figure="fig. 01"
            label="Debt / GDP — 2036"
            value={fmtPct(tenYear?.debtToGdp || 0)}
            detail="Ten-year fiscal checkpoint."
            onWhy={() => askAtlas("Why did debt-to-GDP land where it did at 2036?")}
          />
          <DossierEntry
            figure="fig. 02"
            label="Debt / GDP — 2056"
            value={fmtPct(final.debtToGdp)}
            detail="Long-run debt trajectory."
            onWhy={() => askAtlas("Why is long-run debt at this level?")}
          />
          <DossierEntry
            figure="fig. 03"
            label="Political viability"
            value={fmtPct(probability)}
            detail="How politically realistic is this package."
            onWhy={() => askAtlas("Why is this hard to pass politically?")}
          />
          <DossierEntry
            figure="fig. 04"
            label="Borrowing pressure"
            value={fmtPct(fundingStress)}
            detail="Treasury funding stress index."
            onWhy={() => askAtlas("Explain borrowing pressure in this run.")}
          />
        </section>

        <div className="disclaimer">
          Studium is an exploratory classroom model · Not an official fiscal forecast
        </div>

        <RoleHUD
          selectedRoleId={selectedRoleId}
          setSelectedRoleId={setSelectedRoleId}
          policy={policy}
          roleScore={roleScore}
          onAskAtlas={askAtlas}
        />

        <section className="grid2">
          <div className="card">
            <div className="card-head">
              <div>
                <span className="eyebrow"><span className="pip"></span>Tradeoff radar</span>
                <h2 className="panel-title">Five axes, one shape</h2>
              </div>
            </div>
            <TradeoffRadar axes={tradeoffAxes} onAskAtlas={askAtlas} />
          </div>
          <ScenarioStory context={{ ...atlasContext, summary: { ...atlasContext.summary, ...tradeoffAxes } }} />
        </section>

        <GovernmentPanel govData={govData} manualStress={stress} derivedStress={derivedStress} onAskAtlas={askAtlas} />

        {/* ---------- Cartography: two maps side by side ---------- */}
        <section className="maps-grid">
          <div className="map-cell">
            <div className="map-label">Plate I · Transmission map</div>
            <h3>How world regions hit the U.S. budget</h3>
            <FlatTransmissionMap
              regions={regions}
              selectedRegionId={selectedRegionId}
              onSelectRegion={setSelectedRegionId}
            />
            <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Each arc is a channel of pressure — defense, energy, trade, climate. The highlighted
              region is selected on the right.
            </p>
          </div>
          <div className="map-cell">
            <div className="map-label">Plate II · Rotating globe (drag to spin)</div>
            <h3>{selectedRegion?.label || "Selected region"} · {selectedRegion?.risk || ""}</h3>
            <Globe
              regions={regions}
              selectedRegionId={selectedRegionId}
              setSelectedRegionId={setSelectedRegionId}
              finalDeficit={final.deficitToGdp}
              score={score}
              fundingStress={fundingStress}
            />
            <div className="map-controls">Auto-rotates · drag globe to take control · hover to pause</div>
          </div>
        </section>

        <section className="maps-grid">
          <div className="map-cell">
            <div className="map-label">Plate III · Domestic atlas</div>
            <h3>U.S. pressure points · live federal data</h3>
            <USPressureMap govData={govData} derivedStress={derivedStress} />
            <div className="map-controls">Hover a census region for context · DC anchors Treasury / Fed / Congress</div>
          </div>
          <div className="map-cell">
            <div className="map-label">Plate IV · Historical reference</div>
            <h3>Your debt path against four anchors</h3>
            <HistoricalDebtChart rows={rows} />
            <div className="map-controls">Hover a reference line for the historical episode</div>
          </div>
        </section>

        <PrecedentTimeline onAskAtlas={(q) => askAtlas(q, "historical-case")} />

        <section className="card">
          <div className="card-head">
            <div>
              <span className="eyebrow"><span className="pip"></span>Plate III · Regional dossier</span>
              <h2 className="panel-title">Pressure index by region</h2>
            </div>
            <p className="muted" style={{ maxWidth: 320, margin: 0 }}>
              Numbered cards. Select one to anchor the maps above.
            </p>
          </div>
          <RegionList regions={regions} selectedRegionId={selectedRegionId} onSelect={setSelectedRegionId} />
        </section>

        <PolicyOptionsPanel
          selectedOptionIds={selectedOptionIds}
          setSelectedOptionIds={setSelectedOptionIds}
          deltaPctGdp={optionsDelta}
        />
        <PersistencePanel persistence={persistence} />
        <Controls
          policy={policy}
          stress={stress}
          setPolicy={setPolicy}
          setStress={setStress}
          onAskAtlas={(leverLabel) => askAtlas(`Explain what happens when I change ${leverLabel} in this model.`)}
        />
        <Charts rows={rows} regions={regions} />
      </div>

      <AtlasMentor context={atlasContext} externalAsk={externalAsk} />
      <Tutorial forceOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </main>
  );
}
