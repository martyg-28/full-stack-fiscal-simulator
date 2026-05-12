import React, { useMemo, useState } from "react";

// Historical anchor lines. Sources are well-known peaks/troughs in U.S. and
// comparable advanced-economy debt-to-GDP history.
const REFERENCE_LINES = [
  { id: "japan",      value: 250, label: "Japan today",          note: "High-debt, low-rate equilibrium." },
  { id: "ww2",        value: 119, label: "U.S. WWII peak (1946)", note: "War-era debt; later eroded by growth." },
  { id: "eurozone",   value: 105, label: "Eurozone crisis avg.",  note: "Average of Greece/Italy/Spain peaks." },
  { id: "today",      value: 100, label: "U.S. today (≈2026)",    note: "Roughly current debt-to-GDP." },
  { id: "ninetiess",  value:  35, label: "U.S. 1990s low",        note: "Post-deficit-reduction trough." },
];

export default function HistoricalDebtChart({ rows }) {
  const [hover, setHover] = useState(null);

  const W = 1000;
  const H = 360;
  const padding = { left: 80, right: 60, top: 28, bottom: 50 };
  const yMin = 0;
  const yMax = 260;

  const xs = useMemo(() => {
    const startYear = rows[0]?.year ?? 2026;
    const endYear = rows.at(-1)?.year ?? 2056;
    return { startYear, endYear };
  }, [rows]);

  function xFor(year) {
    const { startYear, endYear } = xs;
    return padding.left + ((year - startYear) / (endYear - startYear)) * (W - padding.left - padding.right);
  }

  function yFor(value) {
    return padding.top + (1 - (value - yMin) / (yMax - yMin)) * (H - padding.top - padding.bottom);
  }

  const pathD = rows.map((row, i) => `${i === 0 ? "M" : "L"} ${xFor(row.year).toFixed(1)} ${yFor(row.debtToGdp).toFixed(1)}`).join(" ");

  const yTicks = [0, 50, 100, 150, 200, 250];
  const xTicks = [2026, 2031, 2036, 2041, 2046, 2051, 2056];

  const peak = rows.reduce((acc, r) => (r.debtToGdp > acc.debtToGdp ? r : acc), rows[0]);

  return (
    <div className="map-stage" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Historical debt reference">
        <defs>
          <pattern id="histPaper" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.4" fill="rgba(12,42,54,0.08)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#histPaper)" />

        {/* y axis */}
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={padding.left} y1={yFor(t)} x2={W - padding.right} y2={yFor(t)} stroke="rgba(12,42,54,0.08)" strokeDasharray="2 4" />
            <text x={padding.left - 10} y={yFor(t) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#5e7480">{t}%</text>
          </g>
        ))}

        {/* x axis */}
        {xTicks.map((y) => (
          <g key={y}>
            <line x1={xFor(y)} y1={padding.top} x2={xFor(y)} y2={H - padding.bottom} stroke="rgba(12,42,54,0.06)" strokeDasharray="2 5" />
            <text x={xFor(y)} y={H - padding.bottom + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#5e7480">{y}</text>
          </g>
        ))}

        {/* reference lines */}
        {REFERENCE_LINES.map((ref) => {
          const isHover = hover === ref.id;
          return (
            <g key={ref.id} onMouseEnter={() => setHover(ref.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <line
                x1={padding.left}
                y1={yFor(ref.value)}
                x2={W - padding.right}
                y2={yFor(ref.value)}
                stroke={isHover ? "#1f6b3a" : "#0c2a36"}
                strokeOpacity={isHover ? 1 : 0.45}
                strokeWidth={isHover ? 1.2 : 0.8}
                strokeDasharray="6 4"
              />
              <text x={W - padding.right - 6} y={yFor(ref.value) - 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.10em" fill={isHover ? "#1f6b3a" : "#2a4756"} style={{ textTransform: "uppercase" }}>
                {ref.label} · {ref.value}%
              </text>
            </g>
          );
        })}

        {/* user's projected debt path */}
        <path d={pathD} fill="none" stroke="#1f6b3a" strokeWidth="2.4" />
        {rows.map((row, i) => (
          i % 5 === 0 ? (
            <circle key={row.year} cx={xFor(row.year)} cy={yFor(row.debtToGdp)} r="3" fill="#1f6b3a" />
          ) : null
        ))}

        {/* peak callout */}
        {peak && (
          <g>
            <circle cx={xFor(peak.year)} cy={yFor(peak.debtToGdp)} r="6" fill="#0c2a36" stroke="#eaf0e2" strokeWidth="1.5" />
            <line x1={xFor(peak.year)} y1={yFor(peak.debtToGdp) - 6} x2={xFor(peak.year)} y2={yFor(peak.debtToGdp) - 22} stroke="#0c2a36" strokeWidth="0.8" />
            <text x={xFor(peak.year)} y={yFor(peak.debtToGdp) - 28} textAnchor="middle" fontFamily="Fraunces, serif" fontWeight="500" fontSize="13" fill="#0c2a36">
              Your peak · {Math.round(peak.debtToGdp)}% in {peak.year}
            </text>
          </g>
        )}
      </svg>

      {hover && (
        <div className="map-tooltip">
          <strong>{REFERENCE_LINES.find((r) => r.id === hover)?.label}</strong>
          <p>{REFERENCE_LINES.find((r) => r.id === hover)?.note}</p>
          <span>{REFERENCE_LINES.find((r) => r.id === hover)?.value}% debt / GDP</span>
        </div>
      )}
    </div>
  );
}
