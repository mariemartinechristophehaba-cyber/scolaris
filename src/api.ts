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
let lectureSeule = false; let nonPayee = false;
export const poserLectureSeule = (v: boolean, attente = false) => { lectureSeule = v; nonPayee = attente; };
export function message(e: any): string {
  const m = String(e?.message || e || 'Erreur');
  if (lectureSeule && /row-level security|permission denied|non autorisée/i.test(m)) return nonPayee ? 'Votre école n’est pas encore activée : payez votre abonnement pour enregistrer' : 'Abonnement terminé : renouvelez-le pour continuer à enregistrer';
  for (const [r, t] of TRAD) if (r.test(m)) return t;
  return m;
}

async function jeton() {
  if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
    let r: Response | null = null;
    try {
      r = await fetch(`${SUPA}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
    } catch { /* hors connexion : on garde la session, elle sera renouvelée au retour du réseau */ }
    if (r) { if (r.ok) poser(await r.json()); else if (r.status >= 400 && r.status < 500) poser(null); }
  }
  return session?.access_token || ANON;
}

// ---- Hors connexion ----
// Chaque lecture réussie est gardée sur le téléphone. Sans réseau, l'application affiche la dernière copie.
const CACHE_D = 'scolaris-donnees-v1';
let hors: { depuis: number } | null = null;
const abonnesR = new Set<() => void>();
const signaler = (v: { depuis: number } | null) => { if (!!v !== !!hors) { hors = v; abonnesR.forEach((f) => f()); } else hors = v; };
export const horsLigne = () => hors;
export const surReseau = (f: () => void) => { abonnesR.add(f); return () => { abonnesR.delete(f); }; };
const lisible = (url: string, init: RequestInit) => (!init.method || init.method === 'GET') ? url.startsWith('/rest/v1/') : url === '/rest/v1/rpc/demarrage';
const cleCache = (url: string, init: RequestInit) => `https://cache.scolaris/${session?.user?.id || 'anon'}${url}${init.method === 'POST' ? '#' + (init.body || '') : ''}`;
async function garder(cle: string, txt: string) { try { const c = await caches.open(CACHE_D); await c.put(cle, new Response(txt, { headers: { 'x-quand': String(Date.now()) } })); } catch { /* stockage indisponible */ } }
async function reprendre(cle: string) { try { const c = await caches.open(CACHE_D); const r = await c.match(cle); if (!r) return null; return { txt: await r.text(), quand: Number(r.headers.get('x-quand')) || Date.now() }; } catch { return null; } }
export async function viderCopies() { try { await caches.delete(CACHE_D); } catch { /* ignoré */ } }

async function appel(url: string, init: RequestInit = {}) {
  const t = await jeton();
  const h: any = { apikey: ANON, Authorization: `Bearer ${t}`, ...(init.headers || {}) };
  if (!(init.body instanceof Blob) && init.body && !h['Content-Type']) h['Content-Type'] = 'application/json';
  const lit = lisible(url, init); const cle = lit ? cleCache(url, init) : '';
  let r: Response;
  try {
    const ac = new AbortController(); const minuteur = setTimeout(() => ac.abort(), lit ? 20000 : 45000);
    r = await fetch(SUPA + url, { ...init, headers: h, signal: init.signal || ac.signal }).finally(() => clearTimeout(minuteur));
  } catch (err) {
    const copie = lit ? await reprendre(cle) : null;
    signaler({ depuis: copie?.quand || hors?.depuis || Date.now() });
    if (copie) return copie.txt ? JSON.parse(copie.txt) : null;
    throw new Error(lit ? 'Pas de connexion, et cette page n’a pas encore été ouverte sur ce téléphone' : 'Connexion impossible. Vérifiez votre réseau');
  }
  if (hors) signaler(null);
  const txt = await r.text();
  if (lit && r.ok) garder(cle, txt);
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
    const r = await appel('/functions/v1/inscription-ecole', { method: 'POST', body: JSON.stringify({ email: email.trim(), mot_de_passe: mdp, data: { ...data, source: sourceArrivee() } }) });
    if (r?.access_token) { poser(r); return true; }
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
  deconnexion: async () => { try { await appel('/auth/v1/logout', { method: 'POST' }); } catch { /* session déjà expirée */ } poser(null); viderCopies(); viderAttente(); },
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

// D'où vient le visiteur (lien ?src=… de chaque réseau, sinon le site d'arrivée). Rien de personnel : seulement le réseau.
const RESEAUX: [RegExp, string][] = [[/tiktok/, 'tiktok'], [/youtube|youtu\.be/, 'youtube'], [/facebook|fb\.|fbclid/, 'facebook'], [/instagram/, 'instagram'], [/whatsapp|wa\.me/, 'whatsapp'], [/google\./, 'google'], [/linkedin|lnkd/, 'linkedin'], [/twitter|t\.co|x\.com/, 'twitter']];
const versReseau = (t: string) => { const x = (t || '').toLowerCase(); if (!x) return ''; const r = RESEAUX.find(([re]) => re.test(x)); return r ? r[1] : 'autre'; };
export function sourceArrivee(): string {
  try {
    const deja = localStorage.getItem('scolaris_src'); if (deja) return deja;
    const q = new URLSearchParams(location.search);
    let s = versReseau(q.get('src') || q.get('utm_source') || '') || (q.get('fbclid') ? 'facebook' : '');
    if (!s) { const ref = document.referrer && !document.referrer.includes(location.host) ? document.referrer : ''; s = ref ? versReseau(new URL(ref).hostname) : 'direct'; }
    localStorage.setItem('scolaris_src', s); return s;
  } catch { return 'direct'; }
}
// Une visite par appareil et par jour, comptée par réseau.
export function noterArrivee() {
  try {
    const src = sourceArrivee(); const j = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('scolaris_vu') === j) return;
    localStorage.setItem('scolaris_vu', j);
    appel('/rest/v1/rpc/noter_arrivee', { method: 'POST', keepalive: true, body: JSON.stringify({ p_source: src }) }).catch(() => {});
  } catch { /* ignoré */ }
}

// ---- Paiements saisis sans réseau ----
// Gardés sur le téléphone puis envoyés dès le retour du réseau. Chaque paiement a son identifiant fixé dès la saisie :
// s'il a déjà été reçu (réponse perdue), le renvoi ne crée pas de doublon.
const CLE_A = 'scolaris_attente';
export type Attente = { id: string; corps: any; valider: boolean; eleve: string; montant: number; cree: number; erreur?: string };
export const lireAttente = (): Attente[] => { try { return JSON.parse(localStorage.getItem(CLE_A) || '[]'); } catch { return []; } };
const ecrireAttente = (l: Attente[]) => { try { localStorage.setItem(CLE_A, JSON.stringify(l)); } catch { /* plein */ } abonnesR.forEach((f) => f()); };
function viderAttente() { try { localStorage.removeItem(CLE_A); } catch { /* ignoré */ } }
export function mettreEnAttente(a: Attente) { ecrireAttente([...lireAttente(), a]); }
export function retirerAttente(id: string) { ecrireAttente(lireAttente().filter((x) => x.id !== id)); }
let envoiEnCours = false;
export async function envoyerAttente(): Promise<number> {
  if (envoiEnCours || !session?.access_token) return 0;
  const l = lireAttente(); if (!l.length) return 0;
  envoiEnCours = true; let n = 0;
  try {
    for (const a of l) {
      try {
        try { await db.ins('paiements', a.corps); } catch (e: any) { if (!/paiements_pkey/.test(String(e?.message))) throw e; }
        if (a.valider) await db.upd(`paiements?id=eq.${a.id}&statut=eq.en_attente`, { statut: 'valide' });
        retirerAttente(a.id); n++;
      } catch (e: any) {
        if (horsLigne()) break; // toujours pas de réseau : on réessaiera
        ecrireAttente(lireAttente().map((x) => (x.id === a.id ? { ...x, erreur: e.message } : x)));
      }
    }
  } finally { envoiEnCours = false; }
  return n;
}
if (typeof window !== 'undefined') {
  addEventListener('online', () => { envoyerAttente(); });
  setInterval(() => { if (lireAttente().some((x) => !x.erreur)) envoyerAttente(); }, 30000);
}
