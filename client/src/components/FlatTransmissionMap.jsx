import React, { useState } from "react";
import { continentPolygons } from "../lib/regions.js";

// Equirectangular projection: lon ∈ [-180, 180] -> x ∈ [0, W]; lat ∈ [-90, 90] -> y ∈ [H, 0]
function project(lon, lat, W, H) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

function polygonPath(points, W, H) {
  return points.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat, W, H);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

// Smooth arc between two points biased upward.
function arcPath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - 60;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export default function FlatTransmissionMap({ regions, selectedRegionId, onSelectRegion }) {
  const W = 980;
  const H = 460;
  const [usX, usY] = project(-100, 39, W, H); // U.S. budget anchor
  const [hover, setHover] = useState(null);
  const hoverRegion = hover ? regions.find((r) => r.id === hover) : null;

  return (
    <div className="map-stage" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Flat world transmission map">
        <defs>
          <pattern id="paperTexture" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.4" fill="rgba(28,26,23,0.10)" />
          </pattern>
        </defs>

        <rect width={W} height={H} fill="url(#paperTexture)" />

        {/* graticule */}
        {[-60, -30, 0, 30, 60].map((lat) => {
          const [, y] = project(0, lat, W, H);
          return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="rgba(28,26,23,0.10)" strokeDasharray="2 4" />;
        })}
        {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
          const [x] = project(lon, 0, W, H);
          return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={H} stroke="rgba(28,26,23,0.08)" strokeDasharray="2 5" />;
        })}

        {/* equator + prime meridian (bolder) */}
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="rgba(28,26,23,0.22)" />
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(28,26,23,0.18)" />

        {/* continents */}
        {continentPolygons.map((poly, i) => (
          <path
            key={`c-${i}`}
            d={polygonPath(poly, W, H)}
            fill="rgba(74, 90, 58, 0.16)"
            stroke="#4a5a3a"
            strokeWidth="0.8"
          />
        ))}

        {/* U.S. budget anchor */}
        <circle cx={usX} cy={usY} r={14} fill="#1c1a17" />
        <circle cx={usX} cy={usY} r={20} fill="none" stroke="#1c1a17" strokeWidth="0.8" strokeDasharray="2 3" />
        <text x={usX} y={usY + 32} textAnchor="middle" fontFamily="Fraunces, serif" fontSize="13" fontWeight="500" fill="#1c1a17">
          U.S. Budget
        </text>

        {/* transmission arcs */}
        {regions.filter((r) => r.id !== "north-america").map((region) => {
          const [rx, ry] = project(region.lon, region.lat, W, H);
          const active = region.id === selectedRegionId;
          return (
            <path
              key={`arc-${region.id}`}
              d={arcPath(rx, ry, usX, usY)}
              fill="none"
              stroke={active ? "#b9572f" : "rgba(28,26,23,0.45)"}
              strokeWidth={active ? 1.8 : 0.9}
              strokeDasharray={active ? "0" : "4 5"}
            />
          );
        })}

        {/* region nodes */}
        {regions.map((region) => {
          const [rx, ry] = project(region.lon, region.lat, W, H);
          const active = region.id === selectedRegionId;
          const r = Math.max(5, Math.min(12, 4 + region.impact * 0.08));
          return (
            <g
              key={region.id}
              onClick={() => onSelectRegion?.(region.id)}
              onMouseEnter={() => setHover(region.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={rx} cy={ry} r={r + 5} fill="rgba(185,87,47,0.10)" />
              <circle cx={rx} cy={ry} r={r} fill={active ? "#b9572f" : "#1c1a17"} stroke="#f4ede0" strokeWidth="1.2" />
              <text
                x={rx + 10}
                y={ry - 6}
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fontWeight="500"
                letterSpacing="0.06em"
                fill="#1c1a17"
                style={{ textTransform: "uppercase" }}
              >
                {region.label}
              </text>
              <text
                x={rx + 10}
                y={ry + 7}
                fontFamily="Fraunces, serif"
                fontSize="11"
                fill="#4d4639"
              >
                Impact · {region.impact}
              </text>
            </g>
          );
        })}
      </svg>
      {hoverRegion && (
        <div className="map-tooltip">
          <strong>{hoverRegion.label} · {hoverRegion.risk}</strong>
          <p>{hoverRegion.short}. Channels: {hoverRegion.channels.join(", ")}.</p>
          <span>Impact {hoverRegion.impact} · budget drag {hoverRegion.budgetDrag}</span>
        </div>
      )}
    </div>
  );
}
