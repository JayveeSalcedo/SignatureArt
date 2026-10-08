import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

/**
 * Vercel function behind the /admin dashboard. It holds the Supabase service
 * role key (never sent to the browser) and only answers requests carrying the
 * shared ADMIN_PASSWORD.
 *
 * POST /api/admin  { action: 'list', q, from } | { action: 'get', id } | { action: 'delete', id } | { action: 'export' }
 */

const BUCKET = 'artworks';
const PAGE = 48;

const db = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function passwordOk(given) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

const actions = {
  async list({ q = '', from = 0 }) {
    let query = db.from('families')
      .select('id,family_name,title,design,palette,artwork_path,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1);
    const term = String(q).trim().replace(/[%_,()]/g, '');
    if (term) query = query.ilike('title', `%${term}%`);
    const { data, count, error } = await query;
    if (error) throw error;
    return { rows: data, total: count ?? 0 };
  },

  async get({ id }) {
    const { data, error } = await db.from('families').select('members').eq('id', id).single();
    if (error) throw error;
    return { members: data.members.map(({ strokes, ...m }) => m) };
  },

  async delete({ id }) {
    const { data, error } = await db.from('families').select('artwork_path,members').eq('id', id).single();
    if (error) throw error;
    const paths = [data.artwork_path, ...data.members.map((m) => m.image_path)];
    const { error: e1 } = await db.storage.from(BUCKET).remove(paths);
    if (e1) throw e1;
    const { error: e2 } = await db.from('families').delete().eq('id', id);
    if (e2) throw e2;
    return { ok: true };
  },

  async export() {
    const { data, error } = await db.from('families')
      .select('created_at,family_name,title,design,palette,members,artwork_path')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { rows: data.map(({ members, ...r }) => ({ ...r, members: members.map((m) => m.name) })) };
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!db) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not set on the server' });
  if (!passwordOk(req.headers['x-admin-password'])) return res.status(401).json({ error: 'Wrong password' });

  const { action, ...args } = req.body || {};
  const fn = actions[action];
  if (!fn) return res.status(400).json({ error: 'Unknown action' });
  try {
    res.status(200).json(await fn(args));
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
}
