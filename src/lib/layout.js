import { FF } from '../data';
import { SHAPES } from './shapes';
import { sigPath } from './signature';

// Small seeded xorshift RNG so a given family + shape always produces the same artwork
export function rng(seed) {
  let h = seed >>> 0 || 1;
  return () => {
    h ^= h << 13; h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5; h >>>= 0;
    return h / 4294967296;
  };
}

// Drawn signatures are scaled so their full height is this fraction of the tier "font size",
// shrunk further for very long signatures so they pack like a written name would
const SIG_K = 0.8, SIG_MAX_W = 2.6;
export const sigScale = (sig, size) => size * Math.min(SIG_K, SIG_MAX_W / sig.w);
const NUM = { kind: 'text', name: '55', script: 'num' };

/** Member for an item index; -1 is the "55" anniversary mark sprinkled through the art. */
export const memberOf = (members, fi) => (fi < 0 ? NUM : members[fi]);

/** Colour and opacity of item `i` in palette `pal`. Shared by the SVG and PNG renderers. */
export function itemStyle(it, i, pal) {
  const n = pal.c.length;
  const col = it.ti === 0 ? pal.c[it.fi % n] : it.fi < 0 ? pal.c[2] : pal.c[(it.fi + it.ti + (i % 2)) % n];
  const op = it.ti >= 6 ? 0.7 : it.ti === 5 ? 0.82 : it.ti === 4 ? 0.92 : 1;
  return { col, op };
}

/** Seed derived from the strokes, so every family gets a different composition. */
export function seedFor(key, strokeSets) {
  let h = SHAPES[key].seed;
  for (const strokes of strokeSets)
    for (const s of strokes)
      for (const [x, y] of s) h = (Math.imul(h, 31) + ((x * 7 + y) | 0)) >>> 0;
  return h;
}

const CACHE = {};

/**
 * Calligram engine: rasterises the shape to a mask, then packs the members'
 * signatures inside it (each member once as a large "hero", then progressively
 * smaller tiers), rotated to follow the shape's flow. Collision checks use the
 * actual inked pixels of each rotated signature, so nothing overlaps.
 *
 * members: [{ kind:'sig', sig }] (drawn, see normalize()) or [{ kind:'text', name, script }]
 * returns: [{ fi, x, y, ang, size, ti }] in the shape's 400x400 space
 */
