import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IDLE_MS, INKS, MAX_MEMBERS, ROLES } from './data';
import { normalize } from './lib/signature';

/**
 * Kiosk session state: which screen is showing, the chosen design and colour
 * story, the family name, each member's drawn signature, and the generated art.
 */

const Ctx = createContext(null);
export const useKiosk = () => useContext(Ctx);

export const FLOW = ['attract', 'choose', 'sign', 'create', 'preview', 'print', 'home', 'share'];

let nextId = 1;
const newMember = (i) => ({ id: nextId++, role: ROLES[i] || `Member ${i + 1}`, label: '', color: INKS[i % INKS.length], strokes: [], sig: null });
const freshMembers = () => ROLES.map((_, i) => newMember(i));

export function KioskProvider({ children }) {
  const [step, setStep] = useState('attract');
  const [design, setDesign] = useState(null);
  const [pal, setPal] = useState(0);
  const [surname, setSurname] = useState('');
  const [members, setMembers] = useState(freshMembers);
  const [art, setArt] = useState(null); // { design, members, items }

  const reset = useCallback(() => {
    setStep('attract'); setDesign(null); setPal(0); setSurname('');
    setMembers(freshMembers()); setArt(null);
  }, []);

  const updateMember = useCallback((id, patch) => {
    setMembers((ms) => ms.map((m) => {
      if (m.id !== id) return m;
      const n = { ...m, ...patch };
      if ('strokes' in patch) n.sig = normalize(patch.strokes);
      return n;
    }));
  }, []);

  const addMember = useCallback(() => {
    setMembers((ms) => (ms.length >= MAX_MEMBERS ? ms : [...ms, newMember(ms.length)]));
  }, []);

  const removeMember = useCallback((id) => {
    setMembers((ms) => (ms.length <= 1 ? ms : ms.filter((m) => m.id !== id)));
  }, []);

  // Idle timeout: a walk-away family's session is cleared for the next visitors
  useEffect(() => {
    if (step === 'attract') return;
    let t;
    const arm = () => { clearTimeout(t); t = setTimeout(reset, IDLE_MS); };
    arm();
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
    };
  }, [step, reset]);

  const title = surname.trim() ? `The ${surname.trim()} Family` : 'Our Family';

  const value = useMemo(() => ({
    step, go: setStep, reset,
    design, setDesign, pal, setPal, surname, setSurname, title,
    members, updateMember, addMember, removeMember,
    art, setArt,
  }), [step, reset, design, pal, surname, title, members, updateMember, addMember, removeMember, art]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
