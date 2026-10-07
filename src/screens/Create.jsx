import { useEffect, useState } from 'react';
import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { SHAPES } from '../lib/shapes';
import { layout, seedFor } from '../lib/layout';
import { Art } from '../components/Art';
import { Signature } from '../components/Signature';
import { View } from '../components/View';

export default function Create() {
  const { design, members, pal, art, setArt, go } = useKiosk();
  const [phase, setPhase] = useState(1);
  const signed = members.filter((m) => m.sig);

  useEffect(() => {
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    setArt(null);
    // let the screen paint before the (synchronous) layout pass
    later(() => {
      const mem = signed.map((m) => ({ kind: 'sig', sig: m.sig }));
      const items = layout(design, mem, seedFor(design, signed.map((m) => m.strokes)));
      setArt({ design, members: mem, items });
      setPhase(2);
      later(() => setPhase(3), 1250);
      later(() => setPhase(4), 2500);
      later(() => setPhase(5), 3700);
      later(() => go('preview'), 4500);
    }, 600);
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    `Reading ${signed.length} signature${signed.length === 1 ? '' : 's'}`,
    `Shaping the ${SHAPES[design].en.toLowerCase()}`,
    'Balancing colour',
    'Final details',
  ];

  return (
    <View cls="ai" en="AI is creating your art" ar="الذكاء الاصطناعي يرسم لوحتكم">
      <div className="grid">
        <div className="sigs">
          {signed.slice(0, 8).map((m) => <div key={m.id}><Signature sig={m.sig} color="#F3EED6" /></div>)}
        </div>
        <div className="canvas">
          {art && <Art art={art} pal={PALETTES[pal]} reveal />}
          {phase < 5 && <div className="scan" />}
        </div>
        <ol className="steps">
          {steps.map((s, i) => <li key={s} className={phase > i ? 'on' : ''}>{s}</li>)}
        </ol>
      </div>
    </View>
  );
}
