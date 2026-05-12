import React, { useMemo, useState } from "react";
import {
  policyCategories,
  policyOptions,
  policyOptionsById,
  selectedTenYearTotalBillions,
} from "../lib/policyOptions.js";

function formatBillions(n) {
  if (n === 0) return "$0";
  const sign = n > 0 ? "+" : "−";
  const abs = Math.abs(n);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}T`;
  return `${sign}$${abs}B`;
}

function OptionCard({ option, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const direction = option.tenYearBillions > 0 ? "increase" : option.tenYearBillions < 0 ? "decrease" : "neutral";
  return (
    <div className={`option-card ${selected ? "is-selected" : ""}`}>
      <label className="option-head">
        <input type="checkbox" checked={selected} onChange={onToggle} />
        <div className="option-title">
          <strong>{option.label}</strong>
          <small>{option.blurb}</small>
        </div>
        <span className={`option-impact ${direction}`}>{formatBillions(option.tenYearBillions)}</span>
      </label>
      <button type="button" className="option-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide arguments" : "Show arguments"}
      </button>
      {open && (
        <div className="option-args">
          <p><strong>Proponents:</strong> {option.pro}</p>
          <p><strong>Opponents:</strong> {option.con}</p>
        </div>
      )}
    </div>
  );
}

export default function PolicyOptionsPanel({ selectedOptionIds, setSelectedOptionIds, deltaPctGdp }) {
  const [activeCategory, setActiveCategory] = useState("general");
  const selectedSet = useMemo(() => new Set(selectedOptionIds), [selectedOptionIds]);

  function toggle(id) {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function clearAll() { setSelectedOptionIds([]); }
  function pickBalanced() {
    // A defensible bipartisan package: site-neutral payments, MA coding fix, chained CPI,
    // SS cap raise, +2pp capital gains, end stepped-up basis, modest corp tax bump.
    setSelectedOptionIds([
      "site-neutral", "fix-ma-coding", "chained-cpi", "raise-ss-cap",
      "capgains-plus-2", "kill-stepup", "corp-21-to-22",
    ]);
  }

  const totalBillions = selectedTenYearTotalBillions(selectedOptionIds);
  const byCategory = policyOptions.filter((o) => o.category === activeCategory);
  const totals = policyCategories.map((cat) => {
    const ids = selectedOptionIds.filter((id) => policyOptionsById[id]?.category === cat.id);
    return { cat, count: ids.length, billions: selectedTenYearTotalBillions(ids) };
  });

  return (
    <div className="card">
      <div className="options-head">
        <div>
          <span className="badge">CBO / Concord Coalition</span>
          <h2 className="panel-title" style={{ marginTop: 10 }}>Pick policy options</h2>
          <p className="muted">
            Each toggle applies a real CBO-scored 10-year deficit effect. Mix and match. Negative numbers
            shrink the deficit; positive numbers add to it.
          </p>
        </div>
        <div className="options-summary">
          <div className={`options-total ${totalBillions > 0 ? "increase" : totalBillions < 0 ? "decrease" : "neutral"}`}>
            <small>10-year deficit impact</small>
            <strong>{formatBillions(totalBillions)}</strong>
            <span>≈ {deltaPctGdp >= 0 ? "+" : ""}{deltaPctGdp.toFixed(2)} pp of GDP / yr</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={pickBalanced}>Balanced package</button>
            <button className="btn ghost" onClick={clearAll}>Clear all</button>
          </div>
        </div>
      </div>

      <div className="options-tabs">
        {policyCategories.map((cat) => {
          const t = totals.find((x) => x.cat.id === cat.id);
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`options-tab ${active ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <strong>{cat.label}</strong>
              <small>{t?.count || 0} selected · {formatBillions(t?.billions || 0)}</small>
            </button>
          );
        })}
      </div>

      <div className="options-grid">
        {byCategory.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={selectedSet.has(option.id)}
            onToggle={() => toggle(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
