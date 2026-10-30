/**
 * Framework diagrams as standalone SVG files for download: the ten layers and
 * the relations proposed between them, the scales of context, and the Read,
 * Plan, Process sequence. Each file carries its title, its source and a
 * credit, so that it stays attributable when it travels.
 */
import { PALETTE } from './core';

const SERIF = "'Instrument Serif', 'Iowan Old Style', Palatino, Georgia, serif";
const SANS = "'Inter', 'Segoe UI', Roboto, Arial, sans-serif";
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const f = (n: number) => n.toFixed(1);

interface Layer {
  id: string;
  number: number;
  name: string;
}
interface Relation {
  a: string;
  b: string;
}

function frame(w: number, h: number, title: string, desc: string, body: string, source: string): string {
  const credit =
    'Editorial diagram, New Contextualism platform (pre-publication edition). Not a statement by the founder unless stated.';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 170}" width="${w}" height="${h + 170}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="100%" height="100%" fill="${PALETTE.paper}"/>
<text x="48" y="64" font-family="${SANS}" font-size="13" font-weight="600" letter-spacing="2.6" fill="${PALETTE.ink}">NEW CONTEXTUALISM</text>
<text x="48" y="112" font-family="${SERIF}" font-size="40" fill="${PALETTE.ink}">${esc(title)}</text>
<line x1="48" y1="134" x2="${w - 48}" y2="134" stroke="${PALETTE.ink}" stroke-width="1"/>
<g transform="translate(0 150)">${body}</g>
<line x1="48" y1="${h + 112}" x2="${w - 48}" y2="${h + 112}" stroke="${PALETTE.rule}" stroke-width="1"/>
<text x="48" y="${h + 136}" font-family="${SANS}" font-size="13" fill="${PALETTE.ink2}">${esc(source)}</text>
<text x="48" y="${h + 156}" font-family="${SANS}" font-size="13" fill="${PALETTE.ink2}">${esc(credit)}</text>
</svg>`;
}

export function tenLayersSvg(layers: Layer[], relations: Relation[]): string {
  const W = 1000;
  const H = 900;
  const C: [number, number] = [W / 2, H / 2];
  const R = 300;
  const N = layers.length;
  const geo = new Map(
    layers.map((l, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / N;
      return [l.id, { a, x: C[0] + R * Math.cos(a), y: C[1] + R * Math.sin(a) }];
    }),
  );
  let body = `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="${PALETTE.rule}" stroke-width="1"/>`;
  for (const r of relations) {
    const a = geo.get(r.a);
    const b = geo.get(r.b);
    if (!a || !b) continue;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const cx = C[0] + (mx - C[0]) * 0.36;
    const cy = C[1] + (my - C[1]) * 0.36;
    body += `<path d="M${f(a.x)} ${f(a.y)}Q${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}" fill="none" stroke="${PALETTE.sage}" stroke-width="1.6"/>`;
  }
  for (const l of layers) {
    const g = geo.get(l.id)!;
    const lx = C[0] + (R + 44) * Math.cos(g.a);
    const ly = C[1] + (R + 44) * Math.sin(g.a);
    const cos = Math.cos(g.a);
    const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
    const dy = Math.sin(g.a) < -0.85 ? -10 : Math.sin(g.a) > 0.85 ? 26 : 8;
    body += `<circle cx="${f(g.x)}" cy="${f(g.y)}" r="7" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="1.4"/>`;
    body += `<text x="${f(lx)}" y="${f(ly + dy)}" text-anchor="${anchor}" font-family="${SERIF}" font-size="28" fill="${PALETTE.ink}"><tspan font-family="${SANS}" font-size="12" fill="${PALETTE.ink2}">${String(l.number).padStart(2, '0')}  </tspan>${esc(l.name)}</text>`;
  }
  return frame(
    W,
    H,
    'The ten contextual layers',
    `The ten layers on a ring, joined by the ${relations.length} relations proposed between them by the editors.`,
    body,
    'Layers: Reza (2025), “New Contextualism: An architectural philosophy for deltaic Bangladesh”, The Daily Star. Relations: editorial interpretation.',
  );
}

export function scalesSvg(): string {
  const W = 1000;
  const H = 560;
  const scales = [
    ['Universal values', 'Values shared across places and cultures'],
    ['Regional ideas', 'Aligned with critical regionalism'],
    ['Neighbourhood', 'The immediate surroundings'],
    ['Site', 'Within its boundaries'],
  ];
  let body = '';
  scales.forEach(([label, note], i) => {
    const inset = i * 66;
    const x = 48 + inset;
    const y = 20 + inset;
    const w = 540 - inset * 2;
    const h = 520 - inset * 2;
    const stroke = i < 2 ? PALETTE.grey : PALETTE.ink;
    const dash = i === 0 ? ' stroke-dasharray="7 7"' : '';
    const fill = i === 3 ? ` fill="${PALETTE.sage}" fill-opacity="0.45"` : ' fill="none"';
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}"${fill} stroke="${stroke}" stroke-width="${i === 3 ? 1.8 : 1.2}"${dash}/>`;
    body += `<line x1="${x + w}" y1="${y + 22}" x2="640" y2="${y + 22}" stroke="${PALETTE.rule}" stroke-width="1"/>`;
    body += `<circle cx="${x + w}" cy="${y + 22}" r="3.5" fill="${PALETTE.ink}"/>`;
    body += `<text x="656" y="${y + 29}" font-family="${SERIF}" font-size="28" fill="${PALETTE.ink}">${esc(label)}</text>`;
    body += `<text x="656" y="${y + 52}" font-family="${SANS}" font-size="14" fill="${PALETTE.ink2}">${esc(note)}</text>`;
  });
  body += `<path d="M318 280h-12m12 0h12m-12 0v-12m0 12v12" stroke="${PALETTE.brick}" stroke-width="1.6" fill="none"/>`;
  return frame(
    W,
    H,
    'Scales of context',
    'Four nested fields: universal values contain regional ideas, which contain the neighbourhood, which contains the site. Each is read through its past and its developmental trends.',
    body,
    'After Reza (2023), “New contextualism: A path to a sustainable and equitable future”, The Business Standard.',
  );
}

