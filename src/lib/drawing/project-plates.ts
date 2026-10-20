/**
 * Abstract plates that accompany projects until permitted documentation is
 * supplied. Each evokes a type of setting (river, canal, dense fabric…) in the
 * vocabulary of survey drawing; none depicts the project it accompanies.
 */
import {
  add,
  between,
  centroid,
  chaikin,
  chars,
  distToPolyline,
  fabric,
  fbm,
  hash,
  hatch,
  inPolygon,
  len,
  lerpV,
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
  sub,
  type Noise,
  type Rng,
  type Vec,
} from './core.ts';
import { contourLines, crosses, fields, g, p, svg } from './plates.ts';

export type ProjectVariant =
  | 'river'
  | 'canal'
  | 'fabric'
  | 'megablock'
  | 'waterfront'
  | 'hilltop'
  | 'village'
  | 'strata'
  | 'studio';

const W = 1600;
const H = 1200;

const frameCrosses = (skip: (v: Vec) => boolean = () => false) =>
  g(`stroke="${C.grey}" stroke-width="1.6"`, p(crosses(W, H, 200, 8, skip), ''));

const buildings = (list: Vec[][]) => p(polys(list), `fill="${C.ink}"`);

const inFrame = (v: Vec, m = 30) => v[0] > -m && v[0] < W + m && v[1] > -m && v[1] < H + m;

function riverLayers(rv: ReturnType<typeof river>, islands: Vec[][] = []): string {
  return [
    p(path(riverPolygon(rv), true), `fill="${C.sage}"`),
    islands.length
      ? p(islands.map((i) => path(i, true)).join(''), `fill="${C.paper}" stroke="${C.ink}" stroke-width="1.3"`)
      : '',
    g(`stroke="${C.ink}" stroke-width="2"`, p(path(rv.left) + path(rv.right), '')),
  ].join('');
}

function hamlet(r: Rng, noise: Noise, at: Vec, radius: number, angle: number, avoid: (v: Vec) => boolean) {
  return fabric(r, {
    origin: at,
    angle,
    block: [48, 40],
    extent: [-radius * 1.3, -radius * 1.3, radius * 1.3, radius * 1.3],
    jitter: 0.32,
    warp: (pt) => add(pt, [noise(pt[0] / 120, pt[1] / 120) * 16, noise(pt[0] / 120 + 3, pt[1] / 120) * 16]),
    street: 6,
    lotWidth: [6, 10],
    lotDepth: [6, 11],
    density: (c) => Math.max(0, 1.05 - len(sub(c, at)) / radius),
    openChance: 0,
    include: (pt) => len(sub(pt, at)) < radius * 1.1 && !avoid(pt),
  });
}

const blob = (c: Vec, rx: number, ry: number, angle: number, noise: Noise, seed: number, n = 18): Vec[] => {
  const pts: Vec[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const f = 0.88 + 0.24 * (0.5 + 0.5 * noise(k * 0.6, seed));
    pts.push(add(c, rotate([Math.cos(a) * rx * f, Math.sin(a) * ry * f], angle)));
  }
  return chaikin(pts, 2, true);
};

/* ------------------------------------------------------------- Variants */

function riverScene(r: Rng, noise: Noise): string {
  const rv = river(r, noise, [-120, 260], [W + 120, 900], 200, 96, 1.8);
  const isl = chars(rv, 2, r);
  const near = (v: Vec, m = 0) => distToPolyline(v, rv.centre) < 50 + m;
  const terrain = (x: number, y: number) => fbm(noise, x / 600 + 2, y / 600 + 5, 3);
  const topo = contourLines(terrain, W, H, 0.05, (v) => near(v, 6));
  const sites: Vec[] = [
    [330, 690],
    [1080, 330],
    [1250, 1030],
  ];
  const hamlets = sites.map((at, i) => hamlet(r, noise, at, 120 + i * 18, 0.3 * i, (v) => near(v, 10)));
  const fld = fields(r, {
    origin: [800, 600],
    angle: -0.42,
    size: [90, 56],
    extent: [-1200, -1200, 1200, 1200],
    spacing: 7,
    include: (v) => !near(v, 22) && sites.every((s) => len(sub(v, s)) > 170) && inFrame(v, 40),
    skip: 0.3,
  });
  return [
    g(`stroke="${C.grey}" stroke-width="1.3"`, p(topo.minor, '')),
    g(`stroke="${C.grey}" stroke-width="2"`, p(topo.major, '')),
    g(`stroke="${C.grey}" stroke-width="1.1"`, p(fld.hatches, '')),
    g(`stroke="${C.rule}" stroke-width="1.6"`, p(fld.bunds, '')),
    riverLayers(rv, isl),
    buildings(hamlets.flatMap((h) => h.buildings)),
    frameCrosses((v) => near(v, 20)),
  ].join('');
}

