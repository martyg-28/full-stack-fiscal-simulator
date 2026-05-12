// CBO / Concord Coalition budget options. tenYearBillions follows the Concord
// convention: positive means the option *adds* to the deficit, negative means
// it reduces the deficit. Sources: Concord Coalition "Principles & Priorities:
// Budget Options Book" (Mar 2026 ed.), drawing on CBO's Options for Reducing
// the Deficit: 2025–2034 and OMB FY2025/FY2026 budget submissions.

export const policyCategories = [
  { id: "general",   label: "General government", short: "Domestic spending" },
  { id: "defense",   label: "Defense & security", short: "DoD, foreign aid, VA" },
  { id: "health-ss", label: "Healthcare & Social Security", short: "Medicare, Medicaid, SS" },
  { id: "tax",       label: "Tax policy",          short: "Revenue side" },
];

export const policyOptions = [
  // ---- General government ----
  { id: "univ-preschool",    category: "general", tenYearBillions: 200,  label: "Universal free preschool",
    blurb: "Fund a federal–state partnership to provide free preschool for all four-year-olds.",
    pro: "Early-childhood investment improves long-run earnings and tax base.",
    con: "Family/child care has historically been a state and parental responsibility." },
  { id: "paid-leave",        category: "general", tenYearBillions: 325,  label: "National paid family & medical leave",
    blurb: "12 weeks of paid leave administered by the Social Security Administration.",
    pro: "Keeps caregivers, especially women, attached to the workforce.",
    con: "Costly federal mandate; market and employers should provide leave." },
  { id: "double-pell",       category: "general", tenYearBillions: 123,  label: "Double the maximum Pell Grant",
    blurb: "Phase the Pell Grant max to double its current level by 2029.",
    pro: "Increases access to college for low-income students.",
    con: "Larger grants can be absorbed by tuition increases." },
  { id: "cut-amtrak",        category: "general", tenYearBillions: -71,  label: "Eliminate Amtrak / intercity rail subsidies",
    blurb: "End federal subsidies for Amtrak and other intercity rail.",
    pro: "Forces rail to operate on commercial terms.",
    con: "Northeast Corridor is a major piece of national productivity." },
  { id: "cut-crop-insurance",category: "general", tenYearBillions: -47,  label: "Reduce crop insurance subsidies",
    blurb: "Lower the federal share of crop insurance premiums from 60% to 40%.",
    pro: "Subsidies skew to large corporate producers.",
    con: "Smaller farms could be pushed out of the market." },
  { id: "cut-nasa-deep-space",category:"general", tenYearBillions: -93,  label: "Eliminate NASA Deep Space Exploration",
    blurb: "Terminate the Artemis / Deep Space Exploration Systems budget.",
    pro: "Private space industry can take more of the load.",
    con: "Stalls technology pipeline for human missions to Mars." },
  { id: "reduce-fed-pay",    category: "general", tenYearBillions: -58,  label: "Reduce federal civilian pay adjustment",
    blurb: "Cut the FEPCA annual pay adjustment by 0.5 percentage points.",
    pro: "Lower compensation growth; rewards merit over tenure.",
    con: "Worsens federal recruiting in a tight labor market." },

  // ---- Defense & security ----
  { id: "cut-dod-manpower",  category: "defense", tenYearBillions: -959, label: "Reduce DoD active manpower 17% by 2034",
    blurb: "Shrink active-duty force in proportion to current funding levels.",
    pro: "Defense is ~45% of discretionary spending.",
    con: "Cuts capability in a more contested security environment." },
  { id: "cut-dod-rd",        category: "defense", tenYearBillions: -75,  label: "Slow DoD procurement & R&D",
    blurb: "Defer/cancel future weapons programs (nuclear, Ford-class carriers, etc.).",
    pro: "DoD financial management is repeatedly flagged as high-risk.",
    con: "Cedes the modernization race to adversaries." },
  { id: "repeal-obbba-dhs",  category: "defense", tenYearBillions: -176, label: "Repeal OBBBA homeland security increases",
    blurb: "Reverse the 2025 reconciliation bill's ICE / border infrastructure spending.",
    pro: "Reform, not enforcement-only, is the cost-efficient lever.",
    con: "Illegal immigration is a continuing security challenge." },
  { id: "tricare-fees",      category: "defense", tenYearBillions: -48,  label: "Introduce TRICARE-for-Life cost sharing",
    blurb: "$575 enrollment fee plus out-of-pocket minimums for military retirees on Medicare.",
    pro: "Mirrors private-sector Medicare cost-sharing norms.",
    con: "Breaks a benefit promise made to current retirees." },
  { id: "cut-foreign-aid",   category: "defense", tenYearBillions: -225, label: "Cut international affairs / foreign aid 30%",
    blurb: "Reduce State + USAID spending by 30% over the next decade.",
    pro: "Prioritize domestic over external spending.",
    con: "Cedes diplomatic and economic ground to rival powers." },
  { id: "means-test-va",     category: "defense", tenYearBillions: -253, label: "Means-test VA disability compensation",
    blurb: "Phase out benefits above the 70th-percentile household income.",
    pro: "Targets aid to lower-income disabled veterans.",
    con: "Treats earned benefits as welfare; breaks the service compact." },

  // ---- Healthcare & Social Security ----
  { id: "site-neutral",      category: "health-ss", tenYearBillions: -157,  label: "Site-neutral Medicare payments",
    blurb: "Pay the same Medicare rate regardless of outpatient site of care.",
    pro: "Endorsed by MedPAC; included in Obama and Trump budgets.",
    con: "Mirrors longstanding private-sector practice." },
  { id: "premium-support",   category: "health-ss", tenYearBillions: -1875, label: "Convert Medicare to premium support",
    blurb: "Replace fee-for-service Medicare with means-tested subsidies for private plans.",
    pro: "Brings real cost competition into Medicare.",
    con: "Shifts healthcare-inflation risk to seniors." },
  { id: "fix-ma-coding",     category: "health-ss", tenYearBillions: -1049, label: "Cut Medicare Advantage overpayments",
    blurb: "Raise the coding-intensity adjustment from 5.9% to at least 20%.",
    pro: "Today's MA payments reward coding, not quality.",
    con: "MA plans score better on many quality metrics." },
  { id: "expand-medicare",   category: "health-ss", tenYearBillions: 358,   label: "Add dental, vision, hearing to Medicare",
    blurb: "Cover dentures, glasses, and hearing aids under Parts A/B.",
    pro: "Closes a major gap in senior healthcare access.",
    con: "Adds cost to a program already on an unsustainable path." },
  { id: "raise-partb",       category: "health-ss", tenYearBillions: -510,  label: "Raise Medicare Part B premiums to 35%",
    blurb: "Phase Part B basic premium up to 35% of program costs over 5 years.",
    pro: "Restores the original 50% beneficiary cost share over time.",
    con: "Hits retirees on fixed incomes." },
  { id: "repeal-medicaid-work", category: "health-ss", tenYearBillions: 326, label: "Repeal Medicaid work requirements",
    blurb: "Remove the OBBBA's 80-hours-per-month community engagement rule.",
    pro: "Avoids 4.8M people losing coverage from paperwork attrition.",
    con: "Work requirements screen for genuine need." },
  { id: "perm-aca-ptc",      category: "health-ss", tenYearBillions: 335,   label: "Make enhanced ACA tax credits permanent",
    blurb: "Permanently extend ARP/IRA premium tax credits above 400% FPL.",
    pro: "Keeps ~4M people insured through 2034.",
    con: "Subsidizes households well above the poverty line." },
  { id: "raise-fra-70",      category: "health-ss", tenYearBillions: -95,   label: "Raise Social Security FRA to 70",
    blurb: "Phase the full retirement age to 70 for workers born 1981+.",
    pro: "Tracks gains in life expectancy.",
    con: "Hits physically demanding occupations hardest." },
  { id: "raise-ss-cap",      category: "health-ss", tenYearBillions: -728,  label: "Raise the Social Security payroll-tax cap to $300K",
    blurb: "Cover 90% of covered wages (vs. ~80% today).",
    pro: "Closes a major Trust Fund shortfall on the revenue side.",
    con: "Material payroll-tax hike on the self-employed and small business." },
  { id: "chained-cpi",       category: "health-ss", tenYearBillions: -278,  label: "Use chained CPI for COLAs",
    blurb: "Index Social Security and other mandatory programs to chained CPI.",
    pro: "More accurately reflects consumer substitution.",
    con: "Erodes real benefits, especially for the very old." },

  // ---- Tax policy ----
  { id: "capgains-plus-2",   category: "tax", tenYearBillions: -103,  label: "Raise long-term capital-gains rates +2 pp",
    blurb: "Each capital-gains bracket up by 2 percentage points (0/15/20 → 2/17/22).",
    pro: "Modest revenue without breaking the preferential rate structure.",
    con: "Reduces incentive to invest at the margin." },
  { id: "eliminate-estate",  category: "tax", tenYearBillions: 313,   label: "Eliminate the federal estate tax",
    blurb: "Repeal the 40% estate tax (currently hitting <0.1% of estates).",
    pro: "Ends a 'second tax' on already-taxed wealth.",
    con: "Benefits flow almost entirely to the very wealthy." },
  { id: "corp-21-to-22",     category: "tax", tenYearBillions: -136,  label: "Corporate tax 21% → 22%",
    blurb: "One-point rate increase from current statutory rate.",
    pro: "Modest revenue, minimal competitiveness impact.",
    con: "Some incidence falls on workers as lower wages." },
  { id: "corp-21-to-28",     category: "tax", tenYearBillions: -1350, label: "Corporate tax 21% → 28%",
    blurb: "Move halfway back to the pre-2017 statutory rate.",
    pro: "Reverses about half of the TCJA's revenue loss.",
    con: "OECD-high effective rate hurts competitiveness." },
  { id: "cap-empl-health",   category: "tax", tenYearBillions: -521,  label: "Cap employer health benefit tax exclusion",
    blurb: "Tax employer-paid premiums above ~75th-percentile plans.",
    pro: "Largest single tax expenditure; distorts coverage upward.",
    con: "Reads as a middle-class tax hike." },
  { id: "cut-ed-credits",    category: "tax", tenYearBillions: -130,  label: "Eliminate education tax credits",
    blurb: "Repeal the American Opportunity and Lifetime Learning credits.",
    pro: "Credits skew to households with enough liability to claim them.",
    con: "Hits middle-income families that don't qualify for Pell." },
  { id: "kill-stepup",       category: "tax", tenYearBillions: -197,  label: "Eliminate stepped-up basis at death",
    blurb: "Tax inherited capital gains as of the original cost basis.",
    pro: "Closes a major loophole that lets gains escape tax entirely.",
    con: "Hard to administer on illiquid assets like family businesses." },
];

export const policyOptionsById = Object.fromEntries(policyOptions.map((option) => [option.id, option]));

// Convert the catalog of selected options into a per-year shift to deficit/GDP.
// Concord effects are 10-year cumulative; we annualize over ~$34T average GDP.
const AVG_TEN_YEAR_GDP_TRILLIONS = 34;

export function optionsDeficitDeltaPctGdp(selectedIds) {
  const totalTenYearBillions = selectedIds.reduce(
    (sum, id) => sum + (policyOptionsById[id]?.tenYearBillions ?? 0),
    0
  );
  const annualBillions = totalTenYearBillions / 10;
  return (annualBillions / (AVG_TEN_YEAR_GDP_TRILLIONS * 1000)) * 100;
}

export function selectedTenYearTotalBillions(selectedIds) {
  return selectedIds.reduce(
    (sum, id) => sum + (policyOptionsById[id]?.tenYearBillions ?? 0),
    0
  );
}