export function processSvg(layers: Layer[]): string {
  const W = 1000;
  const H = 600;
  const phases = [
    ['01', 'Read', 'Investigating context: the phase given particular weight, through the ten layers.'],
    ['02', 'Plan', 'Translating findings into strategy.'],
    ['03', 'Process', 'Developing, testing and refining.'],
  ];
  const colW = (W - 96 - 48) / 3;
  let body = '';
  phases.forEach(([n, name, note], i) => {
    const x = 48 + i * (colW + 24);
    body += `<line x1="${x}" y1="20" x2="${x + colW}" y2="20" stroke="${PALETTE.ink}" stroke-width="${i === 0 ? 2.4 : 1.2}"/>`;
    body += `<text x="${x}" y="50" font-family="${SANS}" font-size="13" letter-spacing="2" fill="${PALETTE.ink2}">PHASE ${n}</text>`;
    body += `<text x="${x}" y="104" font-family="${SERIF}" font-size="52" fill="${PALETTE.ink}">${esc(name)}</text>`;
    const words = note.split(' ');
    let line = '';
    let ly = 140;
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 34) {
        body += `<text x="${x}" y="${ly}" font-family="${SANS}" font-size="15" fill="${PALETTE.ink2}">${esc(line.trim())}</text>`;
        line = w;
        ly += 22;
      } else line += ` ${w}`;
    }
    body += `<text x="${x}" y="${ly}" font-family="${SANS}" font-size="15" fill="${PALETTE.ink2}">${esc(line.trim())}</text>`;
    if (i < 2) body += `<path d="M${x + colW + 4} 98h14m-5 -5 5 5 -5 5" stroke="${PALETTE.ink}" stroke-width="1.4" fill="none"/>`;
  });
  layers.forEach((l, i) => {
    const y = 250 + i * 32;
    body += `<line x1="48" y1="${y + 10}" x2="${48 + colW}" y2="${y + 10}" stroke="${PALETTE.rule}" stroke-width="1"/>`;
    body += `<text x="48" y="${y}" font-family="${SANS}" font-size="12" fill="${PALETTE.ink2}">${String(l.number).padStart(2, '0')}</text>`;
    body += `<text x="84" y="${y}" font-family="${SERIF}" font-size="22" fill="${PALETTE.ink}">${esc(l.name)}</text>`;
  });
  return frame(
    W,
    H,
    'Read, Plan, Process',
    'The three phases with which every project is said to begin, with the ten layers that structure the reading.',
    body,
    'Phases: Reza and Nitu (2025), “New Contextualism: Architecture and Urbanism for People, Place, and Justice”, Context BD. Descriptions of Plan and Process: editorial.',
  );
}
