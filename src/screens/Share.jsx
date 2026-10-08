import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { INK, PALETTES } from '../data';
import { useKiosk } from '../KioskContext';
import { Art, ArtContent } from '../components/Art';
import { View } from '../components/View';
import { downloadBlob, renderArtPNG } from '../lib/render';
import { artworkPath, cloudEnabled, publicUrl, whenSaved } from '../lib/cloud';

export default function Share() {
  const { art, pal, title, surname, reset } = useKiosk();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [link, setLink] = useState(null);
  const P = PALETTES[pal];
  const fileName = `${(surname.trim() || 'family').replace(/\s+/g, '-').toLowerCase()}-signature-artwork.png`;

  // QR code to the uploaded artwork, shown once its upload has finished
  useEffect(() => {
    if (!cloudEnabled) return;
    let live = true;
    whenSaved(art.id).then(() => live && setLink(publicUrl(artworkPath(art.id))));
    return () => { live = false; };
  }, [art.id]);

  const run = async (fn) => {
    setBusy(true); setStatus('');
    try { await fn(await renderArtPNG(art, P, title)); }
    catch (e) { if (e.name !== 'AbortError') setStatus(`Something went wrong: ${e.message}`); }
    finally { setBusy(false); }
  };

  const download = () => run(async (blob) => {
    downloadBlob(blob, fileName);
    setStatus('Saved to downloads');
  });

  const share = () => run(async (blob) => {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title, text: 'Our AI Family Signature Artwork · Eid Al Etihad 55' });
      setStatus('Shared');
    } else {
      downloadBlob(blob, fileName);
      setStatus("Sharing isn't available on this device, so the image was downloaded instead.");
    }
  });

  return (
    <View
      en="Treasure & share" ar="احتفظوا بها وشاركوها"
      foot={<>
        <span className="note">Thank you for celebrating Eid Al Etihad with us.</span>
        <button className="btn accent" onClick={reset}>Finish · إنهاء</button>
      </>}
    >
      <div className="room">
        <div className="scene">
          <svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" aria-label="Artwork hanging in a living room">
            <rect width="600" height="420" fill="#D6D9E3" />
            <rect y="330" width="600" height="90" fill="#E5E0CE" />
            <line x1="0" y1="330" x2="600" y2="330" stroke={INK} strokeWidth="1.5" />
            <rect x="208" y="34" width="184" height="230" fill="#FBF8EC" stroke={INK} strokeWidth="2" />
            <rect x="220" y="46" width="160" height="206" fill="#F1EDD8" />
            <g transform="translate(220 69) scale(0.4)"><ArtContent art={art} pal={P} /></g>
            <rect x="170" y="290" width="260" height="44" fill="#A86744" stroke={INK} strokeWidth="1.5" />
            <rect x="186" y="334" width="10" height="26" fill="#A86744" />
            <rect x="404" y="334" width="10" height="26" fill="#A86744" />
            <path d="M460 330 L470 280 L500 280 L510 330Z" fill="#326A82" stroke={INK} strokeWidth="1.5" />
            <g fill="#80935A" stroke={INK} strokeWidth="1.2">
              <ellipse cx="470" cy="250" rx="12" ry="34" transform="rotate(-20 470 250)" />
              <ellipse cx="500" cy="246" rx="12" ry="36" transform="rotate(18 500 246)" />
              <ellipse cx="486" cy="236" rx="11" ry="40" />
            </g>
            <path d="M120 330 V180 M100 180 H140 L130 150 H110Z" fill="#F6D27A" stroke={INK} strokeWidth="1.5" />
            <rect x="250" y="270" width="40" height="20" fill="#C8685A" stroke={INK} strokeWidth="1.2" />
            <rect x="300" y="276" width="56" height="14" fill="#F3EED6" stroke={INK} strokeWidth="1.2" />
          </svg>
        </div>
        <div className="phone">
          {link ? (
            <div className="qr">
              <QRCodeSVG value={link} size={150} marginSize={2} fgColor={INK} bgColor="#FFFFFF" title="Scan to download your artwork" />
              <small>Scan with your phone to download<br />امسحوا الرمز للتحميل</small>
            </div>
          ) : (
            <div className="mini"><Art art={art} pal={P} lite /></div>
          )}
          <b>{title}</b>
          <small>{cloudEnabled && !link ? 'Preparing your download link…' : 'Keep a digital copy of your artwork'}</small>
          <div className="acts">
            <button className="btn primary" disabled={busy} onClick={download}>Download</button>
            <button className="btn" disabled={busy} onClick={share}>Share</button>
            <button className="btn" disabled={busy} onClick={() => window.print()}>Print again</button>
          </div>
          {status && <small aria-live="polite">{status}</small>}
        </div>
      </div>
    </View>
  );
}
