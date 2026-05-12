import React, { useMemo, useState } from "react";

// Hand-simplified U.S. silhouette in a 1000x520 canvas. Not cartographically
// precise — just recognizable enough to anchor the editorial style.
const US_OUTLINE = `
M 90 240 L 130 180 L 200 140 L 280 130 L 350 110 L 420 100 L 500 95
L 580 100 L 660 110 L 720 130 L 760 160 L 800 200
L 830 230 L 850 270 L 870 310 L 880 350 L 870 380 L 850 400
L 820 420 L 770 430 L 720 425 L 680 440 L 640 460 L 600 470 L 560 465
L 520 470 L 480 480 L 440 470 L 400 460 L 360 440 L 320 430 L 280 420
L 240 410 L 200 390 L 170 360 L 140 320 L 110 280 L 90 240 Z
`;

// Florida tongue
const US_FLORIDA = `M 720 420 L 740 440 L 760 470 L 770 490 L 760 500 L 745 490 L 730 470 L 720 440 Z`;

// Census-region anchors (approximate, in canvas coords aligned to silhouette).
const REGIONS = [
  { id: "northeast", label: "Northeast", x: 800, y: 220,
    blurb: "Financial center · Treasury bond market · alliance commitments anchor here.",
    pickStress: (s) => Math.round((s.politicalPolarization + s.fundingPressure) / 2) },
  { id: "south",     label: "South",     x: 670, y: 380,
    blurb: "Defense industry · disaster-prone coastline · large healthcare share.",
    pickStress: (s) => Math.round((s.disasterShock + s.conflictShock) / 2) },
  { id: "midwest",   label: "Midwest",   x: 530, y: 260,
    blurb: "Manufacturing · industrial policy heartland · trade-disruption exposure.",
    pickStress: (s) => Math.round((s.tradeDisruption + s.publicSupport * 0.4 + 30) / 2) },
  { id: "mountain",  label: "Mountain West", x: 350, y: 280,
    blurb: "Federal land · resource extraction · climate adaptation costs.",
    pickStress: (s) => Math.round((s.disasterShock + 30) / 2) },
  { id: "pacific",   label: "Pacific",   x: 175, y: 240,
    blurb: "Tech, trade with East Asia · climate insurance pressure.",
    pickStress: (s) => Math.round((s.tradeDisruption + s.disasterShock) / 2) },
];

// DC anchor (Treasury / Congress / Fed)
const DC = { x: 800, y: 280 };

