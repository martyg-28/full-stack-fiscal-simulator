import React, { useEffect, useState } from "react";
import {
  projectSpherePoint,
  buildProjectedLine,
  buildPolygonPath,
  makeLatitudeLine,
  makeLongitudeLine,
} from "../lib/globeProjection.js";
import { continentPolygons } from "../lib/regions.js";
import { fmtPct } from "../lib/simulation.js";

const latitudeLines = [-60, -30, 0, 30, 60].map(makeLatitudeLine);
const longitudeLines = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180].map(makeLongitudeLine);

export default function Globe({ regions, selectedRegionId, setSelectedRegionId, finalDeficit, score, fundingStress }) {
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

  const selected = projectedRegions.find((r) => r.id === selectedRegionId) || projectedRegions[0];
  const visible = projectedRegions.filter((r) => r.projected.front);

  return (
    <div className="globe-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 20, alignItems: "start", marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <span className="badge">3D spherical transmission model</span>
          <h2 className="panel-title" style={{ marginTop: 12 }}>World drivers of the U.S. budget</h2>
          <p className="dark-muted">A rotating globe showing how global shocks transmit into deficit, debt, and funding pressure. Hover to pause.</p>
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
