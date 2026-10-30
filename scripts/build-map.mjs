/**
 * Builds the base map for the project map (src/lib/drawing/map-data.json)
 * from Natural Earth vector data, which is in the public domain.
 *
 *   node scripts/build-map.mjs <folder with Natural Earth GeoJSON>
 *
 * The folder must contain, from https://github.com/nvkelso/natural-earth-vector
 * (release v5.1.2, folder geojson/):
 *   ne_50m_land.geojson
 *   ne_10m_rivers_lake_centerlines.geojson
 *   ne_10m_lakes.geojson
 *
 * Each frame is clipped to its bounds (with a margin hidden by a clip path),
 * projected (equirectangular, true to scale at the frame's middle latitude),
 * simplified and rounded. Only the generated file is committed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Usage: node scripts/build-map.mjs <folder with Natural Earth GeoJSON>');
  process.exit(1);
}
const read = (name) => JSON.parse(readFileSync(join(dir, name), 'utf8'));

const FRAMES = {
  'south-asia': { bbox: [67, 5, 97, 30], width: 1000, riverRank: 7, lakeArea: 1.5 },
  iberia: { bbox: [-9.9, 35.8, 3.6, 43.9], width: 420, riverRank: 6, lakeArea: 2 },
};
const MARGIN = 1.5;
const TOLERANCE = 0.45;

/* ------------------------------------------------------------- Geometry */

function clipPolygon(ring, [x0, y0, x1, y1]) {
  const edges = [
    (p) => p[0] >= x0,
    (p) => p[0] <= x1,
    (p) => p[1] >= y0,
    (p) => p[1] <= y1,
  ];
  const cross = [
    (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])],
    (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0],
    (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1],
  ];
  let out = ring;
  for (let e = 0; e < 4; e++) {
    const input = out;
    out = [];
    if (!input.length) break;
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      const inCur = edges[e](cur);
      const inPrev = edges[e](prev);
      if (inCur) {
        if (!inPrev) out.push(cross[e](prev, cur));
        out.push(cur);
      } else if (inPrev) {
        out.push(cross[e](prev, cur));
      }
    }
  }
  return out;
}

function clipLine(line, [x0, y0, x1, y1]) {
  const inside = (p) => p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;
  const parts = [];
  let cur = [];
  for (const p of line) {
    if (inside(p)) cur.push(p);
    else if (cur.length) {
      cur.push(p);
      parts.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) parts.push(cur);
  return parts;
}

function simplify(points, tol) {
  if (points.length < 3) return points;
  const sq = tol * tol;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > sq && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const ringArea = (r) => {
  let s = 0;
  for (let i = 0; i < r.length; i++) {
    const [x1, y1] = r[i];
    const [x2, y2] = r[(i + 1) % r.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s / 2);
};

const n = (v) => Math.round(v * 10) / 10;
const path = (pts, close) => `M${pts.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}${close ? 'Z' : ''}`;

function polygons(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}

function lines(geom) {
  if (!geom) return [];
  if (geom.type === 'LineString') return [geom.coordinates];
  if (geom.type === 'MultiLineString') return geom.coordinates;
  return [];
}

/* --------------------------------------------------------------- Build */

const land = read('ne_50m_land.geojson');
const rivers = read('ne_10m_rivers_lake_centerlines.geojson');
const lakes = read('ne_10m_lakes.geojson');

const out = {
  source:
    'Made with Natural Earth: free vector and raster map data at naturalearthdata.com (public domain). Land 1:50m, rivers and lakes 1:10m, version 5.1.2.',
  frames: {},
};

for (const [key, f] of Object.entries(FRAMES)) {
  const [lon0, lat0, lon1, lat1] = f.bbox;
  const phi = (((lat0 + lat1) / 2) * Math.PI) / 180;
  const s = f.width / ((lon1 - lon0) * Math.cos(phi));
  const height = Math.round((lat1 - lat0) * s);
  const project = ([lon, lat]) => [(lon - lon0) * s * Math.cos(phi), (lat1 - lat) * s];
  const wide = [lon0 - MARGIN, lat0 - MARGIN, lon1 + MARGIN, lat1 + MARGIN];

  const polys = (collection, minArea) => {
    const parts = [];
    for (const feat of collection.features) {
      for (const poly of polygons(feat.geometry)) {
        for (const ring of poly) {
          const clipped = clipPolygon(ring, wide);
          if (clipped.length < 3) continue;
          const pts = simplify(clipped.map(project), TOLERANCE);
          if (pts.length < 3 || ringArea(pts) < minArea) continue;
          parts.push(path(pts, true));
        }
      }
    }
    return parts.join('');
  };

  const riverPaths = [];
  for (const feat of rivers.features) {
    const rank = feat.properties.scalerank ?? 10;
    if (rank > f.riverRank || feat.properties.featurecla?.includes('Lake')) continue;
    for (const line of lines(feat.geometry)) {
      for (const part of clipLine(line, wide)) {
        const pts = simplify(part.map(project), TOLERANCE);
        if (pts.length < 2) continue;
        riverPaths.push({ d: path(pts, false), rank });
      }
    }
  }
  riverPaths.sort((a, b) => b.rank - a.rank);

  out.frames[key] = {
    bbox: f.bbox,
    width: f.width,
    height,
    scale: Math.round(s * 1000) / 1000,
    land: polys(land, 2),
    lakes: polys(lakes, f.lakeArea),
    rivers: riverPaths,
  };
  console.log(`${key}: ${f.width}×${height}, ${riverPaths.length} river paths`);
}

const target = new URL('../src/lib/drawing/map-data.json', import.meta.url);
writeFileSync(target, JSON.stringify(out));
console.log(`Wrote ${target.pathname} (${Math.round(JSON.stringify(out).length / 1024)} KB)`);
