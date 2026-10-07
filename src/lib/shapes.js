import { INK } from '../data';

// Outline paths (400x400 viewBox) for each artwork, plus a "flow" function that
// returns the text angle (deg) at a point so signatures follow the form, and
// small decorative overlays (eye, dates, heart) drawn on top.

const circ = (cx, cy, r) =>
  `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

function palmPaths() {
  const out = ['M190 396 Q184 290 197 176 L216 176 Q209 290 216 396 Z'];
  const cx = 206, cy = 168;
  const angles = [-180, -152, -126, -102, -78, -54, -28, 0];
  angles.forEach((a) => {
    const r = (a * Math.PI) / 180;
    const L = a > -110 && a < -70 ? 122 : 156;
    const tx = cx + Math.cos(r) * L;
    const ty = cy + Math.sin(r) * L + 50 * Math.abs(Math.cos(r));
    const mx = (cx + tx) / 2, my = (cy + ty) / 2 - 28;
    const nx = -(ty - cy) / L, ny = (tx - cx) / L, w = 40;
    out.push(
      `M${cx} ${cy} Q${mx + nx * w} ${my + ny * w} ${tx} ${ty} Q${mx - nx * w * 0.55} ${my - ny * w * 0.55} ${cx} ${cy}Z`
    );
  });
  return out;
}

const deg = (x, y, ox, oy) => {
  let a = (Math.atan2(y - oy, x - ox) * 180) / Math.PI;
  if (a > 90) a -= 180;
  if (a < -90) a += 180;
  return a;
};

export const SHAPES = {
  falcon: {
    en: 'Falcon', ar: 'الصقر', seed: 11,
    d: ['M342 118 L320 108 Q306 92 288 97 Q270 102 262 120 Q214 90 150 54 Q100 28 34 24 Q94 58 130 90 Q86 88 40 100 Q98 122 150 140 Q104 150 62 174 Q126 180 182 176 Q168 216 138 254 L92 320 L126 314 L140 334 L164 302 L186 320 L196 284 Q238 250 264 210 Q292 176 298 146 L318 136 Q334 130 342 118 Z'],
    flow: (x, y) => (x > 270 && y < 150 ? -12 : deg(x, y, 268, 150)),
    over: [
      { d: circ(299, 113, 3.6), fill: INK },
      { d: 'M342 118 L330 129 L323 120Z', fill: INK },
    ],
  },
  map: {
    en: 'UAE Map', ar: 'خريطة الإمارات', seed: 23,
    d: ['M16 228 L37 247 L94 232 L154 236 L208 224 L234 213 L268 175 L299 149 L321 130 L348 107 L358 91 L364 110 L367 124 L380 126 L379 152 L381 173 L360 180 L349 206 L337 230 L349 244 L321 247 L310 263 L318 293 L291 346 L94 327 Z'],
    flow: (x, y) => (x > 330 ? -90 : y < 240 && x > 230 ? deg(x, y, 150, 330) * 0.6 : -4),
    over: [],
  },
  palm: {
    en: 'Palm Tree', ar: 'النخلة', seed: 37, d: palmPaths(),
    flow: (x, y) => (y > 205 && x > 182 && x < 232 ? -90 : deg(x, y, 206, 168)),
    // dates
    over: [[195, 186], [206, 191], [217, 186], [200, 199], [212, 199]].map(([x, y]) => (
      { d: circ(x, y, 6.5), fill: '#A86744', stroke: INK }
    )),
  },
  tree: {
    en: 'Family Tree', ar: 'شجرة العائلة', seed: 41,
    d: [
      'M176 394 Q186 330 176 284 Q150 254 112 240 L122 226 Q160 240 184 262 Q190 224 186 196 L210 196 Q204 236 212 262 Q240 236 284 224 L290 238 Q248 250 222 284 Q212 330 226 394 Z',
      circ(200, 150, 92), circ(118, 176, 62), circ(282, 176, 62),
      circ(146, 96, 56), circ(254, 96, 56), circ(200, 72, 54),
    ],
    flow: (x, y) => {
      if (y > 246 && x > 160 && x < 240) return -90;
      if (y > 222 && y < 262) return deg(x, y, 200, 270);
      return deg(x, y, 200, 330) * 0.45;
    },
    // heart at the root
    over: [{
      d: 'M201 384 c-7 -9 -18 -10 -18 -19 c0 -6 5 -10 10 -10 c4 0 7 3 8 6 c1 -3 4 -6 8 -6 c5 0 10 4 10 10 c0 9 -11 10 -18 19z',
      fill: '#C8685A', stroke: INK,
    }],
  },
};
