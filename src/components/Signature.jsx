/** A normalized drawn signature rendered as a small standalone SVG. */
export function Signature({ sig, color, className }) {
  const pad = 0.12;
  const vb = `${-sig.w / 2 - pad} ${-0.5 - pad} ${sig.w + 2 * pad} ${1 + 2 * pad}`;
  return (
    <svg viewBox={vb} className={className} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d={sig.d} fill="none" stroke={color} strokeWidth={sig.sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
