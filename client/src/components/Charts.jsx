import React from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fmtMoney } from "../lib/simulation.js";

export default function Charts({ rows, regions }) {
  return (
    <div className="grid2">
      <div className="card">
        <h2 className="panel-title">Debt and deficit path</h2>
        <p className="muted">Projection runs from 2026 through 2056. Exploratory model — not an official forecast.</p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="debtToGdp" name="Debt / GDP" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="deficitToGdp" name="Deficit / GDP" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">Regional impact</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-10} height={70} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="impact" name="Impact score" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">Federal deficit dollars</h2>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => fmtMoney(value)} />
              <Area type="monotone" dataKey="deficit" name="Annual deficit" strokeWidth={3} fillOpacity={0.18} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="panel-title">What this satisfies</h2>
        <ul className="muted" style={{ lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Frontend: React + Vite, Recharts, Framer Motion, SVG globe.</li>
          <li>Backend: Express API on port 4000.</li>
          <li>Database: Prisma + SQLite for scenario persistence and a metric cache.</li>
          <li>External APIs (server-side): Treasury Fiscal Data, BLS, NOAA / NWS.</li>
          <li>Dynamic functionality: live sliders, presets, 3D globe, scenario save/delete.</li>
        </ul>
      </div>
    </div>
  );
}
