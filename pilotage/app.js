'use strict';
/* Pilotage — tableau de bord admin FixPro + Scolaris (lecture seule) */
const SB = 'https://hezntpvvsukdlehpbqzs.supabase.co';
const CLE = 'sb_publishable_Ej0MV2OXgjNRTF0aLpWmYg_t-Xxd0dd';
const LIEN = { fixpro: 'https://fixproguinee.com', scolaris: 'https://scolaris-murex.vercel.app/admin' };
const $app = document.getElementById('app');
const S = { session: null, data: null, page: 'accueil', per: 'tout', quoi: 'tous', err: '', charge: false, oeil: false, vu: null };

/* ---------- outils ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const F = n => Math.round(n || 0).toLocaleString('fr-FR').replace(/ | /g, ' ');
const court = n => n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',').replace(',0', '') + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' k' : String(Math.round(n));
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const D = s => new Date(s);
const jourCourt = d => `${d.getDate()} ${MOIS[d.getMonth()]}`;
const cleMois = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const cleJour = d => d.toISOString().slice(0, 10);
const ilYa = s => { const m = (Date.now() - D(s)) / 6e4; if (m < 1) return "à l'instant"; if (m < 60) return `il y a ${Math.round(m)} min`; const h = m / 60; if (h < 24) return `il y a ${Math.round(h)} h`; const j = h / 24; if (j < 2) return 'hier'; if (j < 7) return `il y a ${Math.round(j)} j`; return jourCourt(D(s)); };
const heure = d => `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
const pl = (n, s, p) => `${F(n)} ${n > 1 ? (p || s + 's') : s}`;
function store(k, v) { try { v === undefined ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function lire(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

/* ---------- icônes ---------- */
const I = {
  sante: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.3-9.2C1.4 8.4 3.6 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8C19.5 16.4 12 21 12 21z"/><path d="M3 12h4l2-3 3 6 2-3h7"/></svg>',
  usersI: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
  oeilI: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  badge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><path d="M12 3l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9L3.2 14.8l1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z"/></svg>',
  pieceI: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  bd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
  copie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/></svg>',
  sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  globe2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  cadenasI: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  fusee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/></svg>',
  accueil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>',
  argent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16"/><path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H16a3 3 0 0 1 0-6"/><circle cx="16.2" cy="13" r=".6" fill="currentColor"/></svg>',
  reseaux: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  activite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  reglages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.8l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.8v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  app: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M11 18h2"/></svg>',
  sortir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  maj: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5"/></svg>',
  ext: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  mail: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  cadenas: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/></svg>',
  oeil: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  bouclier: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12B76A" stroke-width="2.4"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  att: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#DC6803" stroke-width="2.2"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  rouge: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D92D20" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>',
  bleu: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2F5BF5" stroke-width="2.2"><path d="M4 12h16M12 4l8 8-8 8"/></svg>',
  vert: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#079455" stroke-width="2.4"><path d="m5 12 5 5 9-10"/></svg>',
};

/* ---------- marques (vrais logos) ---------- */
function B(k, z) {
  z = z || 32; const r = Math.round(z * .28), ic = Math.round(z * .58);
  const box = (bg, inner, bord) => `<span style="flex:none;width:${z}px;height:${z}px;border-radius:${r}px;background:${bg};display:inline-grid;place-items:center;${bord ? 'box-shadow:inset 0 0 0 1px #E7EBF3' : ''}">${inner}</span>`;
  const sv = (d, f, s) => `<svg viewBox="0 0 24 24" width="${s || ic}" height="${s || ic}"><path d="${d}" fill="${f}"/></svg>`;
  const txt = (bg, t, c) => box(bg, `<b style="color:${c || '#fff'};font-size:${Math.round(z * (t.length > 1 ? .36 : .44))}px;font-weight:700">${t}</b>`);
  switch (k) {
    case 'tiktok': return box('#000', `<svg viewBox="0 0 24 24" width="${ic}" height="${ic}" style="overflow:visible"><path d="${PA.tiktok}" fill="#25F4EE" transform="translate(-.9,-.6)"/><path d="${PA.tiktok}" fill="#FE2C55" transform="translate(.9,.6)"/><path d="${PA.tiktok}" fill="#fff"/></svg>`);
    case 'facebook': return box('#fff', sv(PA.facebook, '#0866FF', Math.round(z * .78)), 1);
    case 'instagram': return box('linear-gradient(45deg,#F58529,#DD2A7B 50%,#8134AF)', sv(PA.instagram, '#fff'));
    case 'whatsapp': return box('#25D366', sv(PA.whatsapp, '#fff'));
    case 'youtube': return box('#fff', sv(PA.youtube, '#FF0000', Math.round(z * .72)), 1);
    case 'orange': return box('#fff', sv(PA.orange, '#FF7900', Math.round(z * .7)), 1);
    case 'mtn': return box('#FFCB05', `<svg viewBox="0 0 1280 640" width="${Math.round(z * .8)}"><path d="${PA.mtn}" fill="#000"/></svg>`);
    case 'chariow': return txt('#6941C6', 'C');
    case 'fixpro': return `<img src="/fixpro.png" width="${z}" height="${z}" alt="FixPro" style="flex:none;display:inline-block;border-radius:${r}px;box-shadow:inset 0 0 0 1px #E7EBF3;background:#fff">`;
    case 'scolaris': return `<img src="/scolaris.png" width="${z}" height="${z}" alt="Scolaris" style="flex:none;display:inline-block;border-radius:${r}px">`;
    case 'google': return txt('#fff', 'G', '#4285F4').replace('display:inline-grid', 'box-shadow:inset 0 0 0 1px #E7EBF3;display:inline-grid');
    case 'linkedin': return txt('#0A66C2', 'in');
    case 'twitter': return txt('#000', 'X');
    case 'especes': return box('#ECFDF3', `<svg viewBox="0 0 24 24" width="${ic}" height="${ic}" fill="none" stroke="#067647" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>`);
    default: return box('#F2F4F7', `<svg viewBox="0 0 24 24" width="${ic}" height="${ic}" fill="none" stroke="#667085" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`);
  }
}
const SOURCES = { tiktok: ['TikTok', '#111'], facebook: ['Facebook', '#0866FF'], whatsapp: ['WhatsApp', '#25D366'], youtube: ['YouTube', '#FF0000'], instagram: ['Instagram', '#DD2A7B'], google: ['Google', '#4285F4'], linkedin: ['LinkedIn', '#0A66C2'], twitter: ['X (Twitter)', '#444'], direct: ['Direct', '#98A2B3'], autre: ['Autre', '#C0C7D4'] };
function moyen(m) {
  m = String(m || '').toLowerCase();
  if (m.includes('orange')) return ['orange', 'Orange Money'];
  if (m.includes('mtn') || m.includes('momo')) return ['mtn', 'MTN MoMo'];
  if (m.includes('chariow')) return ['chariow', 'Chariow'];
  if (m.includes('esp') || m.includes('cash')) return ['especes', 'Espèces'];
  return ['autre', m ? m.replace(/_/g, ' ') : 'Autre'];
}
const LOGO = z => `<img class="lg" src="/logo.svg" width="${z}" height="${z}" alt="" style="border-radius:${Math.round(z * .23)}px">`;
const WM = (sz, col) => `<span class="wm" style="font-size:${sz}px;color:${col}">P<i style="background-image:linear-gradient(180deg,#2EE59D 0 31%,${col} 31%)">i</i>lotage</span>`;

