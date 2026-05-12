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
  const H = 540;
  const padding = { left: 80, right: 240, top: 44, bottom: 60 };
  const yMin = 0;
  const yMax = 260;
  const MIN_LABEL_GAP = 22;

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

  // Lay reference-line labels out vertically with a minimum gap so the
  // clustered (100/105/119) labels stop overlapping. Walk top-down: each
  // label's labelY is at most (previous labelY + MIN_LABEL_GAP).
  const labels = useMemo(() => {
    const sorted = [...REFERENCE_LINES].sort((a, b) => b.value - a.value);
    let lastY = -Infinity;
    return sorted.map((ref) => {
      const lineY = yFor(ref.value);
      const labelY = Math.max(lineY, lastY + MIN_LABEL_GAP);
      lastY = labelY;
      return { ...ref, lineY, labelY };
    });
  }, [/* labels depend only on constants */]);

  const pathD = rows.map((row, i) => `${i === 0 ? "M" : "L"} ${xFor(row.year).toFixed(1)} ${yFor(row.debtToGdp).toFixed(1)}`).join(" ");

  const yTicks = [0, 50, 100, 150, 200, 250];
  const xTicks = [2026, 2031, 2036, 2041, 2046, 2051, 2056];

  const peak = rows.reduce((acc, r) => (r.debtToGdp > acc.debtToGdp ? r : acc), rows[0]);
  // Anchor the peak callout away from the right edge so it never clips.
  const peakX = Math.min(xFor(peak.year), W - padding.right - 20);
  const peakAnchor = peakX > W - padding.right - 50 ? "end" : "middle";

  const labelX = W - padding.right + 12; // labels sit in the right gutter
  const chartRightX = W - padding.right;

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
            <line x1={padding.left} y1={yFor(t)} x2={chartRightX} y2={yFor(t)} stroke="rgba(12,42,54,0.08)" strokeDasharray="2 4" />
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

        {/* reference lines (hover hits) */}
        {labels.map((ref) => {
          const isHover = hover === ref.id;
          return (
            <line
              key={`line-${ref.id}`}
              x1={padding.left}
              y1={ref.lineY}
              x2={chartRightX}
              y2={ref.lineY}
              stroke={isHover ? "#1f6b3a" : "#0c2a36"}
              strokeOpacity={isHover ? 1 : 0.45}
              strokeWidth={isHover ? 1.4 : 0.8}
              strokeDasharray="6 4"
              onMouseEnter={() => setHover(ref.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          );
        })}

        {/* user's projected debt path */}
        <path d={pathD} fill="none" stroke="#1f6b3a" strokeWidth="2.4" />
        {rows.map((row, i) => (
          i % 5 === 0 ? (
            <circle key={row.year} cx={xFor(row.year)} cy={yFor(row.debtToGdp)} r="3" fill="#1f6b3a" />
          ) : null
        ))}

        {/* reference labels in the right gutter, staggered + leader lines */}
        {labels.map((ref) => {
          const isHover = hover === ref.id;
          return (
            <g
              key={`label-${ref.id}`}
              onMouseEnter={() => setHover(ref.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* leader from line endpoint to label baseline */}
              <line
                x1={chartRightX}
                y1={ref.lineY}
                x2={labelX - 6}
                y2={ref.labelY - 4}
                stroke={isHover ? "#1f6b3a" : "rgba(12,42,54,0.4)"}
                strokeWidth="0.6"
              />
              {/* label background pill for legibility */}
              <rect
                x={labelX - 6}
                y={ref.labelY - 14}
                width={padding.right - 18}
                height="19"
                fill={isHover ? "#1f6b3a" : "rgba(234,240,226,0.95)"}
                stroke={isHover ? "#1f6b3a" : "rgba(12,42,54,0.15)"}
                strokeWidth="0.5"
              />
              <text
                x={labelX}
                y={ref.labelY - 1}
                textAnchor="start"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                letterSpacing="0.08em"
                fill={isHover ? "#eaf0e2" : "#0c2a36"}
                style={{ textTransform: "uppercase", fontWeight: 600 }}
              >
                {ref.value}% · {ref.label}
              </text>
            </g>
          );
        })}

        {/* peak callout */}
        {peak && (
          <g>
            <circle cx={xFor(peak.year)} cy={yFor(peak.debtToGdp)} r="6" fill="#0c2a36" stroke="#eaf0e2" strokeWidth="1.5" />
            <line x1={xFor(peak.year)} y1={yFor(peak.debtToGdp) - 6} x2={peakX} y2={yFor(peak.debtToGdp) - 24} stroke="#0c2a36" strokeWidth="0.8" />
            <text x={peakX} y={yFor(peak.debtToGdp) - 30} textAnchor={peakAnchor} fontFamily="Fraunces, serif" fontWeight="500" fontSize="14" fill="#0c2a36">
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