function canalScene(r: Rng, noise: Noise): string {
  const canal = river(r, noise, [-80, 980], [W + 80, 180], 70, 30, 1.2);
  const near = (v: Vec, m = 0) => distToPolyline(v, canal.centre) < 15 + m;
  const city = fabric(r, {
    origin: [800, 600],
    angle: 0.12,
    block: [92, 70],
    extent: [-1100, -900, 1100, 900],
    jitter: 0.12,
    warp: (pt) => add(pt, [noise(pt[0] / 300, pt[1] / 300) * 18, noise(pt[0] / 300 + 7, pt[1] / 300) * 18]),
    street: 10,
    lotWidth: [9, 18],
    lotDepth: [10, 18],
    density: 0.86,
    openChance: 0.03,
    include: (v) => !near(v, 58) && inFrame(v),
  });
  const greenL = offset(canal.centre, 36);
  const greenR = offset(canal.centre, -36);
  const edges = path(offset(canal.centre, 24)) + path(offset(canal.centre, -24));
  return [
    p(path([...greenL, ...greenR.slice().reverse()], true), `fill="${C.sage}" fill-opacity=".35"`),
    g(`stroke="${C.grey}" stroke-width="1.4" stroke-dasharray="2 9"`, p(edges, '')),
    riverLayers(canal),
    p(polys(city.open), `fill="${C.sage}" fill-opacity=".5"`),
    buildings(city.buildings),
    frameCrosses((v) => !near(v, 60)),
  ].join('');
}

function fabricScene(r: Rng, noise: Noise): string {
  const rv = river(r, noise, [-100, 1150], [W + 100, 1080], 40, 120, 1);
  const near = (v: Vec, m = 0) => distToPolyline(v, rv.centre) < 60 + m;
  const courts: Vec[] = [
    [760, 520],
    [1130, 330],
  ];
  const radii = [86, 54];
  // Lanes: a few winding thoroughfares cut through the dense grain.
  const lanes = [
    chaikin([[-40, 300], [400, 420], [760, 520], [1200, 420], [W + 40, 470]], 2),
    chaikin([[520, -40], [620, 300], [760, 520], [700, 820], [760, 1020]], 2),
  ];
  const onLane = (v: Vec) => lanes.some((l) => distToPolyline(v, l) < 13);
  const old = fabric(r, {
    origin: [800, 520],
    angle: -0.1,
    block: [62, 50],
    extent: [-860, -600, 860, 620],
    jitter: 0.36,
    warp: (pt) => add(pt, [noise(pt[0] / 150, pt[1] / 150) * 30, noise(pt[0] / 150 + 5, pt[1] / 150) * 30]),
    street: 6.5,
    lotWidth: [8, 14],
    lotDepth: [9, 16],
    density: 0.9,
    openChance: 0.01,
    include: (v) => !near(v, 30) && !onLane(v) && courts.every((c, i) => len(sub(v, c)) > radii[i] + 12) && inFrame(v, 10),
  });
  const courtPolys = courts.map((c, i) => blob(c, radii[i], radii[i] * 0.8, 0.3, noise, i + 3, 9));
  return [
    riverLayers(rv),
    p(courtPolys.map((c) => path(c, true)).join(''), `fill="${C.sage}" fill-opacity=".55" stroke="${C.grey}" stroke-width="1.4"`),
    buildings(old.buildings),
  ].join('');
}

