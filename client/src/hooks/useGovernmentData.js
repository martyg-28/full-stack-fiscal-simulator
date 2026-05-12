import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

const sourcePlaceholders = [
  { id: "treasury-debt", label: "Debt to the Penny", agency: "U.S. Treasury Fiscal Data" },
  { id: "treasury-rates", label: "Avg Treasury rate", agency: "U.S. Treasury Fiscal Data" },
  { id: "bls-cpi", label: "CPI inflation (YoY)", agency: "Bureau of Labor Statistics" },
  { id: "bls-unemployment", label: "Unemployment rate", agency: "Bureau of Labor Statistics" },
  { id: "nws-alerts", label: "Active U.S. weather alerts", agency: "NOAA / National Weather Service" },
];

// Conservative fallback values used only when the backend itself is unreachable.
const demoMetrics = {
  debtTrillions: 36.2,
  avgTreasuryRate: 3.95,
  cpiInflationYoY: 3.1,
  unemploymentRate: 4.1,
  activeWeatherAlerts: 210,
};

export function useGovernmentData() {
  const [state, setState] = useState({
    status: "loading",
    metrics: {},
    sources: sourcePlaceholders.map((s) => ({ ...s, status: "loading", display: "Loading…" })),
  });

  async function load() {
    setState((prev) => ({
      ...prev,
      status: "loading",
      sources: prev.sources.map((s) => ({ ...s, status: "loading", display: "Loading…" })),
    }));
    try {
      const data = await api.governmentMetrics();
      setState({ status: "live", metrics: data.metrics || {}, sources: data.sources || [] });
    } catch {
      setState({
        status: "offline",
        metrics: demoMetrics,
        sources: sourcePlaceholders.map((s) => ({ ...s, status: "demo fallback", display: "Demo fallback" })),
      });
    }
  }

  useEffect(() => { load(); }, []);

  return { ...state, refresh: load };
}
