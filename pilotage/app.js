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
  accueil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  argent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.8"/><path d="M6 10v5M18 10v5"/></svg>',
  reseaux: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  activite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  reglages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>',
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
const kpi = (lab, v, u, d) => `<div class="card kpi"><div class="lab">${lab}</div><div class="v num">${v}${u ? `<small>${u}</small>` : ''}</div><div class="d">${d}</div></div>`;
function blocHero(X, titre, montant, detail) {
  const t = X.totFx + X.totSc, pf = t ? Math.round(X.totFx / t * 100) : 0, ps = t ? 100 - pf : 0;
  return `<div class="card hero kpi"><div class="lab">${titre}</div><div class="v num">${F(montant)}<small>GNF</small></div><div class="d">${detail}</div>
  <div class="split">${t ? `<i style="width:${pf}%;background:#5B9BFF"></i><i style="width:${ps}%;background:#3DDC97"></i>` : ''}</div>
  <div class="leg"><span><i class="dot" style="background:#5B9BFF"></i>FixPro ${t ? pf + ' %' : '0'}</span><span><i class="dot" style="background:#3DDC97"></i>Scolaris ${t ? ps + ' %' : '0'}</span></div></div>`;
}
function blocKpis(X) {
  const diff = X.moisPrec ? Math.round((X.mois - X.moisPrec) / X.moisPrec * 100) : null;
  const actifs = (S.quoi !== 'scolaris' ? X.actifsFx : 0) + (S.quoi !== 'fixpro' ? X.actifsSc : 0);
  const inscr = (S.quoi !== 'scolaris' ? X.comptesFx : 0) + (S.quoi !== 'fixpro' ? X.ecoles.length : 0);
  const nMois = (S.quoi !== 'scolaris' ? ((X.fx.comptes || []).find(c => c.mois === cleMois(X.now)) || {}).n || 0 : 0) + (S.quoi !== 'fixpro' ? X.ecoles.filter(e => cleMois(D(e.cree_le)) === cleMois(X.now)).length : 0);
  const pages = S.quoi !== 'scolaris' ? X.fx.pages_30j || 0 : 0;
  return `<div class="k2">
    ${kpi(`Encaissé en ${MOIS[X.now.getMonth()].replace('.', '')}`, F(X.mois), 'GNF', diff === null ? (X.moisPrec ? '' : 'Rien le mois dernier') : `<b class="${diff >= 0 ? 'up' : 'dn'}">${diff >= 0 ? '+' : ''}${diff} %</b> vs mois dernier`)}
    ${kpi('Abonnés actifs', F(actifs), '', S.quoi === 'fixpro' ? 'techniciens' : S.quoi === 'scolaris' ? 'écoles' : 'techniciens + écoles')}
    ${kpi('Visiteurs · 30 j', F(X.visit30), '', pages ? `${F(pages)} pages vues` : 'personnes différentes')}
    ${kpi('Inscriptions', F(inscr), '', `<b>${nMois ? '+' + nMois : '0'}</b> ce mois-ci`)}
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
  ${barres(series, LARG(700), h)}${vide ? '<div class="pied">Aucun vrai paiement sur ces 6 mois. Le premier apparaîtra ici.</div>' : ''}</div>`;
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
  if (!L.length) return `<div class="card"><div class="ct"><h3>D'où viennent les visiteurs</h3></div><div class="vide"><div class="logos-gris">${['tiktok', 'facebook', 'whatsapp', 'youtube'].map(k => B(k, 34)).join('')}</div><b>Pas encore de données</b>Le suivi des réseaux s'active quand les mises à jour de FixPro et de Scolaris sont publiées.</div></div>`;
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
  if (!L.length) return `<div class="card"><div class="ct"><h3>Du réseau au paiement</h3></div><div class="vide"><div class="logos-gris">${['tiktok', 'facebook', 'whatsapp', 'youtube'].map(k => B(k, 34)).join('')}</div><b>En attente des premières données</b>Chaque visite sera rattachée au réseau d'où elle vient (TikTok, Facebook, WhatsApp, YouTube…), puis suivie jusqu'à l'inscription et au paiement.</div></div>`;
  return `<div class="card"><div class="ct"><h3>Du réseau au paiement</h3><span class="s">90 jours</span></div>${L.map(x => `<div class="row">${B(x.k)}<div><b>${SOURCES[x.k][0]}</b><small>${pl(x.visites, 'visite')} · ${pl(x.inscrits, 'inscrit')} · ${pl(x.payants, 'payant')}</small></div><div class="r num">${F(x.argent)}<small>GNF</small></div></div>`).join('')}</div>`;
}
function blocConseil(X) {
  const L = Object.entries(X.src).map(([k, v]) => ({ k, ...v }));
  let t = "Quand le suivi sera actif, Pilotage te dira quel réseau t'amène des clients <b>qui paient</b>, pas seulement des vues.";
  if (L.length) { const best = L.slice().sort((a, b) => (b.argent - a.argent) || (b.inscrits - a.inscrits) || (b.visites - a.visites))[0]; const nom = SOURCES[best.k][0];
    t = best.argent ? `<b>${nom}</b> t'a rapporté le plus d'argent (${F(best.argent)} GNF). Publie plus là-bas.` : best.inscrits ? `<b>${nom}</b> t'amène le plus d'inscriptions (${best.inscrits}). Pousse-les vers le paiement.` : `<b>${nom}</b> t'amène le plus de visites. Mets ton lien d'inscription bien en vue.`; }
  return `<div class="card conseil"><b style="font-size:13.5px">💡 Conseil</b><p>${t}</p></div>`;
}

