import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const baseline = {
  startYear: 2026,
  endYear: 2056,
  gdp2026: 32.0,
  debtToGdp2026: 101,
  deficitToGdp2026: 5.8,
  deficitToGdp2036: 6.7,
};

const initialPolicy = {
  revenueReform: 35,
  discretionaryCuts: 18,
  healthcareEfficiency: 28,
  socialSecurityReform: 22,
  defensePosture: 50,
  climateResilience: 30,
  industrialPolicy: 20,
};

const initialStress = {
  politicalPolarization: 58,
  pacPressure: 45,
  publicSupport: 55,
  congressionalMargin: 40,
  fundingPressure: 42,
  conflictShock: 30,
  disasterShock: 35,
  tradeDisruption: 25,
};

const regionTemplates = [
  { id: "north-america", label: "North America", lat: 39, lon: -100, short: "Domestic transmission", channels: ["Treasury refinancing", "Disaster relief", "Polarization drag"] },
  { id: "europe", label: "Europe", lat: 50, lon: 15, short: "Alliance pressure", channels: ["Defense support", "Energy prices", "Financial contagion"] },
  { id: "middle-east", label: "Middle East", lat: 28, lon: 45, short: "Energy and security", channels: ["Oil shock", "Shipping lanes", "Defense surge"] },
  { id: "east-asia", label: "East Asia", lat: 35, lon: 120, short: "Trade and chips", channels: ["Semiconductors", "Trade flows", "Industrial subsidies"] },
  { id: "latin-america", label: "Latin America", lat: -15, lon: -65, short: "Migration and commodities", channels: ["Migration", "Food prices", "Aid spending"] },
  { id: "africa", label: "Africa", lat: 6, lon: 20, short: "Humanitarian load", channels: ["Food insecurity", "Humanitarian aid", "Climate stress"] },
  { id: "arctic", label: "Arctic / Climate Belt", lat: 74, lon: 0, short: "Climate tail risk", channels: ["Extreme weather", "Infrastructure", "Insurance losses"] },
];

const continentPolygons = [
  [[-168,72],[-150,72],[-134,64],[-124,50],[-123,36],[-111,26],[-95,18],[-82,25],[-68,44],[-82,56],[-105,68],[-140,74],[-168,72]],
  [[-81,12],[-70,8],[-59,-5],[-50,-18],[-54,-34],[-63,-53],[-76,-42],[-82,-14],[-81,12]],
  [[-60,82],[-34,76],[-25,67],[-40,60],[-55,66],[-60,82]],
  [[-10,36],[5,44],[20,58],[42,63],[70,60],[95,56],[120,46],[145,35],[132,18],[108,9],[83,16],[61,24],[40,34],[20,38],[5,42],[-10,36]],
  [[-17,35],[2,37],[18,32],[32,20],[39,2],[34,-16],[24,-33],[8,-35],[-5,-20],[-12,2],[-17,20],[-17,35]],
  [[111,-11],[132,-10],[153,-27],[146,-43],[123,-39],[111,-23],[111,-11]],
];

const governmentSources = [
  { id: "treasury-debt", label: "Debt to the Penny", agency: "Treasury", metricKey: "debtTrillions" },
  { id: "treasury-rates", label: "Avg Treasury rate", agency: "Treasury", metricKey: "avgTreasuryRate" },
  { id: "bls-cpi", label: "CPI inflation", agency: "BLS", metricKey: "cpiInflationYoY" },
  { id: "bls-unemployment", label: "Unemployment", agency: "BLS", metricKey: "unemploymentRate" },
  { id: "nws-alerts", label: "Weather alerts", agency: "NOAA/NWS", metricKey: "activeWeatherAlerts" },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fmtPct(value) {
  return `${Number(value).toFixed(1)}%`;
}

function fmtMoney(value) {
  return `$${Number(value).toFixed(1)}T`;
}

function riskLabel(value) {
  if (value >= 78) return "Severe";
  if (value >= 58) return "Elevated";
  if (value >= 38) return "Watch";
  return "Low";
}

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy) {
  const latRad = degToRad(lat);
  const lonRad = degToRad(lon + rotationDeg);
  const x3d = Math.cos(latRad) * Math.sin(lonRad);
  const y3d = Math.sin(latRad);
  const z3d = Math.cos(latRad) * Math.cos(lonRad);

  return {
    x: cx + x3d * radius,
    y: cy - y3d * radius,
    z: z3d,
    front: z3d > 0,
    scale: clamp(0.45 + z3d * 0.55, 0.18, 1),
  };
}

