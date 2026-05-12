import React from "react";

const MODE_LABEL = {
  loading: "Connecting…",
  backend: "Backend (SQLite via Prisma)",
  "local-demo": "Local fallback (browser only)",
};

export default function PersistencePanel({ persistence }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 className="panel-title">Saved scenario runs</h2>
          <p className="muted">
            Mode: <span className={`persistence-mode ${persistence.status}`}>{MODE_LABEL[persistence.status] || persistence.status}</span>
            {persistence.status === "local-demo" && (
              <span> · Backend unreachable. Saves go to browser localStorage for now.</span>
            )}
          </p>
        </div>
        <button className="btn" onClick={persistence.saveCurrentScenario}>Save current run</button>
      </div>
      <div className="saved-list">
        {persistence.savedScenarios.length === 0 ? (
          <div className="saved-item"><div className="meta"><strong>No saved scenarios yet.</strong><span className="muted">Use the button above to save the current sliders.</span></div></div>
        ) : (
          persistence.savedScenarios.slice(0, 6).map((scenario) => (
            <div className="saved-item" key={scenario.id}>
              <div className="meta">
                <strong>{scenario.name || "Saved scenario"}</strong>
                <span className="muted">{new Date(scenario.createdAt).toLocaleString()}</span>
                <span className="muted">
                  Balance {scenario.summary?.fiscalBalanceScore ?? "n/a"} · Debt 2056 {scenario.summary?.debtToGdp2056 ?? "n/a"}% · Highest risk: {scenario.summary?.highestRiskRegion ?? "n/a"}
                </span>
              </div>
              <button onClick={() => persistence.deleteScenario(scenario.id)} title="Delete scenario">✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
