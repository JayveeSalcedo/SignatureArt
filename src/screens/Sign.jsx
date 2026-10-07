import { MAX_MEMBERS } from '../data';
import { useKiosk } from '../KioskContext';
import { SignaturePad } from '../components/SignaturePad';
import { View } from '../components/View';

function Pad({ m, canRemove }) {
  const { updateMember, removeMember } = useKiosk();
  const empty = !m.strokes.length;
  return (
    <div className={`pad${m.sig ? ' signed' : ''}`}>
      <div className="who">
        <input
          className="who-name" value={m.label} placeholder={m.role} maxLength={24} aria-label="Name"
          onChange={(e) => updateMember(m.id, { label: e.target.value })}
        />
        {m.sig && (
          <span className="ok" aria-label="Signed">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="3"><path d="M5 12l5 5 9-10" /></svg>
          </span>
        )}
        <button className="mini" disabled={empty} onClick={() => updateMember(m.id, { strokes: m.strokes.slice(0, -1) })}>Undo</button>
        <button className="mini" disabled={empty} onClick={() => updateMember(m.id, { strokes: [] })}>Clear</button>
        {canRemove && (
          <button className="mini" aria-label="Remove family member" onClick={() => removeMember(m.id)}>✕</button>
        )}
      </div>
      <div className="padarea">
        <SignaturePad
          strokes={m.strokes} color={m.color} label={`Signature pad for ${m.label || m.role}`}
          onChange={(strokes) => updateMember(m.id, { strokes })}
        />
        <span className="base" />
        {empty && <span className="ph">Sign here · وقّع هنا</span>}
      </div>
    </div>
  );
}

export default function Sign() {
  const { members, addMember, surname, setSurname, go } = useKiosk();
  const signed = members.filter((m) => m.sig).length;

  return (
    <View
      cls="sign" en="Everyone signs" ar="الجميع يوقّع"
      foot={<>
        <button className="btn" onClick={() => go('choose')}>Back</button>
        <span className="note">{signed} of {members.length} signed · Up to {MAX_MEMBERS} signatures per artwork</span>
        <button className="btn accent" disabled={!signed} onClick={() => go('create')}>Create our artwork · اصنع لوحتنا</button>
      </>}
    >
      <div className="vbody scroll">
        <label className="famname">
          <span>Family name · اسم العائلة</span>
          <input value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="e.g. Al Mansoori" maxLength={32} />
        </label>
        <div className="pads">
          {members.map((m) => <Pad key={m.id} m={m} canRemove={members.length > 1} />)}
          {members.length < MAX_MEMBERS && (
            <button className="pad add" onClick={addMember}>+ Add family member · أضف فرداً</button>
          )}
        </div>
      </div>
    </View>
  );
}
