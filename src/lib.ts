export const nb = (n: any) => Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
// Pays africains : indicatif, monnaie, chiffres du numéro national. Les prix Scolaris sont fixés en FCFA puis convertis.
export type Pays = { c: string; nom: string; ind: string; dev: string; ch: number; mn: number; z: boolean; zone: string; ex: string };
// Pays où l'on peut payer par Orange Money ou MTN Mobile Money (et par carte). Mêmes règles que la base (table pays_ref).
const P = (c: string, nom: string, ind: string, dev: string, mn: number, ch: number, z: boolean, zone: string, ex: string): Pays => ({ c, nom, ind, dev, mn, ch, z, zone, ex });
const O = "Afrique de l'Ouest", C = 'Afrique centrale', E = "Afrique de l'Est et australe", N = 'Afrique du Nord';
export const PAYS: Pays[] = [
  P('GN', 'Guinée', '224', 'GNF', 9, 9, false, O, '621 34 56 78'), P('SN', 'Sénégal', '221', 'XOF', 9, 9, false, O, '77 640 21 93'),
  P('CI', "Côte d'Ivoire", '225', 'XOF', 10, 10, false, O, '07 08 41 29 65'), P('ML', 'Mali', '223', 'XOF', 8, 8, false, O, '76 40 21 93'),
  P('BF', 'Burkina Faso', '226', 'XOF', 8, 8, false, O, '70 40 21 93'), P('BJ', 'Bénin', '229', 'XOF', 10, 10, false, O, '01 97 40 21 93'),
  P('GW', 'Guinée-Bissau', '245', 'XOF', 9, 9, false, O, '955 40 21 93'), P('SL', 'Sierra Leone', '232', 'SLE', 8, 8, true, O, '76 40 21 93'),
  P('LR', 'Liberia', '231', 'LRD', 8, 9, true, O, '77 040 21 93'), P('GH', 'Ghana', '233', 'GHS', 9, 9, true, O, '24 481 09 36'),
  P('NG', 'Nigeria', '234', 'NGN', 10, 10, true, O, '803 418 22 96'),
  P('CM', 'Cameroun', '237', 'XAF', 9, 9, false, C, '6 71 40 21 93'), P('CG', 'Congo', '242', 'XAF', 9, 9, false, C, '06 640 21 93'),
  P('CD', 'RD Congo', '243', 'CDF', 9, 9, true, C, '81 640 21 93'), P('CF', 'Centrafrique', '236', 'XAF', 8, 8, false, C, '70 40 21 93'),
  P('RW', 'Rwanda', '250', 'RWF', 9, 9, true, E, '78 640 21 93'), P('UG', 'Ouganda', '256', 'UGX', 9, 9, true, E, '772 40 21 93'),
  P('ZM', 'Zambie', '260', 'ZMW', 9, 9, true, E, '96 640 21 93'), P('MG', 'Madagascar', '261', 'MGA', 9, 9, true, E, '32 40 214 93'),
  P('BW', 'Botswana', '267', 'BWP', 8, 8, false, E, '71 40 21 93'),
  P('MA', 'Maroc', '212', 'MAD', 9, 9, true, N, '612 40 21 93'), P('TN', 'Tunisie', '216', 'TND', 8, 8, false, N, '20 40 21 93'),
];
export const paysDe = (c: any) => PAYS.find((p) => p.c === c) || PAYS[0];
// Symbole affiché : FCFA pour les deux francs CFA, sinon le code de la monnaie.
export const symbole = (dev: string) => (dev === 'XOF' || dev === 'XAF' ? 'FCFA' : dev);
let ACTIF: Pays = PAYS[0];
export const paysActif = () => ACTIF;
export function choisirPays(c: any) { ACTIF = paysDe(c); }
// Montant dans la monnaie de l'école (le nom gnf est gardé pour ne rien casser).
export const gnf = (n: any) => `${nb(n)} ${symbole(ACTIF.dev)}`;
export const dv = () => symbole(ACTIF.dev);
export const fcfa = (n: any) => `${nb(n)} FCFA`;
export const drapeau = (c: string) => String.fromCodePoint(...[...c.toUpperCase()].map((x) => 0x1f1e6 + x.charCodeAt(0) - 65));
// Prix fixé en FCFA -> monnaie du pays, arrondi proprement (GNF au millier).
export function convertir(f: any, dev: string, taux: any): number | null {
  if (f == null) return null; const v = Number(f) * (dev === 'XOF' || dev === 'XAF' ? 1 : Number(taux?.[dev]) || 0); if (!v) return null;
  if (dev === 'XOF' || dev === 'XAF') return Math.round(v);
  const pas = dev === 'GNF' ? 1000 : Math.max(1, 10 ** (Math.floor(Math.log10(v)) - 2)); return Math.round(v / pas) * pas;
}
export const entier = (s: any) => Number(String(s ?? '').replace(/\D/g, '')) || 0;
export const dateFr = (d: any) => (d ? new Date(String(d).length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('fr-FR') : '');
export const heure = (d: any) => (d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
export const TRANCHES: [string, string][] = [['t_100', "Jusqu'à 100 élèves"], ['t_200', '101 à 200 élèves'], ['t_300', '201 à 300 élèves'], ['t_400', '301 à 400 élèves'], ['t_500', '401 à 500 élèves'], ['t_700', '501 à 700 élèves'], ['t_1000', '701 à 1 000 élèves'], ['plus_1000', 'Plus de 1 000 élèves']];
export const trancheDe = (n: number) => (n <= 100 ? 't_100' : n <= 200 ? 't_200' : n <= 300 ? 't_300' : n <= 400 ? 't_400' : n <= 500 ? 't_500' : n <= 700 ? 't_700' : n <= 1000 ? 't_1000' : 'plus_1000');
export const auj = () => new Date().toISOString().slice(0, 10);
export const tel = (v: any) => { let t = String(v ?? '').replace(/\D/g, '').replace(/^00/, ''); const p = ACTIF; if (p.c === 'GN') return t.replace(/^224(?=\d{9}$)/, ''); const n = t.length - p.ind.length; if (t.startsWith(p.ind) && n >= p.mn && n <= p.ch) return t.slice(p.ind.length); if (p.z && t.startsWith('0') && t.length - 1 >= p.mn && t.length - 1 <= p.ch) return t.slice(1); return t; };
// Numéro guinéen (+224) : 9 chiffres, mobile 61 à 69, fixe 3x pour une école. Mêmes règles que la base.
export function erreurTel(v: any, fixe = false): string {
  const t = tel(v); if (!t) return '';
  if (!/^\d+$/.test(t)) return 'Le numéro ne doit contenir que des chiffres';
  if (/(\d)\1{6}/.test(t) || /1234567|2345678|3456789|9876543|8765432|7654321/.test(t)) return 'Ce numéro semble faux. Saisissez un vrai numéro.';
  if (ACTIF.c !== 'GN') return t.length >= ACTIF.mn && t.length <= ACTIF.ch ? '' : `Un numéro (${ACTIF.nom}) a ${ACTIF.mn === ACTIF.ch ? ACTIF.ch : `${ACTIF.mn} ou ${ACTIF.ch}`} chiffres, sans le +${ACTIF.ind} (vous en avez ${t.length})`;
  return erreurTelGn(t, fixe);
}
function erreurTelGn(t: string, fixe: boolean): string {
  if (t.length !== 9) return `Un numéro guinéen a 9 chiffres (vous en avez ${t.length})`;
  if (!(/^6[1-9]/.test(t) || (fixe && /^3/.test(t)))) return fixe ? 'Numéro guinéen invalide : il doit commencer par 6 (mobile) ou 3 (fixe)' : 'Numéro guinéen invalide : il doit commencer par 61 à 69 (Orange, MTN, Cellcom)';
  if (/(\d)\1{6}/.test(t) || /1234567|2345678|3456789|9876543|8765432|7654321/.test(t)) return 'Ce numéro semble faux. Saisissez un vrai numéro.';
  return '';
}
export const telAff = (v: any) => { const t0 = String(v ?? ''); if (!/^\d+$/.test(t0)) return t0; const ex = PAYS.find((p) => p.c !== 'GN' && p.c !== ACTIF.c && t0.startsWith(p.ind) && t0.length - p.ind.length >= p.mn && t0.length - p.ind.length <= p.ch); if (ex) { const n = t0.slice(ex.ind.length); const d = n.length % 2 ? 3 : 2; return `+${ex.ind} ${[n.slice(0, d), ...(n.slice(d).match(/\d{2}/g) || [])].join(' ')}`; } if (ACTIF.c === 'GN' && t0.length === 9) return `${t0.slice(0, 3)} ${t0.slice(3, 5)} ${t0.slice(5, 7)} ${t0.slice(7)}`; const t = tel(t0); const d = t.length % 2 ? 3 : 2; const g = [t.slice(0, d), ...(t.slice(d).match(/\d{2}/g) || [])].join(' '); return t !== t0 ? `+${ACTIF.ind} ${g}` : g; };
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

// Mois de l'année scolaire : [{cle:'2026-10', label:'Oct'}…]
export function moisAnnee(a: any) {
  const l: { cle: string; label: string }[] = [];
  const d = new Date(a.date_debut + 'T00:00:00'); const f = new Date(a.date_fin + 'T00:00:00');
  for (let y = d.getFullYear(), m = d.getMonth(); y < f.getFullYear() || (y === f.getFullYear() && m <= f.getMonth());) {
    l.push({ cle: `${y}-${String(m + 1).padStart(2, '0')}`, label: MOIS[m] });
    if (++m === 12) { m = 0; y++; }
  }
  return l;
}

export function parMois(a: any, lignes: any[], champDate: string, jusquAujourdhui = false) {
  const t: Record<string, number> = {};
  for (const l of lignes) { const k = String(l[champDate]).slice(0, 7); t[k] = (t[k] || 0) + Number(l.montant); }
  const fin = auj().slice(0, 7);
  return moisAnnee(a).filter((m) => !jusquAujourdhui || m.cle <= fin).map((m) => ({ label: m.label, cle: m.cle, valeur: t[m.cle] || 0 }));
}

// Excel : fichier .xlsx réel, sans dépendance
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b: Uint8Array) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(fichiers: Record<string, string>) {
  const enc = new TextEncoder(); const morceaux: Uint8Array[] = []; const central: Uint8Array[] = []; let pos = 0;
  const u16 = (n: number) => [n & 255, n >> 8]; const u32 = (n: number) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24];
  for (const [nom, txt] of Object.entries(fichiers)) {
    const n = enc.encode(nom), d = enc.encode(txt), c = crc(d);
    const com = [20, 0, 0, 8, 0, 0, 0, 0, 33, 0, ...u32(c), ...u32(d.length), ...u32(d.length), ...u16(n.length), 0, 0];
    const loc = new Uint8Array([0x50, 0x4b, 3, 4, ...com, ...n, ...d]);
    morceaux.push(loc);
    central.push(new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, ...com, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(pos), ...n]));
    pos += loc.length;
  }
  const tc = central.reduce((s, x) => s + x.length, 0); const k = Object.keys(fichiers).length;
  const fin = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(k), ...u16(k), ...u32(tc), ...u32(pos), 0, 0]);
  return new Blob([...morceaux, ...central, fin] as any, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
const esc = (s: any) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const col = (i: number) => { let s = ''; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };

export function telechargerExcel(nom: string, lignes: any[][]) {
  const rows = lignes.map((l, r) => `<row r="${r + 1}">${l.map((v, c) => typeof v === 'number'
    ? `<c r="${col(c)}${r + 1}"><v>${v}</v></c>`
    : `<c r="${col(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`).join('')}</row>`).join('');
  const b = zip({
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Scolaris" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`,
  });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${nom}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// Lecture des fichiers importés
function csv(txt: string): string[][] {
  const sep = (txt.split('\n')[0].match(/;/g) || []).length >= (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const r: string[][] = []; let l: string[] = [], c = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const x = txt[i];
    if (q) { if (x === '"' && txt[i + 1] === '"') { c += '"'; i++; } else if (x === '"') q = false; else c += x; }
    else if (x === '"') q = true;
    else if (x === sep) { l.push(c); c = ''; }
    else if (x === '\n') { l.push(c.replace(/\r$/, '')); r.push(l); l = []; c = ''; }
    else c += x;
  }
  if (c || l.length) { l.push(c.replace(/\r$/, '')); r.push(l); }
  return r.filter((x) => x.some((v) => v.trim()));
}

async function deziper(buf: ArrayBuffer) {
  const v = new DataView(buf); let e = buf.byteLength - 22;
  while (e >= 0 && v.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Fichier Excel illisible');
  const n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true);
  const res: Record<string, string> = {}; const dec = new TextDecoder();
  for (let i = 0; i < n; i++) {
    const meth = v.getUint16(p + 10, true), taille = v.getUint32(p + 20, true), ln = v.getUint16(p + 28, true), lx = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
    const nom = dec.decode(new Uint8Array(buf, p + 46, ln));
    if (/sharedStrings\.xml$|worksheets\/sheet1\.xml$/.test(nom)) {
      const d = off + 30 + v.getUint16(off + 26, true) + v.getUint16(off + 28, true);
      const brut = new Uint8Array(buf, d, taille);
      res[nom] = meth === 0 ? dec.decode(brut) : await new Response(new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    p += 46 + ln + lx + lc;
  }
  return res;
}

async function xlsx(buf: ArrayBuffer): Promise<string[][]> {
  const f = await deziper(buf); const P = new DOMParser();
  const partages = f['xl/sharedStrings.xml'] ? [...P.parseFromString(f['xl/sharedStrings.xml'], 'text/xml').getElementsByTagName('si')].map((s) => [...s.getElementsByTagName('t')].map((t) => t.textContent).join('')) : [];
  const feuille = f['xl/worksheets/sheet1.xml']; if (!feuille) throw new Error('Feuille Excel introuvable');
  const lignes: string[][] = [];
  for (const row of P.parseFromString(feuille, 'text/xml').getElementsByTagName('row')) {
    const l: string[] = [];
    for (const c of row.getElementsByTagName('c')) {
      const m = (c.getAttribute('r') || 'A').match(/[A-Z]+/)![0]; let idx = 0; for (const ch of m) idx = idx * 26 + ch.charCodeAt(0) - 64;
      const t = c.getAttribute('t'); const val = c.getElementsByTagName('v')[0]?.textContent ?? '';
      l[idx - 1] = t === 's' ? partages[Number(val)] ?? '' : t === 'inlineStr' ? c.getElementsByTagName('t')[0]?.textContent ?? '' : val;
    }
    lignes.push(Array.from(l, (x) => x ?? ''));
  }
  return lignes.filter((x) => x.some((v) => String(v).trim()));
}

export async function lireTableau(f: File) {
  if (/\.xlsx$/i.test(f.name)) return xlsx(await f.arrayBuffer());
  if (/\.csv$/i.test(f.name)) return csv((await f.text()).replace(/^﻿/, ''));
  throw new Error('Format accepté : .xlsx ou .csv');
}

// Classes rangées comme dans une école : Maternelle, Primaire, Collège, Lycée, puis dans l'ordre des années.
const sansAccent = (s: any) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const NIVEAUX_ORDRE = ['maternelle', 'primaire', 'college', 'lycee'];
function niveauDeduit(nom: string) {
  const n = sansAccent(nom);
  if (/section|maternelle/.test(n)) return 'maternelle';
  if (/^(cp|ce|cm)\s?\d?/.test(n)) return 'primaire';
  if (/terminale|^tle|^(11|12)\s?e|seconde|^2n?de/.test(n)) return 'lycee';
  if (/^(7|8|9|10)\s?e/.test(n)) return 'college';
  return '';
}
export const rangNiveau = (niveau: any, nom = '') => { const i = NIVEAUX_ORDRE.indexOf(sansAccent(niveau) || niveauDeduit(nom)); return i < 0 ? 9 : i; };
function rangClasse(nom: string, niveau: any) {
  const n = sansAccent(nom); const nv = NIVEAUX_ORDRE[rangNiveau(niveau, nom)] || '';
  if (/terminale|^tle/.test(n)) return 99;
  if (/petite/.test(n)) return 1; if (/moyenne/.test(n)) return 2; if (/grande/.test(n)) return 3;
  const p = n.match(/^(cp|ce|cm)\s?(\d)?/); if (p) return { cp: 10, ce: 12, cm: 14 }[p[1] as 'cp']! + Math.max(Number(p[2] || 1) - 1, 0);
  if (/^(seconde|2n?de)/.test(n)) return 40; if (nv === 'lycee' && /^(1ere|premiere|1re)/.test(n)) return 41;
  const m = n.match(/^(\d{1,2})/); if (m) { const x = Number(m[1]); return nv === 'college' && x <= 6 ? 10 + (6 - x) : 20 + x; }
  return 60;
}
export const nomNiveau = (c: any) => c?.niveaux?.nom || c?.niveau || '';
export function trierClasses<T>(l: T[], niv: (c: T) => any = nomNiveau, nom: (c: T) => string = (c: any) => c.nom): T[] {
  return [...l].sort((a, b) => rangNiveau(niv(a), nom(a)) - rangNiveau(niv(b), nom(b)) || rangClasse(nom(a), niv(a)) - rangClasse(nom(b), niv(b)) || nom(a).localeCompare(nom(b), 'fr', { numeric: true }));
}
const LIB_NIV = ['Maternelle', 'Primaire', 'Collège', 'Lycée'];
export function grouperClasses<T>(l: T[], niv: (c: T) => any = nomNiveau, nom: (c: T) => string = (c: any) => c.nom): [string, T[]][] {
  const r: [string, T[]][] = [];
  for (const c of trierClasses(l, niv, nom)) { const lib = niv(c) || LIB_NIV[rangNiveau('', nom(c))] || 'Autres'; const g = r.find((x) => x[0] === lib); if (g) g[1].push(c); else r.push([lib, [c]]); }
  return r;
}
