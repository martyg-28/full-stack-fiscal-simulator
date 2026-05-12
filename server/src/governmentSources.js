// Adapters for the public government APIs. Each adapter knows how to fetch a
// single source and normalize the response into a consistent shape:
//   { sourceId, label, agency, metricKey, status, value, display, asOf, fetchedAt }

function safeNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function latestBlsMonthlyRecord(rows) {
  return rows.find((row) => String(row.period || "").startsWith("M")) || null;
}

function parseBlsYoY(json) {
  const rows = json?.Results?.series?.[0]?.data || [];
  const latest = latestBlsMonthlyRecord(rows);
  if (!latest) return { value: null, display: "Unavailable", asOf: null };

  const latestValue = safeNumber(latest.value);
  const prior = rows.find(
    (row) => row.year === String(Number(latest.year) - 1) && row.period === latest.period
  );
  const priorValue = safeNumber(prior?.value);

  if (latestValue !== null && priorValue !== null && priorValue !== 0) {
    const yoy = ((latestValue - priorValue) / priorValue) * 100;
    return {
      value: yoy,
      display: `${yoy.toFixed(1)}% YoY`,
      asOf: `${latest.periodName || latest.period} ${latest.year}`,
    };
  }

  return {
    value: latestValue,
    display: latestValue === null ? "Unavailable" : `${latestValue.toFixed(1)} index`,
    asOf: `${latest.periodName || latest.period} ${latest.year}`,
  };
}

// BLS unregistered GET only returns the current calendar year. We need 13+
// months for a YoY calc, so we POST a 2-year window instead. An optional API
// key (env BLS_API_KEY) unlocks more data and a higher rate limit.
async function fetchBlsSeries(seriesId) {
  const now = new Date();
  const endYear = now.getUTCFullYear();
  const startYear = endYear - 2;
  const body = {
    seriesid: [seriesId],
    startyear: String(startYear),
    endyear: String(endYear),
  };
  if (process.env.BLS_API_KEY) body.registrationkey = process.env.BLS_API_KEY;

  const response = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = new Error(`BLS responded with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  if (payload?.status && payload.status !== "REQUEST_SUCCEEDED") {
    throw new Error(`BLS error: ${(payload.message || []).join("; ") || payload.status}`);
  }
  return payload;
}

export const governmentSources = {
  "treasury-debt": {
    id: "treasury-debt",
    label: "Debt to the Penny",
    agency: "U.S. Treasury Fiscal Data",
    metricKey: "debtTrillions",
    fetch: async () => {
      const url =
        "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1";
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Treasury HTTP ${response.status}`);
      const payload = await response.json();
      const row = payload?.data?.[0] || {};
      const debt = safeNumber(row.tot_pub_debt_out_amt);
      return {
        payload,
        parsed: {
          value: debt === null ? null : debt / 1_000_000_000_000,
          display: debt === null ? "Unavailable" : `$${(debt / 1_000_000_000_000).toFixed(2)}T`,
          asOf: row.record_date || null,
        },
      };
    },
  },

  "treasury-rates": {
    id: "treasury-rates",
    label: "Average Treasury interest rate",
    agency: "U.S. Treasury Fiscal Data",
    metricKey: "avgTreasuryRate",
    fetch: async () => {
      const url =
        "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=100";
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Treasury HTTP ${response.status}`);
      const payload = await response.json();
      const rows = payload?.data || [];
      // Prefer the "Total Marketable" aggregate; fall back to first row.
      const row =
        rows.find((item) =>
          /total marketable/i.test(String(item.security_desc || item.security_type_desc || ""))
        ) ||
        rows[0] ||
        {};
      const rate = safeNumber(
        row.avg_interest_rate_amt ?? row.avg_interest_rate_pct ?? row.average_interest_rate_amt
      );
      return {
        payload,
        parsed: {
          value: rate,
          display: rate === null ? "Unavailable" : `${rate.toFixed(2)}%`,
          asOf: row.record_date || null,
        },
      };
    },
  },

  "bls-cpi": {
    id: "bls-cpi",
    label: "Consumer Price Index inflation",
    agency: "Bureau of Labor Statistics",
    metricKey: "cpiInflationYoY",
    fetch: async () => {
      const payload = await fetchBlsSeries("CUUR0000SA0");
      return { payload, parsed: parseBlsYoY(payload) };
    },
  },

  "bls-unemployment": {
    id: "bls-unemployment",
    label: "Unemployment rate",
    agency: "Bureau of Labor Statistics",
    metricKey: "unemploymentRate",
    fetch: async () => {
      const payload = await fetchBlsSeries("LNS14000000");
      const rows = payload?.Results?.series?.[0]?.data || [];
      const latest = latestBlsMonthlyRecord(rows);
      const value = safeNumber(latest?.value);
      return {
        payload,
        parsed: {
          value,
          display: value === null ? "Unavailable" : `${value.toFixed(1)}%`,
          asOf: latest ? `${latest.periodName || latest.period} ${latest.year}` : null,
        },
      };
    },
  },

  "nws-alerts": {
    id: "nws-alerts",
    label: "Active U.S. weather alerts",
    agency: "NOAA / National Weather Service",
    metricKey: "activeWeatherAlerts",
    fetch: async () => {
      const response = await fetch(
        "https://api.weather.gov/alerts/active?status=actual&message_type=alert",
        {
          headers: {
            Accept: "application/geo+json",
            "User-Agent": "GlobalBudgetPressureMap/1.0 (student project)",
          },
        }
      );
      if (!response.ok) throw new Error(`NOAA/NWS HTTP ${response.status}`);
      const payload = await response.json();
      const count = Array.isArray(payload?.features) ? payload.features.length : null;
      return {
        payload,
        parsed: {
          value: count,
          display: count === null ? "Unavailable" : `${count} active alerts`,
          asOf: payload?.updated || null,
        },
      };
    },
  },
};

export async function fetchGovernmentSource(sourceId) {
  const source = governmentSources[sourceId];
  if (!source) {
    const error = new Error(`Unknown government source: ${sourceId}`);
    error.status = 404;
    throw error;
  }

  const { payload, parsed } = await source.fetch();
  const hasValue = parsed.value !== null && parsed.value !== undefined;

  return {
    sourceId: source.id,
    label: source.label,
    agency: source.agency,
    metricKey: source.metricKey,
    status: hasValue ? "live" : "empty",
    value: parsed.value,
    display: parsed.display,
    asOf: parsed.asOf,
    fetchedAt: new Date().toISOString(),
    payload,
  };
}
