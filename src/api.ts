export const SUPA = 'https://hezntpvvsukdlehpbqzs.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlem50cHZ2c3VrZGxlaHBicXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1NTc3OTgsImV4cCI6MjEwOTEzMzc5OH0.aAeqyLr8PY2MlGIP09cLSvJSive3YSTTkFW4zuh0Zk4';

const CLE = 'scolaris_session';
function lire() { try { return JSON.parse(localStorage.getItem(CLE) || 'null'); } catch { return null; } }
let session: any = lire();
const abonnes = new Set<() => void>();
function poser(s: any) {
  session = s;
  try { s ? localStorage.setItem(CLE, JSON.stringify(s)) : localStorage.removeItem(CLE); } catch { /* navigation privée */ }
  abonnes.forEach((f) => f());
}
export const surSession = (f: () => void) => { abonnes.add(f); return () => { abonnes.delete(f); }; };
export const getSession = () => session;

const TRAD: [RegExp, string][] = [
  [/invalid login/i, 'Identifiants incorrects'],
  [/email not confirmed/i, 'Confirmez votre adresse e-mail avant de vous connecter'],
  [/already registered/i, 'Un compte existe déjà avec cette adresse e-mail'],
  [/password should be/i, 'Le mot de passe doit contenir au moins 6 caractères'],
  [/rate limit/i, 'Trop de tentatives, réessayez dans quelques minutes'],
  [/too large|exceeded the maximum/i, 'Fichier trop lourd : 10 Mo maximum'],
  [/mime type|invalid_mime/i, 'Format non accepté : envoyez une photo ou un PDF'],
  [/profils_telephone_key/i, 'Ce numéro de téléphone est déjà utilisé'],
  [/eleves_etablissement_id_matricule/i, 'Ce matricule existe déjà'],
  [/paiement_reference_unique/i, 'Cette référence de transaction a déjà été enregistrée'],
  [/classes_etablissement_id_annee/i, 'Cette classe existe déjà'],
  [/row-level security|permission denied/i, 'Action non autorisée pour votre rôle'],
  [/failed to fetch|networkerror/i, 'Connexion impossible. Vérifiez votre réseau'],
];
let lectureSeule = false;
export const poserLectureSeule = (v: boolean) => { lectureSeule = v; };
export function message(e: any): string {
  const m = String(e?.message || e || 'Erreur');
  if (lectureSeule && /row-level security|permission denied|non autorisée/i.test(m)) return 'Abonnement terminé : renouvelez-le pour continuer à enregistrer';
  for (const [r, t] of TRAD) if (r.test(m)) return t;
  return m;
}

