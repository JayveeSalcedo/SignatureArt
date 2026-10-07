import { PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { DemoArt } from '../components/Art';
import { Logo } from '../components/Logo';
import { View } from '../components/View';

export default function Attract() {
  const { go } = useKiosk();
  return (
    <View cls="attract" onClick={() => go('choose')}>
      <svg className="bgshape" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M0 0 H660 C540 60 480 220 560 330 C640 430 640 520 420 660 C260 760 90 880 0 1000Z" fill="#C9CBD8" />
      </svg>
      <div className="hero-art"><DemoArt design="falcon" pal={PALETTES[0]} /></div>
      <div className="hero-art2"><DemoArt design="tree" pal={PALETTES[1]} /></div>
      <div className="lockup">
        <Logo />
        <div className="comp">
          <span className="a">لوحة توقيع العائلة</span>
          <span className="e">AI Family Signature Artwork</span>
          <span className="s">Sign together. Create together.</span>
        </div>
      </div>
      <button className="btn start" onClick={(e) => { e.stopPropagation(); go('choose'); }}>
        Touch to begin · المس للبدء
      </button>
    </View>
  );
}
