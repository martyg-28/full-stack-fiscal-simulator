import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "studium-tutorial-v3";

// Each tutorial step targets a real app step and can apply an effect
// (e.g., bump a slider, select a region) so the student sees the model
// actually move while they read. The tutorial sits in the bottom-right
// instead of centering a modal — students can watch the UI respond.

const STEPS = [
  {
    targetStep: "role",
    title: "Step 1 · Choose your role",
    body:
      "Pick a role at the top. For this walkthrough you'll play the Fiscal Hawk — your job is to keep long-run debt under control.",
    cta: "Set me up as Fiscal Hawk",
    effect: ({ setSelectedRoleId }) => setSelectedRoleId("fiscal-hawk"),
  },
  {
    targetStep: "brief",
    title: "Step 2 · Read the brief",
    body:
      "The Classroom Mission Card sets the prompt. Below it, the Live Data Sources panel shows current Treasury, BLS, and NOAA numbers — these auto-shift your stress dials before you've touched a slider.",
    cta: "Next",
  },
  {
    targetStep: "build",
    title: "Step 3 · Build a sample package",
    body:
      "Move sliders and toggle CBO options. I'll do it for you now — bumping Revenue Reform to Substantial and Discretionary Cuts to Squeeze, plus selecting two CBO options that reduce the deficit. Watch the sustainability tag at the top change as you read this.",
    cta: "Apply the sample package",
    effect: ({ setPolicy, setSelectedOptionIds }) => {
      setPolicy((prev) => ({
        ...prev,
        revenueReform: 55,
        discretionaryCuts: 35,
        healthcareEfficiency: 45,
      }));
      setSelectedOptionIds(["site-neutral", "fix-ma-coding"]);
    },
  },
  {
    targetStep: "world",
    title: "Step 4 · Stress-test the world",
    body:
      "Four maps. Plate I & II are global. Plate III is the live U.S. data layer. Plate IV charts your debt path against real historical anchors. I'll select the Middle East node so you can see how a region detail panel works.",
    cta: "Show me the Middle East node",
    effect: ({ setSelectedRegionId }) => setSelectedRegionId("middle-east"),
  },
  {
    targetStep: "read",
    title: "Step 5 · Read your results",
    body:
      "Look at the dossier figures, the radar shape, and the Scenario Story below. The story is a plain-English narrative of your run — use the reshape buttons (Make it simpler, Explain like Econ 1) when you don't follow something.",
    cta: "Next",
  },
  {
    targetStep: "defend",
    title: "Step 6 · Defend and take the quiz",
    body:
      "Pull a historical precedent, save your run, and when you're ready hit “Done · take the quiz”. Atlas will generate five questions from your actual scenario. That's a full simulation.",
    cta: "I'm ready",
  },
  {
    targetStep: "role",
    title: "Now run your own",
    body:
      "I've reset you to step 1 with the default sliders. Pick a role, build a real package, and aim higher than this walkthrough's score. Atlas is always one click away if you get stuck.",
    cta: "Start my run",
    effect: ({ setCurrentStepId, setSelectedRoleId, setPolicy, setSelectedOptionIds, initialPolicy }) => {
      setSelectedRoleId("fiscal-hawk");
      setPolicy(initialPolicy);
      setSelectedOptionIds([]);
      setCurrentStepId("role");
    },
  },
];

export default function Tutorial({
  forceOpen,
  onClose,
  setCurrentStepId,
  setSelectedRoleId,
  setPolicy,
  setSelectedOptionIds,
  setSelectedRegionId,
  initialPolicy,
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const lastForceRef = useRef(forceOpen);

  // First-run auto-open: only on initial mount, only if not previously dismissed.
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
        setStep(0);
      }
    } catch {
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-open whenever the parent flips forceOpen from false → true.
  useEffect(() => {
    if (forceOpen && !lastForceRef.current) {
      setOpen(true);
      setStep(0);
    }
    lastForceRef.current = forceOpen;
  }, [forceOpen]);

  // Whenever the active tutorial step changes, drive the app to its target.
  useEffect(() => {
    if (!open) return;
    const s = STEPS[step];
    if (s?.targetStep && setCurrentStepId) {
      setCurrentStepId(s.targetStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [open, step, setCurrentStepId]);

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    onClose?.();
  }

  function advance() {
    const s = STEPS[step];
    s.effect?.({
      setCurrentStepId,
      setSelectedRoleId,
      setPolicy,
      setSelectedOptionIds,
      setSelectedRegionId,
      initialPolicy,
    });
    if (step === STEPS.length - 1) finish();
    else setStep((x) => x + 1);
  }

  if (!open) return null;
  const s = STEPS[step];

  return (
    <div className="walkthrough-dock" role="dialog" aria-label="Studium walkthrough">
      <div className="walkthrough-card">
        <div className="walkthrough-step-counter">
          Walkthrough · Step {step + 1} of {STEPS.length}
        </div>
        <h2 className="walkthrough-title">{s.title}</h2>
        <p className="walkthrough-body">{s.body}</p>

        <div className="walkthrough-progress">
          {STEPS.map((_, i) => (
            <span key={i} className={`tut-pip ${i <= step ? "on" : ""}`} />
          ))}
        </div>

        <div className="walkthrough-actions">
          <button className="btn ghost" onClick={finish}>Skip walkthrough</button>
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button className="btn ghost" onClick={() => setStep((x) => x - 1)}>Back</button>
            )}
            <button className="btn" onClick={advance}>{s.cta}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
