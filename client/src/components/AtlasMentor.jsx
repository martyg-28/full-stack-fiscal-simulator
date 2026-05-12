import React, { useEffect, useMemo, useRef, useState } from "react";
import { suggestedPrompts, depthLabels, modeLabels } from "../lib/atlasPrompts.js";
import { useSpeech } from "../hooks/useSpeech.js";

function buildIntro(step) {
  if (!step) {
    return {
      answer:
        "Hi, I'm Atlas. I help students reason about why the model moves and how to defend their policy package. Ask me anything, or tap a prompt below.",
      keyConcept: "Welcome",
    };
  }
  return {
    answer: `Hi — I see you're on ${step}. I'll keep my suggestions tied to what you're doing right now. Ask me anything, tap a prompt, or switch to voice mode for a Socratic seminar.`,
    keyConcept: "Welcome",
  };
}

export default function AtlasMentor({ context, externalAsk }) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [mode, setMode] = useState("explain");
  const [depth, setDepth] = useState("standard");
  const [voiceOn, setVoiceOn] = useState(false);
  const [messages, setMessages] = useState([{ role: "atlas", content: buildIntro(context?.currentStep) }]);
  const lastStepRef = useRef(context?.currentStep);
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

  const speech = useSpeech({
    onFinalTranscript: (text) => {
      // When the student stops talking, send their transcript through the
      // mentor pipeline in socratic-seminar mode and speak the answer.
      ask(text, "socratic-seminar");
    },
  });

  // Auto-flip to socratic mode when voice opens; restore on close.
  useEffect(() => {
    if (voiceOn) setMode("socratic-seminar");
    else if (mode === "socratic-seminar") setMode("explain");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceOn]);

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
      // If voice mode is on (or we just got a socratic reply), speak the answer.
      if (voiceOn || useMode === "socratic-seminar") {
        speech.speak(data.answer);
      }
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

  // Insert a context note whenever the active step changes, so Atlas's chat
  // history shows the student "I'm now on step N" without an extra click.
  useEffect(() => {
    const step = context?.currentStep;
    if (step && step !== lastStepRef.current) {
      lastStepRef.current = step;
      setMessages((prev) => [
        ...prev,
        {
          role: "atlas",
          content: {
            answer: `You're now on: ${step}. I've updated the suggested prompts to match.`,
            keyConcept: "Step update",
          },
        },
      ]);
    }
  }, [context?.currentStep]);

  // Suggested chips: prefer the current step's bespoke prompts, fall back to
  // the mode's standard chips.
  const chips = useMemo(() => {
    if (context?.currentStepPrompts?.length) return context.currentStepPrompts;
    return suggestedPrompts[mode] || [];
  }, [mode, context?.currentStepPrompts]);

  function toggleVoice() {
    if (!speech.supported) return;
    if (voiceOn) {
      speech.stop();
      speech.cancelSpeech();
    }
    setVoiceOn((v) => !v);
  }

  function toggleListening() {
    if (!speech.supported) return;
    if (speech.listening) speech.stop();
    else speech.start();
  }

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
        <div className={`atlas-panel ${voiceOn ? "voice-mode" : ""}`} role="dialog" aria-label="Atlas Macro Mentor">
          <header className="atlas-header">
            <div className="avatar">{voiceOn ? "🎙" : "🌐"}</div>
            <div>
              <h3>Atlas · Macro Mentor</h3>
              <small>{voiceOn ? "Voice seminar mode" : "Ask why the model moved."}</small>
            </div>
            <button
              type="button"
              className={`voice-toggle ${voiceOn ? "on" : ""}`}
              onClick={toggleVoice}
              disabled={!speech.supported}
              title={speech.supported ? "Toggle voice mode" : "Voice not supported in this browser"}
              aria-pressed={voiceOn}
            >
              {voiceOn ? "Voice on" : "Voice"}
            </button>
            <button className="close" onClick={() => setOpen(false)} aria-label="Close Atlas">×</button>
          </header>

          {!voiceOn && (
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
          )}

          {voiceOn && (
            <div className="voice-stage">
              <button
                type="button"
                className={`mic-btn ${speech.listening ? "listening" : ""} ${speech.speaking ? "speaking" : ""}`}
                onClick={toggleListening}
                disabled={busy || speech.speaking}
                aria-label={speech.listening ? "Stop listening" : "Start listening"}
              >
                <span className="mic-glyph">{speech.speaking ? "🔊" : speech.listening ? "■" : "🎙"}</span>
              </button>
              <div className="voice-status">
                {speech.speaking && "Atlas is speaking — listen, then hit the mic to reply."}
                {!speech.speaking && speech.listening && (speech.interim ? `Heard: "${speech.interim}"` : "Listening… speak now.")}
                {!speech.speaking && !speech.listening && busy && "Atlas is thinking…"}
                {!speech.speaking && !speech.listening && !busy && "Press the mic and explain your reasoning. Atlas will push back with a Socratic question."}
              </div>
              {speech.error && <div className="voice-error">{speech.error}</div>}
            </div>
          )}

          <div className="atlas-messages" ref={scrollRef}>
            {messages.map((msg, i) => (
              <AtlasBubble key={i} role={msg.role} content={msg.content} />
            ))}
            {busy && <AtlasBubble role="atlas" content={{ answer: "Thinking…" }} />}
          </div>

          {!voiceOn && (
            <>
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
            </>
          )}

          {voiceOn && !speech.supported && (
            <div className="voice-fallback">
              This browser doesn't support the Web Speech API. Try Chrome or Edge to use voice mode.
            </div>
          )}
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
