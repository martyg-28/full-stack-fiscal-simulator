import React from "react";

const STATUS_HELP = {
  live: "Just fetched from the source API.",
  cached: "Source API didn't respond. Showing the last successful value from the SQLite cache.",
  offline: "Source API is unreachable and no cache exists yet.",
  empty: "Source responded but returned no value for this period.",
  loading: "Fetching from the backend.",
  "demo fallback": "Backend is unreachable. Showing a static demo value.",
};

export default function GovernmentPanel({ govData, manualStress, derivedStress }) {
  const adjustments = Object.keys(derivedStress)
    .map((key) => ({ key, manual: manualStress[key], derived: derivedStress[key] }))
    .filter((item) => Math.round(item.manual) !== Math.round(item.derived));

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <span className="eyebrow"><span className="pip"></span>Live data sources</span>
          <h2 className="panel-title">Government data, server-side</h2>
          <p className="muted" style={{ maxWidth: 560 }}>
            The frontend talks only to our API. The backend fans out to Treasury, BLS, and NOAA/NWS,
            caches each response in SQLite, and returns a normalized metric.
          </p>
        </div>
        <button className="btn ghost" onClick={govData.refresh}>Refresh feeds</button>
      </div>

      <div className="api-grid">
        {govData.sources.map((source) => (
          <div className="api-tile" key={source.sourceId || source.id}>
            <div className="agency">{source.agency}</div>
            <strong>{source.label}</strong>
            <div className="api-value">{source.display}</div>
            {source.asOf ? <div className="api-asof">As of {source.asOf}</div> : null}
            <span className={`status ${source.status}`} title={STATUS_HELP[source.status] || ""}>
              {source.status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }} className="muted">
        <strong>Live-data stress adjustments:</strong>{" "}
        {adjustments.length === 0
          ? "No adjustment yet — manual sliders are dominating."
          : adjustments.map((item) => `${item.key}: ${Math.round(item.manual)} → ${Math.round(item.derived)}`).join(" · ")}
      </div>
    </div>
  );
}
