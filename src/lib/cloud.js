import { createClient } from '@supabase/supabase-js';

/**
 * Saves each family's session to Supabase: one row in `families` plus the
 * artwork and signature PNGs in the `artworks` storage bucket.
 *
 * Sessions are queued in IndexedDB first and uploaded from there, so a kiosk
 * that loses its connection keeps them and retries when it comes back online.
 * Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY nothing is saved.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const BUCKET = 'artworks';
const RETRY_MS = 60000;

const supabase = URL_ && KEY ? createClient(URL_, KEY, { auth: { persistSession: false } }) : null;
export const cloudEnabled = !!supabase;

export const artworkPath = (id) => `${id}/artwork.png`;

/**
 * Public link to a stored file. The bucket can't be listed, so the session id keeps it private.
 * With `download` (a file name) the link makes the browser save the file instead of showing it.
 */
export const publicUrl = (path, download) =>
  supabase.storage.from(BUCKET).getPublicUrl(path, download ? { download } : undefined).data.publicUrl;

// Resolves once a session's upload has finished (it may still be queued offline)
const saved = new Map();
function waiter(id) {
  if (!saved.has(id)) {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    saved.set(id, { promise, resolve });
  }
  return saved.get(id);
}
export const whenSaved = (id) => waiter(id).promise;

// --- tiny IndexedDB queue ----------------------------------------------------

const open = () => new Promise((res, rej) => {
  const r = indexedDB.open('signature-kiosk', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('pending', { keyPath: 'row.id' });
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});

async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction('pending', mode);
    const out = fn(t.objectStore('pending'));
    t.oncomplete = () => res(out.result);
    t.onerror = () => rej(t.error);
  });
}

// --- upload ------------------------------------------------------------------

// Retries must be idempotent: an object or row already saved counts as success.
const isDuplicate = (e) => e && (e.statusCode === '409' || e.code === '23505' || /exists|duplicate/i.test(e.message));

async function upload({ row, files }) {
  for (const [path, blob] of Object.entries(files)) {
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/png' });
    if (error && !isDuplicate(error)) throw error;
  }
  const { error } = await supabase.from('families').insert(row);
  if (error && !isDuplicate(error)) throw error;
}

let flushing = false, again = false;
/** Upload every queued session; failures stay queued for the next attempt. */
export async function flush() {
  if (!supabase || !navigator.onLine) return;
  // a session queued mid-flush is picked up by another pass rather than waiting for the timer
  if (flushing) { again = true; return; }
  flushing = true;
  try {
    do {
      again = false;
      const pending = await tx('readonly', (s) => s.getAll());
      for (const item of pending) {
        try {
          await upload(item);
          await tx('readwrite', (s) => s.delete(item.row.id));
          waiter(item.row.id).resolve();
        } catch (e) {
          console.warn('Supabase upload failed, will retry', e);
        }
      }
    } while (again);
  } finally {
    flushing = false;
  }
}

/** Queue a finished session and try to upload it straight away. */
export async function saveSession(row, files) {
  if (!supabase) return;
  await tx('readwrite', (s) => s.put({ row, files }));
  flush();
}

if (supabase) {
  window.addEventListener('online', flush);
  setInterval(flush, RETRY_MS);
  flush();
}