/* ---------- authentification (Supabase Auth, compte admin Scolaris) ---------- */
async function auth(corps, type) {
  const r = await fetch(`${SB}/auth/v1/token?grant_type=${type}`, { method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error_description || j.msg || j.message || 'Connexion impossible');
  const s = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email };
  S.session = s; store('pilotage_session', s); return s;
}
async function jeton() {
  if (!S.session) return null;
  if (Date.now() > S.session.exp - 60000) { try { await auth({ refresh_token: S.session.rt }, 'refresh_token'); } catch (e) { deconnexion(); return null; } }
  return S.session.at;
}
function deconnexion() {
  if (S.session) fetch(`${SB}/auth/v1/logout`, { method: 'POST', headers: { apikey: CLE, Authorization: 'Bearer ' + S.session.at } }).catch(() => {});
  S.session = null; S.data = null; store('pilotage_session'); store('pilotage_cache'); location.hash = ''; rendre();
}
async function charger(silence) {
  const t = await jeton(); if (!t) return rendre();
  if (!silence) { S.charge = true; rendre(); }
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/pilotage`, { method: 'POST', headers: { apikey: CLE, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: '{}' });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { deconnexion(); return; }
    if (!r.ok) {
      if (/pilotage|admin/i.test(j.message || '') || r.status === 403) { S.err = "Ce compte n'a pas accès à Pilotage."; deconnexion(); return; }
      throw new Error(j.message || 'Erreur ' + r.status);
    }
    S.data = j; S.vu = new Date(); S.err = ''; store('pilotage_cache', { d: j, t: Date.now() });
  } catch (e) { S.err = navigator.onLine ? 'Impossible de charger les chiffres : ' + e.message : 'Pas de connexion internet.'; }
  S.charge = false; rendre();
}

/* ---------- préparation des données ---------- */
function prep() {
  const d = S.data || {}; const fx = d.fixpro || {}; const sc = d.scolaris || {};
  const now = new Date(d.maintenant || Date.now());
  const pay = [];
  (fx.paiements || []).forEach(p => pay.push({ app: 'fixpro', date: D(p.date), gnf: +p.montant || 0, formule: `${cap(p.plan)} ${p.periode === 'year' ? 'annuel' : 'mensuel'}`, moyen: moyen(p.moyen), qui: p.tech || 'Technicien', expire: p.expire, source: null }));
  (sc.paiements || []).forEach(p => pay.push({ app: 'scolaris', date: D(p.date), gnf: +p.gnf || 0, fcfa: +p.fcfa || 0, formule: p.periode === 'an' ? 'Annuel' : p.periode === 'sms' ? 'Pack SMS' : 'Mensuel', moyen: moyen(p.moyen), qui: p.ecole, source: p.source }));
  pay.sort((a, b) => b.date - a.date);
  const filtreApp = x => S.quoi === 'tous' || x.app === S.quoi;
  const debut = S.per === 'tout' ? new Date(0) : new Date(now - (+S.per) * 864e5);
  const payA = pay.filter(filtreApp), payP = payA.filter(p => p.date >= debut);
  // visites par jour (90 j)
  const vis = {};
  if (S.quoi !== 'scolaris') (fx.visites_jour || []).forEach(v => { vis[v.jour] = (vis[v.jour] || 0) + v.n; });
  if (S.quoi !== 'fixpro') (sc.arrivees || []).forEach(v => { vis[v.jour] = (vis[v.jour] || 0) + v.n; });
  // sources (Scolaris : visites + écoles + argent ; FixPro : dès que le suivi est actif)
  const src = {};
  const add = (k, champ, n) => { k = SOURCES[k] ? k : 'autre'; src[k] = src[k] || { visites: 0, inscrits: 0, payants: 0, argent: 0 }; src[k][champ] += n; };
  if (S.quoi !== 'fixpro') {
    (sc.arrivees || []).forEach(a => add(a.source, 'visites', a.n));
    (sc.ecoles || []).forEach(e => add(e.source, 'inscrits', 1));
    const vus = new Set();
    (sc.paiements || []).forEach(p => { add(p.source, 'argent', +p.gnf || 0); if (!vus.has(p.ecole)) { vus.add(p.ecole); add(p.source, 'payants', 1); } });
  }
  if (S.quoi !== 'scolaris') (fx.sources || []).forEach(s => { add(s.source, 'visites', s.visites || 0); add(s.source, 'inscrits', s.comptes || 0); });
  const ecoles = sc.ecoles || [];
  const actifsSc = ecoles.filter(e => e.situation === 'actif').length;
  const actifsFx = fx.actifs || 0;
  const visit30 = (S.quoi !== 'scolaris' ? (fx.visiteurs_30j || 0) : 0) + (S.quoi !== 'fixpro' ? (sc.arrivees || []).filter(a => D(a.jour) > new Date(now - 30 * 864e5)).reduce((s, a) => s + a.n, 0) : 0);
  const comptesFx = fx.total_comptes || 0;
  const moisCle = cleMois(now), moisPrec = cleMois(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const sumMois = k => payA.filter(p => cleMois(p.date) === k).reduce((s, p) => s + p.gnf, 0);
  return { d, fx, sc, now, pay, payA, payP, vis, src, ecoles, actifsSc, actifsFx, visit30, comptesFx, mois: sumMois(moisCle), moisPrec: sumMois(moisPrec), total: payA.reduce((s, p) => s + p.gnf, 0), totFx: pay.filter(p => p.app === 'fixpro').reduce((s, p) => s + p.gnf, 0), totSc: pay.filter(p => p.app === 'scolaris').reduce((s, p) => s + p.gnf, 0) };
}
const cap = s => s ? String(s)[0].toUpperCase() + String(s).slice(1) : '';

function taches(X) {
  const t = [];
  const rel = (X.fx.relancer || []);
  if (S.quoi !== 'scolaris' && rel.length) t.push({ ic: I.att, bg: '#FFFAEB', titre: `${pl(rel.length, 'abonnement FixPro expiré', 'abonnements FixPro expirés')}`, sous: `Jusqu'à ${F(rel.reduce((s, r) => s + (+r.montant || 0), 0))} GNF/mois à récupérer`, btn: 'Relancer', lien: '#activite', p: 1 });
  if (S.quoi !== 'fixpro' && X.sc.en_attente) t.push({ ic: I.att, bg: '#FFFAEB', titre: `${pl(X.sc.en_attente, 'paiement Scolaris', 'paiements Scolaris')} à valider`, sous: 'Déclarés par des écoles', btn: 'Valider', lien: LIEN.scolaris, p: 1 });
  if (S.quoi !== 'fixpro' && X.sc.chariow_a_verifier) t.push({ ic: I.rouge, bg: '#FEF3F2', titre: `${pl(X.sc.chariow_a_verifier, 'vente Chariow', 'ventes Chariow')} à vérifier`, sous: 'École introuvable ou montant trop bas', btn: 'Voir', lien: LIEN.scolaris });
  if (S.quoi !== 'fixpro' && !X.pay.some(p => p.app === 'scolaris')) t.push({ ic: I.rouge, bg: '#FEF3F2', titre: 'Scolaris : 0 école payante', sous: X.ecoles.length ? `${pl(X.ecoles.length, 'école inscrite', 'écoles inscrites')}, aucune n'a encore payé` : 'Aucune vraie inscription pour l\'instant', btn: 'Voir', lien: LIEN.scolaris });
  if (S.quoi !== 'scolaris' && !X.pay.some(p => p.app === 'fixpro')) t.push({ ic: I.rouge, bg: '#FEF3F2', titre: 'FixPro : 0 technicien payant', sous: `${F(X.comptesFx)} comptes, aucun vrai paiement encore`, btn: 'Voir', lien: LIEN.fixpro });
  if (!Object.keys(X.src).length) t.push({ ic: I.bleu, bg: '#EEF2FF', titre: 'Suivi des réseaux pas encore actif', sous: "Pour savoir d'où viennent les clients", btn: 'Voir', lien: '#reseaux' });
  const majFx = X.fx.maj_le ? (Date.now() - D(X.fx.maj_le)) / 36e5 : 99;
  if (S.quoi !== 'scolaris' && majFx > 3) t.push({ ic: I.att, bg: '#FFFAEB', titre: 'Chiffres FixPro pas à jour', sous: X.fx.maj_le ? `Dernière copie ${ilYa(X.fx.maj_le)}` : 'Aucune copie reçue', btn: '', lien: '' });
  return t;
}

/* ---------- graphiques ---------- */
const LARG = (bur, tel) => innerWidth >= 1024 ? bur : Math.max(280, Math.min(innerWidth - 62, 460)) * (tel || 1);
function courbe(vals, labels, w, h, col) {
  const mx = Math.max(1, ...vals) * 1.15, st = w / Math.max(1, vals.length - 1);
  const pts = vals.map((v, i) => [i * st, h - 22 - (v / mx) * (h - 34)]);
  const dd = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  let g = ''; for (let k = 0; k < 4; k++) { const y = 12 + k * (h - 34) / 3; g += `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="#EEF1F6"/>`; }
  const im = vals.indexOf(Math.max(...vals)), pm = pts[im] || [0, 0];
  const bulle = vals.length && vals[im] > 0 ? `<line x1="${pm[0]}" x2="${pm[0]}" y1="${pm[1]}" y2="${h - 22}" stroke="${col}" stroke-dasharray="3 3" opacity=".5"/><circle cx="${pm[0]}" cy="${pm[1]}" r="4.5" fill="#fff" stroke="${col}" stroke-width="2.2"/><g transform="translate(${Math.min(Math.max(pm[0] - 44, 0), w - 92)},${Math.max(pm[1] - 32, 0)})"><rect width="92" height="22" rx="6" fill="#0B1424"/><text x="46" y="15" text-anchor="middle" fill="#fff" font-size="11" font-weight="600">${vals[im]} visiteur${vals[im] > 1 ? 's' : ''}</text></g>` : '';
  const id = 'a' + Math.random().toString(36).slice(2, 7);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="overflow:visible;display:block"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>${g}
  <path d="${dd} L${w},${h - 22} L0,${h - 22}Z" fill="url(#${id})"/><path d="${dd}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${bulle}
  ${labels.map(([i, t]) => `<text x="${i * st}" y="${h - 4}" fill="#98A2B3" font-size="11" text-anchor="${i === 0 ? 'start' : i === vals.length - 1 ? 'end' : 'middle'}">${t}</text>`).join('')}</svg>`;
}
function barres(series, w, h) { // series: [{m, fx, sc}]
  const mx0 = Math.max(...series.map(s => s.fx + s.sc));
  const pas = mx0 <= 0 ? 100000 : Math.pow(10, Math.floor(Math.log10(mx0))) * (mx0 / Math.pow(10, Math.floor(Math.log10(mx0))) > 5 ? 2 : 1);
  const mx = Math.max(pas * 3, Math.ceil(mx0 * 1.1 / pas) * pas);
  const L = 44, n = series.length, cw = (w - L) / n, bw = Math.min(46, cw * .5);
  let s = '';
  for (let k = 0; k <= 3; k++) { const v = mx * k / 3, y = h - 30 - (v / mx) * (h - 46); s += `<line x1="${L}" x2="${w}" y1="${y}" y2="${y}" stroke="#EEF1F6"/><text x="0" y="${y + 4}" fill="#98A2B3" font-size="10.5">${court(v)}</text>`; }
  series.forEach((p, i) => {
    const x = L + i * cw + (cw - bw) / 2, hf = p.fx / mx * (h - 46), hs = p.sc / mx * (h - 46), tot = p.fx + p.sc;
    if (tot <= 0) s += `<rect x="${x}" y="${h - 32}" width="${bw}" height="2" rx="1" fill="#E4E8F0"/>`;
    if (p.fx) s += `<rect x="${x}" y="${h - 30 - hf}" width="${bw}" height="${hf}" rx="${hs ? 0 : 6}" fill="#1E7BFF"/>`;
    if (p.sc) s += `<rect x="${x}" y="${h - 30 - hf - hs}" width="${bw}" height="${hs}" rx="6" fill="#10B26C"/>`;
    if (tot) s += `<text x="${x + bw / 2}" y="${h - 36 - hf - hs}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#0B1424">${court(tot)}</text>`;
    s += `<text x="${x + bw / 2}" y="${h - 10}" text-anchor="middle" font-size="11.5" fill="#667085">${p.m}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block">${s}</svg>`;
}
function donut(parts, sz, centre, sous) {
  const tot = parts.reduce((s, p) => s + p.v, 0) || 1; let a = -Math.PI / 2, s = ''; const r = sz / 2 - 12, c = sz / 2;
  if (parts.length === 1) s = `<circle cx="${c}" cy="${c}" r="${r}" stroke="${parts[0].c}" stroke-width="16" fill="none"/>`;
  else parts.forEach(p => { const b = a + p.v / tot * Math.PI * 2 - .03; const L = b - a > Math.PI ? 1 : 0; s += `<path d="M${c + r * Math.cos(a)},${c + r * Math.sin(a)} A${r},${r} 0 ${L} 1 ${c + r * Math.cos(b)},${c + r * Math.sin(b)}" stroke="${p.c}" stroke-width="16" fill="none"/>`; a = b + .03; });
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" style="flex:none">${s}<text x="${c}" y="${c - 2}" text-anchor="middle" font-size="22" font-weight="700" fill="#0B1424">${centre}</text><text x="${c}" y="${c + 16}" text-anchor="middle" font-size="11" fill="#667085">${sous}</text></svg>`;
}

