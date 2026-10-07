// Pen width (CSS px) used on the signing pads
export const PEN = 3.2;

const f = (v) => +v.toFixed(4);

/** Smooth SVG/Path2D path through one stroke's points (quadratic midpoints). */
export function strokeD(p) {
  if (!p.length) return '';
  if (p.length === 1) return `M${f(p[0][0])} ${f(p[0][1])}l0.001 0`;
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
    d += `Q${f(p[i][0])} ${f(p[i][1])} ${f(mx)} ${f(my)}`;
  }
  const l = p[p.length - 1];
  return d + `L${f(l[0])} ${f(l[1])}`;
}

/**
 * Turn raw pad strokes into a resolution-independent signature: centred on 0,0,
 * scaled so its height is ~1 unit. Returns { d, w (width in units), sw (stroke width) }.
 */
export function normalize(strokes) {
  const pts = strokes.flat();
  if (!pts.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  const bw = maxX - minX, bh = maxY - minY;
  // very flat signatures are scaled by width so they don't become enormous
  const h = Math.max(bh, bw / 5, 12) + PEN;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const d = strokes.map((s) => strokeD(s.map(([x, y]) => [(x - cx) / h, (y - cy) / h]))).join('');
  return { d, w: (bw + PEN) / h, sw: Math.max(PEN / h, 0.08) };
}

const P2D = new WeakMap();
/** Cached Path2D for a normalized signature. */
export function sigPath(sig) {
  let p = P2D.get(sig);
  if (!p) { p = new Path2D(sig.d); P2D.set(sig, p); }
  return p;
}
