import React, { useEffect, useState } from "react";

// Renders a horizontal timeline of historical precedents from the server's
// shared knowledge base. Click an entry to send Atlas straight to that case.

const FALLBACK_PRECEDENTS = [
  { id: "ww2-debt", title: "WWII debt buildup", period: "1941–1946", concept: "Wartime spending, postwar growth", year: 1944 },
  { id: "oil-shocks-70s", title: "1970s oil shocks", period: "1973–1980", concept: "Supply shocks fuel stagflation", year: 1976 },
  { id: "volcker", title: "Volcker disinflation", period: "1979–1982", concept: "Monetary tightening to break inflation", year: 1981 },
  { id: "ssa-1983", title: "Social Security reform", period: "1983", concept: "Bipartisan entitlement deal", year: 1983 },
  { id: "deficit-90s", title: "1990s deficit reduction", period: "1990–2000", concept: "Reform + growth = surplus", year: 1995 },
  { id: "gfc-2008", title: "2008 stimulus", period: "2008–2010", concept: "Countercyclical response", year: 2009 },
  { id: "debt-ceiling-2011", title: "2011 debt-ceiling crisis", period: "2011", concept: "Political risk pricing", year: 2011 },
  { id: "eurozone-debt", title: "Eurozone debt crisis", period: "2010–2015", concept: "Currency union austerity", year: 2012 },
  { id: "covid-relief", title: "COVID relief", period: "2020–2021", concept: "Emergency transfers", year: 2020 },
  { id: "chips-ira", title: "CHIPS / IRA", period: "2022", concept: "Modern industrial policy", year: 2022 },
];

function parseYear(period) {
  const m = String(period || "").match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

export default function PrecedentTimeline({ onAskAtlas }) {
  const [items, setItems] = useState(FALLBACK_PRECEDENTS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentor/precedents")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (cancelled || !Array.isArray(data?.precedents)) return;
        const enriched = data.precedents.map((p) => ({ ...p, year: parseYear(p.period) ?? 2000 }));
        setItems(enriched.sort((a, b) => a.year - b.year));
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const minYear = Math.min(...items.map((i) => i.year)) - 2;
  const maxYear = Math.max(...items.map((i) => i.year)) + 2;
  const W = 1000;
  const H = 240;
  const yLine = H / 2;
  function xFor(year) {
    return 60 + ((year - minYear) / (maxYear - minYear)) * (W - 120);
  }

  // Compute a "lane" (depth from the timeline) per event so dense clusters
  // ladder outward instead of stacking on top of each other. Even items go
  // above the line, odd go below; consecutive same-side items get pushed
  // further out.
  const sorted = [...items].sort((a, b) => a.year - b.year);
  const lanes = {};
  let aboveLane = 0;
  let belowLane = 0;
  let lastAboveX = -Infinity;
  let lastBelowX = -Infinity;
  const MIN_X_GAP = 110; // empirical: title length at the current font size
  sorted.forEach((p, idx) => {
    const above = idx % 2 === 0;
    const x = xFor(p.year);
    if (above) {
      aboveLane = (x - lastAboveX < MIN_X_GAP) ? aboveLane + 1 : 0;
      lanes[p.id] = { side: "above", lane: aboveLane };
      lastAboveX = x;
    } else {
      belowLane = (x - lastBelowX < MIN_X_GAP) ? belowLane + 1 : 0;
      lanes[p.id] = { side: "below", lane: belowLane };
      lastBelowX = x;
    }
  });

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <span className="eyebrow"><span className="pip"></span>Precedent timeline</span>
          <h2 className="panel-title">Historical anchors for your scenario</h2>
          <p className="muted" style={{ maxWidth: 560 }}>
            Click an entry to send Atlas straight to the case. Use it when you need a real analog for a shock or reform you just toggled.
          </p>
        </div>
      </div>

      <div className="precedent-timeline">
        <svg viewBox={`0 0 ${W} ${H}`}>
          <line x1="20" y1={yLine} x2={W - 20} y2={yLine} stroke="#0c2a36" strokeWidth="1.2" />
          {[1950, 1970, 1990, 2010, 2030].map((y) => (
            <g key={y}>
              <line x1={xFor(y)} y1={yLine - 5} x2={xFor(y)} y2={yLine + 5} stroke="#0c2a36" strokeWidth="0.6" />
              <text x={xFor(y)} y={yLine + 20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="0.14em" fill="#5e7480">{y}</text>
            </g>
          ))}
          {items.map((p) => {
            const x = xFor(p.year);
            const slot = lanes[p.id] || { side: "above", lane: 0 };
            const dir = slot.side === "above" ? -1 : 1;
            // Leader line steps out by ~18px per lane, label sits 12px past.
            const leaderEnd = yLine + dir * (16 + slot.lane * 22);
            const textY = leaderEnd + dir * 6;
            const rotation = -28;
            return (
              <g
                key={p.id}
                onClick={() => onAskAtlas?.(`Give me the ${p.title} (${p.period}) precedent and connect it to my current scenario.`)}
                style={{ cursor: "pointer" }}
              >
                <line x1={x} y1={yLine} x2={x} y2={leaderEnd} stroke="rgba(12,42,54,0.4)" strokeDasharray="2 3" />
                <circle cx={x} cy={yLine} r="5" fill="#1f6b3a" stroke="#eaf0e2" strokeWidth="1.4" />
                <text
                  x={x}
                  y={textY}
                  textAnchor="start"
                  transform={`rotate(${rotation} ${x} ${textY})`}
                  fontFamily="Fraunces, serif"
                  fontSize="12"
                  fontWeight="500"
                  fill="#0c2a36"
                >
                  {p.title}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