export default function USPressureMap({ govData, derivedStress }) {
  const [hover, setHover] = useState(null);

  const metrics = govData?.metrics || {};
  const alerts = metrics.activeWeatherAlerts;
  const debt = metrics.debtTrillions;
  const rate = metrics.avgTreasuryRate;
  const cpi  = metrics.cpiInflationYoY;
  const unrate = metrics.unemploymentRate;

  const regionData = useMemo(
    () => REGIONS.map((r) => ({ ...r, pressure: r.pickStress(derivedStress || {}) })),
    [derivedStress]
  );

  return (
    <div className="map-stage" style={{ position: "relative" }}>
      <svg viewBox="0 0 1000 560" role="img" aria-label="U.S. pressure map">
        <defs>
          <pattern id="usPaper" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="rgba(12,42,54,0.10)" />
          </pattern>
        </defs>

        <rect width="1000" height="560" fill="url(#usPaper)" />

        {/* graticule */}
        {[120, 200, 280, 360, 440].map((y) => (
          <line key={`hl-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="rgba(12,42,54,0.06)" strokeDasharray="2 5" />
        ))}
        {[200, 350, 500, 650, 800].map((x) => (
          <line key={`vl-${x}`} x1={x} y1="0" x2={x} y2="560" stroke="rgba(12,42,54,0.06)" strokeDasharray="2 5" />
        ))}

        {/* silhouette */}
        <path d={US_OUTLINE} fill="rgba(31,107,58,0.18)" stroke="#1f6b3a" strokeWidth="1.2" />
        <path d={US_FLORIDA} fill="rgba(31,107,58,0.18)" stroke="#1f6b3a" strokeWidth="1" />

        {/* DC federal anchor */}
        <line x1={DC.x} y1={DC.y - 30} x2={DC.x} y2={DC.y - 10} stroke="#0c2a36" strokeWidth="0.8" />
        <circle cx={DC.x} cy={DC.y} r="10" fill="#0c2a36" />
        <text x={DC.x + 14} y={DC.y - 4} fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.14em" fill="#0c2a36" style={{ textTransform: "uppercase" }}>
          DC · Treasury / Fed / Congress
        </text>
        <text x={DC.x + 14} y={DC.y + 9} fontFamily="Fraunces, serif" fontSize="11" fill="#2a4756">
          {Number.isFinite(rate) ? `${rate.toFixed(2)}% avg rate` : "rate offline"}
          {Number.isFinite(debt) ? ` · $${debt.toFixed(1)}T debt` : ""}
        </text>

        {/* live NWS alerts banner */}
        {Number.isFinite(alerts) && (
          <g>
            <rect x="40" y="40" width="220" height="62" fill="#0c2a36" />
            <text x="56" y="62" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.18em" fill="#a8baa4" style={{ textTransform: "uppercase" }}>
              Live · NOAA / NWS
            </text>
            <text x="56" y="86" fontFamily="Fraunces, serif" fontWeight="500" fontSize="22" fill="#eaf0e2">
              {alerts} active alerts
            </text>
          </g>
        )}

        {/* macro indicators along bottom */}
        {[
          { label: "CPI YoY",      value: Number.isFinite(cpi)    ? `${cpi.toFixed(1)}%` : "—", x: 60 },
          { label: "Unemployment", value: Number.isFinite(unrate) ? `${unrate.toFixed(1)}%` : "—", x: 220 },
          { label: "Treasury",     value: Number.isFinite(rate)   ? `${rate.toFixed(2)}%` : "—", x: 380 },
          { label: "Debt",         value: Number.isFinite(debt)   ? `$${debt.toFixed(1)}T` : "—", x: 540 },
        ].map((item) => (
          <g key={item.label}>
            <line x1={item.x} y1="500" x2={item.x + 140} y2="500" stroke="#0c2a36" strokeWidth="0.6" />
            <text x={item.x} y="516" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.14em" fill="#5e7480" style={{ textTransform: "uppercase" }}>
              {item.label}
            </text>
            <text x={item.x} y="540" fontFamily="Fraunces, serif" fontSize="20" fontWeight="500" fill="#0c2a36">
              {item.value}
            </text>
          </g>
        ))}

        {/* region markers */}
        {regionData.map((r) => {
          const radius = 8 + (r.pressure || 0) * 0.10;
          const isHover = hover === r.id;
          return (
            <g
              key={r.id}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={r.x} cy={r.y} r={radius + 8} fill="rgba(31,107,58,0.10)" />
              <circle cx={r.x} cy={r.y} r={radius} fill={isHover ? "#1f6b3a" : "#0c2a36"} stroke="#eaf0e2" strokeWidth="1.4" />
              <text x={r.x + radius + 6} y={r.y - 6} fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.10em" fill="#0c2a36" style={{ textTransform: "uppercase" }}>
                {r.label}
              </text>
              <text x={r.x + radius + 6} y={r.y + 8} fontFamily="Fraunces, serif" fontSize="12" fill="#2a4756">
                Pressure · {r.pressure}
              </text>
            </g>
          );
        })}
      </svg>

      {hover && (
        <div className="map-tooltip">
          <strong>{regionData.find((x) => x.id === hover)?.label}</strong>
          <p>{regionData.find((x) => x.id === hover)?.blurb}</p>
          <span>Composite pressure index: {regionData.find((x) => x.id === hover)?.pressure}</span>
        </div>
      )}
    </div>
  );
}
