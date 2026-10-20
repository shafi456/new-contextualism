/**
 * Plate compositions. Each function returns a complete SVG document.
 *
 * These are original, abstract drawings made for the platform. They borrow
 * the conventions of survey and analytical drawings but do not represent any
 * real site or project, and are captioned as such wherever they appear.
 */
import {
  add,
  between,
  centroid,
  chaikin,
  chars,
  contours,
  distToPolyline,
  fabric,
  fbm,
  hash,
  hatch,
  inPolygon,
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

/* ------------------------------------------------------------- Helpers */

export function svg(w: number, h: number, body: string, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke-linecap="round" stroke-linejoin="round"><title>${title}</title><rect width="${w}" height="${h}" fill="${C.paper}"/>${body}</svg>`;
}

export const g = (attrs: string, inner: string) => (inner ? `<g ${attrs}>${inner}</g>` : '');
export const p = (d: string, attrs: string) => (d ? `<path d="${d}" ${attrs}/>` : '');

/** Contour lines, optionally interrupted where `mask` is true. */
export function contourLines(
  field: (x: number, y: number) => number,
  w: number,
  h: number,
  step: number,
  mask: (v: Vec) => boolean = () => false,
  cell = 12,
): { minor: string; major: string } {
  const levels: number[] = [];
  for (let l = -0.9; l <= 0.9; l += step) levels.push(+l.toFixed(4));
  let minor = '';
  let major = '';
  contours(field, w, h, cell, levels).forEach(({ lines }, li) => {
    for (const line of lines) {
      // Split each line into runs outside the mask.
      let run: Vec[] = [];
      const flush = () => {
        if (run.length > 2) {
          const d = path(simplify(chaikin(run, 1), 0.9));
          if (li % 5 === 0) major += d;
          else minor += d;
        }
        run = [];
      };
      for (const pt of line) {
        if (mask(pt)) flush();
        else run.push(pt);
      }
      flush();
    }
  });
  return { minor, major };
}

/** Field pattern: a patchwork of hatched plots, as in deltaic paddy land. */
export function fields(
  r: Rng,
  o: { origin: Vec; angle: number; size: [number, number]; extent: [number, number, number, number]; spacing: number; include: (v: Vec) => boolean; skip?: number },
): { hatches: string; bunds: string } {
  const [w, h] = o.size;
  const [u0, v0, u1, v1] = o.extent;
  const hs: [Vec, Vec][] = [];
  const bunds: Vec[][] = [];
  for (let u = u0; u < u1; u += w) {
    let v = v0;
    while (v < v1) {
      const ph = h * between(r, 0.6, 1.4);
      const pw = w * between(r, 0.85, 1.15);
      const local: Vec[] = [
        [u, v],
        [u + pw, v],
        [u + pw, v + ph],
        [u, v + ph],
      ];
      const quad = local.map((pt) => rotate(add(o.origin, pt), o.angle, o.origin));
      v += ph;
      const c = centroid(quad);
      if (!quad.every(o.include) || !o.include(c)) continue;
      bunds.push(quad);
      if (r() < (o.skip ?? 0.18)) continue;
      const inset = quad.map((pt) => add(c, mul(sub(pt, c), 0.9)));
      const a = o.angle + (r() < 0.5 ? 0 : Math.PI / 2);
      hs.push(...hatch(inset, a, o.spacing * between(r, 0.8, 1.25)));
    }
  }
  return { hatches: segments(hs), bunds: polys(bunds) };
}

export function crosses(w: number, h: number, step: number, arm = 7, skip: (v: Vec) => boolean = () => false): string {
  const out: [Vec, Vec][] = [];
  for (let x = step; x < w; x += step)
    for (let y = step; y < h; y += step) {
      if (skip([x, y])) continue;
      out.push([[x - arm, y], [x + arm, y]], [[x, y - arm], [x, y + arm]]);
    }
  return segments(out);
}

export function northArrow(at: Vec, size: number): string {
  const [x, y] = at;
  return `<g stroke="${C.ink}" stroke-width="1.6"><path d="M${x} ${y + size}L${x} ${y - size}"/><path d="M${x - size * 0.32} ${y - size * 0.55}L${x} ${y - size}L${x + size * 0.32} ${y - size * 0.55}"/><circle cx="${x}" cy="${y}" r="${size * 0.42}"/></g>`;
}

export function scaleBar(at: Vec, unit: number, n = 4): string {
  const [x, y] = at;
  let d = '';
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) d += `<rect x="${x + i * unit}" y="${y}" width="${unit}" height="7" fill="${C.ink}"/>`;
  }
  return `${d}<rect x="${x}" y="${y}" width="${unit * n}" height="7" stroke="${C.ink}" stroke-width="1.4"/>`;
}

/** Section line with end markers and view arrows, in brick. */
export function sectionLine(a: Vec, b: Vec, label = 'A'): string {
  const u = norm(sub(b, a));
  const n = perp(u);
  const tick = (pt: Vec) => {
    const t0 = add(pt, mul(n, -18));
    const t1 = add(pt, mul(n, 18));
    const arrowTip = add(t1, mul(n, 0));
    const arr = [add(arrowTip, mul(u, -9)), add(arrowTip, mul(n, 12)), add(arrowTip, mul(u, 9))];
    return `<path d="${path([t0, t1])}" stroke-width="2.4"/><path d="${path(arr, true)}" fill="${C.brick}" stroke="none"/>`;
  };
  const la = add(add(a, mul(u, -30)), mul(n, 6));
  const lb = add(add(b, mul(u, 30)), mul(n, 6));
  const text = (pt: Vec, s: string) =>
    `<text x="${pt[0].toFixed(1)}" y="${pt[1].toFixed(1)}" fill="${C.brick}" stroke="none" font-family="Helvetica, Arial, sans-serif" font-size="26" text-anchor="middle" dominant-baseline="middle">${s}</text>`;
  return `<g stroke="${C.brick}" stroke-width="1.8"><path d="${path([a, b])}" stroke-dasharray="26 9 4 9"/>${tick(a)}${tick(b)}${text(la, label)}${text(lb, `${label}′`)}</g>`;
}

/* ------------------------------------------------------------------ Hero */

export function heroPlate(): string {
  const W = 2400;
  const H = 1100;
  const r = rng(hash('plate:hero'));
  const noise = perlin(11);
  const terrain = (x: number, y: number) => fbm(noise, x / 820 + 3.1, y / 820 + 1.7, 4);

  const rv = river(r, noise, [-150, 170], [W + 150, 930], 230, 78, 2.2);
  const water = riverPolygon(rv);
  const islands = chars(rv, 3, r);
  const joinAt = rv.centre[Math.floor(rv.centre.length * 0.3)];
  const trib = river(rng(hash('plate:hero:trib')), noise, [380, H + 90], joinAt, 90, 15, 1.6);
  const near = (pt: Vec, m = 0) =>
    distToPolyline(pt, rv.centre) < 34 + m || distToPolyline(pt, trib.centre) < 11 + m * 0.6;

  const edge = (y: number) => 1040 + noise(y / 260, 9.4) * 190 + (y / H) * 60;
  const inCity = (pt: Vec) => pt[0] > edge(pt[1]);
  // The old core sits on one bank of the river, at the inside of a bend.
  const bend = rv.centre.reduce((best, c) => (Math.abs(c[0] - 1500) < Math.abs(best[0] - 1500) ? c : best));
  const core: Vec = [bend[0] + 40, bend[1] - 250];
  const coreR = (pt: Vec) => 360 + noise(pt[0] / 160, pt[1] / 160) * 120;
  const fromCore = (pt: Vec) => len(sub(pt, core));
  const inCore = (pt: Vec) => fromCore(pt) < coreR(pt);

  const old = fabric(r, {
    origin: core,
    angle: 0.2,
    block: [60, 48],
    extent: [-640, -640, 640, 640],
    jitter: 0.34,
    warp: (pt) => add(pt, [noise(pt[0] / 160, pt[1] / 160) * 32, noise(pt[0] / 160 + 9, pt[1] / 160) * 32]),
    street: 7,
    lotWidth: [7, 12],
    lotDepth: [8, 15],
    density: (c) => Math.min(0.94, Math.max(0, 1.5 - fromCore(c) / coreR(c))),
    openChance: 0.02,
    include: (pt) => inCity(pt) && fromCore(pt) < coreR(pt) * 1.12 && !near(pt, 12),
  });
  const planned = fabric(r, {
    origin: [1800, 560],
    angle: -0.05,
    block: [118, 84],
    extent: [-1100, -800, 1100, 820],
    jitter: 0.03,
    street: 14,
    lotWidth: [12, 26],
    lotDepth: [10, 16],
    density: (c) => 0.78 * Math.min(1, Math.max(0.12, 1.25 - (fromCore(c) - 300) / 1000)) * (0.75 + 0.5 * (0.5 + noise(c[0] / 300, c[1] / 300))),
    openChance: 0.07,
    include: (pt) => inCity(add(pt, [-40, 0])) && !inCore(pt) && fromCore(pt) > coreR(pt) * 1.05 && !near(pt, 26) && pt[0] < W + 30,
  });
  // A second, smaller settlement across the river.
  const far: Vec = [bend[0] + 160, bend[1] + 230];
  const hamlet = fabric(r, {
    origin: far,
    angle: -0.35,
    block: [56, 44],
    extent: [-300, -300, 300, 300],
    jitter: 0.3,
    warp: (pt) => add(pt, [noise(pt[0] / 140 + 4, pt[1] / 140) * 22, noise(pt[0] / 140, pt[1] / 140 + 4) * 22]),
    street: 7,
    lotWidth: [7, 11],
    lotDepth: [7, 13],
    density: (c) => Math.max(0, 1.1 - len(sub(c, far)) / 240),
    openChance: 0.02,
    include: (pt) => len(sub(pt, far)) < 260 && !near(pt, 12),
  });

  const fld = fields(r, {
    origin: [480, 560],
    angle: 0.32,
    size: [100, 62],
    extent: [-1000, -1000, 1000, 1000],
    spacing: 7.5,
    include: (pt) =>
      !inCity(add(pt, [70, 0])) && !near(pt, 30) && len(sub(pt, far)) > 290 && pt[0] > -60 && pt[0] < W && pt[1] > -60 && pt[1] < H + 60,
    skip: 0.34,
  });

  const topo = contourLines(terrain, W, H, 0.045, (pt) => inCity(add(pt, [-40, 0])) || near(pt, 4) || len(sub(pt, far)) < 250);

  // An earthen embankment (al) following the river at a distance.
  const al = offset(rv.centre, -170).filter((pt) => !inCity(add(pt, [90, 0])) && pt[0] > -20 && pt[1] < H + 10);
  const alPair = al.length > 2 ? path(offset(al, 4)) + path(offset(al, -4)) : '';

  const body = [
    g(`stroke="${C.grey}" stroke-width="1.3"`, p(topo.minor, '')),
    g(`stroke="${C.grey}" stroke-width="2.1"`, p(topo.major, '')),
    g(`stroke="${C.grey}" stroke-width="1.1"`, p(fld.hatches, '')),
    g(`stroke="${C.rule}" stroke-width="1.6"`, p(fld.bunds, '')),
    g(`stroke="${C.grey}" stroke-width="1.5"`, p(alPair, '')),
    p(path(riverPolygon(trib), true), `fill="${C.sage}"`),
    p(path(water, true), `fill="${C.sage}"`),
    p(islands.map((i) => path(i, true)).join(''), `fill="${C.paper}" stroke="${C.ink}" stroke-width="1.3"`),
    g(`stroke="${C.ink}" stroke-width="2"`, p(path(rv.left) + path(rv.right), '')),
    g(`stroke="${C.ink}" stroke-width="1.4"`, p(path(trib.left) + path(trib.right), '')),
    p(polys(old.open.concat(planned.open)), `fill="${C.sage}" fill-opacity=".5"`),
    p(polys(old.buildings.concat(hamlet.buildings)), `fill="${C.ink}"`),
    p(polys(planned.buildings), `fill="${C.ink}"`),
    g(`stroke="${C.grey}" stroke-width="1.6"`, p(crosses(W, H, 200, 8, (v) => inCity(add(v, [-60, 0])) || near(v, 20)), '')),
    sectionLine([core[0] - 90, 90], [core[0] + 170, 1010]),
    northArrow([150, 935], 44),
    scaleBar([232, 962], 46),
  ].join('');

  return svg(W, H, body, 'Plate: settlement, water and terrain (abstract composition)');
}
