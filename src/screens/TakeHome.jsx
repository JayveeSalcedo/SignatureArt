import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { SHAPES } from '../lib/shapes';
import { Art } from '../components/Art';
import { Logo } from '../components/Logo';
import { Signature } from '../components/Signature';
import { View } from '../components/View';

export default function TakeHome() {
  const { art, pal, title, members, go } = useKiosk();
  const signed = members.filter((m) => m.sig);
  const shape = SHAPES[art.design].en;
  const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  const n = art.members.length;

  return (
    <View
      en="Your masterpiece" ar="تحفتكم الفنية"
      foot={<>
        <span />
        <button className="btn primary" onClick={() => go('share')}>Continue · متابعة</button>
      </>}
    >
      <div className="home">
        <div className="stretched"><Art art={art} pal={PALETTES[pal]} /></div>
        <div>
          <h4>Different signatures. One family.</h4>
          <p>A one-of-a-kind {shape.toLowerCase()} made from {n} signature{n === 1 ? '' : 's'}, printed on canvas and ready to hang.</p>
          <div className="sigrow">
            {signed.map((m) => <Signature key={m.id} sig={m.sig} color={m.color} className="sigchip" />)}
          </div>
          <div className="plaque">
            <Logo />
            <div className="pc"><b>{title}</b><span>{shape} · Eid Al Etihad 55 · {date}</span></div>
          </div>
        </div>
      </div>
    </View>
  );
}