/* ---------- blocs ---------- */
const kpi = (lab, v, u, d, ic, col) => `<div class="card kpi"><div class="lab">${ic ? `<span class="kic" style="--c:${col}">${ic}</span>` : ''}${lab}</div><div class="v num">${v}${u ? `<small>${u}</small>` : ''}</div><div class="d">${d}</div></div>`;
function blocHero(X, titre, montant, detail, nb) {
  const fx = S.quoi === 'scolaris' ? 0 : X.totFx, sc = S.quoi === 'fixpro' ? 0 : X.totSc, t = fx + sc;
  const n = nb === undefined ? X.payA.length : nb;
  const C = 2 * Math.PI * 46, lf = t ? fx / t * C : 0, ls = t ? sc / t * C : 0, gap = fx && sc ? 4 : 0;
  const arc = (l, off, col) => l > 0 ? `<circle cx="60" cy="60" r="46" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${Math.max(l - gap, 0.01)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>` : '';
  const ligne = (k, nom, v) => `<span>${B(k, 22)}<em>${nom}</em><b class="num">${F(v)}</b></span>`;
  return `<div class="card hero kpi heroD"><div class="hd-g"><div class="lab">${titre}</div><div class="v num">${F(montant)}<small>GNF</small></div>
  <div class="hd-l">${S.quoi !== 'scolaris' ? ligne('fixpro', 'FixPro', fx) : ''}${S.quoi !== 'fixpro' ? ligne('scolaris', 'Scolaris', sc) : ''}</div>
  <div class="d hd-d">${detail}</div></div>
  <svg class="hd-r" viewBox="0 0 120 120"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="13"/>${arc(ls, lf, '#3DDC97')}${arc(lf, 0, '#5B9BFF')}
  <text x="60" y="60" text-anchor="middle" fill="#fff" font-size="24" font-weight="700" font-family="Inter">${n}</text><text x="60" y="78" text-anchor="middle" fill="rgba(255,255,255,.7)" font-size="11" font-family="Inter">paiement${n > 1 ? 's' : ''}</text></svg></div>`;
}
function blocKpis(X) {
  const diff = X.moisPrec ? Math.round((X.mois - X.moisPrec) / X.moisPrec * 100) : null;
  const actifs = (S.quoi !== 'scolaris' ? X.actifsFx : 0) + (S.quoi !== 'fixpro' ? X.actifsSc : 0);
  const inscr = (S.quoi !== 'scolaris' ? X.comptesFx : 0) + (S.quoi !== 'fixpro' ? X.ecoles.length : 0);
  const nMois = (S.quoi !== 'scolaris' ? ((X.fx.comptes || []).find(c => c.mois === cleMois(X.now)) || {}).n || 0 : 0) + (S.quoi !== 'fixpro' ? X.ecoles.filter(e => cleMois(D(e.cree_le)) === cleMois(X.now)).length : 0);
  const pages = S.quoi !== 'scolaris' ? X.fx.pages_30j || 0 : 0;
  return `<div class="k2">
    ${kpi(`Encaissé en ${MOIS[X.now.getMonth()].replace('.', '')}`, F(X.mois), 'GNF', diff === null ? (X.moisPrec ? '' : 'Rien le mois dernier') : `<b class="${diff >= 0 ? 'up' : 'dn'}">${diff >= 0 ? '+' : ''}${diff} %</b> vs mois dernier`, I.argent, '#2F5BF5')}
    ${kpi('Abonnés actifs', F(actifs), '', S.quoi === 'fixpro' ? 'techniciens' : S.quoi === 'scolaris' ? 'écoles' : 'techniciens + écoles', I.badge, '#12B76A')}
    ${kpi('Visiteurs · 30 j', F(X.visit30), '', pages ? `${F(pages)} pages vues` : 'personnes différentes', I.oeilI, '#7A5AF8')}
    ${kpi('Inscriptions', F(inscr), '', `<b>${nMois ? '+' + nMois : '0'}</b> ce mois-ci`, I.usersI, '#F79009')}
  </div>`;
}
function blocTaches(X, max) {
  const t = taches(X); const v = max ? t.slice(0, max) : t;
  return `<div class="card"><div class="ct"><h3>À faire maintenant</h3>${t.length ? `<span class="tag ko">${t.length}</span>` : ''}</div>
  ${v.length ? v.map(x => `<div class="task"><span class="ic" style="background:${x.bg}">${x.ic}</span><div><b>${esc(x.titre)}</b><small>${esc(x.sous)}</small></div>${x.btn ? `<a class="btn ${x.p ? 'p' : ''}" href="${x.lien}" ${x.lien.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${x.btn}</a>` : '<span></span>'}</div>`).join('') : `<div class="task"><span class="ic" style="background:#ECFDF3">${I.vert}</span><div><b>Tout est en ordre</b><small>Rien à faire pour le moment</small></div><span></span></div>`}</div>`;
}
function blocRevenus(X, h) {
  const series = []; for (let k = 5; k >= 0; k--) { const d = new Date(X.now.getFullYear(), X.now.getMonth() - k, 1), c = cleMois(d); const ps = X.payA.filter(p => cleMois(p.date) === c); series.push({ m: MOIS[d.getMonth()], fx: ps.filter(p => p.app === 'fixpro').reduce((s, p) => s + p.gnf, 0), sc: ps.filter(p => p.app === 'scolaris').reduce((s, p) => s + p.gnf, 0) }); }
  const vide = !series.some(s => s.fx + s.sc);
  return `<div class="card"><div class="ct"><div><h3>Revenu par mois</h3><div class="sous">6 derniers mois · en GNF</div></div><div class="leg" style="margin:0"><span><i class="dot" style="background:#1E7BFF"></i>FixPro</span><span><i class="dot" style="background:#10B26C"></i>Scolaris</span></div></div>
  ${vide ? `<div class="vide-g"><div class="vg-ic">${I.argent}</div><b>Pas encore de revenu</b><span>Dès le premier vrai paiement, le graphique mois par mois apparaît ici.</span></div>` : barres(series, LARG(700), h)}</div>`;
}
function blocVisiteurs(X, h) {
  const n = S.per === 'tout' ? 30 : +S.per; const vals = [], lab = [];
  for (let k = n - 1; k >= 0; k--) { const d = new Date(X.now - k * 864e5); vals.push(X.vis[cleJour(d)] || 0); }
  const idx = [0, Math.round((n - 1) / 3), Math.round(2 * (n - 1) / 3), n - 1];
  idx.forEach(i => lab.push([i, jourCourt(new Date(X.now - (n - 1 - i) * 864e5))]));
  const pr = X.fx.profils_30j || {};
  return `<div class="card"><div class="ct"><div><h3>Visiteurs par jour</h3><div class="sous">${n} derniers jours · ${S.quoi === 'tous' ? 'les 2 apps' : S.quoi === 'fixpro' ? 'FixPro' : 'Scolaris'}</div></div><span class="tag gr">${F(vals.reduce((a, b) => a + b, 0))} au total</span></div>
  ${courbe(vals, lab, LARG(420), h, '#2F5BF5')}
  ${S.quoi !== 'scolaris' ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px;border-top:1px solid var(--l2);padding-top:12px">${[['Simples visiteurs', pr.visiteur || 0], ['Techniciens', pr.technicien || 0], ['Clients', pr.client || 0]].map(([a, b]) => `<div><div style="font-size:11.5px;color:var(--m)">${a} · 30 j</div><div class="num" style="font-size:17px;font-weight:700;margin-top:2px">${F(b)}</div></div>`).join('')}</div>` : ''}</div>`;
}
function blocSources(X, sz) {
  const L = Object.entries(X.src).map(([k, v]) => ({ k, ...v })).sort((a, b) => (b.argent - a.argent) || (b.visites - a.visites));
  const tot = L.reduce((s, x) => s + x.visites, 0);
  if (!L.length) return `<div class="card"><div class="ct"><h3>D'où viennent les visiteurs</h3></div><div class="vide"><div class="logos-gris">${['tiktok', 'facebook', 'whatsapp', 'youtube'].map(k => B(k, 34)).join('')}</div><b>Pas encore de visite venant des réseaux</b>Le suivi est actif depuis le 14 nov. Dès que quelqu'un clique sur tes liens TikTok ou Facebook, il apparaît ici${S.quoi !== 'scolaris' ? ' (FixPro : mis à jour chaque heure)' : ''}.</div></div>`;
  return `<div class="card"><div class="ct"><h3>D'où viennent les visiteurs</h3><span class="s">90 jours</span></div>
  <div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">${donut(L.filter(x => x.visites).map(x => ({ v: x.visites, c: SOURCES[x.k][1] })), sz, F(tot), 'visites')}
  <div style="flex:1;min-width:150px">${L.slice(0, 6).map(x => `<div style="display:flex;align-items:center;gap:9px;font-size:13px;padding:3px 0">${B(x.k, 22)}<span style="flex:1">${SOURCES[x.k][0]}</span><b class="num">${tot ? Math.round(x.visites / tot * 100) : 0} %</b></div>`).join('')}</div></div></div>`;
}
function blocApps(X) {
  const sc = X.ecoles.length;
  return `<div class="card"><div class="ct"><h3>Mes applications</h3><span class="s">depuis le début</span></div>
  <div class="row">${B('fixpro')}<div><b>FixPro Guinée</b><small>${F(X.comptesFx)} comptes · ${F(X.fx.visiteurs_30j || 0)} visiteurs/30 j · ${F(X.actifsFx)} actif${X.actifsFx > 1 ? 's' : ''}</small></div><div class="r num">${F(X.totFx)}<small>GNF</small></div></div>
  <div class="row">${B('scolaris')}<div><b>Scolaris</b><small>${pl(sc, 'école')} · ${F(X.actifsSc)} payante${X.actifsSc > 1 ? 's' : ''}${X.sc.tarifs ? ` · dès ${F(X.sc.tarifs.mois)} FCFA/mois` : ''}</small></div><div class="r num">${F(X.totSc)}<small>GNF</small></div></div></div>`;
}
function lignePay(p) { return `<div class="row">${B(p.moyen[0])}<div><b>${esc(p.qui)}</b><small>${p.app === 'fixpro' ? 'FixPro' : 'Scolaris'} · ${esc(p.formule)} · ${p.moyen[1]}</small></div><div class="r"><span class="num up">+${F(p.gnf)}</span><small style="color:var(--m2)">${ilYa(p.date)}</small></div></div>`; }
function blocDerniers(X, n, complet) {
  const L = complet ? X.payP : X.payA.slice(0, n);
  return `<div class="card"><div class="ct"><h3>${complet ? 'Tous les paiements' : 'Derniers paiements'}</h3>${!complet && X.payA.length ? '<a class="s" href="#argent">Tout voir →</a>' : `<span class="s">${pl(L.length, 'paiement')}</span>`}</div>
  ${!L.length ? `<div class="vide"><div class="logos-gris" style="filter:none;opacity:1">${B('orange', 34)}${B('mtn', 34)}${B('chariow', 34)}</div><b>Aucun vrai paiement ${complet && S.per !== 'tout' ? 'sur cette période' : 'pour l\'instant'}</b>Les paiements de test sont exclus${X.fx.paiements_test ? ` (${X.fx.paiements_test} sur FixPro)` : ''}.</div>`
    : complet ? `<div class="tbl"><table><tr><th>Date</th><th>App</th><th>Client</th><th>Formule</th><th>Moyen</th><th class="n">Montant</th></tr>${L.map(p => `<tr><td style="color:var(--m)">${jourCourt(p.date)}</td><td><span class="tag ${p.app === 'fixpro' ? 'fx' : 'sc'}">${p.app === 'fixpro' ? 'FixPro' : 'Scolaris'}</span></td><td>${esc(p.qui)}</td><td>${esc(p.formule)}</td><td><span style="display:inline-flex;align-items:center;gap:8px">${B(p.moyen[0], 22)}${p.moyen[1]}</span></td><td class="n num"><b>${F(p.gnf)}</b>${p.fcfa ? `<div style="font-size:11px;color:var(--m2)">${F(p.fcfa)} FCFA</div>` : ''}</td></tr>`).join('')}</table></div>`
    : L.map(lignePay).join('')}</div>`;
}
function blocRepartition(X, cle, titre) {
  const g = {}; X.payP.forEach(p => { const k = cle === 'moyen' ? p.moyen[0] : p.formule; g[k] = g[k] || { n: 0, v: 0, lab: cle === 'moyen' ? p.moyen[1] : p.formule }; g[k].n++; g[k].v += p.gnf; });
  const L = Object.entries(g).sort((a, b) => b[1].v - a[1].v); const mx = Math.max(1, ...L.map(x => x[1].v));
  return `<div class="card"><div class="ct"><h3>${titre}</h3></div>${L.length ? L.map(([k, x]) => cle === 'moyen'
    ? `<div class="row">${B(k)}<div><b>${x.lab}</b><small>${pl(x.n, 'paiement')}</small></div><div class="r num">${F(x.v)}<small>GNF</small></div></div>`
    : `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:13px"><span><b style="font-weight:600">${esc(x.lab)}</b> <span style="color:var(--m)">· ${pl(x.n, 'paiement')}</span></span><b class="num">${F(x.v)}</b></div><div class="bar"><i style="width:${x.v / mx * 100}%;background:#2F5BF5"></i></div></div>`).join('')
    : `<div class="vide" style="padding:10px">${cle === 'moyen' ? `<div class="logos-gris" style="filter:none;opacity:1">${B('orange', 30)}${B('mtn', 30)}${B('chariow', 30)}</div>` : ''}Rien encore sur cette période.</div>`}</div>`;
}
function blocComptes(X) {
  const L = []; for (let k = 5; k >= 0; k--) { const d = new Date(X.now.getFullYear(), X.now.getMonth() - k, 1), c = cleMois(d); L.push({ m: MOIS[d.getMonth()], fx: S.quoi !== 'scolaris' ? ((X.fx.comptes || []).find(x => x.mois === c) || {}).n || 0 : 0, sc: S.quoi !== 'fixpro' ? X.ecoles.filter(e => cleMois(D(e.cree_le)) === c).length : 0 }); }
  const mx = Math.max(1, ...L.map(x => x.fx + x.sc));
  return `<div class="card"><div class="ct"><h3>Nouvelles inscriptions</h3><span class="s">comptes FixPro + écoles</span></div><div style="display:flex;align-items:flex-end;gap:10px;height:130px">
  ${L.map(x => `<div style="flex:1;text-align:center"><div class="num" style="font-size:12px;font-weight:600;margin-bottom:5px">${x.fx + x.sc}</div><div style="display:flex;flex-direction:column;justify-content:flex-end;height:${Math.max(3, (x.fx + x.sc) / mx * 84)}px;border-radius:6px;overflow:hidden;background:#E4E8F0">${x.sc ? `<i style="display:block;height:${x.sc / (x.fx + x.sc) * 100}%;background:#10B26C"></i>` : ''}${x.fx ? `<i style="display:block;height:${x.fx / (x.fx + x.sc) * 100}%;background:#1E7BFF"></i>` : ''}</div><div style="font-size:11.5px;color:var(--m);margin-top:6px">${x.m}</div></div>`).join('')}</div></div>`;
}
function blocVilles(X) {
  const L = S.quoi === 'scolaris' ? Object.entries(X.ecoles.reduce((a, e) => (a[e.ville || '—'] = (a[e.ville || '—'] || 0) + 1, a), {})).map(([v, n]) => ({ v, n })) : (X.fx.villes || []);
  const mx = Math.max(1, ...L.map(x => x.n));
  return `<div class="card"><div class="ct"><h3>Où sont les comptes</h3><span class="s">${S.quoi === 'scolaris' ? 'Scolaris' : 'FixPro'}</span></div>${L.length ? L.slice(0, 6).map(x => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(x.v)}</span><b class="num">${x.n}</b></div><div class="bar"><i style="width:${x.n / mx * 100}%;background:#2F5BF5"></i></div></div>`).join('') : '<div class="vide">Pas encore de données.</div>'}</div>`;
}
function blocEcoles(X) {
  const L = X.ecoles.slice(0, 6);
  return `<div class="card"><div class="ct"><h3>Dernières écoles Scolaris</h3><span class="s">${pl(X.ecoles.length, 'école')}</span></div>${L.length ? L.map(e => `<div class="row">${B(e.source)}<div><b>${esc(e.nom)}</b><small>${esc(e.ville || '')}${e.eleves ? ` · ${F(e.eleves)} élèves` : ''} · ${(SOURCES[e.source] || SOURCES.autre)[0]}</small></div><div class="r"><span class="tag ${e.situation === 'actif' ? 'ok' : e.situation === 'essai' ? 'fx' : 'gr'}">${cap(e.situation || '—')}</span><small style="color:var(--m2);margin-top:3px">${ilYa(e.cree_le)}</small></div></div>`).join('')
    : `<div class="vide"><b>Aucune vraie école pour l'instant</b>Les écoles de test d'avant le 14 nov. ne sont pas comptées.${X.sc.tarifs ? `<br>Abonnement dès ${F(X.sc.tarifs.mois)} FCFA/mois.` : ''}</div>`}</div>`;
}
function blocRelancer(X) {
  const L = X.fx.relancer || [];
  if (!L.length) return '';
  return `<div class="card"><div class="ct"><h3>Techniciens à relancer</h3><span class="tag or">${L.length}</span></div>${L.map(r => { const tel = String(r.tel || '').replace(/\D/g, ''); const num = tel.length === 9 ? '224' + tel : tel; const msg = encodeURIComponent(`Bonjour ${r.nom}, votre abonnement FixPro ${cap(r.plan)} a expiré. Renouvelez-le pour continuer à recevoir des demandes de clients : https://fixproguinee.com`);
    return `<div class="row">${B('whatsapp')}<div><b>${esc(r.nom)}</b><small>${cap(r.plan)} · expiré ${ilYa(r.expire)}</small></div>${num ? `<a class="btn p" target="_blank" rel="noopener" href="https://wa.me/${num}?text=${msg}">WhatsApp</a>` : '<span class="s">pas de numéro</span>'}</div>`; }).join('')}</div>`;
}
function blocActivite(X) {
  const ev = [];
  X.payA.slice(0, 15).forEach(p => ev.push({ t: p.date, h: lignePay(p) }));
  if (S.quoi !== 'fixpro') X.ecoles.slice(0, 15).forEach(e => ev.push({ t: D(e.cree_le), h: `<div class="row"><span class="ico" style="background:#ECFDF3">🏫</span><div><b>Nouvelle école : ${esc(e.nom)}</b><small>Scolaris · ${esc(e.ville || '')} · ${(SOURCES[e.source] || SOURCES.autre)[0]}</small></div><div class="r"><small style="color:var(--m2)">${ilYa(e.cree_le)}</small></div></div>` }));
  if (S.quoi !== 'scolaris') (X.fx.comptes || []).slice(-4).forEach(c => { const [y, m] = c.mois.split('-'); const d = new Date(+y, +m - 1, 28); ev.push({ t: d > X.now ? X.now : d, h: `<div class="row"><span class="ico" style="background:#EEF2FF">👤</span><div><b>${pl(c.n, 'nouveau compte', 'nouveaux comptes')}</b><small>FixPro · ${MOIS[+m - 1]} ${y}</small></div><div class="r"><small style="color:var(--m2)">${MOIS[+m - 1]}</small></div></div>` }); });
  ev.sort((a, b) => b.t - a.t);
  return `<div class="card"><div class="ct"><h3>Activité récente</h3><span class="s">vraies données</span></div>${ev.length ? ev.slice(0, 12).map(e => e.h).join('') : '<div class="vide">Rien pour le moment.</div>'}</div>`;
}
function blocReseauxTable(X) {
  const L = Object.entries(X.src).map(([k, v]) => ({ k, ...v })).sort((a, b) => (b.argent - a.argent) || (b.inscrits - a.inscrits) || (b.visites - a.visites));
  if (!L.length) return `<div class="card"><div class="ct"><h3>Du réseau au paiement</h3></div><div class="vide"><div class="logos-gris">${['tiktok', 'facebook', 'whatsapp', 'youtube'].map(k => B(k, 34)).join('')}</div><b>En attente des premiers clics</b>Le suivi est actif. Chaque visite est rattachée au réseau d'où elle vient (TikTok, Facebook, WhatsApp, YouTube…), puis suivie jusqu'à l'inscription et au paiement.</div></div>`;
  return `<div class="card"><div class="ct"><h3>Du réseau au paiement</h3><span class="s">90 jours</span></div>${L.map(x => `<div class="row">${B(x.k)}<div><b>${SOURCES[x.k][0]}</b><small>${pl(x.visites, 'visite')} · ${pl(x.inscrits, 'inscrit')} · ${pl(x.payants, 'payant')}</small></div><div class="r num">${F(x.argent)}<small>GNF</small></div></div>`).join('')}</div>`;
}
function blocConseil(X) {
  const L = Object.entries(X.src).map(([k, v]) => ({ k, ...v }));
  let t = "Dès les premiers clics sur tes liens, Pilotage te dira quel réseau t'amène des clients <b>qui paient</b>, pas seulement des vues.";
  if (L.length) { const best = L.slice().sort((a, b) => (b.argent - a.argent) || (b.inscrits - a.inscrits) || (b.visites - a.visites))[0]; const nom = SOURCES[best.k][0];
    t = best.argent ? `<b>${nom}</b> t'a rapporté le plus d'argent (${F(best.argent)} GNF). Publie plus là-bas.` : best.inscrits ? `<b>${nom}</b> t'amène le plus d'inscriptions (${best.inscrits}). Pousse-les vers le paiement.` : `<b>${nom}</b> t'amène le plus de visites. Mets ton lien d'inscription bien en vue.`; }
  return `<div class="card conseil"><b style="font-size:13.5px">💡 Conseil</b><p>${t}</p></div>`;
}