function megablockScene(r: Rng): string {
  const big: Vec[] = [
    [560, 420],
    [1080, 400],
    [1100, 780],
    [570, 800],
  ];
  const c0 = centroid(big);
  const halo = big.map((q) => add(c0, mul(sub(q, c0), 1.25)));
  const corridors: [Vec, Vec][] = [
    [
      [-50, 250],
      [W + 50, 330],
    ],
    [
      [380, -50],
      [470, H + 50],
    ],
  ];
  const nearCorr = (v: Vec) => corridors.some(([a, b]) => distToPolyline(v, [a, b]) < 46);
  const city = fabric(r, {
    origin: [800, 600],
    angle: 0.035,
    block: [150, 110],
    extent: [-1000, -900, 1000, 900],
    jitter: 0.03,
    street: 18,
    lotWidth: [14, 30],
    lotDepth: [12, 22],
    density: 0.72,
    openChance: 0.05,
    include: (v) => !inPolygon(v, halo) && !nearCorr(v) && inFrame(v),
  });
  const courts = [0.3, 0.7].map((t) => {
    const c = add(lerpV(big[0], big[1], t), mul(sub(big[3], big[0]), 0.5));
    return [add(c, [-60, -55]), add(c, [60, -55]), add(c, [60, 55]), add(c, [-60, 55])] as Vec[];
  });
  const inner = big.map((q) => add(c0, mul(sub(q, c0), 0.62)));
  const corrPolys = corridors.map(([a, b]) => {
    const n = mul(perp(norm(sub(b, a))), 30);
    return [add(a, n), add(b, n), sub(b, n), sub(a, n)] as Vec[];
  });
  return [
    p(polys(corrPolys), `fill="${C.sage}" fill-opacity=".45"`),
    g(`stroke="${C.grey}" stroke-width="1.3" stroke-dasharray="3 10"`, p(corridors.map((c) => path(c)).join(''), '')),
    p(polys(city.open), `fill="${C.sage}" fill-opacity=".5"`),
    buildings(city.buildings),
    p(path(big, true) + courts.map((c) => path(c, true)).join(''), `fill="${C.ink}" fill-rule="evenodd"`),
    p(path(inner, true), `stroke="${C.paper}" stroke-width="1.6" stroke-dasharray="6 8"`),
    frameCrosses((v) => !nearCorr(v)),
  ].join('');
}

function waterfrontScene(r: Rng, noise: Noise): string {
  const coast: Vec[] = [];
  for (let x = -40; x <= W + 40; x += 40) coast.push([x, 830 + noise(x / 400, 1.2) * 70 - x * 0.12]);
  const shore = chaikin(coast, 3);
  const shoreY = (x: number) => shore.reduce((best, c) => (Math.abs(c[0] - x) < Math.abs(best[0] - x) ? c : best))[1];
  const onLand = (v: Vec) => v[1] < shoreY(v[0]) - 70;
  const sea: Vec[] = [...shore, [W + 40, H + 40], [-40, H + 40]];
  const city = fabric(r, {
    origin: [800, 400],
    angle: -0.42,
    block: [88, 66],
    extent: [-1300, -1100, 1300, 1100],
    jitter: 0.1,
    street: 10,
    lotWidth: [9, 18],
    lotDepth: [10, 18],
    density: (c) => Math.min(0.92, 0.5 + c[1] / 1500),
    openChance: 0.05,
    include: (v) => onLand(v) && inFrame(v),
  });
  const promenade = offset(shore, 34);
  const pierBase: Vec = [1000, shoreY(1000)];
  const pier: Vec[] = [add(pierBase, [-16, -6]), add(pierBase, [16, -6]), add(pierBase, [36, 220]), add(pierBase, [6, 222])];
  const swell = [1, 2, 3, 4].map((k) => path(offset(shore, -k * 28 - k * k * 7))).join('');
  return [
    p(path(sea, true), `fill="${C.sage}"`),
    g(`stroke="${C.paper}" stroke-width="1.3" stroke-opacity=".85"`, p(swell, '')),
    g(`stroke="${C.ink}" stroke-width="2"`, p(path(shore), '')),
    g(`stroke="${C.grey}" stroke-width="1.4"`, p(path(promenade), '')),
    p(path(pier, true), `fill="${C.paper}" stroke="${C.ink}" stroke-width="1.6"`),
    p(polys(city.open), `fill="${C.sage}" fill-opacity=".5"`),
    buildings(city.buildings),
    frameCrosses((v) => !onLand(v)),
  ].join('');
}

