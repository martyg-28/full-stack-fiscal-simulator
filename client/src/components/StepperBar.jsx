import React from "react";
import { STEPS } from "../lib/steps.js";

export default function StepperBar({ currentStepId, onSelect, onNext, onBack, advancedView, setAdvancedView }) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStepId);
  const step = STEPS[currentIdx] || STEPS[0];

  return (
    <section className="stepper">
      <div className="stepper-track" role="tablist" aria-label="Studium guided flow">
        {STEPS.map((s, i) => {
          const state =
            s.id === currentStepId ? "current" :
            i < currentIdx ? "done" :
            "future";
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={state === "current"}
              className={`step-chip ${state}`}
              onClick={() => onSelect(s.id)}
              disabled={advancedView}
              title={advancedView ? "Stepper disabled in advanced view" : s.label}
            >
              <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="step-label">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="step-meta">
        <div className="step-headline">
          {!advancedView ? (
            <>
              <span className="eyebrow"><span className="pip"></span>{step.badge} · {step.label}</span>
              <h2 className="display">{step.headline}</h2>
              <p className="muted">{step.blurb}</p>
            </>
          ) : (
            <>
              <span className="eyebrow"><span className="pip"></span>Advanced view</span>
              <h2 className="display">All panels visible at once</h2>
              <p className="muted">Use this view to demo the full product or review a saved run. Switch off to return to the guided flow.</p>
            </>
          )}
        </div>

        <div className="step-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setAdvancedView(!advancedView)}
            title="Show or hide every panel at once"
          >
            {advancedView ? "Return to guided flow" : "Advanced view"}
          </button>
          {!advancedView && (
            <>
              <button
                type="button"
                className="btn ghost"
                onClick={onBack}
                disabled={currentIdx <= 0}
              >
                Back
              </button>
              <button
                type="button"
                className="btn"
                onClick={onNext}
                disabled={currentIdx >= STEPS.length - 1}
              >
                {currentIdx >= STEPS.length - 1 ? "Done" : "Next →"}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
