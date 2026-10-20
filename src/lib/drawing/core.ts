/**
 * Drawing engine for the platform's original analytical plates.
 *
 * Everything is deterministic: a plate is generated from a seed, so the same
 * drawing is produced on every build. The vocabulary is that of architectural
 * survey drawings: contours, water, figure–ground fabric, field patterns,
 * hatching and annotation.
 */

export type Vec = [number, number];
export type Rng = () => number;

/* ---------------------------------------------------------------- Random */

export function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const between = (r: Rng, a: number, b: number) => a + (b - a) * r();

/* ----------------------------------------------------------------- Noise */

export type Noise = (x: number, y: number) => number;

export function perlin(seed: number): Noise {
  const r = rng(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const grad = (h: number, x: number, y: number) => {
    switch (h & 7) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      case 4: return x;
      case 5: return -x;
      case 6: return y;
      default: return -y;
    }
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const X = xi & 255;
    const Y = yi & 255;
    const xf = x - xi;
    const yf = y - yi;
    const u = fade(xf);
    const v = fade(yf);
    const aa = p[p[X] + Y];
    const ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y];
    const bb = p[p[X + 1] + Y + 1];
    return (
      lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v,
      ) * 0.7071
    );
  };
}

export function fbm(noise: Noise, x: number, y: number, octaves = 4, gain = 0.5): number {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= 2;
  }
  return sum / norm;
}

/* -------------------------------------------------------------- Geometry */

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k];
export const len = (a: Vec) => Math.hypot(a[0], a[1]);
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1];
export const norm = (a: Vec): Vec => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const perp = (a: Vec): Vec => [-a[1], a[0]];
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const rotate = (p: Vec, angle: number, c: Vec = [0, 0]): Vec => {
  const s = Math.sin(angle);
  const k = Math.cos(angle);
  const x = p[0] - c[0];
  const y = p[1] - c[1];
  return [c[0] + x * k - y * s, c[1] + x * s + y * k];
};
export const polar = (c: Vec, r: number, angle: number): Vec => [c[0] + r * Math.cos(angle), c[1] + r * Math.sin(angle)];

export function centroid(poly: Vec[]): Vec {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

export function chaikin(points: Vec[], iterations = 2, closed = false): Vec[] {
  let pts = points;
  for (let k = 0; k < iterations; k++) {
    const out: Vec[] = closed ? [] : [pts[0]];
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      out.push(lerpV(a, b, 0.25), lerpV(a, b, 0.75));
    }
    if (!closed) out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

function distSegSq(p: Vec, a: Vec, b: Vec): number {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 ? Math.max(0, Math.min(1, dot(sub(p, a), ab) / l2)) : 0;
  const d = sub(p, add(a, mul(ab, t)));
  return dot(d, d);
}

export function distToPolyline(p: Vec, line: Vec[]): number {
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) best = Math.min(best, distSegSq(p, line[i], line[i + 1]));
  return Math.sqrt(best);
}

/** Ramer–Douglas–Peucker simplification. */
export function simplify(points: Vec[], tolerance: number): Vec[] {
  if (points.length < 3) return points;
  const tol2 = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = distSegSq(points[i], points[s], points[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx > -1 && maxD > tol2) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

export function inPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Offsets an open polyline by d (positive to the left of travel). */
export function offset(line: Vec[], d: number | ((i: number) => number)): Vec[] {
  return line.map((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const n = perp(norm(sub(b, a)));
    const k = typeof d === 'function' ? d(i) : d;
    return add(p, mul(n, k));
  });
}

/** Clips the segment a–b to a convex polygon (Cyrus–Beck). */
export function clipToConvex(a: Vec, b: Vec, poly: Vec[]): [Vec, Vec] | null {
  let t0 = 0;
  let t1 = 1;
  const d = sub(b, a);
  const c = centroid(poly);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    let n = perp(sub(q, p));
    if (dot(n, sub(c, p)) < 0) n = mul(n, -1); // inward normal
    const den = dot(n, d);
    const num = dot(n, sub(a, p));
    if (Math.abs(den) < 1e-9) {
      if (num < 0) return null;
      continue;
    }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 > t1) return null;
  }
  return [add(a, mul(d, t0)), add(a, mul(d, t1))];
}

/** Parallel hatch lines filling a convex polygon. */
export function hatch(poly: Vec[], angle: number, spacing: number): [Vec, Vec][] {
  const dir: Vec = [Math.cos(angle), Math.sin(angle)];
  const n = perp(dir);
  const proj = poly.map((p) => dot(p, n));
  const along = poly.map((p) => dot(p, dir));
  const min = Math.min(...proj);
  const max = Math.max(...proj);
  const aMin = Math.min(...along) - 10;
  const aMax = Math.max(...along) + 10;
  const out: [Vec, Vec][] = [];
  for (let k = min + spacing / 2; k < max; k += spacing) {
    const a = add(mul(n, k), mul(dir, aMin));
    const b = add(mul(n, k), mul(dir, aMax));
    const seg = clipToConvex(a, b, poly);
    if (seg) out.push(seg);
  }
  return out;
}

/* ----------------------------------------------------------- Contours */

/** Marching squares: iso-lines of a scalar field, joined into polylines. */
export function contours(
  field: (x: number, y: number) => number,
  width: number,
  height: number,
  cell: number,
  levels: number[],
): { level: number; lines: Vec[][] }[] {
  const cols = Math.ceil(width / cell) + 1;
  const rows = Math.ceil(height / cell) + 1;
  const v = new Float64Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * cell, j * cell);

  return levels.map((L) => {
    const segs: [Vec, Vec][] = [];
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const tl = v[j * cols + i];
        const tr = v[j * cols + i + 1];
        const br = v[(j + 1) * cols + i + 1];
        const bl = v[(j + 1) * cols + i];
        const idx = (tl > L ? 8 : 0) | (tr > L ? 4 : 0) | (br > L ? 2 : 0) | (bl > L ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cell;
        const y = j * cell;
        const top: Vec = [x + cell * ((L - tl) / (tr - tl)), y];
        const right: Vec = [x + cell, y + cell * ((L - tr) / (br - tr))];
        const bottom: Vec = [x + cell * ((L - bl) / (br - bl)), y + cell];
        const left: Vec = [x, y + cell * ((L - tl) / (bl - tl))];
        const centre = (tl + tr + br + bl) / 4 > L;
        switch (idx) {
          case 1: case 14: segs.push([left, bottom]); break;
          case 2: case 13: segs.push([bottom, right]); break;
          case 3: case 12: segs.push([left, right]); break;
          case 4: case 11: segs.push([top, right]); break;
          case 6: case 9: segs.push([top, bottom]); break;
          case 7: case 8: segs.push([left, top]); break;
          case 5:
            if (centre) segs.push([left, top], [bottom, right]);
            else segs.push([left, bottom], [top, right]);
            break;
          case 10:
            if (centre) segs.push([left, bottom], [top, right]);
            else segs.push([left, top], [bottom, right]);
            break;
        }
      }
    }
    return { level: L, lines: join(segs) };
  });
}