function makeLatitudeLine(lat) {
  const points = [];
  for (let lon = -180; lon <= 180; lon += 5) points.push([lon, lat]);
  return points;
}

function makeLongitudeLine(lon) {
  const points = [];
  for (let lat = -80; lat <= 80; lat += 4) points.push([lon, lat]);
  return points;
}

const latitudeLines = [-60, -30, 0, 30, 60].map(makeLatitudeLine);
const longitudeLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(makeLongitudeLine);

function buildProjectedLine(points, rotationDeg, radius, cx, cy) {
  let path = "";
  let started = false;
  for (const [lon, lat] of points) {
    const point = projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy);
    if (!point.front) {
      started = false;
      continue;
    }
    path += `${started ? "L" : "M"} ${point.x} ${point.y} `;
    started = true;
  }
  return path.trim();
}

function buildPolygonPath(points, rotationDeg, radius, cx, cy) {
  const projected = points
    .map(([lon, lat]) => projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy))
    .filter((point) => point.front);
  if (projected.length < 3) return "";
  return `${projected.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")} Z`;
}

function fiscalPolicyEffect(policy, stress, year) {
  const phaseIn = clamp((year - 2026) / 8, 0.1, 1);
  const revenueGain = (policy.revenueReform / 100) * 1.65 * phaseIn;
  const discretionarySavings = (policy.discretionaryCuts / 100) * 0.85 * phaseIn;
  const healthcareSavings = (policy.healthcareEfficiency / 100) * 1.15 * clamp((year - 2026) / 12, 0.05, 1);
  const socialSecuritySavings = (policy.socialSecurityReform / 100) * 1.05 * clamp((year - 2026) / 16, 0.02, 1);
  const defenseCost = ((policy.defensePosture - 50) / 50) * 0.45 * phaseIn;
  const industrialCost = (policy.industrialPolicy / 100) * 0.32 * phaseIn;
  const climateCostNow = (policy.climateResilience / 100) * 0.22 * phaseIn;
  const climateSavingsLater = (policy.climateResilience / 100) * 0.42 * clamp((year - 2034) / 12, 0, 1);
  const implementationHaircut = clamp(1 - (stress.politicalPolarization / 100) * 0.35 - (stress.pacPressure / 100) * 0.2, 0.35, 0.95);

  return (
    (revenueGain + discretionarySavings + healthcareSavings + socialSecuritySavings + climateSavingsLater) *
      implementationHaircut -
    defenseCost -
    industrialCost -
    climateCostNow
  );
}

function macroShockEffect(stress, year) {
  const conflict = (stress.conflictShock / 100) * 0.45;
  const disasters = (stress.disasterShock / 100) * 0.28;
  const trade = (stress.tradeDisruption / 100) * 0.38;
  const funding = (stress.fundingPressure / 100) * 0.52;
  const lateCycleAmplifier = 1 + Math.max(0, year - 2036) * 0.018;
  return (conflict + disasters + trade + funding) * lateCycleAmplifier;
}

function baselineDeficitToGdp(year) {
  if (year <= 2036) {
    return baseline.deficitToGdp2026 + ((baseline.deficitToGdp2036 - baseline.deficitToGdp2026) * (year - 2026)) / 10;
  }
  return baseline.deficitToGdp2036 + (year - 2036) * 0.09;
}

