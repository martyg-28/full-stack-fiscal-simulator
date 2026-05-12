import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runProjection,
  applyRealDataToStress,
  projectSpherePoint,
  baseline,
} from "../src/simulation.js";

const samplePolicy = {
  revenueReform: 35,
  discretionaryCuts: 18,
  healthcareEfficiency: 28,
  socialSecurityReform: 22,
  defensePosture: 50,
  climateResilience: 30,
  industrialPolicy: 20,
};

const calmStress = {
  politicalPolarization: 30,
  pacPressure: 25,
  publicSupport: 70,
  congressionalMargin: 55,
  fundingPressure: 25,
  conflictShock: 10,
  disasterShock: 15,
  tradeDisruption: 10,
};

const stormyStress = {
  ...calmStress,
  fundingPressure: 80,
  conflictShock: 75,
  disasterShock: 70,
  tradeDisruption: 70,
};

test("projection spans 2026 through 2056", () => {
  const rows = runProjection(samplePolicy, calmStress);
  assert.equal(rows.length, baseline.endYear - baseline.startYear + 1);
  assert.equal(rows[0].year, 2026);
  assert.equal(rows.at(-1).year, 2056);
});

test("higher shocks worsen the debt-to-GDP path", () => {
  const calm = runProjection(samplePolicy, calmStress);
  const stormy = runProjection(samplePolicy, stormyStress);
  assert.ok(stormy.at(-1).debtToGdp > calm.at(-1).debtToGdp);
});

test("stronger reforms improve the debt-to-GDP path", () => {
  const weak = runProjection({ ...samplePolicy, revenueReform: 0, discretionaryCuts: 0 }, calmStress);
  const strong = runProjection({ ...samplePolicy, revenueReform: 90, discretionaryCuts: 80 }, calmStress);
  assert.ok(strong.at(-1).debtToGdp < weak.at(-1).debtToGdp);
});

test("government metrics push expected stress dials", () => {
  const blended = applyRealDataToStress(calmStress, {
    debtTrillions: 36,
    avgTreasuryRate: 4.5,
    cpiInflationYoY: 4.0,
    unemploymentRate: 6.0,
    activeWeatherAlerts: 360,
  });
  assert.ok(blended.fundingPressure > calmStress.fundingPressure, "funding pressure rises");
  assert.ok(blended.tradeDisruption > calmStress.tradeDisruption, "trade disruption rises with CPI");
  assert.ok(blended.publicSupport < calmStress.publicSupport, "unemployment lowers public support");
  assert.ok(blended.disasterShock > calmStress.disasterShock, "weather alerts raise disaster shock");
});

test("spherical projection returns finite coordinates", () => {
  for (const lat of [-80, 0, 45, 80]) {
    for (const lon of [-170, 0, 100, 175]) {
      const p = projectSpherePoint(lat, lon, 37, 180, 330, 255);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
      assert.ok(p.scale >= 0.18 && p.scale <= 1);
    }
  }
});