function join(segs: [Vec, Vec][]): Vec[][] {
  const key = (p: Vec) => `${Math.round(p[0] * 100)},${Math.round(p[1] * 100)}`;
  const adj = new Map<string, number[]>();
  segs.forEach((s, i) => {
    for (const p of s) {
      const k = key(p);
      const list = adj.get(k);
      if (list) list.push(i);
      else adj.set(k, [i]);
    }
  });
  const used = new Uint8Array(segs.length);
  const lines: Vec[][] = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    used[i] = 1;
    const line: Vec[] = [segs[i][0], segs[i][1]];
    for (const forward of [true, false]) {
      for (;;) {
        const end = forward ? line[line.length - 1] : line[0];
        const k = key(end);
        const next = (adj.get(k) ?? []).find((j) => !used[j]);
        if (next === undefined) break;
        used[next] = 1;
        const s = segs[next];
        const other = key(s[0]) === k ? s[1] : s[0];
        if (forward) line.push(other);
        else line.unshift(other);
      }
    }
    lines.push(line);
  }
  return lines;
}

/* ------------------------------------------------------------- Fabric */

export interface FabricOptions {
  /** Grid origin, rotation and block size. */
  origin: Vec;
  angle: number;
  block: [number, number];
  /** Extent of the grid in local units (from origin). */
  extent: [number, number, number, number];
  jitter?: number;
  warp?: (p: Vec) => Vec;
  street?: number;
  lotWidth?: [number, number];
  lotDepth?: [number, number];
  /** Probability that a lot is built; may vary across the plate. */
  density?: number | ((p: Vec) => number);
  openChance?: number;
  include: (p: Vec) => boolean;
}

export interface Fabric {
  buildings: Vec[][];
  open: Vec[][];
  blocks: Vec[][];
}

