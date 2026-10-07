import { ORDER, PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { SHAPES } from '../lib/shapes';
import { DemoArt } from '../components/Art';
import { View } from '../components/View';

export default function Choose() {
  const { design, setDesign, setArt, go, reset } = useKiosk();

  const pick = (k) => {
    if (k !== design) setArt(null);
    setDesign(k);
  };

  return (
    <View
      en="Choose your masterpiece" ar="اختر لوحتك"
      foot={<>
        <button className="btn" onClick={reset}>Start over</button>
        <span className="note">Every design is built from your family's own signatures.</span>
        <button className="btn primary" disabled={!design} onClick={() => go('sign')}>Next · التالي</button>
      </>}
    >
      <div className="vbody">
        <div className="cards">
          {ORDER.map((k, i) => (
            <button key={k} className={`card${design === k ? ' sel' : ''}`} aria-pressed={design === k} onClick={() => pick(k)}>
              <span className="tagl">{SHAPES[k].en}</span>
              <div className="art"><DemoArt design={k} pal={PALETTES[i % PALETTES.length]} /></div>
              <small>{SHAPES[k].ar}</small>
            </button>
          ))}
        </div>
      </div>
    </View>
  );
}
