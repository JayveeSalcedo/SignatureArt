import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { Art } from '../components/Art';
import { View } from '../components/View';

export default function Preview() {
  const { art, pal, setPal, title, go } = useKiosk();
  return (
    <View en="Preview your artwork" ar="معاينة لوحتكم">
      <div className="pv">
        <div className="framed">
          <div className="art"><Art art={art} pal={PALETTES[pal]} /></div>
          <div className="cap">{title}</div>
        </div>
        <div className="side">
          <h4>Colour story</h4>
          <div className="swatches">
            {PALETTES.map((p, i) => (
              <button key={p.k} className={`swatch${i === pal ? ' sel' : ''}`} aria-pressed={i === pal} onClick={() => setPal(i)}>
                <span className="chipset">{p.c.map((c) => <i key={c} style={{ background: c }} />)}</span>
                {p.en}
              </button>
            ))}
          </div>
          <button className="btn" onClick={() => go('choose')}>Change design</button>
          <button className="btn" onClick={() => go('sign')}>Edit signatures</button>
          <button className="btn accent" onClick={() => go('print')}>Print on canvas</button>
        </div>
      </div>
    </View>
  );
}
