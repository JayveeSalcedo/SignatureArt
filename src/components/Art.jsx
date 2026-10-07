import { memo, useId, useMemo } from 'react';
import { DEMO_MEMBERS, FF } from '../data';
import { SHAPES } from '../lib/shapes';
import { itemStyle, layout, memberOf, sigScale } from '../lib/layout';

/**
 * Inner contents of an artwork (no <svg> wrapper) so it can also be nested,
 * e.g. inside the living-room scene. `art` = { design, members, items }.
 */
export const ArtContent = memo(function ArtContent({ art, pal, lite = false, reveal = false }) {
  const uid = useId().replace(/:/g, '');
  const { design, members, items } = art;
  const sh = SHAPES[design];
  const N = items.length;

  return (
    <>
      {/* each drawn signature is defined once and reused with <use> */}
      <defs>
        {members.map((m, fi) => m.kind === 'sig' && (
          <path
            key={fi} id={`${uid}m${fi}`} d={m.sig.d} fill="none" stroke="currentColor"
            strokeWidth={m.sig.sw} strokeLinecap="round" strokeLinejoin="round"
          />
        ))}
      </defs>
      <g fill={pal.c[0]} opacity=".07">
        {sh.d.map((d, i) => <path key={i} d={d} />)}
      </g>
      {items.map((it, i) => {
        if (lite && it.ti >= 6) return null;
        const { col, op } = itemStyle(it, i, pal);
        const m = memberOf(members, it.fi);
        const style = reveal ? { animationDelay: `${((i / N) * 3.1).toFixed(2)}s` } : undefined;
        const t = `translate(${it.x} ${it.y}) rotate(${it.ang})`;
        if (m.kind === 'sig') {
          return (
            <use
              key={i} href={`#${uid}m${it.fi}`} color={col} opacity={op} style={style}
              transform={`${t} scale(${+sigScale(m.sig, it.size).toFixed(3)})`}
            />
          );
        }
        return (
          <g key={i} transform={t}>
            <text
              textAnchor="middle" dominantBaseline="central"
              fontFamily={FF[m.script]} fontWeight="700" fontSize={it.size}
              fill={col} fillOpacity={op} style={style}
            >
              {m.name}
            </text>
          </g>
        );
      })}
      {sh.over.map((o, i) => (
        <path key={`o${i}`} d={o.d} fill={o.fill} stroke={o.stroke} strokeWidth={o.stroke ? 1 : undefined} />
      ))}
    </>
  );
});

/** A signature calligram as a standalone SVG. */
export const Art = memo(function Art({ art, pal, lite = false, reveal = false }) {
  return (
    <svg
      viewBox="0 0 400 400" className={reveal ? 'reveal' : undefined}
      role="img" aria-label={`${SHAPES[art.design].en} artwork made of family signatures`}
    >
      <ArtContent art={art} pal={pal} lite={lite} reveal={reveal} />
    </svg>
  );
});

/** Example artwork built from a sample family's typed names (thumbnails, welcome screen). */
export function DemoArt({ design, pal, lite = true }) {
  const art = useMemo(() => ({
    design,
    members: DEMO_MEMBERS,
    items: layout(design, DEMO_MEMBERS, SHAPES[design].seed, `demo:${design}`),
  }), [design]);
  return <Art art={art} pal={pal} lite={lite} />;
}
