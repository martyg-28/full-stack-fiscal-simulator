import { clamp } from "./simulation.js";

function degToRad(value) {
  return (value * Math.PI) / 180;
}

export function projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy) {
  const latRad = degToRad(lat);
  const lonRad = degToRad(lon + rotationDeg);
  const x3d = Math.cos(latRad) * Math.sin(lonRad);
  const y3d = Math.sin(latRad);
  const z3d = Math.cos(latRad) * Math.cos(lonRad);
  return {
    x: cx + x3d * radius,
    y: cy - y3d * radius,
    z: z3d,
    front: z3d > 0,
    scale: clamp(0.45 + z3d * 0.55, 0.18, 1),
  };
}

export function makeLatitudeLine(lat) {
  const points = [];
  for (let lon = -180; lon <= 180; lon += 5) points.push([lon, lat]);
  return points;
}

export function makeLongitudeLine(lon) {
  const points = [];
  for (let lat = -80; lat <= 80; lat += 4) points.push([lon, lat]);
  return points;
}

export function buildProjectedLine(points, rotationDeg, radius, cx, cy) {
  let path = "";
  let started = false;
  for (const [lon, lat] of points) {
    const point = projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy);
    if (!point.front) {
      started = false;
      continue;
    }
    path += `${started ? "L" : "M"} ${point.x} ${point.y} `;
    started = true;
  }
  return path.trim();
}

export function buildPolygonPath(points, rotationDeg, radius, cx, cy) {
  const projected = points
    .map(([lon, lat]) => projectSpherePoint(lat, lon, rotationDeg, radius, cx, cy))
    .filter((point) => point.front);
  if (projected.length < 3) return "";
  return `${projected.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")} Z`;
}
