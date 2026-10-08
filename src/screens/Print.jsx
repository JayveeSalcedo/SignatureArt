import { useEffect, useState } from 'react';
import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { Art } from '../components/Art';
import { View } from '../components/View';
import { renderArtPNG, renderSigPNG } from '../lib/render';
import { artworkPath, saveSession } from '../lib/cloud';

const MSGS = ['Printing colour layers', 'Sealing for a lasting finish', 'Ready to hang'];

export default function Print() {
  const { art, pal, go, surname, title, members } = useKiosk();
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

  // The design and colours are final once printing starts, so archive the session.
  // Keyed by art.id, so a repeated save (e.g. StrictMode's double effect) is harmless.
  useEffect(() => {
    archive(art, PALETTES[pal], title, surname, members)
      .catch((e) => console.warn('Could not save session', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [art.id]);

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

async function archive(art, P, title, surname, members) {
  const dir = art.id;
  const signed = members.filter((m) => m.sig);
  const files = { [artworkPath(dir)]: await renderArtPNG(art, P, title) };
  const rows = [];
  for (const [i, m] of signed.entries()) {
    const path = `${dir}/signatures/${i + 1}.png`;
    files[path] = await renderSigPNG(m.sig, m.color);
    rows.push({ name: m.label.trim() || m.role, color: m.color, image_path: path, strokes: m.strokes });
  }
  await saveSession({
    id: art.id,
    family_name: surname.trim() || null,
    title,
    design: art.design,
    palette: P.k,
    members: rows,
    artwork_path: artworkPath(dir),
  }, files);
}
