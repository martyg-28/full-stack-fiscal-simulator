import React from "react";

const FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export default function EditorialMasthead({ onOpenTour }) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="wordmark">
          <span className="mark">Studium</span>
          <span className="sub">Policy Simulation Studio</span>
        </div>
        <div className="masthead-meta">
          {onOpenTour && (
            <button type="button" className="tour-hint" onClick={onOpenTour}>
              Take the tour
            </button>
          )}
          <span>Vol. I · No. 1</span>
          <span><strong>{FMT.format(new Date())}</strong></span>
          <span>Edition · Classroom</span>
        </div>
      </div>
    </header>
  );
}
