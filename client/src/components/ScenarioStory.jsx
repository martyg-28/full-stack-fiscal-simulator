import React, { useEffect, useState } from "react";

// Hits the same /api/mentor/chat endpoint as Atlas, but stays inline in the
// dashboard. Buttons let the student reshape the same story for different
// audiences without leaving the page.

const VARIANTS = [
  { id: "default",   label: "Re-read",                   depth: "standard", mode: "explain",          q: "In 4-6 sentences, narrate why my run came out the way it did. Reference specific levers and metrics from my context." },
  { id: "simpler",   label: "Make it simpler",           depth: "simple",   mode: "explain",          q: "In plain English with one analogy, explain why my run came out the way it did. Reference my numbers." },
  { id: "econ1",     label: "Explain like Econ 1",       depth: "simple",   mode: "explain",          q: "Explain my scenario for a first-year economics student. Define deficit vs. debt and connect to my numbers." },
  { id: "history",   label: "Add historical precedent",  depth: "standard", mode: "historical-case",  q: "Find the most relevant historical precedent for my run and explain the parallel in 4 sentences." },
  { id: "debate",    label: "Turn into a debate argument", depth: "standard", mode: "debate-prep",     q: "Generate three opening arguments, two likely objections, and one concession for defending my policy package." },
];

export default function ScenarioStory({ context }) {
  const [variant, setVariant] = useState("default");
  const [story, setStory] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(variantId) {
    const v = VARIANTS.find((x) => x.id === variantId) || VARIANTS[0];
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: v.q, mode: v.mode, depth: v.depth, context }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  // Generate the default story when the panel mounts and whenever the context
  // hash changes meaningfully (debt path or selected role).
  useEffect(() => {
    if (!context?.summary) return;
    run(variant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context?.summary?.debtToGdp2056,
    context?.summary?.politicalViability,
    context?.summary?.sustainabilityScore,
    context?.selectedRole,
  ]);

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <span className="eyebrow"><span className="pip"></span>Scenario story</span>
          <h2 className="panel-title">What just happened, in plain English</h2>
          <p className="muted" style={{ maxWidth: 560 }}>
            A short narrative explanation of your run, generated from the live model context.
            Re-shape it for any audience.
          </p>
        </div>
      </div>

      <div className="story-buttons">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`btn ${v.id === variant ? "" : "ghost"}`}
            onClick={() => { setVariant(v.id); run(v.id); }}
            disabled={busy}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="story-body">
        {busy && <p className="muted">Generating…</p>}
        {!busy && error && <p className="muted">Couldn't reach the mentor: {error}</p>}
        {!busy && !error && story && (
          <>
            {story.keyConcept && <div className="story-tag">{story.keyConcept}</div>}
            <p className="story-text">{story.answer}</p>
            {story.tradeoff && (
              <p className="story-text" style={{ borderLeft: "2px solid var(--rule-strong)", paddingLeft: 12, color: "var(--ink-soft)" }}>
                <strong>Tradeoff · </strong>{story.tradeoff}
              </p>
            )}
            {story.historicalPrecedent?.title && (
              <p className="story-text">
                <strong>{story.historicalPrecedent.title}.</strong> {story.historicalPrecedent.summary}
              </p>
            )}
            {story.discussionQuestion && (
              <p className="story-text" style={{ color: "var(--accent-forest)" }}>
                <strong>Discussion · </strong>{story.discussionQuestion}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
