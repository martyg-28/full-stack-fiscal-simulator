import React, { useState } from "react";
import { AXIS_LABELS } from "../lib/scoreAxes.js";

const AXIS_ORDER = ["sustainability", "politicalViability", "growth", "socialResilience", "shockReadiness"];

export default function TradeoffRadar({ axes, onAskAtlas }) {
  const [hover, setHover] = useState(null);
  const W = 460;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const radius = 130;
  const n = AXIS_ORDER.length;

  function point(axisIndex, value) {
    const angle = (Math.PI * 2 * axisIndex) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  }

  const polygon = AXIS_ORDER.map((id, i) => point(i, axes[id]).join(",")).join(" ");

  return (
    <div className="map-stage" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tradeoff radar">
        {/* rings */}
        {[25, 50, 75, 100].map((pct) => {
          const ringPolygon = AXIS_ORDER.map((_, i) => point(i, pct).join(",")).join(" ");
          return (
            <polygon
              key={pct}
              points={ringPolygon}
              fill="none"
              stroke="rgba(12,42,54,0.10)"
              strokeDasharray={pct === 100 ? "0" : "2 4"}
            />
          );
        })}

        {/* axis spokes + labels */}
        {AXIS_ORDER.map((id, i) => {
          const [x, y] = point(i, 100);
          const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
          const lx = cx + Math.cos(angle) * (radius + 28);
          const ly = cy + Math.sin(angle) * (radius + 28);
          const isHover = hover === id;
          return (
            <g key={id}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(12,42,54,0.12)" strokeDasharray="2 5" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                letterSpacing="0.12em"
                fontWeight="500"
                fill={isHover ? "#1f6b3a" : "#2a4756"}
                style={{ textTransform: "uppercase", cursor: "pointer" }}
                onMouseEnter={() => setHover(id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onAskAtlas?.(`Explain the ${AXIS_LABELS[id]} axis in my current run.`)}
              >
                {AXIS_LABELS[id]}
              </text>
            </g>
          );
        })}

        {/* data polygon */}
        <polygon points={polygon} fill="rgba(31,107,58,0.22)" stroke="#1f6b3a" strokeWidth="1.6" />

        {/* point handles */}
        {AXIS_ORDER.map((id, i) => {
          const [x, y] = point(i, axes[id]);
          const isHover = hover === id;
          return (
            <g key={`pt-${id}`}>
              <circle cx={x} cy={y} r={isHover ? 6 : 4} fill="#0c2a36" stroke="#eaf0e2" strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="map-tooltip">
          <strong>{AXIS_LABELS[hover]}</strong>
          <p>{describeAxis(hover, axes[hover])}</p>
          <span>{axes[hover]} / 100</span>
        </div>
      )}
    </div>
  );
}

function describeAxis(axisId, value) {
  const tier = value >= 70 ? "Strong" : value >= 40 ? "Moderate" : "Weak";
  const desc = {
    sustainability:     "Long-run debt and deficit trajectory.",
    politicalViability: "Likelihood the package can actually pass.",
    growth:             "Investment plus low trade disruption.",
    socialResilience:   "Public services and support held intact.",
    shockReadiness:     "Capacity to absorb conflict, disaster, and trade shocks.",
  }[axisId];
  return `${tier}. ${desc}`;
}
