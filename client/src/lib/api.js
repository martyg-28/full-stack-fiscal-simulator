// Thin wrapper around the backend. The frontend never calls government APIs
// directly — everything goes through these endpoints.

async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${options.method || "GET"} ${path} → HTTP ${response.status} ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  governmentMetrics: () => request("/api/government-metrics"),
  scenarios: () => request("/api/scenarios"),
  saveScenario: (payload) =>
    request("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteScenario: (id) => request(`/api/scenarios/${id}`, { method: "DELETE" }),
};
