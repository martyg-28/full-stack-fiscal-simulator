import React, { useEffect, useState } from "react";

const STORAGE_KEY = "studium-tutorial-v2";

const STEPS = [
  {
    title: "Welcome to Studium",
    body:
      "Studium is a classroom atlas for U.S. fiscal policy. You'll build a policy package, expose it to global shocks, and watch what happens to debt, deficits, and political viability through 2056.",
    cta: "Show me how",
    anchor: null,
  },
  {
    title: "Step 1 · Read the dossier",
    body:
      "Four figures at the top summarize every run: Debt/GDP at 2036 and 2056, Political viability, and Borrowing pressure. Tap “Why?” under any figure and Atlas explains it in the context of your current package.",
    cta: "Next",
    anchor: ".dossier",
  },
  {
    title: "Step 2 · Pick CBO budget options",
    body:
      "In the Policy options panel, toggle real CBO-scored proposals — site-neutral Medicare payments, raising the Social Security cap, corporate-tax changes. The 10-year deficit impact updates live.",
    cta: "Next",
    anchor: ".options-head",
  },
  {
    title: "Step 3 · Tune the levers",
    body:
      "The Policy Builder has seven sliders for revenue, spending, defense posture, climate resilience, and more. Each lever has tradeoffs. Hover help text and the “Ask Atlas” link on each card.",
    cta: "Next",
    anchor: ".slider-grid",
  },
  {
    title: "Step 4 · Read the maps",
    body:
      "Two cartographic plates show how the world transmits pressure into the U.S. budget. Click any region on either map and the dossier on the right updates.",
    cta: "Next",
    anchor: ".maps-grid",
  },
  {
    title: "Step 5 · Ask Atlas",
    body:
      "The globe button in the corner opens Atlas, the Macro Mentor. Ask why your debt moved, get debate prep for class, or pull a historical precedent. Atlas reads your current scenario context.",
    cta: "Start exploring",
    anchor: ".atlas-fab",
  },
];

export default function Tutorial({ forceOpen, onClose }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setStep(0);
      return;
    }
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable, just open
      setOpen(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    const anchor = STEPS[step]?.anchor;
    if (open && anchor) {
      const el = document.querySelector(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [open, step]);

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    onClose?.();
  }

  function next() {
    if (step === STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  }

  if (!open) return null;
  const s = STEPS[step];

  return (
    <div className="tutorial-overlay" role="dialog" aria-label="Studium tutorial">
      <div className="tutorial-card">
        <div className="tutorial-step-counter">
          Step {step + 1} of {STEPS.length}
        </div>
        <h2 className="tutorial-title">{s.title}</h2>
        <p className="tutorial-body">{s.body}</p>

        <div className="tutorial-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`tut-pip ${i <= step ? "on" : ""}`} />
          ))}
        </div>

        <div className="tutorial-actions">
          <button className="btn ghost" onClick={finish}>Skip tour</button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button className="btn ghost" onClick={() => setStep((s) => s - 1)}>Back</button>
            )}
            <button className="btn" onClick={next}>{s.cta}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