function hilltopScene(r: Rng, noise: Noise): string {
  const peak: Vec = [860, 540];
  const hill = (x: number, y: number) => {
    const d = len(sub([x, y], peak));
    return Math.exp(-(d * d) / (2 * 380 * 380)) * 1.25 + fbm(noise, x / 500, y / 500, 3) * 0.28 - 0.35;
  };
  const topo = contourLines(hill, W, H, 0.06);
  const wall: Vec[] = [];
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2;
    wall.push(polar(peak, 170 * (0.8 + 0.35 * (0.5 + noise(k * 0.9, 2.2))) * (k % 2 ? 1.12 : 0.92), a));
  }
  const towers = wall.map((v) => [add(v, [-11, -11]), add(v, [11, -11]), add(v, [11, 11]), add(v, [-11, 11])] as Vec[]);
  // Houses stepping down the slope, aligned with the contours.
  const houses: Vec[][] = [];
  for (let k = 0; k < 1400 && houses.length < 260; k++) {
    const a = r() * Math.PI * 2;
    const d = between(r, 240, 580);
    const c = polar(peak, d, a);
    if (!inFrame(c, -20)) continue;
    if (r() > Math.max(0, 1 - (d - 240) / 380) * (0.55 + noise(c[0] / 90, c[1] / 90))) continue;
    if (houses.some((q) => len(sub(centroid(q), c)) < 21)) continue;
    const u: Vec = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)];
    const n = perp(u);
    const w = between(r, 12, 22);
    const h = between(r, 8, 13);
    houses.push([
      add(c, add(mul(u, -w / 2), mul(n, -h / 2))),
      add(c, add(mul(u, w / 2), mul(n, -h / 2))),
      add(c, add(mul(u, w / 2), mul(n, h / 2))),
      add(c, add(mul(u, -w / 2), mul(n, h / 2))),
    ]);
  }
  return [
    g(`stroke="${C.grey}" stroke-width="1.3"`, p(topo.minor, '')),
    g(`stroke="${C.grey}" stroke-width="2.1"`, p(topo.major, '')),
    p(path(wall, true), `fill="${C.sage}" fill-opacity=".45"`),
    g(`stroke="${C.ink}" stroke-width="7" stroke-linejoin="miter"`, p(path(wall, true), '')),
    p(polys(towers), `fill="${C.ink}"`),
    buildings(houses),
    frameCrosses((v) => len(sub(v, peak)) < 620),
  ].join('');
}

