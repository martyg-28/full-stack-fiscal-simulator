import React, { useMemo, useState } from "react";

// Hand-simplified U.S. silhouette in a 1000x560 canvas. Goal is recognizability,
// not precision: Pacific Northwest indent, California bend, Texas bulge, Gulf
// coast, Florida peninsula, Carolinas, Maine corner, Great Lakes notch.
const US_OUTLINE = `
M 145 145
L 175 140 L 220 135 L 280 130 L 340 130 L 400 132 L 460 134
L 500 165
L 540 132 L 600 138 L 650 152 L 680 142 L 720 148 L 760 150
L 800 158 L 830 168
L 840 200 L 845 230 L 840 255
L 830 275 L 810 290 L 790 305 L 775 325 L 770 348 L 770 365
L 770 380
L 760 388 L 740 388
L 720 380 L 685 380 L 640 382 L 590 384 L 540 385 L 490 385
L 440 380 L 405 378
L 395 410 L 410 440 L 395 450 L 370 440 L 360 405
L 340 380
L 295 372 L 250 365 L 215 358
L 195 345 L 175 325
L 155 300 L 150 270 L 145 240 L 145 210 L 145 180
Z
`;

// Florida peninsula — a clearer tail off the Gulf coast.
const US_FLORIDA = `
M 690 380
L 700 410 L 710 445 L 716 475 L 712 495 L 700 498
L 692 478 L 686 445 L 682 420 L 680 395
Z
`;

// Census-region anchors over the new silhouette.
const REGIONS = [
  { id: "northeast", label: "Northeast", x: 770, y: 195,
    blurb: "Financial center · Treasury bond market · alliance commitments anchor here.",
    pickStress: (s) => Math.round((s.politicalPolarization + s.fundingPressure) / 2) },
  { id: "south",     label: "South",     x: 600, y: 340,
    blurb: "Defense industry · disaster-prone coastline · large healthcare share.",
    pickStress: (s) => Math.round((s.disasterShock + s.conflictShock) / 2) },
  { id: "midwest",   label: "Midwest",   x: 530, y: 220,
    blurb: "Manufacturing · industrial policy heartland · trade-disruption exposure.",
    pickStress: (s) => Math.round((s.tradeDisruption + s.publicSupport * 0.4 + 30) / 2) },
  { id: "mountain",  label: "Mountain West", x: 340, y: 245,
    blurb: "Federal land · resource extraction · climate adaptation costs.",
    pickStress: (s) => Math.round((s.disasterShock + 30) / 2) },
  { id: "pacific",   label: "Pacific",   x: 200, y: 240,
    blurb: "Tech, trade with East Asia · climate insurance pressure.",
    pickStress: (s) => Math.round((s.tradeDisruption + s.disasterShock) / 2) },
];

// DC anchor (Treasury / Congress / Fed) — east coast at the Chesapeake.
const DC = { x: 765, y: 248 };

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
