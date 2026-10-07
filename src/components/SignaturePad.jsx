import { useCallback, useEffect, useRef } from 'react';
import { PEN, strokeD } from '../lib/signature';

/**
 * Touch / mouse / stylus drawing surface. Strokes are arrays of [x, y] points in
 * CSS pixels; `onChange` receives the full stroke list after each stroke ends.
 */
export function SignaturePad({ strokes, color, onChange, label }) {
  const cv = useRef(null);
  const cur = useRef(null);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const paint = useCallback(() => {
    const c = cv.current;
    if (!c) return;
    const g = c.getContext('2d'), dpr = window.devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, c.width / dpr, c.height / dpr);
    g.strokeStyle = color; g.lineWidth = PEN; g.lineCap = g.lineJoin = 'round';
    const all = cur.current ? [...strokesRef.current, cur.current] : strokesRef.current;
    all.forEach((s) => g.stroke(new Path2D(strokeD(s))));
  }, [color]);

  useEffect(() => {
    const c = cv.current;
    const resize = () => {
      const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      paint();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => ro.disconnect();
  }, [paint]);

  useEffect(paint, [strokes, paint]);

  const pt = (e) => {
    const r = cv.current.getBoundingClientRect();
    return [+(e.clientX - r.left).toFixed(1), +(e.clientY - r.top).toFixed(1)];
  };

  const down = (e) => {
    e.preventDefault();
    cv.current.setPointerCapture(e.pointerId);
    cur.current = [pt(e)];
    paint();
  };
  const move = (e) => {
    if (!cur.current) return;
    const events = e.nativeEvent.getCoalescedEvents ? e.nativeEvent.getCoalescedEvents() : [e];
    (events.length ? events : [e]).forEach((ev) => cur.current.push(pt(ev)));
    paint();
  };
  const up = () => {
    if (!cur.current) return;
    const s = cur.current;
    cur.current = null;
    onChange([...strokesRef.current, s]);
  };

  return (
    <canvas
      ref={cv} className="padcanvas" aria-label={label}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
    />
  );
}