async function jeton() {
  if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    const r = await fetch(`${SUPA}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (r.ok) poser(await r.json()); else poser(null);
  }
  return session?.access_token || ANON;
}

async function appel(url: string, init: RequestInit = {}) {
  const t = await jeton();
  const h: any = { apikey: ANON, Authorization: `Bearer ${t}`, ...(init.headers || {}) };
  if (!(init.body instanceof Blob) && init.body && !h['Content-Type']) h['Content-Type'] = 'application/json';
  const r = await fetch(SUPA + url, { ...init, headers: h });
  const txt = await r.text();
  let d: any = null;
  try { d = txt ? JSON.parse(txt) : null; } catch { d = txt; }
  if (!r.ok) throw new Error(message(d?.message || d?.msg || d?.error_description || d?.error || `Erreur ${r.status}`));
  return d;
}

export const equipeApi = (b: any) => appel('/functions/v1/equipe', { method: 'POST', body: JSON.stringify(b) });

// Réduit les photos avant l'envoi : un justificatif reste lisible et prend dix fois moins de place.
async function compresser(f: File, max = 1600, q = 0.72): Promise<File> {
  if (!f.type.startsWith('image/') || f.type === 'image/gif' || f.size < 250 * 1024) return f;
  try {
    const img = await createImageBitmap(f, { imageOrientation: 'from-image' } as any);
    const r = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
    const g = c.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); img.close();
    const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', q));
    return b && b.size < f.size ? new File([b], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : f;
  } catch { return f; }
}

export const db = {
  get: (q: string) => appel(`/rest/v1/${q}`),
  // Supabase coupe à 1000 lignes : on lit par pages pour que les totaux restent exacts. La requête doit avoir un ordre stable.
  tout: async (q: string) => { const N = 1000; let r: any[] = []; for (let o = 0; ; o += N) { const l = await appel(`/rest/v1/${q}${q.includes('?') ? '&' : '?'}limit=${N}&offset=${o}`); r = r.concat(l); if (l.length < N) return r; } },
  ins: (t: string, b: any) => appel(`/rest/v1/${t}`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(b) }),
  ups: (t: string, b: any, cols: string) => appel(`/rest/v1/${t}?on_conflict=${cols}`, { method: 'POST', headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify(b) }),
  upd: (q: string, b: any) => appel(`/rest/v1/${q}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(b) }),
  del: (q: string) => appel(`/rest/v1/${q}`, { method: 'DELETE' }),
  rpc: (f: string, a: any = {}) => appel(`/rest/v1/rpc/${f}`, { method: 'POST', body: JSON.stringify(a) }),
  poserLogo: async (etab: string, brut: File) => { const f = await compresser(brut, 512, 0.85); const chemin = `${etab}/logo-${Date.now()}`; await appel(`/storage/v1/object/logos/${chemin}`, { method: 'POST', headers: { 'Content-Type': f.type || 'image/jpeg' }, body: f }); await appel('/rest/v1/rpc/definir_logo', { method: 'POST', body: JSON.stringify({ p_etab: etab, p_chemin: chemin }) }); return chemin; },
  voirFichier: async (chemin: string) => { const r = await appel(`/storage/v1/object/sign/justificatifs/${chemin}`, { method: 'POST', body: JSON.stringify({ expiresIn: 300 }) }); return `${SUPA}/storage/v1${r.signedURL}`; },
  fichier: async (etab: string, brut: File) => {
    const f = await compresser(brut);
    const chemin = `${etab}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, '_')}`;
    await appel(`/storage/v1/object/justificatifs/${chemin}`, { method: 'POST', headers: { 'Content-Type': f.type || 'application/octet-stream' }, body: f });
    return chemin;
  },
};

export const auth = {
  connexion: async (id: string, mdp: string) => {
    if (id.includes('@')) {
      poser(await appel('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: id.trim(), password: mdp }) }));
    } else {
      poser(await appel('/functions/v1/connexion-telephone', { method: 'POST', body: JSON.stringify({ telephone: id, mot_de_passe: mdp }) }));
    }
  },
  inscription: async (email: string, mdp: string, data: any) => {
    const r = await appel(`/auth/v1/signup?redirect_to=${encodeURIComponent(location.origin + '/')}`, { method: 'POST', body: JSON.stringify({ email: email.trim(), password: mdp, data }) });
    if (r?.access_token) { poser(r); return true; }
    if (Array.isArray(r?.identities ?? r?.user?.identities) && !(r?.identities ?? r?.user?.identities).length) throw new Error('Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez une autre adresse.');
    return false;
  },
  recuperation: async (id: string) => {
    const redirect = location.origin + '/';
    if (id.includes('@')) await appel(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirect)}`, { method: 'POST', body: JSON.stringify({ email: id.trim() }) });
    else await appel('/functions/v1/connexion-telephone', { method: 'POST', body: JSON.stringify({ action: 'recuperation', telephone: id, redirect }) });
  },
  nouveauMotDePasse: async (mdp: string) => { const u = await appel('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: mdp, data: { mdp_temporaire: false } }) }); if (session) poser({ ...session, user: u }); return u; },
  google: async () => {
    const s = await appel('/auth/v1/settings');
    if (!s?.external?.google) throw new Error('La connexion avec Google n\'est pas encore activée');
    location.href = `${SUPA}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(location.origin + '/')}`;
  },
  deconnexion: async () => { try { await appel('/auth/v1/logout', { method: 'POST' }); } catch { /* session déjà expirée */ } poser(null); },
  // Retour de lien e-mail ou Google : la session arrive dans l'adresse
  retour: async () => {
    const p = new URLSearchParams(location.hash.slice(1));
    const at = p.get('access_token');
    if (!at) return null;
    const type = p.get('type');
    const expires_at = Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + Number(p.get('expires_in') || 3600);
    poser({ access_token: at, refresh_token: p.get('refresh_token'), expires_at, user: null });
    const user = await appel('/auth/v1/user');
    poser({ ...session, user });
    history.replaceState(null, '', location.pathname);
    return type;
  },
};
