import { useCallback, useEffect, useState } from 'react';
import { PALETTES } from '../data';
import { SHAPES } from '../lib/shapes';
import { downloadBlob } from '../lib/render';
import './admin.css';

/**
 * Staff dashboard: browse, search, download and delete saved family sessions.
 * Data comes from the /api/admin Vercel function, unlocked by a shared password.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const PW_KEY = 'admin-password';

const fileUrl = (path, download) =>
  `${URL_}/storage/v1/object/public/artworks/${path}${download ? `?download=${encodeURIComponent(download)}` : ''}`;

const store = {
  get: () => { try { return sessionStorage.getItem(PW_KEY) || ''; } catch { return ''; } },
  set: (v) => { try { v ? sessionStorage.setItem(PW_KEY, v) : sessionStorage.removeItem(PW_KEY); } catch { /* private mode */ } },
};

class Unauthorized extends Error {}

async function api(password, action, args = {}) {
  const r = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
    body: JSON.stringify({ action, ...args }),
  });
  const body = await r.json().catch(() => ({ error: `Server error (${r.status})` }));
  if (r.status === 401) throw new Unauthorized(body.error);
  if (!r.ok) throw new Error(body.error);
  return body;
}
const slug = (s) => (s || 'family').trim().replace(/\s+/g, '-').toLowerCase();
const when = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const designName = (k) => SHAPES[k]?.en || k;
const paletteName = (k) => PALETTES.find((p) => p.k === k)?.en || k;

export default function Admin() {
  const [password, setPassword] = useState(store.get);
  const lock = useCallback(() => { store.set(''); setPassword(''); }, []);

  if (!password) return <Shell><Login onUnlock={(pw) => { store.set(pw); setPassword(pw); }} /></Shell>;
  return <Dashboard password={password} lock={lock} />;
}

function Shell({ children, right }) {
  return (
    <div className="adm">
      <header className="adm-head">
        <h1>Signature Artwork · Dashboard</h1>
        {right}
      </header>
      {children}
    </div>
  );
}

function Login({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      await api(pw, 'list', { from: 0 });
      onUnlock(pw);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <form className="adm-login" onSubmit={submit}>
      <h2>Dashboard password</h2>
      <label>Password<input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? 'Checking…' : 'Open dashboard'}</button>
    </form>
  );
}

function Dashboard({ password, lock }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);

  // Any request rejected for a wrong/changed password sends staff back to the password screen
  const call = useCallback(async (action, args) => {
    try { return await api(password, action, args); }
    catch (e) { if (e instanceof Unauthorized) lock(); throw e; }
  }, [password, lock]);

  const load = useCallback(async (from, search) => {
    setLoading(true); setErr('');
    try {
      const { rows: data, total: count } = await call('list', { from, q: search });
      setRows((r) => (from ? [...r, ...data] : data));
      setTotal(count);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [call]);

  // Reload from the top when the search changes (debounced while typing)
  useEffect(() => {
    const t = setTimeout(() => load(0, q), 250);
    return () => clearTimeout(t);
  }, [q, load]);

  const exportCsv = async () => {
    let data;
    try { ({ rows: data } = await call('export')); } catch (e) { return setErr(e.message); }
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [['Date', 'Family name', 'Title', 'Design', 'Colours', 'Members', 'Artwork URL'].map(cell).join(',')];
    data.forEach((r) => lines.push([
      r.created_at, r.family_name, r.title, designName(r.design), paletteName(r.palette),
      r.members.join('; '), fileUrl(r.artwork_path),
    ].map(cell).join(',')));
    downloadBlob(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }), 'families.csv');
  };

  const removed = (id) => {
    setRows((r) => r.filter((x) => x.id !== id));
    setTotal((t) => t - 1);
    setOpen(null);
  };

  const right = <button className="btn" onClick={lock}>Lock</button>;

  return (
    <Shell right={right}>
      <div className="adm-bar">
        <input type="search" placeholder="Search family name…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search family name" />
        <span className="count">{total} {total === 1 ? 'family' : 'families'}</span>
        <button className="btn" onClick={exportCsv}>Export CSV</button>
      </div>
      {err && <p className="err">{err}</p>}
      {!loading && !rows.length && <p className="msg">{q ? 'No families match that search.' : 'No sessions saved yet.'}</p>}
      <div className="adm-grid">
        {rows.map((r) => (
          <button key={r.id} className="adm-card" onClick={() => setOpen(r)}>
            <img src={fileUrl(r.artwork_path)} alt="" loading="lazy" />
            <b>{r.title}</b>
            <small>{designName(r.design)} · {paletteName(r.palette)}</small>
            <small>{when(r.created_at)}</small>
          </button>
        ))}
      </div>
      {rows.length < total && (
        <div className="adm-more">
          <button className="btn" disabled={loading} onClick={() => load(rows.length, q)}>{loading ? 'Loading…' : 'Load more'}</button>
        </div>
      )}
      {open && <Detail row={open} call={call} onClose={() => setOpen(null)} onDeleted={removed} />}
    </Shell>
  );
}

function Detail({ row, call, onClose, onDeleted }) {
  const [members, setMembers] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    call('get', { id: row.id }).then((d) => setMembers(d.members), (e) => setErr(e.message));
  }, [row.id, call]);

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const del = async () => {
    if (!window.confirm(`Delete ${row.title} and all its images? This can't be undone.`)) return;
    setBusy(true); setErr('');
    try {
      await call('delete', { id: row.id });
      onDeleted(row.id);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  const name = slug(row.family_name);

  return (
    <div className="adm-modal" onClick={onClose}>
      <div className="adm-panel" role="dialog" aria-modal="true" aria-label={row.title} onClick={(e) => e.stopPropagation()}>
        <button className="adm-x" onClick={onClose} aria-label="Close">✕</button>
        <img className="art" src={fileUrl(row.artwork_path)} alt={`Artwork for ${row.title}`} />
        <div className="info">
          <h2>{row.title}</h2>
          <dl>
            <dt>Family name</dt><dd>{row.family_name || '—'}</dd>
            <dt>Design</dt><dd>{designName(row.design)}</dd>
            <dt>Colours</dt><dd>{paletteName(row.palette)}</dd>
            <dt>Saved</dt><dd>{when(row.created_at)}</dd>
          </dl>
          <a className="btn primary" href={fileUrl(row.artwork_path, `${name}-signature-artwork.png`)}>Download artwork</a>
          <h3>Signatures</h3>
          {!members && !err && <p className="msg">Loading…</p>}
          <ul className="sigs">
            {members?.map((m, i) => (
              <li key={m.image_path}>
                <img src={fileUrl(m.image_path)} alt={`Signature of ${m.name}`} loading="lazy" />
                <span style={{ color: m.color }}>{m.name}</span>
                <a href={fileUrl(m.image_path, `${name}-signature-${i + 1}.png`)}>Download</a>
              </li>
            ))}
          </ul>
          {err && <p className="err">{err}</p>}
          <button className="btn danger" disabled={busy || !members} onClick={del}>{busy ? 'Deleting…' : 'Delete family'}</button>
        </div>
      </div>
    </div>
  );
}
