// Appelé chaque jour par Vercel (crons) : une petite requête pour que la base Supabase gratuite ne se mette pas en pause.
const SUPA = 'https://hezntpvvsukdlehpbqzs.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlem50cHZ2c3VrZGxlaHBicXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTc3OTgsImV4cCI6MjEwOTEzMzc5OH0.aAeqyLr8PY2MlGIP09cLSvJSive3YSTTkFW4zuh0Zk4'; // clé publique, déjà présente dans l'application

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPA}/rest/v1/rpc/ping`, { method: 'POST', headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }, body: '{}' });
    res.status(r.ok ? 200 : 502).json({ ok: r.ok, statut: r.status, le: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ ok: false, erreur: String(e) });
  }
}
