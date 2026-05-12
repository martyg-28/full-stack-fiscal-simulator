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

// Hand-traced continent outlines, ~30-50 vertices each. Recognizable shape
// without pulling in a mapping library or GeoJSON dataset.
export const continentPolygons = [
  // North America (incl. Alaska, Mexico taper, Florida)
  [
    [-167, 66], [-160, 71], [-150, 70], [-141, 70], [-128, 70], [-115, 73],
    [-104, 73], [-95, 73], [-82, 73], [-75, 68], [-66, 60], [-60, 53],
    [-55, 50], [-60, 44], [-67, 45], [-70, 42], [-74, 39], [-76, 35],
    [-79, 32], [-81, 30], [-80, 26], [-81, 25], [-83, 27], [-84, 30],
    [-89, 30], [-93, 30], [-95, 28], [-97, 26], [-94, 18], [-89, 16],
    [-87, 13], [-83, 9], [-101, 17], [-110, 23], [-117, 32], [-122, 37],
    [-124, 41], [-124, 48], [-130, 53], [-138, 58], [-152, 59], [-160, 60],
    [-167, 66]
  ],
  // South America
  [
    [-78, 12], [-72, 12], [-62, 9], [-50, 0], [-35, -8], [-39, -16],
    [-43, -23], [-50, -28], [-58, -33], [-64, -41], [-71, -53], [-68, -54],
    [-72, -45], [-72, -32], [-73, -18], [-78, -8], [-81, -2], [-79, 5],
    [-78, 12]
  ],
  // Greenland
  [
    [-58, 82], [-30, 83], [-21, 76], [-25, 67], [-42, 60], [-50, 64],
    [-56, 72], [-58, 82]
  ],
  // Iceland
  [[-25, 66], [-13, 66], [-13, 63], [-24, 63], [-25, 66]],
  // British Isles
  [
    [-9, 53], [-6, 55], [-2, 58], [1, 56], [1, 52], [-3, 50], [-6, 51],
    [-9, 53]
  ],
  // Eurasia (Europe + Asia, with India)
  [
    [-10, 36], [-9, 43], [-2, 44], [4, 44], [3, 50], [-2, 51], [4, 53],
    [10, 54], [12, 55], [13, 58], [9, 60], [15, 65], [25, 70], [33, 71],
    [50, 73], [70, 76], [95, 78], [115, 78], [130, 73], [142, 67],
    [150, 60], [155, 55], [142, 52], [137, 47], [131, 43], [127, 38],
    [126, 35], [121, 33], [120, 26], [110, 22], [108, 21], [108, 14],
    [104, 11], [99, 11], [99, 7], [95, 6], [92, 12], [91, 22], [86, 22],
    [80, 19], [78, 12], [76, 8], [73, 17], [69, 22], [66, 24], [60, 25],
    [55, 25], [50, 28], [45, 32], [40, 36], [32, 38], [27, 39], [20, 39],
    [10, 38], [3, 38], [-2, 36], [-10, 36]
  ],
  // Arabian peninsula (lower extrusion of Eurasia, drawn separately for clarity)
  [[35, 30], [44, 30], [49, 25], [55, 22], [57, 18], [55, 14], [49, 12], [44, 14], [40, 18], [37, 24], [35, 30]],
  // Africa
  [
    [-17, 32], [-12, 32], [-5, 35], [1, 36], [11, 36], [21, 33], [25, 32],
    [33, 31], [35, 23], [37, 18], [43, 11], [49, 12], [51, 11], [45, 5],
    [42, 0], [41, -5], [39, -10], [40, -16], [35, -22], [33, -25], [30, -29],
    [26, -33], [22, -34], [18, -35], [13, -22], [12, -8], [9, -2], [6, 4],
    [-1, 6], [-9, 8], [-13, 11], [-16, 14], [-17, 21], [-17, 28], [-17, 32]
  ],
  // Australia
  [
    [114, -22], [122, -18], [129, -15], [135, -12], [141, -11], [144, -14],
    [148, -19], [153, -25], [153, -29], [150, -34], [146, -38], [143, -38],
    [137, -35], [127, -32], [120, -33], [115, -32], [114, -28], [114, -22]
  ],
  // Tasmania
  [[145, -41], [148, -41], [148, -43], [145, -43], [145, -41]],
  // Indonesia / Java (one big island as proxy)
  [[95, 6], [120, 0], [128, -3], [130, -8], [115, -8], [102, -5], [95, 6]],
  // Japan (Honshu approx)
  [[131, 31], [136, 34], [141, 37], [142, 41], [140, 45], [142, 45], [144, 41], [141, 36], [136, 33], [132, 32], [131, 31]],
  // Madagascar
  [[44, -12], [50, -16], [50, -25], [46, -25], [43, -20], [44, -12]],
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