function villageScene(r: Rng, noise: Noise): string {
  const ponds: Vec[] = [
    [420, 380],
    [980, 300],
    [760, 820],
    [1260, 760],
    [300, 960],
  ];
  const pondPolys = ponds.map((c, i) => {
    const rx = between(r, 38, 64);
    return blob(c, rx, rx * between(r, 0.55, 0.85), i * 0.7, noise, i + 11, 14);
  });
  const nearPond = (v: Vec, m = 0) => ponds.some((c) => len(sub(v, c)) < 70 + m);
  const homesteads = ponds.slice(0, 4).map((c, i) => hamlet(r, noise, add(c, [60, 40]), 150, i * 0.5, (v) => nearPond(v, 6)));
  const trees: string[] = [];
  for (let k = 0; k < 420; k++) {
    const c = add(ponds[k % ponds.length], [between(r, -220, 220), between(r, -170, 170)]);
    if (nearPond(c, 4) || r() < 0.4) continue;
    trees.push(`M${(c[0] + 6).toFixed(1)} ${c[1].toFixed(1)}a6 6 0 1 0 -12 0a6 6 0 1 0 12 0`);
  }
  const fld = fields(r, {
    origin: [800, 600],
    angle: 0.18,
    size: [96, 60],
    extent: [-1300, -1300, 1300, 1300],
    spacing: 7,
    include: (v) => ponds.every((c) => len(sub(v, c)) > 250) && inFrame(v, 40),
    skip: 0.25,
  });
  const footpath = chaikin(
    [
      [-40, 560],
      [300, 600],
      [640, 520],
      [980, 560],
      [1300, 470],
      [W + 40, 500],
    ],
    3,
  );
  return [
    g(`stroke="${C.grey}" stroke-width="1.1"`, p(fld.hatches, '')),
    g(`stroke="${C.rule}" stroke-width="1.6"`, p(fld.bunds, '')),
    g(`stroke="${C.grey}" stroke-width="1.6" stroke-dasharray="1 7"`, p(path(footpath), '')),
    p(pondPolys.map((q) => path(q, true)).join(''), `fill="${C.sage}" stroke="${C.ink}" stroke-width="1.6"`),
    g(`stroke="${C.grey}" stroke-width="1.2"`, p(trees.join(''), '')),
    buildings(homesteads.flatMap((h) => h.buildings)),
  ].join('');
}

/** A site section: ground, strata, buildings, and present and future water levels. */
function strataScene(r: Rng, noise: Noise): string {
  const ground: Vec[] = [];
  for (let x = -20; x <= W + 20; x += 20) {
    const dip = Math.exp(-((x - 980) ** 2) / (2 * 170 * 170)) * 150;
    ground.push([x, 520 + noise(x / 340, 0.4) * 60 + dip]);
  }
  const surface = chaikin(ground, 2);
  const yAt = (x: number) => surface.reduce((best, c) => (Math.abs(c[0] - x) < Math.abs(best[0] - x) ? c : best))[1];
  const strata: string[] = [];
  let prev = surface;
  for (let k = 1; k <= 7; k++) {
    const next = prev.map(([x, y]) => [x, y + 42 + k * 13 + noise(x / 300, k) * 16] as Vec);
    for (let i = 0; i < prev.length - 2; i += 2) {
      if (k % 3 === 0) continue;
      const piece: Vec[] = [prev[i], prev[i + 2], next[i + 2], next[i]];
      strata.push(segments(hatch(piece, k % 2 ? 0.7 : -0.5, 6 + k * 1.6)));
    }
    strata.push(path(next));
    prev = next;
  }
  const level = 600;
  const submerged = surface.filter((pt) => pt[1] > level);
  const waterPoly: Vec[] = submerged.length
    ? [[submerged[0][0], level], ...submerged, [submerged[submerged.length - 1][0], level]]
    : [];
  const blocks: Vec[][] = [];
  let x = 40;
  while (x < W - 40) {
    const w = between(r, 40, 120);
    const h = x > 760 && x < 1200 ? 0 : between(r, 50, 210);
    if (h > 0 && r() < 0.8) {
      const y = yAt(x + w / 2);
      blocks.push([
        [x, y + 4],
        [x + w, y + 4],
        [x + w, y - h],
        [x, y - h],
      ]);
    }
    x += w + between(r, 14, 60);
  }
  const future = level - 70;
  return [
    g(`stroke="${C.grey}" stroke-width="1.1"`, p(strata.join(''), '')),
    waterPoly.length ? p(path(waterPoly, true), `fill="${C.sage}"`) : '',
    g(`stroke="${C.ink}" stroke-width="2.4"`, p(path(surface), '')),
    buildings(blocks),
    g(`stroke="${C.ink}" stroke-width="1.4" stroke-dasharray="14 8"`, p(path([[40, level], [W - 40, level]]), '')),
    g(`stroke="${C.brick}" stroke-width="1.8" stroke-dasharray="14 8"`, p(path([[40, future], [W - 40, future]]), '')),
    `<path d="M${W - 70} ${future - 22}l14 22l14 -22z" fill="${C.brick}"/><path d="M${W - 70} ${level - 22}l14 22l14 -22z" fill="${C.ink}"/>`,
    frameCrosses((v) => v[1] > 360),
  ].join('');
}

