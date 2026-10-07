import { useEffect, useState } from 'react';
import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { Art } from '../components/Art';
import { View } from '../components/View';

const MSGS = ['Printing colour layers', 'Sealing for a lasting finish', 'Ready to hang'];

export default function Print() {
  const { art, pal, go } = useKiosk();
  const [msg, setMsg] = useState('Preparing canvas · 40 × 50 cm');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Sends the print-only sheet (see .print-sheet) to the printer. On a kiosk,
    // run Chrome with --kiosk-printing to skip the dialog.
    const timers = [setTimeout(() => window.print(), 500)];
    MSGS.forEach((m, i) => timers.push(setTimeout(() => setMsg(m), 1500 * (i + 1))));
    timers.push(setTimeout(() => setReady(true), 1500 * MSGS.length));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <View
      en="Printing on canvas" ar="الطباعة على القماش"
      foot={<>
        <button className="btn" onClick={() => window.print()}>Print again</button>
        <span className="note" />
        <button className="btn primary" disabled={!ready} onClick={() => go('home')}>Continue · متابعة</button>
      </>}
    >
      <div className="printwrap">
        <div className="printer"><span className="lbl">Premium canvas</span><span className="led" /></div>
        <div className="sheet"><Art art={art} pal={PALETTES[pal]} /></div>
        <div className="ptext" aria-live="polite">{msg}</div>
      </div>
    </View>
  );
}
