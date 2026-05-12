import { useCallback, useEffect, useRef, useState } from "react";

// Browser-native voice agent. SpeechRecognition for input, SpeechSynthesis
// for output. No backend audio streaming, no extra keys. Works in any modern
// Chromium browser; degrades gracefully where the API is missing.

function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeech({ onFinalTranscript } = {}) {
  const Recognition = getRecognitionCtor();
  const supported = Boolean(Recognition) && typeof window !== "undefined" && "speechSynthesis" in window;

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onFinalRef = useRef(onFinalTranscript);
  onFinalRef.current = onFinalTranscript;

  useEffect(() => {
    if (!Recognition) return undefined;
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText);
      if (finalText) {
        setInterim("");
        onFinalRef.current?.(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      setError(event.error || "Speech recognition error");
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim("");
    };

    recognitionRef.current = recognition;
    return () => {
      try { recognition.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    };
  }, [Recognition]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setInterim("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      // start() throws if it's already running.
      setError(e.message);
    }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }, []);

  const speak = useCallback((text, options = {}) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? 1.02;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;
    // Prefer a clearer English voice if one is available.
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /en-US/.test(v.lang) && /Google|Samantha|Daniel|Alex/i.test(v.name))
      || voices.find((v) => /en-US/.test(v.lang))
      || voices[0];
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancelSpeech = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { supported, listening, speaking, interim, error, start, stop, speak, cancelSpeech };
}
