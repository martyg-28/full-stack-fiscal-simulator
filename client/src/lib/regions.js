import { clamp, riskLabel } from "./simulation.js";

export const regionTemplates = [
  { id: "north-america", label: "North America", lat: 39, lon: -100, short: "Domestic transmission", channels: ["Treasury refinancing", "Disaster relief", "Polarization drag"] },
  { id: "europe",         label: "Europe",         lat: 50, lon: 15,   short: "Alliance pressure",      channels: ["Defense support", "Energy prices", "Financial contagion"] },
  { id: "middle-east",    label: "Middle East",    lat: 28, lon: 45,   short: "Energy and security",    channels: ["Oil shock", "Shipping lanes", "Defense surge"] },
  { id: "east-asia",      label: "East Asia",      lat: 35, lon: 120,  short: "Trade and chips",        channels: ["Semiconductors", "Trade flows", "Industrial subsidies"] },
  { id: "latin-america",  label: "Latin America",  lat: -15, lon: -65, short: "Migration and commodities", channels: ["Migration", "Food prices", "Aid spending"] },
  { id: "africa",         label: "Africa",         lat: 6,  lon: 20,   short: "Humanitarian load",      channels: ["Food insecurity", "Humanitarian aid", "Climate stress"] },
  { id: "arctic",         label: "Arctic / Climate Belt", lat: 74, lon: 0, short: "Climate tail risk",  channels: ["Extreme weather", "Infrastructure", "Insurance losses"] },
];

export const continentPolygons = [
  [[-168,72],[-150,72],[-134,64],[-124,50],[-123,36],[-111,26],[-95,18],[-82,25],[-68,44],[-82,56],[-105,68],[-140,74],[-168,72]],
  [[-81,12],[-70,8],[-59,-5],[-50,-18],[-54,-34],[-63,-53],[-76,-42],[-82,-14],[-81,12]],
  [[-60,82],[-34,76],[-25,67],[-40,60],[-55,66],[-60,82]],
  [[-10,36],[5,44],[20,58],[42,63],[70,60],[95,56],[120,46],[145,35],[132,18],[108,9],[83,16],[61,24],[40,34],[20,38],[5,42],[-10,36]],
  [[-17,35],[2,37],[18,32],[32,20],[39,2],[34,-16],[24,-33],[8,-35],[-5,-20],[-12,2],[-17,20],[-17,35]],
  [[111,-11],[132,-10],[153,-27],[146,-43],[123,-39],[111,-23],[111,-11]],
];

export function buildRegionalData(policy, stress) {
  return regionTemplates.map((region) => {
    let variables;
    if (region.id === "north-america") {
      variables = {
        funding: clamp(stress.fundingPressure + 14, 0, 100),
        politics: clamp(stress.politicalPolarization + 18, 0, 100),
        disasters: clamp(stress.disasterShock + 6, 0, 100),
      };
    } else if (region.id === "middle-east") {
      variables = {
        conflict: clamp(stress.conflictShock + 22, 0, 100),
        energy: clamp(stress.tradeDisruption + 20, 0, 100),
        defense: clamp(policy.defensePosture + stress.conflictShock * 0.25, 0, 100),
      };
    } else if (region.id === "east-asia") {
      variables = {
        trade: clamp(stress.tradeDisruption + 24, 0, 100),
        semiconductors: clamp(stress.tradeDisruption + policy.industrialPolicy * 0.35, 0, 100),
        subsidies: clamp(policy.industrialPolicy + 14, 0, 100),
      };
    } else if (region.id === "arctic") {
      variables = {
        climate: clamp(stress.disasterShock + 22, 0, 100),
        infrastructure: clamp(policy.climateResilience + stress.disasterShock * 0.45, 0, 100),
        insurance: clamp(stress.fundingPressure + stress.disasterShock * 0.35, 0, 100),
      };
    } else {
      variables = {
        conflict: clamp(stress.conflictShock + 10, 0, 100),
        trade: clamp(stress.tradeDisruption + 10, 0, 100),
        disasters: clamp(stress.disasterShock + 10, 0, 100),
      };
    }

    const values = Object.values(variables);
    const impact = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

    return {
      ...region,
      variables,
      impact,
      risk: riskLabel(impact),
      budgetDrag: Number((impact * 0.018).toFixed(2)),
    };
  });
}
