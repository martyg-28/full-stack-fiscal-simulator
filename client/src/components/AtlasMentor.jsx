import React, { useEffect, useMemo, useRef, useState } from "react";
import { suggestedPrompts, depthLabels, modeLabels } from "../lib/atlasPrompts.js";

const INTRO = {
  answer:
    "Hi, I'm Atlas. I help students reason about why the model moves and how to defend their policy package. Ask me anything, or tap a prompt below.",
  keyConcept: "Welcome",
};

export default function AtlasMentor({ context, externalAsk }) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [mode, setMode] = useState("explain");
  const [depth, setDepth] = useState("standard");
  const [messages, setMessages] = useState([{ role: "atlas", content: INTRO }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const lastExternalRef = useRef(null);

  // Subtle pulse when key model metrics cross thresholds.
  useEffect(() => {
    const high = context?.summary?.debtToGdp2056 > 175 ||
      context?.summary?.politicalViability < 40 ||
      context?.summary?.fundingStress > 75;
    setPulse(Boolean(high));
  }, [context?.summary?.debtToGdp2056, context?.summary?.politicalViability, context?.summary?.fundingStress]);

  // Allow other parts of the app to push a question into Atlas.
  useEffect(() => {
    if (!externalAsk || externalAsk === lastExternalRef.current) return;
    lastExternalRef.current = externalAsk;
    setOpen(true);
    ask(externalAsk.question, externalAsk.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAsk]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function ask(question, forcedMode) {
    if (!question.trim() || busy) return;
    const useMode = forcedMode || mode;
    setMessages((prev) => [...prev, { role: "user", content: { answer: question } }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, mode: useMode, depth, context }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "atlas", content: data }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "atlas",
          content: {
            answer:
              "I can't reach the mentor service right now. Try refreshing — your scenario state is safe in the meantime.",
            confidenceNote: error.message,
          },
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const chips = useMemo(() => suggestedPrompts[mode] || [], [mode]);

  return (
    <>
      {!open && (
        <button
          type="button"
          className={`atlas-fab ${pulse ? "pulse" : ""}`}
          onClick={() => setOpen(true)}
          title="Ask Atlas, the Macro Mentor"
          aria-label="Open Atlas mentor"
        >
          🌐
        </button>
      )}
      {open && (
        <div className="atlas-panel" role="dialog" aria-label="Atlas Macro Mentor">
          <header className="atlas-header">
            <div className="avatar">🌐</div>
            <div>
              <h3>Atlas · Macro Mentor</h3>
              <small>Ask why the model moved.</small>
            </div>
            <button className="close" onClick={() => setOpen(false)} aria-label="Close Atlas">×</button>
          </header>

          <div className="atlas-controls">
            <div>
              <label>Mode</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {Object.entries(modeLabels).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Depth</label>
              <select value={depth} onChange={(e) => setDepth(e.target.value)}>
                {Object.entries(depthLabels).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="atlas-messages" ref={scrollRef}>
            {messages.map((msg, i) => (
              <AtlasBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {busy && <AtlasBubble role="atlas" content={{ answer: "Thinking…" }} />}
          </div>

          <div className="atlas-chips">
            {chips.map((chip) => (
              <button key={chip} className="atlas-chip" onClick={() => ask(chip)} disabled={busy}>
                {chip}
              </button>
            ))}
          </div>

          <form
            className="atlas-input"
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Atlas about your policy package…"
            />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}

function AtlasBubble({ role, content }) {
  if (role === "user") {
    return <div className="atlas-bubble user">{content.answer}</div>;
  }
  return (
    <div className="atlas-bubble atlas">
      {content.keyConcept && content.keyConcept !== "Welcome" && (
        <h4>{content.keyConcept}</h4>
      )}
      <div>{content.answer}</div>
      {content.tradeoff && (
        <>
          <h4>Tradeoff</h4>
          <div>{content.tradeoff}</div>
        </>
      )}
      {content.historicalPrecedent?.title && (
        <div className="precedent">
          <strong>{content.historicalPrecedent.title}</strong>
          {content.historicalPrecedent.summary}
        </div>
      )}
      {content.discussionQuestion && (
        <>
          <h4>Discussion question</h4>
          <div>{content.discussionQuestion}</div>
        </>
      )}
      {content.confidenceNote && (
        <span className="confidence">{content.confidenceNote}</span>
      )}
    </div>
  );
}