export function layout(key, members, seed, cacheKey) {
  if (cacheKey && CACHE[cacheKey]) return CACHE[cacheKey];
  const Z = 2, W = 400 * Z, sh = SHAPES[key];
  const c = document.createElement('canvas');
  c.width = c.height = W;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.save(); g.scale(Z, Z); g.fillStyle = '#000';
  sh.d.forEach((d) => g.fill(new Path2D(d)));
  g.restore();

  const px = g.getImageData(0, 0, W, W).data;
  const mask = new Uint8Array(W * W), occ = new Uint8Array(W * W), pts = [];
  for (let i = 0; i < W * W; i++) {
    if (px[i * 4 + 3] > 160) { mask[i] = 1; if (i % 3 === 0) pts.push(i); }
  }

  const sc = document.createElement('canvas');
  const sg = sc.getContext('2d', { willReadFrequently: true });
  const cache = new Map();

  // pixel sprite: the actual inked pixels of a rotated signature
  const sprite = (fi, size, ang) => {
    const id = fi + '|' + size + '|' + ang;
    if (cache.has(id)) return cache.get(id);
    const m = memberOf(members, fi);
    const fpx = size * Z;
    let D;
    if (m.kind === 'sig') {
      const s = sigScale(m.sig, fpx);
      D = Math.ceil(Math.hypot(m.sig.w * s, s) + m.sig.sw * s) + 6;
      sc.width = sc.height = D;
      sg.translate(D / 2, D / 2); sg.rotate((ang * Math.PI) / 180); sg.scale(s, s);
      sg.lineWidth = m.sig.sw; sg.lineCap = sg.lineJoin = 'round'; sg.strokeStyle = '#000';
      sg.stroke(sigPath(m.sig));
    } else {
      sg.font = `700 ${fpx}px ${FF[m.script]}`;
      const tw = sg.measureText(m.name).width;
      D = Math.ceil(Math.hypot(tw, fpx * 1.5)) + 6;
      sc.width = sc.height = D;
      sg.font = `700 ${fpx}px ${FF[m.script]}`;
      sg.textAlign = 'center'; sg.textBaseline = 'middle';
      sg.translate(D / 2, D / 2); sg.rotate((ang * Math.PI) / 180);
      sg.fillText(m.name, 0, 0);
    }
    const d = sg.getImageData(0, 0, D, D).data, o = [];
    for (let y = 0; y < D; y++)
      for (let x = 0; x < D; x++)
        if (d[(y * D + x) * 4 + 3] > 30) o.push(x - (D >> 1), y - (D >> 1));
    const r = new Int16Array(o);
    cache.set(id, r);
    return r;
  };

  const fits = (sp, x, y) => {
    for (let i = 0; i < sp.length; i += 2) {
      const X = x + sp[i], Y = y + sp[i + 1];
      if (X < 0 || Y < 0 || X >= W || Y >= W) return false;
      const k = Y * W + X;
      if (!mask[k] || occ[k]) return false;
    }
    return true;
  };

  const mark = (sp, x, y, gap) => {
    for (let i = 0; i < sp.length; i += 2) {
      const X = x + sp[i], Y = y + sp[i + 1];
      for (let a = -gap; a <= gap; a++)
        for (let b = -gap; b <= gap; b++) {
          const XX = X + a, YY = Y + b;
          if (XX >= 0 && YY >= 0 && XX < W && YY < W) occ[YY * W + XX] = 1;
        }
    }
  };

  const r = rng(seed), out = [], M = members.length;
  const pick = (t) => (r() < (t > 3 ? 0.012 : 0.035) ? -1 : (r() * M) | 0);

  const tiers = [
    { s: [30, 36], n: M, sp: 500, hero: 1, gap: 2 },
    { s: [19, 23], n: 12, sp: 500, gap: 2 },
    { s: [13, 16], n: 34, sp: 700, gap: 1 },
    { s: [9.5, 11.5], n: 90, sp: 5000, gap: 1 },
    { s: [7, 8.5], n: 260, sp: 12000, gap: 1 },
    { s: [5.2, 6.2], n: 600, sp: 22000, gap: 1 },
    { s: [3.8, 4.6], n: 1100, sp: 30000, gap: 1 },
  ];

  tiers.forEach((tr, ti) => {
    let placed = 0;
    for (let k = 0; k < tr.sp && placed < tr.n; k++) {
      const fi = tr.hero ? placed : pick(ti);
      const size = Math.round((tr.s[0] + r() * (tr.s[1] - tr.s[0])) * (fi < 0 ? 0.8 : 1) * 2) / 2;
      const p = pts[(r() * pts.length) | 0];
      const x = p % W, y = (p / W) | 0;
      if (occ[p]) continue;
      const ang = Math.round((sh.flow(x / Z, y / Z) + (r() - 0.5) * (ti < 2 ? 6 : 14)) / 4) * 4;
      const sp = sprite(fi, size, ang);
      for (let j = 0; j < 8; j++) {
        const xx = x + ((j % 3) - 1) * 3, yy = y + (((j / 3) | 0) - 1) * 3;
        if (fits(sp, xx, yy)) {
          mark(sp, xx, yy, tr.gap);
          out.push({ fi, x: +(xx / Z).toFixed(1), y: +(yy / Z).toFixed(1), ang, size, ti });
          placed++;
          break;
        }
      }
    }
  });

  if (cacheKey) CACHE[cacheKey] = out;
  return out;
}