function runProjection(policy, stress) {
  const rows = [];
  let gdp = baseline.gdp2026;
  let debt = baseline.gdp2026 * (baseline.debtToGdp2026 / 100);

  for (let year = baseline.startYear; year <= baseline.endYear; year += 1) {
    const policyEffect = fiscalPolicyEffect(policy, stress, year);
    const shockEffect = macroShockEffect(stress, year);
    const debtRatioBefore = (debt / gdp) * 100;
    const interestFeedback = debtRatioBefore > 115 ? (debtRatioBefore - 115) * 0.018 : 0;
    const deficitToGdp = clamp(baselineDeficitToGdp(year) - policyEffect + shockEffect + interestFeedback, 1.2, 15);
    const deficit = gdp * (deficitToGdp / 100);
    debt += deficit;
    const debtToGdp = (debt / gdp) * 100;
    const nominalGrowth = clamp(0.042 - Math.max(0, debtToGdp - 105) * 0.0009 - (stress.tradeDisruption / 100) * 0.006, 0.018, 0.052);

    rows.push({
      year,
      gdp: Number(gdp.toFixed(2)),
      debt: Number(debt.toFixed(2)),
      deficit: Number(deficit.toFixed(2)),
      deficitToGdp: Number(deficitToGdp.toFixed(2)),
      debtToGdp: Number(debtToGdp.toFixed(2)),
      policyEffect: Number(policyEffect.toFixed(2)),
      shockEffect: Number(shockEffect.toFixed(2)),
    });

    gdp *= 1 + nominalGrowth;
  }
  return rows;
}

function passageProbability(policy, stress) {
  const pain =
    policy.revenueReform * 0.22 +
    policy.discretionaryCuts * 0.2 +
    policy.healthcareEfficiency * 0.12 +
    policy.socialSecurityReform * 0.3 +
    Math.abs(policy.defensePosture - 50) * 0.12;
  const support = stress.publicSupport * 0.45 + stress.congressionalMargin * 0.35;
  const resistance = stress.politicalPolarization * 0.35 + stress.pacPressure * 0.32 + pain * 0.28;
  return clamp(55 + support - resistance, 3, 94);
}

function fundingStressScore(rows, stress) {
  const last = rows[rows.length - 1];
  return clamp(stress.fundingPressure * 0.45 + (last.debtToGdp - 100) * 0.5 + last.deficitToGdp * 3.2, 0, 100);
}

function balanceScore(rows, probability, fundingStress) {
  const last = rows[rows.length - 1];
  return clamp(
    100 - (last.debtToGdp - 80) * 0.38 - last.deficitToGdp * 4 + probability * 0.15 - fundingStress * 0.15,
    0,
    100
  );
}

function applyRealDataToStress(manualStress, metrics = {}) {
  const next = { ...manualStress };

  if (Number.isFinite(metrics.debtTrillions)) {
    const debtToGdpProxy = (metrics.debtTrillions / baseline.gdp2026) * 100;
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, debtToGdpProxy - 105) * 0.32, 0, 100);
  }
  if (Number.isFinite(metrics.avgTreasuryRate)) {
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, metrics.avgTreasuryRate - 3.25) * 5.5, 0, 100);
  }
  if (Number.isFinite(metrics.cpiInflationYoY)) {
    next.tradeDisruption = clamp(next.tradeDisruption + Math.max(0, metrics.cpiInflationYoY - 2.2) * 3.5, 0, 100);
    next.fundingPressure = clamp(next.fundingPressure + Math.max(0, metrics.cpiInflationYoY - 2.5) * 2.5, 0, 100);
  }
  if (Number.isFinite(metrics.unemploymentRate)) {
    next.publicSupport = clamp(next.publicSupport - Math.max(0, metrics.unemploymentRate - 4.0) * 2.2, 0, 100);
    next.politicalPolarization = clamp(next.politicalPolarization + Math.max(0, metrics.unemploymentRate - 4.0) * 1.6, 0, 100);
  }
  if (Number.isFinite(metrics.activeWeatherAlerts)) {
    next.disasterShock = clamp(next.disasterShock + Math.min(22, metrics.activeWeatherAlerts / 18), 0, 100);
  }
  return next;
}