/* ---------- pages ---------- */
const PAGES = [['accueil', 'Tableau de bord', 'Accueil'], ['argent', 'Argent', 'Argent'], ['reseaux', 'Réseaux', 'Réseaux'], ['activite', 'Activité', 'Activité'], ['reglages', 'Réglages', 'Réglages']];
function filtres(per) {
  const seg = (cle, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-${cle}="${v}" class="${S[cle] === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  return `<div class="filtres">${seg('quoi', [['tous', 'Les 2 apps'], ['fixpro', 'FixPro'], ['scolaris', 'Scolaris']])}${per ? seg('per', [['7', '7 j'], ['30', '30 j'], ['90', '3 mois'], ['tout', 'Tout']]) : ''}</div>`;
}
function pageAccueil(X) {
  return `${filtres()}
  <div class="g-kpi">${blocHero(X, 'Revenu total encaissé', X.total, X.payA.length ? `${pl(X.payA.length, 'paiement')} · panier moyen ${F(X.total / X.payA.length)} GNF` : 'Aucun vrai paiement encore')}${blocKpis(X)}</div>
  <div class="g21">${blocRevenus(X, 230)}${blocTaches(X, 4)}</div>
  <div class="g111">${blocVisiteurs(X, 150)}${blocSources(X, 140)}${blocApps(X)}</div>
  <div class="g11">${blocDerniers(X, 6)}<div class="col">${S.quoi !== 'fixpro' ? blocEcoles(X) : blocVilles(X)}</div></div>
  <div class="g111">${blocComptes(X)}${blocVilles(X)}${blocActivite(X)}</div>`;
}
function pageArgent(X) {
  const t = X.payP.reduce((s, p) => s + p.gnf, 0);
  const lib = { '7': '7 derniers jours', '30': '30 derniers jours', '90': '3 derniers mois', tout: 'depuis le début' }[S.per];
  return `${filtres(1)}
  <div class="g21">${blocHero(X, 'Encaissé · ' + lib, t, X.payP.length ? `${pl(X.payP.length, 'paiement')} · panier moyen ${F(t / X.payP.length)} GNF` : 'Aucun vrai paiement sur cette période')}${kpi(`Encaissé en ${MOIS[X.now.getMonth()].replace('.', '')}`, F(X.mois), 'GNF', X.moisPrec ? `Mois dernier : ${F(X.moisPrec)} GNF` : 'Rien le mois dernier')}</div>
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
  const champ = (ic, nom, lab, type, ph, auto, oeil) => `<div class="fld"><span class="fi">${ic}</span><label><small>${lab}</small><input name="${nom}" type="${oeil ? (S.oeil ? 'text' : 'password') : type}" ${type === 'email' ? 'inputmode="email" autocapitalize="off"' : ''} autocomplete="${auto}" placeholder="${ph}" required></label>${oeil ? `<button type="button" class="oeil" data-act="oeil" aria-label="Afficher le mot de passe">${I.oeil}</button>` : ''}</div>`;
  const form = act
    ? `<form class="cx-form" id="fact" autocomplete="on"><h2>Mot de passe</h2><p class="s">Entre le code reçu et choisis ton mot de passe</p>
    ${champ(I.mail, 'email', 'Identifiant Pilotage', 'email', 'ton identifiant', 'username')}
    ${champ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h10M4 17h7"/></svg>', 'code', "Code d'activation", 'text', '8 caractères', 'one-time-code')}
    ${champ(I.cadenas, 'mdp', 'Nouveau mot de passe', 'password', '10 caractères minimum', 'new-password', 1)}
    ${S.err ? `<div class="err">${esc(S.err)}</div>` : ''}
    <button class="cta" type="submit" ${S.charge ? 'disabled' : ''}>${S.charge ? 'Enregistrement…' : 'Enregistrer et entrer'}</button>
    <p class="sur"><button type="button" class="lien" data-act="mode">← Retour à la connexion</button></p></form>`
    : `<form class="cx-form" id="fcx" autocomplete="on"><h2>Connexion</h2><p class="s">Accédez à votre tableau de bord</p>
    ${champ(I.mail, 'email', 'Identifiant Pilotage', 'email', 'ton identifiant', 'username')}
    ${champ(I.cadenas, 'mdp', 'Mot de passe', 'password', 'Votre mot de passe', 'current-password', 1)}
    ${S.err ? `<div class="err">${esc(S.err)}</div>` : ''}
    <button class="cta" type="submit" ${S.charge ? 'disabled' : ''}>${S.charge ? 'Connexion…' : 'Se connecter'}</button>
    <p class="sur"><button type="button" class="lien" data-act="mode">Première connexion ou mot de passe oublié ?</button></p>
    <p class="sur garde" style="margin-top:8px">${I.bouclier}Accès réservé à l'administrateur</p></form>`;
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
  const corps = { accueil: pageAccueil, argent: pageArgent, reseaux: pageReseaux, activite: pageActivite, reglages: pageReglages }[p[0]](X);
  return `<div class="cadre">
  <aside class="side"><div class="brand">${LOGO(36)}<div>${WM(18, '#fff')}<small>FixPro · Scolaris</small></div></div>
    <div class="gt">Vue d'ensemble</div>${PAGES.slice(0, 4).map(([k, , l]) => `<a href="#${k}" class="${S.page === k ? 'on' : ''}">${I[k]}${k === 'accueil' ? 'Tableau de bord' : l}${k === 'activite' && nT ? `<span class="cnt">${nT}</span>` : ''}</a>`).join('')}
    <div class="gt">Applications</div><a href="${LIEN.fixpro}" target="_blank" rel="noopener">${I.app}FixPro Guinée</a><a href="${LIEN.scolaris}" target="_blank" rel="noopener">${I.app}Scolaris</a>
    <div class="gt">Compte</div><a href="#reglages" class="${S.page === 'reglages' ? 'on' : ''}">${I.reglages}Réglages</a>
    <div class="me"><div class="av">${esc((S.session.email || 'A')[0].toUpperCase())}</div><div><b>${esc(S.session.email || 'Administrateur')}</b><small>Mis à jour à ${heure(S.vu || new Date())}</small></div></div></aside>
  <main><header class="entete">${LOGO(38)}<div><h1>${p[0] === 'accueil' ? 'Bonjour 👋' : p[1]}</h1><p>${p[0] === 'accueil' ? date : { argent: 'Ce qui rentre vraiment', reseaux: "D'où viennent les gens", activite: 'Paiements, inscriptions, alertes', reglages: 'Compte et informations' }[p[0]]}</p></div><div class="sp"></div>
    <button class="live ${vieux ? 'vieux' : ''}" data-act="maj" title="Actualiser"><i></i>${S.charge ? 'Mise à jour…' : vieux ? 'Actualiser' : 'En direct'}</button></header>
  <div class="page">${S.err ? `<div class="err" style="margin:0">${esc(S.err)}</div>` : ''}${corps}</div></main>
  <nav class="nav">${PAGES.map(([k, , l]) => `<a href="#${k}" class="${S.page === k ? 'on' : ''}">${I[k]}${l}${k === 'activite' && nT ? '<i class="pt"></i>' : ''}</a>`).join('')}</nav></div>`;
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
  else if (b.dataset.act === 'sortir') deconnexion();
  else if (b.dataset.act === 'mode') { S.mode = S.mode === 'activer' ? '' : 'activer'; S.err = ''; S.oeil = false; rendre(); }
  else if (b.dataset.act === 'oeil') { const i = document.querySelector('input[name=mdp]'); S.oeil = !S.oeil; if (i) i.type = S.oeil ? 'text' : 'password'; }
});
document.addEventListener('submit', async e => {
  if (e.target.id === 'fact') return activer(e);
  if (e.target.id !== 'fcx') return; e.preventDefault();
  const f = new FormData(e.target); S.err = ''; S.charge = true;
  const btn = e.target.querySelector('.cta'); btn.disabled = true; btn.textContent = 'Connexion…';
  try { await auth({ email: String(f.get('email')).trim(), password: f.get('mdp') }, 'password'); S.charge = false; await charger(); }
  catch (er) { S.charge = false; S.err = /invalid/i.test(er.message) ? 'E-mail ou mot de passe incorrect.' : er.message; rendre(); const i = document.querySelector('input[name=email]'); if (i) i.value = f.get('email'); }
});
async function activer(e) {
  e.preventDefault(); const f = new FormData(e.target); const email = String(f.get('email')).trim(), mdp = String(f.get('mdp'));
  S.err = ''; S.charge = true; rendre();
  const remettre = () => { const g = document.getElementById('fact'); if (g) { g.email.value = email; g.code.value = f.get('code'); } };
  if (mdp.length < 10) { S.charge = false; S.err = 'Le mot de passe doit faire au moins 10 caractères.'; rendre(); remettre(); return; }
  try {
    const r = await fetch(`${SB}/rest/v1/rpc/pilotage_activer`, { method: 'POST', headers: { apikey: CLE, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_email: email, p_code: String(f.get('code')).trim(), p_mdp: mdp }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.message || 'Erreur');
    if (j !== true) throw new Error('Code incorrect.');
    S.mode = ''; await auth({ email, password: mdp }, 'password'); S.charge = false; await charger();
  } catch (er) { S.charge = false; S.err = er.message; rendre(); remettre(); }
}
window.addEventListener('hashchange', () => { S.page = (location.hash.slice(1) || 'accueil'); window.scrollTo(0, 0); rendre(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.session && (!S.vu || Date.now() - S.vu > 6e4)) charger(true); });
setInterval(() => { if (!document.hidden && S.session) charger(true); }, 5 * 6e4);

/* ---------- démarrage ---------- */
(function () {
  S.session = lire('pilotage_session'); const v = lire('pilotage_vue') || {}; S.quoi = v.quoi || 'tous'; S.per = v.per || 'tout';
  S.page = location.hash.slice(1) || 'accueil';
  const c = lire('pilotage_cache'); if (S.session && c && c.d) { S.data = c.d; S.vu = new Date(c.t); }
  rendre(); if (S.session) charger(!!S.data);
})();
