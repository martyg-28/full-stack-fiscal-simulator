import React, { useEffect, useRef, useState } from "react";
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
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startRotation: 0 });
  const cx = 330;
  const cy = 255;
  const radius = 180;
  const budgetPoint = { x: 760, y: 255 };

  useEffect(() => {
    if (isPaused || isDragging) return undefined;
    const timer = setInterval(() => setRotationDeg((prev) => (prev + 0.55) % 360), 40);
    return () => clearInterval(timer);
  }, [isPaused, isDragging]);

  function onPointerDown(e) {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startRotation: rotationDeg };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    // ~360deg per full-stage width (≈700px). Tuned for natural feel.
    setRotationDeg(((dragRef.current.startRotation + dx * 0.5) % 360 + 360) % 360);
  }
  function onPointerUp(e) {
    setIsDragging(false);
    e.currentTarget?.releasePointerCapture?.(e.pointerId);
  }

  const projectedRegions = regions.map((region) => ({
    ...region,
    projected: projectSpherePoint(region.lat, region.lon, rotationDeg, radius, cx, cy),
  }));

  const selected = projectedRegions.find((r) => r.id === selectedRegionId) || projectedRegions[0];
  const visible = projectedRegions.filter((r) => r.projected.front);

  return (
    <div className="globe-card">
      <div className="globe-layout">
        <div
          className="globe-stage"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none" }}
        >
          <svg viewBox="0 0 1000 560">
            <defs>
              <radialGradient id="globeFill" cx="32%" cy="28%" r="70%">
                <stop offset="0%" stopColor="#ebe1cd" />
                <stop offset="52%" stopColor="#ddd1b8" />
                <stop offset="100%" stopColor="#c8baa1" />
              </radialGradient>
              <clipPath id="globeClip"><circle cx={cx} cy={cy} r={radius} /></clipPath>
            </defs>

            <rect width="1000" height="560" fill="#ebe1cd" />
            {[...Array(36)].map((_, index) => (
              <circle key={index} cx={(index * 71) % 965 + 12} cy={(index * 137) % 520 + 14} r={index % 4 === 0 ? 1.4 : 0.7} fill="rgba(226,232,240,0.55)" />
            ))}
            <circle cx={cx} cy={cy} r={radius + 18} fill="rgba(14,165,233,0.08)" />
            <circle cx={cx} cy={cy} r={radius} fill="url(#globeFill)" stroke="rgba(255,255,255,0.18)" />
            <circle cx={cx - 48} cy={cy - 68} r="54" fill="rgba(255,255,255,0.08)" />

            <g clipPath="url(#globeClip)">
              {latitudeLines.map((line, index) => {
                const d = buildProjectedLine(line, rotationDeg, radius, cx, cy);
                return d ? <path key={`lat-${index}`} d={d} fill="none" stroke="rgba(28,26,23,0.12)" /> : null;
              })}
              {longitudeLines.map((line, index) => {
                const d = buildProjectedLine(line, rotationDeg, radius, cx, cy);
                return d ? <path key={`lon-${index}`} d={d} fill="none" stroke="rgba(28,26,23,0.08)" /> : null;
              })}
              {continentPolygons.map((polygon, index) => {
                const d = buildPolygonPath(polygon, rotationDeg, radius, cx, cy);
                return d ? <path key={`continent-${index}`} d={d} fill="rgba(74,90,58,0.30)" stroke="rgba(74,90,58,0.7)" /> : null;
              })}
            </g>

            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(28,26,23,0.4)" />

            <circle cx={budgetPoint.x} cy={budgetPoint.y} r="60" fill="none" stroke="rgba(28,26,23,0.3)" strokeDasharray="2 4" />
            <circle cx={budgetPoint.x} cy={budgetPoint.y} r="36" fill="#1c1a17" />
            <text x={budgetPoint.x} y={budgetPoint.y - 2} textAnchor="middle" fontFamily="Fraunces, serif" fontSize="14" fontWeight="500" fill="#f4ede0">U.S.</text>
            <text x={budgetPoint.x} y={budgetPoint.y + 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="0.14em" fill="#f4ede0">BUDGET</text>

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
                  stroke={active ? "#b9572f" : "rgba(28,26,23,0.35)"}
                  strokeWidth={active ? 1.8 : 0.9}
                  strokeDasharray={active ? "0" : "5 6"}
                  strokeLinecap="round"
                />
              );
            })}

            {visible.map((region) => {
              const active = selected.id === region.id;
              const { x, y, scale } = region.projected;
              return (
                <g key={region.id} onClick={() => setSelectedRegionId(region.id)} style={{ cursor: "pointer" }}>
                  <circle cx={x} cy={y} r={(12 + region.impact * 0.10) * scale} fill={active ? "rgba(185,87,47,0.16)" : "rgba(28,26,23,0.06)"} />
                  <circle cx={x} cy={y} r={(active ? 8 : 6) * scale} fill={active ? "#b9572f" : "#1c1a17"} stroke="#f4ede0" strokeWidth="1.2" />
                  <text x={x + 12} y={y - 7} fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="0.10em" fill="#1c1a17" style={{ textTransform: "uppercase" }}>{region.label}</text>
                  <text x={x + 12} y={y + 7} fontFamily="Fraunces, serif" fontSize="11" fill="#4d4639">{region.short} · {region.impact}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="globe-strip">
          <div className="globe-strip-row">
            <span className="eyebrow"><span className="pip"></span>Selected · {selected.label}</span>
            <span className="muted" style={{ fontSize: 12 }}>
              {selected.risk} · Impact {selected.impact} · Budget drag {selected.budgetDrag}
            </span>
          </div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
            Channels: {selected.channels.join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}