/** Exploded axonometric of ten stacked layers, each with its own pattern. */
function layersScene(r: Rng): string {
  const out: string[] = [];
  const n = 10;
  const w = 760;
  const d = 380;
  const gap = 82;
  for (let k = n - 1; k >= 0; k--) {
    const oy = 150 + k * gap;
    const o: Vec = [330, oy];
    const plane: Vec[] = [o, [o[0] + w, oy], [o[0] + w + d * 0.75, oy + d * 0.5], [o[0] + d * 0.75, oy + d * 0.5]];
    const c = centroid(plane);
    const inside = plane.map((q) => add(c, mul(sub(q, c), 0.92)));
    let pattern = '';
    switch (k % 5) {
      case 0:
        pattern = segments(hatch(inside, 0.1, 12));
        break;
      case 1:
        pattern = segments(hatch(inside, -0.9, 15));
        break;
      case 2: {
        const dots: string[] = [];
        for (let i = 0; i < 150; i++) {
          const a = lerpV(inside[0], inside[1], r());
          const b = lerpV(inside[3], inside[2], 0);
          const q = lerpV(a, add(a, sub(inside[3], inside[0])), r());
          void b;
          dots.push(`M${(q[0] + 2.5).toFixed(1)} ${q[1].toFixed(1)}a2.5 2.5 0 1 0 -5 0a2.5 2.5 0 1 0 5 0`);
        }
        pattern = dots.join('');
        break;
      }
      case 3: {
        const ls: [Vec, Vec][] = [];
        for (let i = 1; i < 6; i++) ls.push([lerpV(inside[0], inside[3], i / 6), lerpV(inside[1], inside[2], i / 6)]);
        for (let i = 1; i < 9; i++) ls.push([lerpV(inside[0], inside[1], i / 9), lerpV(inside[3], inside[2], i / 9)]);
        pattern = segments(ls);
        break;
      }
      default: {
        const wave: Vec[] = [];
        for (let i = 0; i <= 48; i++) {
          const t = i / 48;
          wave.push(lerpV(lerpV(inside[0], inside[1], t), lerpV(inside[3], inside[2], t), 0.5 + 0.32 * Math.sin(t * Math.PI * 3 + k)));
        }
        pattern = path(wave);
      }
    }
    const top = k === 0;
    out.push(
      p(path(plane, true), `fill="${C.paper}" stroke="${top ? C.brick : C.ink}" stroke-width="${top ? 2.6 : 1.6}"`),
      g(`stroke="${C.grey}" stroke-width="1.2"`, p(pattern, '')),
    );
  }
  // Vertical alignment lines through the stack.
  const first: Vec = [330, 150];
  const last: Vec = [330, 150 + (n - 1) * gap];
  const guides = [0, w].map((dx) => path([add(first, [dx, 0]), add(last, [dx, 0])])).join('');
  return g(`stroke="${C.rule}" stroke-width="1.2" stroke-dasharray="3 6"`, p(guides, '')) + out.join('');
}

export function projectPlate(variant: ProjectVariant): string {
  const r = rng(hash(`plate:project:${variant}`));
  const noise = perlin(hash(variant) % 997);
  const scenes: Record<ProjectVariant, () => string> = {
    river: () => riverScene(r, noise),
    canal: () => canalScene(r, noise),
    fabric: () => fabricScene(r, noise),
    megablock: () => megablockScene(r),
    waterfront: () => waterfrontScene(r, noise),
    hilltop: () => hilltopScene(r, noise),
    village: () => villageScene(r, noise),
    strata: () => strataScene(r, noise),
    studio: () => layersScene(r),
  };
  return svg(W, H, scenes[variant](), `Abstract plate: ${variant} (editorial drawing)`);
}