function buildRegionalData(policy, stress) {
  return regionTemplates.map((region) => {
    let variables;
    if (region.id === "north-america") {
      variables = {
        funding: clamp(stress.fundingPressure + 14, 0, 100),
        politics: clamp(stress.politicalPolarization + 18, 0, 100),
        disasters: clamp(stress.disasterShock + 6, 0, 100),
      };
    } else if (region.id === "middle-east") {
      variables = {
        conflict: clamp(stress.conflictShock + 22, 0, 100),
        energy: clamp(stress.tradeDisruption + 20, 0, 100),
        defense: clamp(policy.defensePosture + stress.conflictShock * 0.25, 0, 100),
      };
    } else if (region.id === "east-asia") {
      variables = {
        trade: clamp(stress.tradeDisruption + 24, 0, 100),
        semiconductors: clamp(stress.tradeDisruption + policy.industrialPolicy * 0.35, 0, 100),
        subsidies: clamp(policy.industrialPolicy + 14, 0, 100),
      };
    } else if (region.id === "arctic") {
      variables = {
        climate: clamp(stress.disasterShock + 22, 0, 100),
        infrastructure: clamp(policy.climateResilience + stress.disasterShock * 0.45, 0, 100),
        insurance: clamp(stress.fundingPressure + stress.disasterShock * 0.35, 0, 100),
      };
    } else {
      variables = {
        conflict: clamp(stress.conflictShock + 10, 0, 100),
        trade: clamp(stress.tradeDisruption + 10, 0, 100),
        disasters: clamp(stress.disasterShock + 10, 0, 100),
      };
    }

    const values = Object.values(variables);
    const impact = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    return {
      ...region,
      variables,
      impact,
      risk: riskLabel(impact),
      budgetDrag: Number((impact * 0.018).toFixed(2)),
    };
  });
}

