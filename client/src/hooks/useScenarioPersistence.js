import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const LOCAL_KEY = "fiscal-scenarios";

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocal(list) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 12)));
}

export function useScenarioPersistence(snapshot) {
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [status, setStatus] = useState("loading");

  async function loadScenarios() {
    try {
      const data = await api.scenarios();
      setSavedScenarios(data.scenarios || []);
      setStatus("backend");
    } catch {
      setSavedScenarios(readLocal());
      setStatus("local-demo");
    }
  }

  async function saveCurrentScenario() {
    try {
      const scenario = await api.saveScenario(snapshot);
      setSavedScenarios((prev) => [scenario, ...prev]);
      setStatus("backend");
    } catch {
      const scenario = {
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
        name: snapshot.name || "Local demo scenario",
        ...snapshot,
      };
      setSavedScenarios((prev) => {
        const next = [scenario, ...prev];
        writeLocal(next);
        return next;
      });
      setStatus("local-demo");
    }
  }

  async function deleteScenario(id) {
    if (id.startsWith("local-")) {
      setSavedScenarios((prev) => {
        const next = prev.filter((s) => s.id !== id);
        writeLocal(next);
        return next;
      });
      return;
    }
    try {
      await api.deleteScenario(id);
      setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.warn("Failed to delete scenario", error);
    }
  }

  useEffect(() => { loadScenarios(); }, []);

  return { savedScenarios, saveCurrentScenario, deleteScenario, status };
}