/* ---------- pages ---------- */
const PAGES = [['accueil', 'Tableau de bord', 'Accueil'], ['argent', 'Argent', 'Argent'], ['reseaux', 'Réseaux', 'Réseaux'], ['sante', 'Santé', 'Santé'], ['activite', 'Activité', 'Activité'], ['reglages', 'Réglages', 'Réglages']];
function filtres(per) {
  const seg = (cle, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-${cle}="${v}" class="${S[cle] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  return `<div class="filtres">${seg('quoi', [['tous', 'Les 2 apps'], ['fixpro', 'FixPro'], ['scolaris', 'Scolaris']])}${per ? seg('per', [['7', '7 j'], ['30', '30 j'], ['90', '3 mois'], ['tout', 'Tout']]) : ''}</div>`;
}
function pageAccueil(X) {
  return `${filtres()}${blocSanteBandeau(X, 1)}
  <div class="g-kpi">${blocHero(X, 'Revenu total encaissé', X.total, X.payA.length ? `Panier moyen ${F(X.total / X.payA.length)} GNF` : 'Aucun vrai paiement encore')}${blocKpis(X)}</div>
  <div class="g21">${blocRevenus(X, 230)}${blocTaches(X, 4)}</div>
  <div class="g111">${blocVisiteurs(X, 150)}${blocSources(X, 140)}${blocApps(X)}</div>
  <div class="g11">${blocDerniers(X, 6)}<div class="col">${S.quoi !== 'fixpro' ? blocEcoles(X) : blocVilles(X)}</div></div>
  <div class="g111">${blocComptes(X)}${blocVilles(X)}${blocActivite(X)}</div>`;
}
function pageArgent(X) {
  const t = X.payP.reduce((s, p) => s + p.gnf, 0);
  const lib = { '7': '7 derniers jours', '30': '30 derniers jours', '90': '3 derniers mois', tout: 'depuis le début' }[S.per];
  return `${filtres(1)}
  <div class="g21">${blocHero(X, 'Encaissé · ' + lib, t, X.payP.length ? `Panier moyen ${F(t / X.payP.length)} GNF` : 'Aucun vrai paiement sur cette période', X.payP.length)}${kpi(`Encaissé en ${MOIS[X.now.getMonth()].replace('.', '')}`, F(X.mois), 'GNF', X.moisPrec ? `Mois dernier : ${F(X.moisPrec)} GNF` : 'Rien le mois dernier')}</div>
  ${blocRevenus(X, 220)}
  <div class="g11">${blocRepartition(X, 'formule', 'Revenu par formule')}${blocRepartition(X, 'moyen', 'Moyens de paiement')}</div>
  ${blocDerniers(X, 0, 1)}`;
}
function pageReseaux(X) { return `${filtres()}<div class="g11">${blocSources(X, 160)}<div class="col">${blocConseil(X)}${blocTaches(X).includes('Suivi des réseaux') ? '' : ''}</div></div>${blocReseauxTable(X)}${blocVisiteurs(X, 160)}`; }
function pageActivite(X) { return `${filtres()}<div class="g11"><div class="col">${blocTaches(X)}${blocRelancer(X)}</div>${blocActivite(X)}</div>`; }
function pageReglages(X) {
  const fx = X.fx.maj_le ? D(X.fx.maj_le) : null;
  return `<div class="card reglages">
    <div style="display:flex;align-items:center;gap:12px;padding-bottom:14px"><span class="av" style="background:#E0E8FF;color:var(--p);width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700">${esc((S.session.email || 'A')[0].toUpperCase())}</span><div><b style="font-size:14.5px">Administrateur</b><div class="sous">${esc(S.session.email || '')}</div></div></div>
    <button data-act="maj"><span>Actualiser les chiffres</span>${I.maj}</button>
    <a href="${LIEN.scolaris}" target="_blank" rel="noopener"><span>Ouvrir l'admin Scolaris</span>${I.ext}</a>
    <a href="${LIEN.fixpro}" target="_blank" rel="noopener"><span>Ouvrir FixPro</span>${I.ext}</a>
    <button data-act="sortir" style="color:var(--ko)"><span>Se déconnecter</span>${I.sortir}</button></div>
  <div class="card"><div class="ct"><h3>À propos des chiffres</h3></div><div style="font-size:13px;color:var(--m);line-height:1.6">
    • Scolaris est lu <b>en direct</b>.<br>• FixPro est recopié <b>toutes les heures</b>${fx ? ` (dernière copie ${ilYa(fx)}, à ${heure(fx)})` : ''}.<br>
    • Les paiements de test et les écoles de test (créées avant le 14 nov. 2026) ne sont pas comptés.<br>• Les montants Scolaris (FCFA) sont convertis en GNF.</div></div>
  <div class="pied">Pilotage · FixPro Guinée & Scolaris</div>`;
}

/* ---------- rendu ---------- */
function vueConnexion() {
  const act = S.mode === 'activer';
  const USER = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  const CODE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M7 12h.01M11 12h.01M15 12h.01"/></svg>';
  const champ = (ic, nom, lab, type, ph, auto, oeil) => `<div class="fld"><span class="fi">${ic}</span><label><small>${lab}</small><input name="${nom}" type="${oeil ? (S.oeil ? 'text' : 'password') : type}" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="${auto}" placeholder="${ph}" required></label>${oeil ? `<button type="button" class="oeil" data-act="oeil" aria-label="Afficher le mot de passe">${I.oeil}</button>` : ''}</div>`;
  const titre = (t, lien) => `<div class="cx-titre"><h2>${t}</h2><button type="button" class="lien" data-act="mode">${lien}</button></div>`;
  const sous = (t) => S.err ? `<p class="s err-l">${esc(S.err)}</p>` : `<p class="s">${t}</p>`;
  const form = act
    ? `<form class="cx-form" id="fact" autocomplete="on">${titre('Créer mon accès', '← Retour')}${sous('Mets le code reçu, puis choisis ton identifiant et ton mot de passe')}
    ${champ(CODE, 'code', "Code d'activation", 'text', '8 caractères', 'one-time-code')}
    ${champ(USER, 'ident', 'Choisis ton identifiant', 'text', 'ce que tu veux', 'username')}
    ${champ(I.cadenas, 'mdp', 'Choisis ton mot de passe', 'password', '10 caractères minimum', 'new-password', 1)}
    <button class="cta" type="submit" ${S.charge ? 'disabled' : ''}>${S.charge ? 'Enregistrement…' : 'Enregistrer et entrer'}</button></form>`
    : `<form class="cx-form" id="fcx" autocomplete="on">${titre('Connexion', 'Première fois ?')}${sous('Accédez à votre tableau de bord')}
    ${champ(USER, 'ident', 'Identifiant', 'text', 'ton identifiant', 'username')}
    ${champ(I.cadenas, 'mdp', 'Mot de passe', 'password', 'Votre mot de passe', 'current-password', 1)}
    <button class="cta" type="submit" ${S.charge ? 'disabled' : ''}>${S.charge ? 'Connexion…' : 'Se connecter'}</button>
    <p class="sur garde">${I.bouclier}Accès réservé à l'administrateur</p></form>`;
  return `<div class="cx">
  <div class="cx-haut grille"><div><span class="lg-grand">${LOGO(92)}</span><div class="wm-grand">${WM(46, '#fff')}</div><div class="chips"><span class="chip">${B('fixpro', 22)}FixPro Guinée</span><span class="chip">${B('scolaris', 22)}Scolaris</span></div></div></div>
  <div class="cx-gauche grille"><div style="display:flex;align-items:center;gap:14px">${LOGO(52)}${WM(34, '#fff')}</div>
    <h1>Tout ce que rapportent <span>tes applications</span>, au même endroit.</h1><p>L'argent qui rentre, les visiteurs, les inscriptions et les réseaux qui t'amènent des clients. En direct.</p>
    <div class="apercu" style="position:relative"><div style="left:0;top:0;width:330px"><div style="font-size:13px;color:var(--m)">Revenu total encaissé</div><div class="num" style="font-size:32px;font-weight:700;margin-top:6px;letter-spacing:.08em">•• ••• ••• <small style="font-size:14px;color:var(--m2);letter-spacing:0">GNF</small></div><div style="display:flex;gap:6px;margin-top:14px">${B('mtn', 30)}${B('orange', 30)}${B('chariow', 30)}</div></div>
    <div style="left:290px;top:150px;width:300px"><div style="font-size:13px;color:var(--m)">D'où viennent les visiteurs</div><div style="display:flex;gap:8px;margin-top:12px">${B('tiktok', 38)}${B('facebook', 38)}${B('whatsapp', 38)}${B('youtube', 38)}</div></div></div></div>
  <div class="cx-feuille">${form}</div></div>`;
}
function vueApp() {
  if (!S.data) return `<div class="chargement"><div style="text-align:center"><img src="/logo.svg" width="64" height="64" alt="" style="border-radius:15px"><p style="margin-top:14px;color:var(--m);font-size:14px">${S.err ? esc(S.err) : 'Chargement des chiffres…'}</p>${S.err ? '<button class="btn p" data-act="maj" style="margin-top:12px">Réessayer</button>' : ''}</div></div>`;
  const X = prep(); const nT = taches(X).length;
  const p = PAGES.find(x => x[0] === S.page) || PAGES[0];
  const vieux = S.vu && Date.now() - S.vu > 15 * 6e4;
  const now = X.now; const date = `${cap(JOURS[now.getDay()])} ${now.getDate()} ${MOIS[now.getMonth()].replace('.', '')} ${now.getFullYear()}`;
  const corps = { sante: pageSante, accueil: pageAccueil, argent: pageArgent, reseaux: pageReseaux, activite: pageActivite, reglages: pageReglages }[p[0]](X);
  return `<div class="cadre">
  <aside class="side"><div class="brand">${LOGO(36)}<div>${WM(18, '#fff')}<small>FixPro · Scolaris</small></div></div>
    <div class="gt">Vue d'ensemble</div>${PAGES.slice(0, 5).map(([k, , l]) => `<a href="#${k}" class="${S.page === k ? 'on' : ''}">${I[k]}${k === 'accueil' ? 'Tableau de bord' : l}${k === 'activite' && nT ? `<span class="cnt">${nT}</span>` : ''}</a>`).join('')}
    <div class="gt">Applications</div><a href="${LIEN.fixpro}" target="_blank" rel="noopener">${I.app}FixPro Guinée</a><a href="${LIEN.scolaris}" target="_blank" rel="noopener">${I.app}Scolaris</a>
    <div class="gt">Compte</div><a href="#reglages" class="${S.page === 'reglages' ? 'on' : ''}">${I.reglages}Réglages</a>
    <div class="me"><div class="av">${esc(initiales(X.d.moi))}</div><div><b>${esc(X.d.moi || 'Administrateur')}</b><small>Mis à jour à ${heure(S.vu || new Date())}</small></div></div></aside>
  <main><header class="entete">${LOGO(38)}<div><h1>${p[0] === 'accueil' ? esc(X.d.moi || 'Administrateur') : p[1]}</h1><p>${p[0] === 'accueil' ? 'Bonjour 👋 · ' + date : { argent: 'Ce qui rentre vraiment', reseaux: "D'où viennent les gens", activite: 'Paiements, inscriptions, alertes', reglages: 'Compte et informations', sante: 'Tes applications vont-elles bien ?' }[p[0]]}</p></div><div class="sp"></div>
    <button class="live ${vieux ? 'vieux' : ''}" data-act="maj" title="Actualiser"><i></i>${S.charge ? 'Mise à jour…' : vieux ? 'Actualiser' : 'En direct'}</button><a class="moi" href="#reglages" title="Réglages">${esc(initiales(X.d.moi))}</a></header>
  <div class="page">${S.err ? `<div class="err" style="margin:0">${esc(S.err)}</div>` : ''}${corps}</div></main>
  <nav class="nav">${PAGES.slice(0, 5).map(([k, , l]) => `<a href="#${k}" class="${S.page === k ? 'on' : ''}"><span class="ni">${I[k]}${k === 'activite' && nT ? '<i class="pt"></i>' : ''}</span>${l}</a>`).join('')}</nav></div>`;
}
const initiales = n => String(n || 'A').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
/* ---------- santé ---------- */
const ETAT = { ok: ['#12B76A', 'Opérationnel', 'ok'], att: ['#F79009', 'À surveiller', 'or'], ko: ['#F04438', 'En panne', 'ko'], off: ['#98A2B3', 'Non configuré', 'gr'] };
function santeX(X) {
  const sa = X.d.sante || {}; const ping = S.ping || {};
  const app = k => { const a = sa[k] || {}; const p = ping[k]; return { ...a, statut: p ? (p.ok ? 'ok' : 'ko') : (a.statut || 'ok'), ms: p ? p.ms : a.ms }; };
  const fxCopie = X.fx.maj_le ? (Date.now() - D(X.fx.maj_le)) / 6e4 : 999;
  const services = (sa.services && sa.services.length) ? sa.services : [
    { k: 'bd', nom: 'Base de données Scolaris', etat: 'ok', info: 'Répond normalement' },
    { k: 'copie', nom: 'Copie des chiffres FixPro', etat: fxCopie < 90 ? 'ok' : 'att', info: X.fx.maj_le ? `Dernière copie ${ilYa(X.fx.maj_le)}` : 'Aucune copie' },
    { k: 'pieceI', nom: 'Paiements Chariow (Scolaris)', etat: 'ok', info: 'Prêt à recevoir' },
    { k: 'sms', nom: 'SMS Nimba', etat: 'off', info: 'Pack SMS pas encore acheté' },
    { k: 'globe2', nom: 'Nom de domaine Scolaris', etat: 'off', info: 'Pas encore acheté' },
  ];
  const apps = [['fixpro', 'FixPro Guinée', app('fixpro')], ['scolaris', 'Scolaris', app('scolaris')]].filter(a => S.quoi === 'tous' || a[0] === S.quoi);
  const pb = apps.filter(a => a[2].statut !== 'ok').length + services.filter(x => x.etat === 'ko' || x.etat === 'att').length;
  const ko = apps.some(a => a[2].statut === 'ko') || services.some(x => x.etat === 'ko');
  let score = 100;
  apps.forEach(([, , a]) => { if (a.statut === 'ko') score -= 40; else if (a.statut === 'att') score -= 15; if (a.erreurs) score -= Math.min(10, a.erreurs); });
  services.forEach(x => { if (x.etat === 'ko') score -= 15; else if (x.etat === 'att') score -= 5; });
  score = Math.max(0, Math.min(100, score));
  return { apps, services, pb, ko, score, incidents: sa.incidents || [], verif: sa.verifie_le || S.pingT };
}
function barresDispo(jours) {
  const L = jours && jours.length ? jours.slice(-30) : [];
  const vides = 30 - L.length;
  const cls = [...Array.from({ length: vides }, () => 'n'), ...L.map(j => j === 1 ? 'v' : j === 0 ? 'r' : j === 0.5 ? 'o' : 'n')];
  return `<div class="dispo scan">${cls.map((c, i) => `<i class="${c}" style="--i:${i}"></i>`).join('')}</div><div class="dispo-l"><span>il y a 30 j</span><span>aujourd'hui</span></div>`;
}
function blocSanteBandeau(X, compact) {
  const H = santeX(X); const [c, , ] = H.ko ? ETAT.ko : H.pb ? ETAT.att : ETAT.ok;
  const titre = H.ko ? 'Une application a un problème' : H.pb ? `${pl(H.pb, 'point', 'points')} à surveiller` : 'Tout fonctionne bien';
  const sous = H.apps.map(([k, n, a]) => `${n.split(' ')[0]} ${a.ms ? a.ms + ' ms' : (a.statut === 'ok' ? 'en ligne' : 'hors ligne')}`).join(' · ');
  if (compact) return `<a class="card sbande" href="#sante" style="--sc:${c}"><span class="sb-ic">${H.ko ? I.rouge : H.pb ? I.att : I.vert}</span><div><b>${titre}</b><small>${sous}</small></div><span class="sb-f">Santé ›</span></a>`;
  const R = 40, L = 2 * Math.PI * R, v = H.score / 100 * L;
  const anneau = `<div class="sh-g"><svg viewBox="0 0 100 100"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F6BFF"/><stop offset="1" stop-color="${H.ko ? '#F04438' : H.pb ? '#F79009' : '#12B76A'}"/></linearGradient></defs>
    <circle cx="50" cy="50" r="${R}" fill="none" stroke="#E6ECFA" stroke-width="9"/><circle class="sg-a" cx="50" cy="50" r="${R}" fill="none" stroke="url(#sg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${v} ${L}" transform="rotate(-90 50 50)" style="--L:${L}"/></svg>
    <svg class="sg-t" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="#2F6BFF" stroke-width="1.6" stroke-dasharray="3 7" opacity=".5"/><circle cx="50" cy="2" r="3" fill="#2F6BFF"/></svg>
    <div class="sg-c"><b class="num">${H.score}%</b><small>santé</small></div></div>`;
  return `<div class="card shero" style="--sc:${c}">${anneau}<div><b>${titre}</b><small>${H.verif ? `Vérifié ${ilYa(H.verif)}` : 'Vérification en cours…'} · ${pl(H.apps.length, 'application')}, ${pl(H.services.length, 'service')}</small></div><button class="btn" data-act="ping" title="Vérifier maintenant">${I.copie}<span>Vérifier</span></button></div>`;
}
function blocSanteApp(k, nom, a) {
  const [c, lib, cl] = ETAT[a.statut] || ETAT.ok;
  const mes = (a.jours || []).filter(j => j !== null && j !== undefined); const dispo = mes.length ? Math.round(mes.reduce((s, j) => s + j, 0) / mes.length * 1000) / 10 : null;
  return `<div class="card sapp"><div class="sa-h">${B(k, 40)}<div><b>${nom}</b><small>${k === 'fixpro' ? 'fixproguinee.com' : 'scolaris-murex.vercel.app'}</small></div><span class="tag ${cl}"><i class="dot puls" style="background:${c}"></i>${a.statut === 'ok' ? 'En ligne' : lib}</span></div>
  <div class="sa-st"><div><span>Réponse</span><b class="num">${a.ms ? a.ms + ' ms' : '—'}</b></div><div><span>Disponibilité${mes.length && mes.length < 30 ? ` · ${mes.length} j` : ' 30 j'}</span><b class="num">${dispo === null ? '—' : String(dispo).replace('.', ',') + ' %'}</b></div><div><span>Erreurs 24 h</span><b class="num ${a.erreurs ? 'dn' : ''}">${a.erreurs === undefined ? '—' : F(a.erreurs)}</b></div></div>
  ${blocPouls(k, a)}${a.bd ? blocBD(a.bd) : ''}
  ${barresDispo(a.jours)}
  <div class="sa-f">${I.fusee}<span>${a.deploy ? `Dernière mise en ligne <b class="${a.deploy.ok ? 'up' : 'dn'}">${a.deploy.ok ? 'réussie' : 'échouée'}</b> · ${ilYa(a.deploy.quand)}` : 'Mise en ligne : —'}</span></div></div>`;
}
function blocPouls(k, a) {
  const P = ((S.pouls || {})[k] || []); const w = 300, h = 46;
  const vals = P.map(v => v === null ? null : v); const ok = vals.filter(v => v !== null);
  const lo = ok.length ? Math.min(...ok) * 0.7 : 0, hi = ok.length ? Math.max(...ok) * 1.15 : 1; const st = w / Math.max(vals.length - 1, 1);
  const pts = vals.map((v, i) => v === null ? null : [vals.length === 1 ? w : i * st, h - 6 - ((v - lo) / Math.max(hi - lo, 1)) * (h - 12)]);
  let d = ''; pts.forEach((p, i) => { if (p) d += (d && pts[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); });
  const der = ok.length ? ok[ok.length - 1] : null; const lent = der !== null && der > 3000; const col = der === null && P.length ? '#F04438' : lent ? '#F79009' : '#12B76A';
  const last = pts.filter(Boolean).slice(-1)[0];
  return `<div class="pouls"><div class="pl-h"><span><i class="pl-dot" style="--pc:${col}"></i>Pouls en direct</span><b class="num">${der !== null ? der + ' ms' : (P.length ? 'injoignable' : '…')}</b></div>
  <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none"><path d="M0,${h - 6} H${w}" stroke="#EEF1F6" stroke-dasharray="3 4"/>${d ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ''}${last ? `<circle cx="${last[0] - 3}" cy="${last[1]}" r="3.5" fill="${col}"/>` : ''}</svg>
  <div class="pl-b"><span>vérifié toutes les 20 s</span><span>${ok.length ? 'moyenne ' + Math.round(ok.reduce((x, y) => x + y, 0) / ok.length) + ' ms' : ''}</span></div></div>`;
}
function blocBD(b) {
  const lim = b.limite_mo || 500, p = Math.min(100, b.taille_mo / lim * 100), col = p > 85 ? '#F04438' : p > 65 ? '#F79009' : '#2F5BF5';
  return `<div class="bdx"><div class="pl-h"><span>${I.bd}Base de données</span><b class="num">${String(b.taille_mo).replace('.', ',')} Mo <small>/ ${lim} Mo</small></b></div><div class="bar" style="height:8px"><i style="width:${Math.max(p, 1.5)}%;background:${col}"></i></div><div class="pl-b"><span>${Math.round(100 - p)} % de place libre (offre gratuite)</span><span>${b.connexions !== undefined ? b.connexions + ' connexions' : ''}</span></div></div>`;
}
function blocSecurite(X) {
  const sec = (X.d.sante || {}).securite; if (!sec) return '';
  const apps = [['scolaris', 'Scolaris'], ['fixpro', 'FixPro']].filter(([k]) => (S.quoi === 'tous' || S.quoi === k) && sec[k]);
  const acor = apps.flatMap(([k, n]) => (sec[k].a_corriger || []).map(x => ({ ...x, app: n, k })));
  const normaux = apps.reduce((t, [k]) => t + (sec[k].normaux || 0), 0);
  const col = acor.length ? '#F79009' : '#12B76A';
  return `<div class="card"><div class="ct"><h3>Sécurité</h3><span class="tag ${acor.length ? 'or' : 'ok'}">${acor.length ? pl(acor.length, 'point à corriger', 'points à corriger') : 'Rien à corriger'}</span></div>
  <div class="secx"><div class="sx-ic" style="--xc:${col}">${I.cadenasI}</div><div><b>${F(normaux + acor.length)} contrôles passés</b><small>${F(normaux)} conformes · ${acor.length} à corriger · vérifié par Supabase</small></div></div>
  ${acor.map(x => `<div class="row rw">${B(x.k, 32)}<div><b>${esc(x.titre)}</b><small>${esc(x.detail)}</small></div><span class="tag or">${x.app}</span></div>`).join('')}</div>`;
}
function blocErreurs(X) {
  const sa = X.d.sante || {}; const L = [];
  [['fixpro', 'FixPro'], ['scolaris', 'Scolaris']].forEach(([k, n]) => { if (S.quoi === 'tous' || S.quoi === k) ((sa[k] || {}).erreurs_liste || []).forEach(e => L.push({ ...e, k, n })); });
  L.sort((a, b) => D(b.quand) - D(a.quand));
  return `<div class="card"><div class="ct"><h3>Dernières erreurs</h3><span class="s">24 h</span></div>${L.length ? L.slice(0, 8).map(e => `<div class="row">${B(e.k, 32)}<div><b>${esc(e.message || 'Erreur')}</b><small>${esc(e.n)}${e.page ? ' · ' + esc(e.page) : ''}</small></div><div class="r"><small style="color:var(--m2)">${ilYa(e.quand)}</small></div></div>`).join('') : `<div class="vide-g"><div class="vg-ic" style="background:#ECFDF3;color:#079455">${I.vert}</div><b>Aucune erreur</b><span>Aucun utilisateur n'a rencontré de bug ces dernières 24 h.</span></div>`}</div>`;
}
function pageSante(X) {
  const H = santeX(X);
  return `${filtres()}${blocSanteBandeau(X)}
  <div class="g11">${H.apps.map(([k, n, a]) => blocSanteApp(k, n, a)).join('')}</div>
  <div class="g11"><div class="card"><div class="ct"><h3>Services</h3><span class="s">${H.services.filter(x => x.etat === 'ok').length}/${H.services.length} opérationnels</span></div>
  ${H.services.map(x => { const [c, lib, cl] = ETAT[x.etat]; return `<div class="row"><span class="ico" style="background:${c}1A;color:${c}">${I[x.k] || I.bd}</span><div><b>${esc(x.nom)}</b><small>${esc(x.info)}</small></div><span class="tag ${cl}">${lib}</span></div>`; }).join('')}</div>
  <div class="col">${blocSecurite(X)}${blocErreurs(X)}</div></div>
  <div class="g11"><div class="card"><div class="ct"><h3>Incidents récents</h3><span class="s">7 jours</span></div>${H.incidents.length ? H.incidents.map(i => `<div class="row"><span class="ico" style="background:${ETAT[i.etat || 'att'][0]}1A;color:${ETAT[i.etat || 'att'][0]}">${i.etat === 'ko' ? I.rouge : I.att}</span><div><b>${esc(i.titre)}</b><small>${esc(i.detail || '')}</small></div><div class="r"><small style="color:var(--m2)">${ilYa(i.quand)}</small></div></div>`).join('') : `<div class="vide-g"><div class="vg-ic" style="background:#ECFDF3;color:#079455">${I.vert}</div><b>Aucun incident</b><span>Pas de panne ni d'erreur grave ces 7 derniers jours.</span></div>`}</div></div>`;
}
async function pinger() {
  const t = async u => { const d = performance.now(); try { await fetch(u, { mode: 'no-cors', cache: 'no-store' }); return { ok: true, ms: Math.max(1, Math.round(performance.now() - d)) }; } catch (e) { return { ok: false }; } };
  const [fx, sc] = await Promise.all([t(LIEN.fixpro + '/?ping=' + Date.now()), t('https://scolaris-murex.vercel.app/?ping=' + Date.now())]);
  S.ping = { fixpro: fx, scolaris: sc }; S.pingT = new Date().toISOString();
  S.pouls = S.pouls || { fixpro: [], scolaris: [] };
  [['fixpro', fx], ['scolaris', sc]].forEach(([k, p]) => { S.pouls[k].push(p.ok ? p.ms : null); if (S.pouls[k].length > 24) S.pouls[k].shift(); });
  rendre();
}
function rendre() {
  const y = window.scrollY;
  $app.innerHTML = S.session ? vueApp() : vueConnexion();
  if (S.session) window.scrollTo(0, y);
}

/* ---------- événements ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-quoi],[data-per],[data-act]'); if (!b) return;
  if (b.dataset.quoi) { S.quoi = b.dataset.quoi; store('pilotage_vue', { quoi: S.quoi, per: S.per }); rendre(); }
  else if (b.dataset.per) { S.per = b.dataset.per; store('pilotage_vue', { quoi: S.quoi, per: S.per }); rendre(); }
  else if (b.dataset.act === 'maj') charger();
  else if (b.dataset.act === 'ping') pinger();
  else if (b.dataset.act === 'sortir') deconnexion();
  else if (b.dataset.act === 'mode') { S.mode = S.mode === 'activer' ? '' : 'activer'; S.err = ''; S.oeil = false; rendre(); }
  else if (b.dataset.act === 'oeil') { const i = document.querySelector('input[name=mdp]'); S.oeil = !S.oeil; if (i) i.type = S.oeil ? 'text' : 'password'; }
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'fact') return activer(e);
  if (e.target.id !== 'fcx') return; e.preventDefault();
  const f = new FormData(e.target); S.err = ''; S.charge = true;
  const btn = e.target.querySelector('.cta'); btn.disabled = true; btn.textContent = 'Connexion…';
  try { await auth({ email: await emailDe(f.get('ident')), password: f.get('mdp') }, 'password'); S.charge = false; await charger(); }
  catch (er) { S.charge = false; S.err = /invalid/i.test(er.message) ? 'Identifiant ou mot de passe incorrect.' : er.message; rendre(); const i = document.querySelector('input[name=ident]'); if (i) i.value = f.get('ident'); }
});
async function emailDe(id) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(id || '').trim().toLowerCase()));
  return 'p' + [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 24) + '@pilotage-admin.app';
}
async function activer(e) {
  e.preventDefault(); const f = new FormData(e.target); const ident = String(f.get('ident')).trim(), mdp = String(f.get('mdp')), code = String(f.get('code')).trim();
  const remettre = () => { const g = document.getElementById('fact'); if (g) { g.code.value = code; g.ident.value = ident; } };
  S.err = ''; S.charge = true; rendre(); remettre();
  if (ident.length < 3) { S.charge = false; S.err = "L'identifiant doit faire au moins 3 caractères."; rendre(); remettre(); return; }
  if (mdp.length < 10) { S.charge = false; S.err = 'Le mot de passe doit faire au moins 10 caractères.'; rendre(); remettre(); return; }
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/pilotage_activer`, { method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code, p_identifiant: ident, p_mdp: mdp }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || 'Erreur');
    if (j !== true) throw new Error("Code d'activation incorrect.");
    S.mode = ''; await auth({ email: await emailDe(ident), password: mdp }, 'password'); S.charge = false; await charger();
  } catch (er) { S.charge = false; S.err = er.message; rendre(); remettre(); }
}
window.addEventListener('hashchange', () => { S.page = (location.hash.slice(1) || 'accueil'); if (S.page === 'activer') { S.mode = 'activer'; S.page = 'accueil'; } window.scrollTo(0, 0); rendre(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.session && (!S.vu || Date.now() - S.vu > 6e4)) charger(true); });
setInterval(() => { if (!document.hidden && S.session) charger(true); }, 5 * 6e4);
setInterval(() => { if (!document.hidden && S.session && S.page === 'sante') pinger(); }, 20000);

/* ---------- démarrage ---------- */
(function () {
  S.session = lire('pilotage_session'); const v = lire('pilotage_vue') || {}; S.quoi = v.quoi || 'tous'; S.per = v.per || 'tout';
  S.page = location.hash.slice(1) || 'accueil';
  if (S.page === 'activer') { S.mode = 'activer'; S.page = 'accueil'; }
  const c = lire('pilotage_cache'); if (S.session && c && c.d) { S.data = c.d; S.vu = new Date(c.t); }
  rendre(); if (S.session) { charger(!!S.data); pinger(); }
})();
