/**
 * Analytical diagrams for the ten dimensions. Each is an abstract drawing of
 * a way of reading context (networks, flows, boundaries, layers, watersheds,
 * sun paths, distributaries, thresholds, figure–ground, typologies). They are
 * editorial drawings, not documentation of any site.
 */
import {
  add,
  between,
  chaikin,
  distToPolyline,
  fabric,
  fbm,
  hash,
  hatch,
  len,
  mul,
  norm,
  offset,
  PALETTE as C,
  path,
  perlin,
  perp,
  polar,
  polys,
  river,
  riverPolygon,
  rng,
  rotate,
  segments,
  simplify,
  sub,
  type Noise,
  type Rng,
  type Vec,
} from './core.ts';
import { contourLines, crosses, g, p, svg } from './plates.ts';

const W = 1200;
const H = 900;

const circle = (c: Vec, rad: number) =>
  `M${(c[0] + rad).toFixed(1)} ${c[1].toFixed(1)}a${rad} ${rad} 0 1 0 ${-2 * rad} 0a${rad} ${rad} 0 1 0 ${2 * rad} 0`;
const square = (c: Vec, s: number): Vec[] => [add(c, [-s, -s]), add(c, [s, -s]), add(c, [s, s]), add(c, [-s, s])];
const inFrame = (v: Vec, m = 30) => v[0] > -m && v[0] < W + m && v[1] > -m && v[1] < H + m;