function useGovernmentData() {
  const [state, setState] = useState({
    status: "loading",
    metrics: {},
    sources: governmentSources.map((source) => ({ ...source, status: "loading", display: "Loading..." })),
  });

  async function load() {
    setState((prev) => ({
      ...prev,
      status: "loading",
      sources: prev.sources.map((source) => ({ ...source, status: "loading", display: "Loading..." })),
    }));

    try {
      const response = await fetch("/api/government-metrics");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setState({ status: "live", metrics: data.metrics || {}, sources: data.sources || [] });
    } catch {
      setState({
        status: "offline",
        metrics: {
          debtTrillions: 36.2,
          avgTreasuryRate: 3.95,
          cpiInflationYoY: 3.1,
          unemploymentRate: 4.1,
          activeWeatherAlerts: 210,
        },
        sources: governmentSources.map((source) => ({
          ...source,
          status: "offline",
          display: "Demo fallback",
        })),
      });
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { ...state, refresh: load };
}

function useScenarioPersistence(snapshot) {
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [status, setStatus] = useState("loading");

  async function loadScenarios() {
    try {
      const response = await fetch("/api/scenarios");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSavedScenarios(data.scenarios || []);
      setStatus("backend");
    } catch {
      setSavedScenarios(JSON.parse(localStorage.getItem("fiscal-scenarios") || "[]"));
      setStatus("local-demo");
    }
  }

  async function saveCurrentScenario() {
    try {
      const response = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const scenario = await response.json();
      setSavedScenarios((prev) => [scenario, ...prev]);
      setStatus("backend");
    } catch {
      const scenario = { id: `local-${Date.now()}`, createdAt: new Date().toISOString(), name: "Local demo scenario", ...snapshot };
      const next = [scenario, ...savedScenarios].slice(0, 8);
      localStorage.setItem("fiscal-scenarios", JSON.stringify(next));
      setSavedScenarios(next);
      setStatus("local-demo");
    }
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  return { savedScenarios, saveCurrentScenario, status };
}

function Slider({ label, value, help, onChange }) {
  return (
    <div className="slider">
      <div className="slider-row">
        <div>
          <label>{label}</label>
          <small>{help}</small>
        </div>
        <strong>{value}</strong>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

function Stat({ label, value, detail }) {
  return (
    <motion.div className="card stat" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="detail">{detail}</div>
    </motion.div>
  );
}

function GovernmentPanel({ govData, manualStress, derivedStress }) {
  const adjustments = Object.keys(derivedStress)
    .map((key) => ({ key, manual: manualStress[key], derived: derivedStress[key] }))
    .filter((item) => Math.round(item.manual) !== Math.round(item.derived));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start" }}>
        <div>
          <p className="muted" style={{ margin: 0 }}>Real-world data layer</p>
          <h2 className="panel-title">Server-side government API connectors</h2>
          <p className="muted">
            The frontend calls your backend. The backend then calls Treasury, BLS, and NOAA/NWS, caches results, and passes normalized metrics back to the simulator.
          </p>
        </div>
        <button className="btn" onClick={govData.refresh}>Refresh feeds</button>
      </div>

      <div className="api-grid">
        {govData.sources.map((source) => (
          <div className="api-tile" key={source.sourceId || source.id}>
            <div className="agency">{source.agency}</div>
            <strong>{source.label}</strong>
            <div className="api-value">{source.display}</div>
            <span className={`status ${source.status}`}>{source.status}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }} className="muted">
        <strong>Live-data stress adjustments:</strong>{" "}
        {adjustments.length === 0
          ? "No adjustment yet."
          : adjustments.map((item) => `${item.key}: ${Math.round(item.manual)} → ${Math.round(item.derived)}`).join(" · ")}
      </div>
    </div>
  );
}

function Globe({ regions, selectedRegionId, setSelectedRegionId, finalDeficit, score, fundingStress }) {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const cx = 330;
  const cy = 255;
  const radius = 180;
  const budgetPoint = { x: 760, y: 255 };

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = setInterval(() => setRotationDeg((prev) => (prev + 0.55) % 360), 40);
    return () => clearInterval(timer);
  }, [isPaused]);

  const projectedRegions = regions.map((region) => ({
    ...region,
    projected: projectSpherePoint(region.lat, region.lon, rotationDeg, radius, cx, cy),
  }));

  const selected = projectedRegions.find((region) => region.id === selectedRegionId) || projectedRegions[0];
  const visible = projectedRegions.filter((region) => region.projected.front);

  return (
    <div className="globe-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "start", marginBottom: 16 }}>
        <div>
          <span className="badge">3D spherical transmission model</span>
          <h2 className="panel-title" style={{ marginTop: 12 }}>World drivers of the U.S. budget</h2>
          <p className="dark-muted">A rotating globe showing how global shocks transmit into deficit, debt, and funding pressure.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, minWidth: 330 }}>
          <div className="score-card"><small>Balance</small><strong>{score.toFixed(0)}</strong></div>
          <div className="score-card"><small>Deficit</small><strong>{fmtPct(finalDeficit)}</strong></div>
          <div className="score-card"><small>Funding</small><strong>{fmtPct(fundingStress)}</strong></div>
        </div>
      </div>

      <div className="globe-layout">
        <div className="globe-stage" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <svg viewBox="0 0 1000 560">
            <defs>
              <radialGradient id="globeFill" cx="32%" cy="28%" r="70%">
                <stop offset="0%" stopColor="#1e3a5f" />
                <stop offset="52%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>
              <clipPath id="globeClip"><circle cx={cx} cy={cy} r={radius} /></clipPath>
            </defs>

            <rect width="1000" height="560" fill="#0f172a" />
            {[...Array(36)].map((_, index) => (
              <circle key={index} cx={(index * 71) % 965 + 12} cy={(index * 137) % 520 + 14} r={index % 4 === 0 ? 1.4 : 0.7} fill="rgba(226,232,240,0.55)" />
            ))}
            <circle cx={cx} cy={cy} r={radius + 18} fill="rgba(14,165,233,0.08)" />
            <circle cx={cx} cy={cy} r={radius} fill="url(#globeFill)" stroke="rgba(255,255,255,0.18)" />
            <circle cx={cx - 48} cy={cy - 68} r="54" fill="rgba(255,255,255,0.08)" />

            <g clipPath="url(#globeClip)">
              {latitudeLines.map((line, index) => {
                const d = buildProjectedLine(line, rotationDeg, radius, cx, cy);
                return d ? <path key={`lat-${index}`} d={d} fill="none" stroke="rgba(255,255,255,0.11)" /> : null;
              })}
              {longitudeLines.map((line, index) => {
                const d = buildProjectedLine(line, rotationDeg, radius, cx, cy);
                return d ? <path key={`lon-${index}`} d={d} fill="none" stroke="rgba(255,255,255,0.075)" /> : null;
              })}
              {continentPolygons.map((polygon, index) => {
                const d = buildPolygonPath(polygon, rotationDeg, radius, cx, cy);
                return d ? <path key={`continent-${index}`} d={d} fill="rgba(226,232,240,0.16)" stroke="rgba(255,255,255,0.13)" /> : null;
              })}
            </g>

            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.22)" />

            <circle cx={budgetPoint.x} cy={budgetPoint.y} r="72" fill="rgba(56,189,248,0.10)" />
            <circle cx={budgetPoint.x} cy={budgetPoint.y} r="48" fill="white" />
            <text x={budgetPoint.x} y={budgetPoint.y - 6} textAnchor="middle" fontSize="16" fontWeight="900" fill="#0f172a">U.S. Budget</text>
            <text x={budgetPoint.x} y={budgetPoint.y + 15} textAnchor="middle" fontSize="11" fontWeight="800" fill="#475569">impact node</text>

            {visible.map((region) => {
              const active = selected.id === region.id;
              const midX = (region.projected.x + budgetPoint.x) / 2;
              const midY = Math.min(region.projected.y, budgetPoint.y) - 55;
              const d = `M ${region.projected.x} ${region.projected.y} Q ${midX} ${midY} ${budgetPoint.x} ${budgetPoint.y}`;
              return (
                <path
                  key={`path-${region.id}`}
                  d={d}
                  fill="none"
                  stroke={active ? "rgba(251,191,36,0.95)" : "rgba(125,211,252,0.68)"}
                  strokeWidth={active ? 3.4 : 2}
                  strokeDasharray="8 10"
                  strokeLinecap="round"
                >
                  <animate attributeName="stroke-dashoffset" from="0" to="-36" dur={active ? "1.1s" : "2.0s"} repeatCount="indefinite" />
                </path>
              );
            })}

            {visible.map((region) => {
              const active = selected.id === region.id;
              const { x, y, scale } = region.projected;
              return (
                <g key={region.id} onClick={() => setSelectedRegionId(region.id)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={(16 + region.impact * 0.13) * scale} fill={active ? "rgba(251,191,36,0.18)" : "rgba(125,211,252,0.12)"} />
                  <circle cx={x} cy={y} r={(active ? 10.5 : 8) * scale} fill={active ? "#fbbf24" : "#e2e8f0"} />
                  <text x={x + 14} y={y - 8} fontSize="12" fontWeight="900" fill="white">{region.label}</text>
                  <text x={x + 14} y={y + 8} fontSize="10" fill="rgba(226,232,240,0.78)">{region.short} · {region.impact}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="side-panel">
          <p className="dark-muted" style={{ margin: 0 }}>Selected node</p>
          <h2 style={{ marginTop: 4 }}>{selected.label}</h2>
          <span className="badge">{selected.risk}</span>
          <div className="grid2" style={{ marginTop: 18 }}>
            <div className="score-card"><small>Impact</small><strong>{selected.impact}</strong></div>
            <div className="score-card"><small>Budget drag</small><strong>{selected.budgetDrag}</strong></div>
          </div>
          <div style={{ marginTop: 18 }}>
            {Object.entries(selected.variables).map(([key, value]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 12, fontWeight: 900 }}>
                  <span>{key.toUpperCase()}</span><span>{Math.round(value)}</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,.1)", borderRadius: 99, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ height: "100%", width: `${value}%`, background: "white" }} />
                </div>
              </div>
            ))}
          </div>
          <p className="dark-muted">Channels: {selected.channels.join(", ")}</p>
        </div>
      </div>
    </div>
  );
}

function Controls({ policy, stress, setPolicy, setStress }) {
  const setPolicyField = (field) => (value) => setPolicy((prev) => ({ ...prev, [field]: value }));
  const setStressField = (field) => (value) => setStress((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="grid2">
      <div className="card">
        <h2 className="panel-title">Fiscal policy levers</h2>
        <p className="muted">Change the policy package and watch the debt path respond.</p>
        <div className="slider-grid">
          <Slider label="Revenue reform" value={policy.revenueReform} onChange={setPolicyField("revenueReform")} help="Base broadening and rate changes" />
          <Slider label="Discretionary cuts" value={policy.discretionaryCuts} onChange={setPolicyField("discretionaryCuts")} help="Annual appropriations and agency budgets" />
          <Slider label="Healthcare efficiency" value={policy.healthcareEfficiency} onChange={setPolicyField("healthcareEfficiency")} help="Medicare payment and care reforms" />
          <Slider label="Social Security reform" value={policy.socialSecurityReform} onChange={setPolicyField("socialSecurityReform")} help="Benefit formula and payroll cap" />
          <Slider label="Defense posture" value={policy.defensePosture} onChange={setPolicyField("defensePosture")} help="50 is neutral; higher costs more" />
          <Slider label="Climate resilience" value={policy.climateResilience} onChange={setPolicyField("climateResilience")} help="Near-term cost, later savings" />
          <Slider label="Industrial policy" value={policy.industrialPolicy} onChange={setPolicyField("industrialPolicy")} help="Chips, energy, manufacturing" />
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">Global stress controls</h2>
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
  );
}

function Charts({ rows, regions }) {
  return (
    <div className="grid2">
      <div className="card">
        <h2 className="panel-title">Debt and deficit path</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="debtToGdp" name="Debt / GDP" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="deficitToGdp" name="Deficit / GDP" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">Regional impact</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-10} height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="impact" name="Impact score" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">Federal deficit dollars</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => fmtMoney(value)} />
              <Area type="monotone" dataKey="deficit" name="Annual deficit" strokeWidth={3} fillOpacity={0.18} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">What this satisfies</h2>
        <p className="muted">
          Frontend: interactive React UI with charts and globe. Backend: Express API. Database:
          Prisma + SQLite scenario persistence. External APIs: Treasury, BLS, and NOAA/NWS called
          from the server.
        </p>
      </div>
    </div>
  );
}

function PersistencePanel({ persistence }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
        <div>
          <h2 className="panel-title">Saved scenario runs</h2>
          <p className="muted">Persistence mode: <strong>{persistence.status}</strong>. Use the backend database for the final demo.</p>
        </div>
        <button className="btn" onClick={persistence.saveCurrentScenario}>Save run</button>
      </div>
      <div className="saved-list">
        {persistence.savedScenarios.length === 0 ? (
          <div className="saved-item">No saved scenarios yet.</div>
        ) : (
          persistence.savedScenarios.slice(0, 5).map((scenario) => (
            <div className="saved-item" key={scenario.id}>
              <strong>{scenario.name || "Saved scenario"}</strong>
              <div>{new Date(scenario.createdAt).toLocaleString()}</div>
              <div>Balance {scenario.summary?.fiscalBalanceScore ?? "n/a"} · Debt 2056 {scenario.summary?.debtToGdp2056 ?? "n/a"}%</div>
            </div>
          ))
        )}
      </div>
    </div>
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
    liveData: govData,
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
              and political constraints compound into U.S. deficits and debt.
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
        <Globe regions={regions} selectedRegionId={selectedRegionId} setSelectedRegionId={setSelectedRegionId} finalDeficit={final.deficitToGdp} finalDebt={final.debtToGdp} score={score} fundingStress={fundingStress} />
        <Controls policy={policy} stress={stress} setPolicy={setPolicy} setStress={setStress} />
        <Charts rows={rows} regions={regions} />
      </div>
    </main>
  );
}