/** Perimeter-block urban fabric generated from a warped, rotated grid. */
export function fabric(r: Rng, o: FabricOptions): Fabric {
  const [bw, bh] = o.block;
  const [u0, v0, u1, v1] = o.extent;
  const cols = Math.ceil((u1 - u0) / bw) + 1;
  const rows = Math.ceil((v1 - v0) / bh) + 1;
  const jit = o.jitter ?? 0.08;
  const grid: Vec[][] = [];
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      const local: Vec = [
        u0 + i * bw + (r() - 0.5) * bw * jit,
        v0 + j * bh + (r() - 0.5) * bh * jit,
      ];
      let p = rotate(add(o.origin, local), o.angle, o.origin);
      if (o.warp) p = o.warp(p);
      grid[i][j] = p;
    }
  }
  const street = o.street ?? 8;
  const [lw0, lw1] = o.lotWidth ?? [8, 16];
  const [ld0, ld1] = o.lotDepth ?? [10, 20];
  const density = typeof o.density === 'function' ? o.density : () => (o.density as number | undefined) ?? 0.88;
  const out: Fabric = { buildings: [], open: [], blocks: [] };

  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      const quad: Vec[] = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]];
      const c = centroid(quad);
      if (!o.include(c)) continue;
      // Inset the block from the street centre-lines.
      const minDim = Math.min(len(sub(quad[1], quad[0])), len(sub(quad[3], quad[0])));
      if (minDim < street * 2.2) continue;
      const k = 1 - street / minDim;
      const blk = quad.map((p) => add(c, mul(sub(p, c), k)));
      out.blocks.push(blk);
      if (r() < (o.openChance ?? 0.04)) {
        out.open.push(blk);
        continue;
      }
      const blockDensity = density(c);
      if (blockDensity <= 0.02) continue;
      const depthCap = Math.min(len(sub(blk[1], blk[0])), len(sub(blk[3], blk[0]))) * 0.46;
      for (let e = 0; e < 4; e++) {
        const a = blk[e];
        const b = blk[(e + 1) % 4];
        const L = len(sub(b, a));
        const u = norm(sub(b, a));
        let n = perp(u);
        if (dot(n, sub(c, a)) < 0) n = mul(n, -1);
        let t = 0;
        while (t < L - lw0 * 0.6) {
          const w = Math.min(between(r, lw0, lw1), L - t);
          const d = Math.min(between(r, ld0, ld1) * (r() < 0.12 ? 1.6 : 1), depthCap);
          if (r() < blockDensity) {
            const p0 = add(a, mul(u, t));
            const p1 = add(a, mul(u, t + w));
            const lot: Vec[] = [p0, p1, add(p1, mul(n, d)), add(p0, mul(n, d))];
            if (o.include(centroid(lot))) out.buildings.push(lot);
          }
          t += w + (r() < 0.1 ? between(r, 2, 6) : 0);
        }
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------- Water */

export interface River {
  centre: Vec[];
  left: Vec[];
  right: Vec[];
  width: (i: number) => number;
}

export function river(r: Rng, noise: Noise, from: Vec, to: Vec, meander: number, width: number, freq = 1.6): River {
  const pts: Vec[] = [];
  const steps = 48;
  const dir = norm(sub(to, from));
  const n = perp(dir);
  const phase = r() * Math.PI * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const base = lerpV(from, to, t);
    const off = Math.sin(t * Math.PI * freq + phase) * meander + noise(t * 2.3, 7.1) * meander * 0.9;
    pts.push(add(base, mul(n, off)));
  }
  const centre = chaikin(pts, 3);
  const w = (i: number) => width * (0.72 + 0.62 * (0.5 + 0.5 * noise(i * 0.045, 3.3)));
  const rough = (i: number, k: number) => noise(i * 0.16, k) * width * 0.05;
  return {
    centre,
    width: w,
    left: offset(centre, (i) => w(i) / 2 + rough(i, 1.7)),
    right: offset(centre, (i) => -w(i) / 2 + rough(i, 5.2)),
  };
}

/** Elongated sandbar islands (chars) in the widest reaches of a river. */
export function chars(rv: River, count: number, r: Rng): Vec[][] {
  const n = rv.centre.length;
  const out: Vec[][] = [];
  const candidates = rv.centre
    .map((_, i) => i)
    .filter((i) => i > n * 0.08 && i < n * 0.92)
    .sort((a, b) => rv.width(b) - rv.width(a));
  const taken: number[] = [];
  for (const i of candidates) {
    if (out.length >= count) break;
    if (taken.some((t) => Math.abs(t - i) < n * 0.18)) continue;
    taken.push(i);
    const span = Math.round(n * (0.035 + r() * 0.03));
    const seg = rv.centre.slice(Math.max(0, i - span), Math.min(n, i + span));
    const half = (k: number) => Math.sin((Math.PI * k) / (seg.length - 1)) * rv.width(i) * (0.16 + r() * 0.08);
    const shift = (r() - 0.5) * rv.width(i) * 0.25;
    const a = offset(seg, (k) => shift + half(k));
    const b = offset(seg, (k) => shift - half(k));
    out.push(chaikin([...a, ...b.reverse()], 2, true));
  }
  return out;
}

export function riverPolygon(rv: River): Vec[] {
  return [...rv.left, ...rv.right.slice().reverse()];
}

/* ------------------------------------------------------------------ SVG */

const f = (n: number) => (Math.round(n * 10) / 10).toString();

export function path(points: Vec[], closed = false): string {
  if (!points.length) return '';
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += `L${f(points[i][0])} ${f(points[i][1])}`;
  return closed ? `${d}Z` : d;
}

/** Compact path for many small polygons (relative coordinates, integers). */
export function polys(list: Vec[][]): string {
  let d = '';
  for (const poly of list) {
    let [px, py] = [Math.round(poly[0][0]), Math.round(poly[0][1])];
    d += `M${px} ${py}`;
    for (let i = 1; i < poly.length; i++) {
      const x = Math.round(poly[i][0]);
      const y = Math.round(poly[i][1]);
      d += `l${x - px} ${y - py}`;
      px = x;
      py = y;
    }
    d += 'z';
  }
  return d;
}

export function segments(list: [Vec, Vec][]): string {
  return list.map(([a, b]) => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`).join('');
}

export const PALETTE = {
  paper: '#F1EFE9',
  ink: '#24241F',
  grey: '#88877F',
  rule: '#D4D1C8',
  brick: '#A54B37',
  sage: '#B7B9A6',
};
