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
import { useGovernmentData } from "./hooks/useGovernmentData.js";
import { useScenarioPersistence } from "./hooks/useScenarioPersistence.js";
import Globe from "./components/Globe.jsx";
import GovernmentPanel from "./components/GovernmentPanel.jsx";
import Controls from "./components/Controls.jsx";
import Charts from "./components/Charts.jsx";
import PersistencePanel from "./components/PersistencePanel.jsx";

const initialPolicy = scenarioPresets[0].policy;
const initialStress = scenarioPresets[0].stress;

function Stat({ label, value, detail }) {
  return (
    <motion.div className="card stat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="detail">{detail}</div>
    </motion.div>
  );
}

export default function App() {
  const [policy, setPolicy] = useState(initialPolicy);
  const [stress, setStress] = useState(initialStress);
  const [selectedRegionId, setSelectedRegionId] = useState("middle-east");

  const govData = useGovernmentData();
  const derivedStress = useMemo(() => applyRealDataToStress(stress, govData.metrics), [stress, govData.metrics]);
  const rows = useMemo(() => runProjection(policy, derivedStress), [policy, derivedStress]);
  const final = rows[rows.length - 1];
  const tenYear = rows.find((row) => row.year === 2036);
  const probability = passageProbability(policy, derivedStress);
  const fundingStress = fundingStressScore(rows, derivedStress);
  const score = balanceScore(rows, probability, fundingStress);
  const regions = useMemo(() => buildRegionalData(policy, derivedStress), [policy, derivedStress]);
  const highestRiskRegion = [...regions].sort((a, b) => b.impact - a.impact)[0];

  const snapshot = {
    name: "Budget pressure scenario",
    policy,
    manualStress: stress,
    derivedStress,
    liveData: { status: govData.status, metrics: govData.metrics },
    regions,
    summary: {
      fiscalBalanceScore: Number(score.toFixed(1)),
      passageProbability: Number(probability.toFixed(1)),
      debtToGdp2036: tenYear?.debtToGdp,
      debtToGdp2056: final.debtToGdp,
      deficitToGdp2056: final.deficitToGdp,
      fundingStress: Number(fundingStress.toFixed(1)),
      highestRiskRegion: highestRiskRegion?.label,
    },
  };

  const persistence = useScenarioPersistence(snapshot);

  return (
    <main className="app">
      <div className="shell">
        <section className="hero">
          <div>
            <span className="badge">Full-stack fiscal risk simulator</span>
            <h1>3D Global Budget Pressure Map</h1>
            <p>
              Explore how global conflict, disasters, trade disruption, inflation, funding pressure,
              and political constraints compound into U.S. deficits and debt through 2056.
            </p>
          </div>
          <div className="score-card">
            <small>Fiscal balance score</small>
            <strong>{score.toFixed(0)}</strong>
          </div>
        </section>

        <section className="grid4">
          <Stat label="2036 debt / GDP" value={fmtPct(tenYear?.debtToGdp || 0)} detail="Ten-year fiscal checkpoint." />
          <Stat label="2056 debt / GDP" value={fmtPct(final.debtToGdp)} detail="Long-run debt path." />
          <Stat label="Passage probability" value={fmtPct(probability)} detail="Political viability proxy." />
          <Stat label="Highest risk node" value={highestRiskRegion?.label || "None"} detail={`${highestRiskRegion?.risk || "Low"} pressure source.`} />
        </section>

        <GovernmentPanel govData={govData} manualStress={stress} derivedStress={derivedStress} />
        <PersistencePanel persistence={persistence} />
        <Globe regions={regions} selectedRegionId={selectedRegionId} setSelectedRegionId={setSelectedRegionId} finalDeficit={final.deficitToGdp} score={score} fundingStress={fundingStress} />
        <Controls policy={policy} stress={stress} setPolicy={setPolicy} setStress={setStress} />
        <Charts rows={rows} regions={regions} />
      </div>
    </main>
  );
}
