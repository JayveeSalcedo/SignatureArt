import { useEffect, useState } from 'react';
import { ORDER, PALETTES, DEMO_MEMBERS } from './data';
import { KioskProvider, useKiosk } from './KioskContext';
import { SHAPES } from './lib/shapes';
import { layout } from './lib/layout';
import { Art } from './components/Art';
import Attract from './screens/Attract';
import Choose from './screens/Choose';
import Sign from './screens/Sign';
import Create from './screens/Create';
import Preview from './screens/Preview';
import Print from './screens/Print';
import TakeHome from './screens/TakeHome';
import Share from './screens/Share';

const SCREENS = { attract: Attract, choose: Choose, sign: Sign, create: Create, preview: Preview, print: Print, home: TakeHome, share: Share };
const NEEDS_ART = ['preview', 'print', 'home', 'share'];

// The layout engine measures glyphs on a canvas, so the fonts must be loaded first
// (text sample included so the Arabic subset of Aref Ruqaa is fetched too).
function loadFonts() {
  if (!document.fonts) return Promise.resolve();
  const fonts = [['700 30px Caveat', 'Mariam'], ['700 30px "Aref Ruqaa"', 'أحمد سارة'], ['700 30px Oswald', '55']];
  const load = Promise.all(fonts.map(([f, t]) => document.fonts.load(f, t).catch(() => 0))).then(() => document.fonts.ready);
  return Promise.race([load, new Promise((r) => setTimeout(r, 5000))]); // safety net; fonts are bundled locally
}

// Pre-compute the sample thumbnails in idle slices so the "Choose" screen opens instantly
function warmDemoLayouts() {
  const q = [...ORDER];
  const next = () => {
    const k = q.shift();
    if (!k) return;
    layout(k, DEMO_MEMBERS, SHAPES[k].seed, `demo:${k}`);
    setTimeout(next, 60);
  };
  setTimeout(next, 300);
}

function Shell() {
  const { step, art, pal, title } = useKiosk();
  const Screen = NEEDS_ART.includes(step) && !art ? Create : SCREENS[step];
  return (
    <>
      <div className="screen"><Screen key={step} /></div>
      {art && (
        <div className="print-sheet" aria-hidden="true">
          <Art art={art} pal={PALETTES[pal]} />
          <div className="cap">{title}</div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadFonts().then(() => { setReady(true); warmDemoLayouts(); });
  }, []);

  if (!ready) return <div className="screen"><div className="loading">Loading…</div></div>;
  return <KioskProvider><Shell /></KioskProvider>;
}
