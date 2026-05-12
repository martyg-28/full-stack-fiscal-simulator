function safeNumber(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function latestBlsMonthlyRecord(json) {
  const rows = json?.Results?.series?.[0]?.data || [];
  return rows.find((row) => String(row.period || "").startsWith("M")) || null;
}

function parseBlsYoY(json) {
  const rows = json?.Results?.series?.[0]?.data || [];
  const latest = latestBlsMonthlyRecord(json);
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

export const governmentSources = {
  "treasury-debt": {
    id: "treasury-debt",
    label: "Debt to the Penny",
    agency: "U.S. Treasury Fiscal Data",
    metricKey: "debtTrillions",
    url:
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=1",
    parse(json) {
      const row = json?.data?.[0] || {};
      const debt = safeNumber(row.tot_pub_debt_out_amt);
      return {
        value: debt === null ? null : debt / 1_000_000_000_000,
        display: debt === null ? "Unavailable" : `$${(debt / 1_000_000_000_000).toFixed(2)}T`,
        asOf: row.record_date || null,
      };
    },
  },

  "treasury-rates": {
    id: "treasury-rates",
    label: "Average Treasury interest rate",
    agency: "U.S. Treasury Fiscal Data",
    metricKey: "avgTreasuryRate",
    url:
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=100",
    parse(json) {
      const rows = json?.data || [];
      const row =
        rows.find((item) =>
          /total marketable/i.test(String(item.security_desc || item.security_type_desc || ""))
        ) || rows[0] || {};
      const rate = safeNumber(
        row.avg_interest_rate_amt ?? row.avg_interest_rate_pct ?? row.average_interest_rate_amt
      );
      return {
        value: rate,
        display: rate === null ? "Unavailable" : `${rate.toFixed(2)}%`,
        asOf: row.record_date || null,
      };
    },
  },

  "bls-cpi": {
    id: "bls-cpi",
    label: "Consumer Price Index inflation",
    agency: "Bureau of Labor Statistics",
    metricKey: "cpiInflationYoY",
    url: "https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0",
    parse(json) {
      return parseBlsYoY(json);
    },
  },

  "bls-unemployment": {
    id: "bls-unemployment",
    label: "Unemployment rate",
    agency: "Bureau of Labor Statistics",
    metricKey: "unemploymentRate",
    url: "https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000",
    parse(json) {
      const latest = latestBlsMonthlyRecord(json);
      const value = safeNumber(latest?.value);
      return {
        value,
        display: value === null ? "Unavailable" : `${value.toFixed(1)}%`,
        asOf: latest ? `${latest.periodName || latest.period} ${latest.year}` : null,
      };
    },
  },

  "nws-alerts": {
    id: "nws-alerts",
    label: "Active U.S. weather alerts",
    agency: "NOAA / National Weather Service",
    metricKey: "activeWeatherAlerts",
    url: "https://api.weather.gov/alerts/active?area=US&status=actual",
    parse(json) {
      const count = Array.isArray(json?.features) ? json.features.length : null;
      return {
        value: count,
        display: count === null ? "Unavailable" : `${count} active alerts`,
        asOf: json?.updated || null,
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

  const response = await fetch(source.url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "GlobalBudgetPressureMap/1.0 student project",
    },
  });

  if (!response.ok) {
    const error = new Error(`${source.agency} responded with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  const parsed = source.parse(payload);

  return {
    sourceId: source.id,
    label: source.label,
    agency: source.agency,
    metricKey: source.metricKey,
    status: parsed.value === null || parsed.value === undefined ? "empty" : "live",
    value: parsed.value,
    display: parsed.display,
    asOf: parsed.asOf,
    fetchedAt: new Date().toISOString(),
    payload,
  };
}
