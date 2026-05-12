// Scenario presets. Selecting one overrides the slider values; the user can
// then keep tweaking from there.

export const scenarioPresets = [
  {
    id: "baseline",
    label: "Baseline 2026",
    description: "Default starting assumptions.",
    policy: {
      revenueReform: 35, discretionaryCuts: 18, healthcareEfficiency: 28,
      socialSecurityReform: 22, defensePosture: 50, climateResilience: 30, industrialPolicy: 20,
    },
    stress: {
      politicalPolarization: 58, pacPressure: 45, publicSupport: 55, congressionalMargin: 40,
      fundingPressure: 42, conflictShock: 30, disasterShock: 35, tradeDisruption: 25,
    },
  },
  {
    id: "great-power-conflict",
    label: "Great-power conflict",
    description: "Sustained conflict drives defense spending and trade disruption.",
    policy: {
      revenueReform: 25, discretionaryCuts: 10, healthcareEfficiency: 20,
      socialSecurityReform: 15, defensePosture: 78, climateResilience: 25, industrialPolicy: 50,
    },
    stress: {
      politicalPolarization: 65, pacPressure: 55, publicSupport: 48, congressionalMargin: 42,
      fundingPressure: 62, conflictShock: 82, disasterShock: 40, tradeDisruption: 72,
    },
  },
  {
    id: "climate-decade",
    label: "Climate-shock decade",
    description: "Repeated billion-dollar disasters and insurance stress.",
    policy: {
      revenueReform: 40, discretionaryCuts: 12, healthcareEfficiency: 30,
      socialSecurityReform: 20, defensePosture: 48, climateResilience: 72, industrialPolicy: 35,
    },
    stress: {
      politicalPolarization: 60, pacPressure: 50, publicSupport: 58, congressionalMargin: 44,
      fundingPressure: 55, conflictShock: 28, disasterShock: 78, tradeDisruption: 35,
    },
  },
  {
    id: "fiscal-tightening",
    label: "Fiscal tightening",
    description: "Aggressive reform package with broad political buy-in.",
    policy: {
      revenueReform: 70, discretionaryCuts: 55, healthcareEfficiency: 60,
      socialSecurityReform: 55, defensePosture: 50, climateResilience: 35, industrialPolicy: 20,
    },
    stress: {
      politicalPolarization: 40, pacPressure: 30, publicSupport: 68, congressionalMargin: 60,
      fundingPressure: 35, conflictShock: 22, disasterShock: 30, tradeDisruption: 22,
    },
  },
];