const drawings: Record<string, (r: Rng, noise: Noise) => string> = {
  /** Networks of everyday life: dwellings, ties and shared places. */
  social(r) {
    const hubs: Vec[] = [
      [300, 300],
      [820, 250],
      [610, 610],
      [980, 650],
      [240, 700],
    ];
    const homes: Vec[] = [];
    for (const h of hubs) for (let i = 0; i < 26; i++) homes.push(add(h, [between(r, -130, 130), between(r, -105, 105)]));
    const ties: [Vec, Vec][] = [];
    homes.forEach((a, i) => {
      homes
        .map((b, j) => ({ j, d: len(sub(a, b)) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
        .forEach(({ j }) => ties.push([a, homes[j]]));
    });
    const commons: [Vec, Vec][] = [];
    hubs.forEach((a, i) => hubs.forEach((b, j) => j > i && len(sub(a, b)) < 560 && commons.push([a, b])));
    return [
      g(`stroke="${C.grey}" stroke-width="1.1"`, p(segments(ties), '')),
      g(`stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="10 7"`, p(segments(commons), '')),
      p(hubs.map((h) => circle(h, 34)).join(''), `fill="${C.sage}" stroke="${C.ink}" stroke-width="1.6"`),
      p(polys(homes.map((c) => square(c, 6))), `fill="${C.ink}"`),
    ].join('');
  },

  /** Exchange: a market, its catchment and a gradient of land value. */
  economic(r, noise) {
    const market: Vec = [640, 450];
    const cells: string[] = [];
    for (let x = 0; x < W; x += 60)
      for (let y = 0; y < H; y += 60) {
        const c: Vec = [x + 30, y + 30];
        const v = Math.max(0, 1 - len(sub(c, market)) / 620) + noise(x / 200, y / 200) * 0.15;
        if (v < 0.12) continue;
        const sq: Vec[] = [
          [x + 5, y + 5],
          [x + 55, y + 5],
          [x + 55, y + 55],
          [x + 5, y + 55],
        ];
        cells.push(segments(hatch(sq, 0.785, Math.max(4.5, 22 - v * 20))));
      }
    const flows: string[] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const from = polar(market, between(r, 360, 560), a);
      const ctrl = polar(market, between(r, 160, 260), a + between(r, 0.3, 0.7));
      flows.push(`M${from[0].toFixed(1)} ${from[1].toFixed(1)}Q${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${market[0]} ${market[1]}`);
    }
    const minor: Vec[] = [
      [250, 230],
      [1000, 700],
      [980, 180],
    ];
    return [
      g(`stroke="${C.grey}" stroke-width="1"`, p(cells.join(''), '')),
      g(`stroke="${C.ink}" stroke-width="1.4"`, p(flows.join(''), '')),
      p(minor.map((s) => circle(s, 18)).join(''), `fill="${C.paper}" stroke="${C.ink}" stroke-width="1.6"`),
      `<rect x="${market[0] - 34}" y="${market[1] - 34}" width="68" height="68" fill="${C.ink}"/>`,
    ].join('');
  },

  /** Jurisdiction: overlapping administrative boundaries over a fabric. */
  political(r, noise) {
    const base = fabric(r, {
      origin: [600, 450],
      angle: 0.08,
      block: [70, 56],
      extent: [-800, -700, 800, 700],
      jitter: 0.15,
      street: 8,
      lotWidth: [8, 14],
      lotDepth: [8, 14],
      density: 0.7,
      include: (v) => inFrame(v, 20),
    });
    const ward = (c: Vec, rad: number, seed: number) => {
      const pts: Vec[] = [];
      for (let k = 0; k < 14; k++) pts.push(polar(c, rad * (0.8 + 0.4 * (0.5 + noise(k * 0.7, seed))), (k / 14) * Math.PI * 2));
      return chaikin(pts, 2, true);
    };
    return [
      p(polys(base.buildings), `fill="${C.grey}" fill-opacity=".5"`),
      p(path(ward([420, 380], 300, 1), true), `stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="22 8 4 8"`),
      p(path(ward([800, 470], 280, 2), true), `stroke="${C.ink}" stroke-width="2.4" stroke-dasharray="4 7"`),
      p(path(ward([600, 760], 240, 3), true), `stroke="${C.brick}" stroke-width="2.2" stroke-dasharray="16 10"`),
      g(`stroke="${C.ink}" stroke-width="2"`, p(crosses(W, H, 300, 10), '')),
    ].join('');
  },

  /** Palimpsest: successive grids, a buried watercourse, an old enclosure. */
  historical(r, noise) {
    const grid = (angle: number, block: [number, number], seed: string) =>
      fabric(rng(hash(seed)), {
        origin: [600, 450],
        angle,
        block,
        extent: [-900, -800, 900, 800],
        jitter: 0.2,
        street: 0,
        density: 0,
        include: (v) => inFrame(v, 60),
      }).blocks;
    const recent = fabric(r, {
      origin: [600, 450],
      angle: 0.05,
      block: [86, 70],
      extent: [-900, -800, 900, 800],
      jitter: 0.05,
      street: 10,
      lotWidth: [10, 18],
      lotDepth: [9, 15],
      density: (c) => (c[0] > 580 ? 0.85 : 0),
      include: (v) => inFrame(v),
    });
    const course = river(r, noise, [-60, 640], [W + 60, 300], 90, 26, 1.2);
    const wall = chaikin(
      [
        [180, 160],
        [520, 120],
        [700, 260],
        [640, 560],
        [300, 640],
        [140, 420],
      ],
      1,
      true,
    );
    return [
      p(polys(grid(0.62, [150, 120], 'h1')), `stroke="${C.rule}" stroke-width="1.6"`),
      p(polys(grid(-0.2, [110, 90], 'h2')), `stroke="${C.grey}" stroke-width="1.3" stroke-dasharray="6 6"`),
      p(path(riverPolygon(course), true), `fill="${C.sage}" fill-opacity=".6"`),
      g(`stroke="${C.ink}" stroke-width="1.2" stroke-dasharray="2 6"`, p(path(course.left) + path(course.right), '')),
      p(polys(recent.buildings), `fill="${C.ink}"`),
      p(path(wall, true), `stroke="${C.ink}" stroke-width="7" stroke-dasharray="70 22"`),
    ].join('');
  },

  /** Watershed: terrain, and the paths water takes across it. */
  ecological(r, noise) {
    // Terrain falls towards a lake in the south; water follows the gradient.
    const lake: Vec = [640, 800];
    const terrain = (x: number, y: number) =>
      fbm(noise, x / 640 + 1.3, y / 640 + 2.1, 3) * 0.55 - Math.exp(-(len(sub([x, y], lake)) ** 2) / (2 * 420 * 420)) * 0.9 - y / 2200;
    const topo = contourLines(terrain, W, H, 0.05, (v) => len(sub(v, lake)) < 150, 10);
    const lakeShape: Vec[] = [];
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2;
      lakeShape.push(add(lake, [Math.cos(a) * 170 * (0.9 + 0.2 * noise(k * 0.5, 1)), Math.sin(a) * 95 * (0.9 + 0.2 * noise(k * 0.5, 2))]));
    }
    const streams: string[] = [];
    const used: Vec[] = [];
    for (let i = 0; i < 46; i++) {
      let pt: Vec = [between(r, 30, W - 30), between(r, 20, H * 0.45)];
      const line: Vec[] = [pt];
      for (let s = 0; s < 400; s++) {
        const e = 4;
        const gx = terrain(pt[0] + e, pt[1]) - terrain(pt[0] - e, pt[1]);
        const gy = terrain(pt[0], pt[1] + e) - terrain(pt[0], pt[1] - e);
        pt = add(pt, mul(norm([-gx, -gy + 0.002]), 6));
        if (!inFrame(pt, 0) || len(sub(pt, lake)) < 120) break;
        line.push(pt);
        // Join an existing stream rather than running alongside it.
        if (s > 12 && used.some((u) => len(sub(u, pt)) < 7)) break;
      }
      if (line.length > 30) {
        used.push(...line.filter((_, k) => k % 3 === 0));
        streams.push(path(simplify(chaikin(line, 2), 1)));
      }
    }
    return [
      g(`stroke="${C.grey}" stroke-width="1.1"`, p(topo.minor, '')),
      g(`stroke="${C.grey}" stroke-width="1.8"`, p(topo.major, '')),
      p(path(chaikin(lakeShape, 2, true), true), `fill="${C.sage}" stroke="${C.ink}" stroke-width="1.8"`),
      g(`stroke="${C.ink}" stroke-width="1.6"`, p(streams.join(''), '')),
    ].join('');
  },

  /**
   * Sun-path chart for latitude 23.8° N (Dhaka): solstices in ink,
   * equinox in brick, on a polar grid of altitude and azimuth.
   */
  scientific() {
    const c: Vec = [600, 450];
    const R = 380;
    const lat = (23.8 * Math.PI) / 180;
    const rings = [0, 15, 30, 45, 60, 75].map((alt) => circle(c, (R * (90 - alt)) / 90)).join('');
    const spokes: [Vec, Vec][] = [];
    for (let a = 0; a < 360; a += 15) {
      const t = (a * Math.PI) / 180 - Math.PI / 2;
      spokes.push([polar(c, a % 90 === 0 ? 0 : 63, t), polar(c, R + (a % 45 === 0 ? 26 : 10), t)]);
    }
    const sunPath = (declination: number) => {
      const d = (declination * Math.PI) / 180;
      const pts: Vec[] = [];
      for (let h = -180; h <= 180; h += 2) {
        const hr = (h * Math.PI) / 180;
        const sinAlt = Math.sin(lat) * Math.sin(d) + Math.cos(lat) * Math.cos(d) * Math.cos(hr);
        const alt = Math.asin(sinAlt);
        if (alt < 0) continue;
        const cosAz = (Math.sin(d) - sinAlt * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat));
        let az = Math.acos(Math.max(-1, Math.min(1, cosAz)));
        if (h > 0) az = Math.PI * 2 - az;
        const rr = (R * (Math.PI / 2 - alt)) / (Math.PI / 2);
        pts.push([c[0] + rr * Math.sin(az), c[1] - rr * Math.cos(az)]);
      }
      return path(pts);
    };
    const block: Vec[] = [
      [566, 416],
      [634, 416],
      [634, 484],
      [566, 484],
    ];
    return [
      p(circle(c, R), `fill="${C.sage}" fill-opacity=".25"`),
      g(`stroke="${C.grey}" stroke-width="1.2"`, p(rings + segments(spokes), '')),
      g(`stroke="${C.ink}" stroke-width="2.2"`, p(sunPath(23.44) + sunPath(-23.44), '')),
      g(`stroke="${C.brick}" stroke-width="2.2"`, p(sunPath(0), '')),
      p(path(block, true), `fill="${C.ink}"`),
      `<path d="M600 ${450 - R - 70}V${450 - R - 30}M590 ${450 - R - 52}L600 ${450 - R - 70}L610 ${450 - R - 52}" stroke="${C.ink}" stroke-width="1.6"/>`,
    ].join('');
  },

  /** Territory: a delta's distributaries, its settlements and their routes. */
  geographical(r, noise) {
    const coast: Vec[] = [];
    for (let x = -40; x <= W + 40; x += 30) coast.push([x, 760 + noise(x / 160, 4.4) * 34]);
    const shore = chaikin(coast, 2);
    const channels: string[] = [];
    const settlements: Vec[] = [];
    const coastAt = (x: number) => shore.reduce((best, c) => (Math.abs(c[0] - x) < Math.abs(best[0] - x) ? c : best))[1];
    const grow = (from: Vec, angle: number, width: number, depth: number) => {
      const seg: Vec[] = [from];
      let pt = from;
      const L = between(r, 150, 200) * (1 - depth * 0.08);
      for (let s = 0; s < 10; s++) {
        // Channels bend gently but always trend towards the sea.
        const a = angle + noise(pt[0] / 110, pt[1] / 110) * 0.45;
        pt = add(pt, polar([0, 0], L / 10, a * 0.8 + (Math.PI / 2) * 0.2));
        seg.push(pt);
        if (pt[1] > coastAt(pt[0]) + 10) break;
      }
      const a = offset(seg, width / 2);
      const b = offset(seg, -width / 2);
      channels.push(path([...a, ...b.reverse()], true));
      if (pt[1] > coastAt(pt[0]) || depth >= 6 || !inFrame(pt, 0)) return;
      if (r() < 0.6) settlements.push(add(pt, [between(r, -46, 46), between(r, -26, 26)]));
      const spread = between(r, 0.26, 0.46);
      grow(pt, angle - spread, Math.max(5, width * 0.74), depth + 1);
      if (r() < 0.9) grow(pt, angle + spread, Math.max(5, width * 0.7), depth + 1);
    };
    grow([600, -20], Math.PI / 2, 40, 0);
    const routes: [Vec, Vec][] = [];
    settlements.forEach((a, i) => {
      const b = settlements
        .map((s, j) => ({ j, d: len(sub(a, s)) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)[0];
      if (b) routes.push([a, settlements[b.j]]);
    });
    return [
      p(path([...shore, [W + 40, H + 40], [-40, H + 40]], true), `fill="${C.sage}"`),
      g(`stroke="${C.ink}" stroke-width="2"`, p(path(shore), '')),
      p(channels.join(''), `fill="${C.sage}" stroke="${C.ink}" stroke-width="1.3"`),
      g(`stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="5 7"`, p(segments(routes), '')),
      p(settlements.map((s, i) => circle(s, i % 4 === 0 ? 14 : 8)).join(''), `fill="${C.ink}"`),
    ].join('');
  },

  /** Meaning in sequence: a route through thresholds and courts. */
  cultural(r) {
    const route = chaikin(
      [
        [60, 760],
        [260, 700],
        [380, 560],
        [560, 520],
        [700, 380],
        [880, 330],
        [1040, 180],
        [1140, 140],
      ],
      3,
    );
    const courts = [0.18, 0.38, 0.58, 0.8].map((t, i) => {
      const c = route[Math.floor(t * (route.length - 1))];
      const s = [70, 110, 80, 140][i];
      const a = (i % 2 ? 0.12 : -0.08) + r() * 0.1;
      const sq = square([0, 0], s).map((q) => add(c, rotate(q, a)));
      return { sq, inner: sq.map((q) => add(c, mul(sub(q, c), 0.7))) };
    });
    // Thresholds: a pair of short walls wherever the route crosses a court edge.
    const gates: string[] = [];
    courts.forEach(({ sq }) => {
      for (let i = 1; i < route.length; i++) {
        const inside = (v: Vec) => {
          const c = sq.reduce((acc, q) => add(acc, mul(q, 0.25)), [0, 0] as Vec);
          const e = len(sub(sq[0], c)) / Math.SQRT2;
          const local = rotate(sub(v, c), -Math.atan2(sq[1][1] - sq[0][1], sq[1][0] - sq[0][0]));
          return Math.abs(local[0]) < e && Math.abs(local[1]) < e;
        };
        if (inside(route[i]) !== inside(route[i - 1])) {
          const u = norm(sub(route[i], route[i - 1]));
          const n = perp(u);
          const at = route[i];
          gates.push(path([add(at, mul(n, 14)), add(at, mul(n, 34))]) + path([add(at, mul(n, -14)), add(at, mul(n, -34))]));
        }
      }
    });
    return [
      p(courts.map((c) => path(c.sq, true)).join(''), `fill="${C.sage}" fill-opacity=".4" stroke="${C.ink}" stroke-width="2.2"`),
      p(courts.map((c) => path(c.inner, true)).join(''), `stroke="${C.grey}" stroke-width="1.3" stroke-dasharray="4 6"`),
      g(`stroke="${C.ink}" stroke-width="5" stroke-linecap="butt"`, p(gates.join(''), '')),
      g(`stroke="${C.brick}" stroke-width="4" stroke-dasharray="0.1 14"`, p(path(route), '')),
    ].join('');
  },

  /** Figure–ground: fabric, avenues, open space and a transit line. */
  urban(r, noise) {
    const avenues = [
      chaikin(
        [
          [-40, 520],
          [400, 470],
          [800, 430],
          [W + 40, 360],
        ],
        2,
      ),
      chaikin(
        [
          [520, -40],
          [560, 400],
          [640, 700],
          [700, H + 40],
        ],
        2,
      ),
    ];
    const nearAvenue = (v: Vec) => avenues.some((a) => distToPolyline(v, a) < 26);
    const city = fabric(r, {
      origin: [600, 450],
      angle: 0.06,
      block: [66, 54],
      extent: [-900, -800, 900, 800],
      jitter: 0.22,
      warp: (pt) => add(pt, [noise(pt[0] / 220, pt[1] / 220) * 20, noise(pt[0] / 220 + 2, pt[1] / 220) * 20]),
      street: 8,
      lotWidth: [8, 15],
      lotDepth: [9, 16],
      density: 0.9,
      openChance: 0.05,
      include: (v) => !nearAvenue(v) && inFrame(v),
    });
    const transit = chaikin(
      [
        [-40, 220],
        [300, 300],
        [620, 450],
        [900, 620],
        [W + 40, 700],
      ],
      2,
    );
    const stations = [0.25, 0.5, 0.75].map((t) => transit[Math.floor(t * (transit.length - 1))]);
    return [
      p(polys(city.open), `fill="${C.sage}" fill-opacity=".55"`),
      p(polys(city.buildings), `fill="${C.ink}"`),
      g(`stroke="${C.brick}" stroke-width="2.4" stroke-dasharray="18 8"`, p(path(transit), '')),
      p(stations.map((s) => circle(s, 13)).join(''), `fill="${C.paper}" stroke="${C.brick}" stroke-width="2.4"`),
    ].join('');
  },

  /** Typology: nine plan types drawn at a common scale. */
  architectural() {
    const s = 220;
    const gap = 30;
    const ox = 600 - (s * 3 + gap * 2) / 2;
    const oy = 450 - (s * 3 + gap * 2) / 2;
    const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
    const plan = (x: number, y: number, kind: number): string => {
      const m = 30;
      switch (kind) {
        case 0: // courtyard house
          return rect(x + m, y + m, x + s - m, y + s - m) + rect(x + 82, y + 82, x + s - 82, y + s - 82);
        case 1: // columned hall
          return rect(x + m, y + 52, x + s - m, y + s - 52) + [0, 1, 2, 3].map((i) => rect(x + 62 + i * 30, y + 104, x + 70 + i * 30, y + 112)).join('');
        case 2: // row houses
          return [0, 1, 2, 3, 4].map((i) => rect(x + m + i * 32, y + m, x + m + (i + 1) * 32, y + s - m)).join('');
        case 3: // cluster
          return [
            [0, 0],
            [70, 20],
            [20, 80],
            [90, 100],
          ]
            .map(([a, b]) => rect(x + m + a, y + m + b, x + m + a + 60, y + m + b + 50))
            .join('');
        case 4: // core with a semi-open edge
          return rect(x + 64, y + 64, x + s - 64, y + s - 64) + rect(x + m, y + m, x + s - m, y + s - m);
        case 5: // tower
          return rect(x + 70, y + 70, x + s - 70, y + s - 70) + `M${x + 70} ${y + 70}L${x + s - 70} ${y + s - 70}M${x + s - 70} ${y + 70}L${x + 70} ${y + s - 70}`;
        case 6: // pavilion on a grid of columns
          return (
            [0, 1, 2]
              .map((i) => [0, 1, 2].map((j) => rect(x + 52 + i * 54, y + 52 + j * 54, x + 60 + i * 54, y + 60 + j * 54)).join(''))
              .join('') + rect(x + m, y + m, x + s - m, y + s - m)
          );
        case 7: // L-shaped block
          return `M${x + m} ${y + m}H${x + s - m}V${y + 90}H${x + 90}V${y + s - m}H${x + m}Z`;
        default: // stepped terraces
          return [0, 1, 2, 3].map((i) => rect(x + m + i * 20, y + m + i * 40, x + s - m, y + m + (i + 1) * 40)).join('');
      }
    };
    const frames: string[] = [];
    const plans: string[] = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const x = ox + i * (s + gap);
        const y = oy + j * (s + gap);
        frames.push(`M${x} ${y}h${s}v${s}h${-s}z`);
        plans.push(plan(x, y, j * 3 + i));
      }
    return [
      p(frames.join(''), `stroke="${C.rule}" stroke-width="1.4"`),
      p(plans.join(''), `stroke="${C.ink}" stroke-width="3" stroke-linejoin="miter"`),
      p(`M${ox + s / 2} ${oy - 40}V${oy + 3 * s + 2 * gap + 40}M${ox - 40} ${oy + s / 2}H${ox + 3 * s + 2 * gap + 40}`, `stroke="${C.brick}" stroke-width="1.4" stroke-dasharray="14 6 3 6"`),
    ].join('');
  },
};

export const DIMENSION_PLATE_NOTES: Record<string, string> = {
  social: 'Networks of everyday life: dwellings, the ties between them and the places they share.',
  economic: 'Exchange: a market, the flows that converge on it and a gradient of land value.',
  political: 'Jurisdiction: overlapping administrative boundaries drawn over an urban fabric.',
  historical: 'Palimpsest: successive street grids, a buried watercourse and the trace of an old enclosure.',
  ecological: 'Watershed: terrain contours and the paths water takes across them.',
  scientific: 'Sun-path chart for latitude 23.8° N: summer and winter solstices in black, equinox in red.',
  geographical: 'Territory: the distributaries of a delta, its settlements and the routes between them.',
  cultural: 'Sequence: a route through thresholds and courts.',
  urban: 'Figure–ground: urban fabric, avenues, open space and a transit line.',
  architectural: 'Typology: nine plan types drawn at a common scale.',
};

export function dimensionPlate(id: string): string {
  const r = rng(hash(`plate:dimension:${id}`));
  const noise = perlin(hash(id) % 991);
  const draw = drawings[id];
  if (!draw) throw new Error(`No analytical diagram for dimension "${id}"`);
  return svg(W, H, draw(r, noise), `Analytical diagram: ${id} (editorial drawing)`);
}
