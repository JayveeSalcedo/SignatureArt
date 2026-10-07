import { FF, INK } from '../data';
import { SHAPES } from './shapes';
import { itemStyle, memberOf, sigScale } from './layout';
import { sigPath } from './signature';

/** Draw an artwork onto a 2D context in the shape's 400x400 coordinate space. */
export function drawArt(g, { design, members, items }, pal) {
  const sh = SHAPES[design];
  g.save();
  g.globalAlpha = 0.07; g.fillStyle = pal.c[0];
  sh.d.forEach((d) => g.fill(new Path2D(d)));
  g.restore();

  items.forEach((it, i) => {
    const { col, op } = itemStyle(it, i, pal);
    const m = memberOf(members, it.fi);
    g.save();
    g.translate(it.x, it.y);
    g.rotate((it.ang * Math.PI) / 180);
    g.globalAlpha = op;
    if (m.kind === 'sig') {
      const s = sigScale(m.sig, it.size);
      g.scale(s, s);
      g.lineWidth = m.sig.sw; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = col;
      g.stroke(sigPath(m.sig));
    } else {
      g.font = `700 ${it.size}px ${FF[m.script]}`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col;
      g.fillText(m.name, 0, 0);
    }
    g.restore();
  });

  sh.over.forEach((o) => {
    const p = new Path2D(o.d);
    g.fillStyle = o.fill; g.fill(p);
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 1; g.stroke(p); }
  });
}

/** Render the finished canvas (4:5, artwork + family name) to a PNG blob. */
export async function renderArtPNG(art, pal, title, width = 1600) {
  if (document.fonts) await document.fonts.ready;
  const W = width, H = Math.round(width * 1.25), k = W / 400;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#F1EDD8';
  g.fillRect(0, 0, W, H);
  g.save(); g.translate(0, H * 0.04); g.scale(k, k);
  drawArt(g, art, pal);
  g.restore();
  g.fillStyle = INK;
  g.font = `700 ${Math.round(W * 0.055)}px 'Caveat', cursive`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(title, W / 2, H * 0.92);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
