import React from "react";

const ROLES = [
  "Fiscal Hawk",
  "Social Investment Advocate",
  "Defense Strategist",
  "Climate Resilience Planner",
  "Political Whip",
];

export default function ClassMissionCard() {
  return (
    <section className="mission-card">
      <div>
        <span className="eyebrow"><span className="pip"></span>Classroom mission</span>
        <h2>Advise Congress in 2028</h2>
        <p className="mission-prompt">
          Debt is rising, borrowing costs are elevated, and global risks are increasing.
          Build a package that balances sustainability, political viability, and social resilience.
        </p>
      </div>
      <div className="mission-meta">
        <div>
          <span className="field-label">Learning objective</span>
          <p style={{ margin: 0, fontSize: 14 }}>
            Reason about fiscal tradeoffs across revenue, spending, and shock exposure — then defend them.
          </p>
        </div>
        <div>
          <span className="field-label">Activity</span>
          <p style={{ margin: 0, fontSize: 14 }}>30 minutes · groups of 3 to 5</p>
        </div>
        <div>
          <span className="field-label">Suggested roles</span>
          <div className="role-chips" style={{ marginTop: 6 }}>
            {ROLES.map((role) => (
              <span key={role} className="role-chip">{role}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
