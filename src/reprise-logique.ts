// Reprise des paiements reçus avant Scolaris : lecture du fichier de l'école,
// reconnaissance de chaque élève (matricule, puis nom), et calcul de ce qu'il reste à ajouter.
// Le fichier donne le TOTAL payé à ce jour par l'élève : Scolaris n'ajoute que la différence
// avec ce qui est déjà enregistré, donc un même paiement n'est jamais compté deux fois.

export type Col = 'matricule' | 'nom' | 'prenom' | 'complet' | 'classe';
export const COLS_R: [Col, string, RegExp][] = [
  ['matricule', 'Matricule', /matri|^code|identifiant/i],
  ['complet', 'Nom et prénom', /(nom.*pr[ée]nom|pr[ée]nom.*nom|nom\s*complet|noms?\s*et\s*pr)/i],
  ['prenom', 'Prénom', /pr[ée]nom/i],
  ['nom', 'Nom', /^\s*noms?\b|nom.*[ée]l[èe]ve|^[ée]l[èe]ve/i],
  ['classe', 'Classe', /classe|niveau/i],
];
// Colonnes de montant payé (on additionne toutes celles retenues : tranche 1, tranche 2…).
const MONTANT = /montant|pay|vers|tranche|scolarit|somme|r[ée]gl|acompte|avance|frais|encaiss|recu|reçu/i;
const PAS_MONTANT = /reste|restant|d[uû]\b|d[uû]\s|[àa]\s*payer|net|solde|date|t[ée]l|mode|moyen|r[ée]f|re[çc]u\s*n|n[°o]\s*re/i;

const nbf = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export const sans = (s: any) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ').trim();
const mots = (s: any) => sans(s).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
export const cleNom = (s: any) => mots(s).sort().join(' ');
// CCS0042, ccs-042, CCS 42 → ccs42
export const cleMat = (s: any) => sans(s).replace(/[^a-z0-9]/g, '').replace(/(^|[a-z])0+(\d)/g, '$1$2');
export const cleClasse = (s: any) => sans(s).replace(/[^a-z0-9]/g, '').replace(/^(\d+)(eme|ere|e|er)/, '$1e');

// « 1 500 000 », « 1.500.000 GNF », « 1500000,00 » → 1500000. Rien de lisible → null.
export function lireMontant(v: any): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
  let t = String(v ?? '').trim(); if (!t || t === '-') return null;
  t = t.replace(/[^\d.,]/g, '');
  if (/^\d+([.,]\d{3})*[.,]\d{1,2}$/.test(t)) t = t.replace(/[.,]\d{1,2}$/, ''); // centimes « ,00 » ignorés
  const ch = t.replace(/[^\d]/g, ''); if (!ch) return null;
  const n = Number(ch); return Number.isFinite(n) ? n : null;
}

const lev = (a: string, b: string) => {
  const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
  let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; }
  return p[n];
};
export const proche = (a: string, b: string) => { const l = Math.max(a.length, b.length); return l ? 1 - lev(a, b) / l : 0; };
// Le nom du fichier et celui de Scolaris désignent-ils la même personne ? (ordre des mots libre, une faute de frappe tolérée)
export const memeNom = (a: string, b: string) => { const x = cleNom(a), y = cleNom(b); if (!x || !y) return false; if (x === y) return true; const mx = x.split(' '), my = y.split(' '); const communs = mx.filter((w) => my.includes(w)).length; return proche(x, y) >= 0.85 || (communs >= 2) || (communs >= 1 && Math.min(mx.length, my.length) === 1 && proche(x, y) >= 0.6); };

export function deviner(entete: string[]) {
  const m: Partial<Record<Col, number>> = {}; const pris = new Set<number>();
  COLS_R.forEach(([k, , r]) => { const i = entete.findIndex((h, n) => !pris.has(n) && r.test(String(h || '')) && !(k === 'nom' && /pr[ée]nom/i.test(h))); if (i >= 0) { m[k] = i; pris.add(i); } });
  if (m.complet !== undefined && (m.nom !== undefined || m.prenom !== undefined)) { if (m.nom !== undefined && m.prenom !== undefined) delete m.complet; }
  const montants = entete.map((h, i) => i).filter((i) => !pris.has(i) && MONTANT.test(String(entete[i] || '')) && !PAS_MONTANT.test(String(entete[i] || '')));
  // Une colonne « total payé » suffit à elle seule.
  const tot = montants.find((i) => /total/i.test(entete[i]));
  return { m, montants: tot !== undefined ? [tot] : montants };
}

export type Eleve = { eleve_id: string; matricule: string; prenom: string; nom: string; classe: string; facture_net: number; reste: number };
export type Deja = { valide: number; attente: number };
export type Groupe = {
  cle: string; eleve?: Eleve; lignes: number[]; fichier: number; deja: number; attente: number; ajouter: number;
  etat: 'pret' | 'verifier' | 'ecarte'; motif: string; classeFichier: string; nomFichier: string; matFichier: string;
};

export function analyser(tab: string[][], m: Partial<Record<Col, number>>, montants: number[], eleves: Eleve[], deja: Record<string, Deja>): Groupe[] {
  const parMat = new Map<string, Eleve>(); eleves.forEach((e) => { const k = cleMat(e.matricule); if (k) parMat.set(k, e); });
  const parNom = new Map<string, Eleve[]>(); eleves.forEach((e) => { const k = cleNom(`${e.nom} ${e.prenom}`); parNom.set(k, [...(parNom.get(k) || []), e]); });
  const val = (l: string[], k: Col) => (m[k] !== undefined ? String(l[m[k]!] ?? '').trim() : '');
  const groupes = new Map<string, Groupe>();
  tab.slice(1).forEach((l, i) => {
    const n = i + 2; if (!l.some((c) => String(c ?? '').trim())) return;
    const mat = val(l, 'matricule'); const nomF = (val(l, 'complet') || `${val(l, 'nom')} ${val(l, 'prenom')}`).trim(); const cl = val(l, 'classe');
    const vals = montants.map((c) => lireMontant(l[c])); const lus = vals.filter((v): v is number => v !== null); const montant = lus.reduce((a, b) => a + b, 0);
    let e: Eleve | undefined; let etat: Groupe['etat'] = 'pret'; let motif = '';
    const pb = (t: string) => { if (etat === 'pret') { etat = 'verifier'; motif = t; } };
    const ecart = (t: string) => { etat = 'ecarte'; motif = t; };
    if (!mat && !nomF) return; // ligne de titre, de total ou vide
    if (/^(total|sous.?total|ensemble)/i.test(nomF) || /^(total)/i.test(mat)) return;
    const km = cleMat(mat);
    if (km && parMat.has(km)) {
      e = parMat.get(km)!;
      if (nomF && !memeNom(nomF, `${e.nom} ${e.prenom}`)) pb(`Le nom ne correspond pas au matricule (Scolaris : ${e.nom} ${e.prenom})`);
    } else {
      const cand = nomF ? parNom.get(cleNom(nomF)) || [] : [];
      const memeCl = cl ? cand.filter((x) => cleClasse(x.classe) === cleClasse(cl)) : cand;
      if (cand.length === 1) { e = cand[0]; if (mat) pb(`Matricule ${mat} inconnu, reconnu par le nom`); }
      else if (memeCl.length === 1) { e = memeCl[0]; if (mat) pb(`Matricule ${mat} inconnu, reconnu par le nom et la classe`); }
      else if (cand.length > 1) ecart(`${cand.length} élèves portent ce nom : ajoutez le matricule`);
      else if (nomF) {
        const k = cleNom(nomF); const pool = cl ? eleves.filter((x) => cleClasse(x.classe) === cleClasse(cl)) : eleves;
        const sc = pool.map((x) => [x, proche(k, cleNom(`${x.nom} ${x.prenom}`))] as [Eleve, number]).filter(([, s]) => s >= 0.8).sort((a, b) => b[1] - a[1]);
        if (sc.length && (sc.length === 1 || sc[0][1] - sc[1][1] >= 0.08)) { e = sc[0][0]; pb(`Nom proche, à confirmer : ${e.nom} ${e.prenom} (${e.classe})`); }
        else ecart(mat ? `Matricule ${mat} et nom introuvables dans l'école` : 'Élève introuvable dans l’école');
      } else ecart(`Matricule ${mat} introuvable dans l'école`);
    }
    if (e && cl && cleClasse(cl) !== cleClasse(e.classe)) pb(`Classe différente : ${cl} dans le fichier, ${e.classe} dans Scolaris`);
    if (!lus.length) ecart('Montant payé vide ou illisible');
    const cle = e ? e.eleve_id : `ligne-${n}`;
    const g = groupes.get(cle) || { cle, eleve: e, lignes: [], fichier: 0, deja: 0, attente: 0, ajouter: 0, etat: 'pret', motif: '', classeFichier: cl, nomFichier: nomF, matFichier: mat };
    g.lignes.push(n); g.fichier += lus.length ? montant : 0;
    const rang = { pret: 0, verifier: 1, ecarte: 2 } as const;
    if (rang[etat] > rang[g.etat]) { g.etat = etat; g.motif = motif; }
    groupes.set(cle, g);
  });
  for (const g of groupes.values()) {
    if (!g.eleve) continue;
    const d = deja[g.eleve.eleve_id] || { valide: 0, attente: 0 };
    g.deja = d.valide + d.attente; g.attente = d.attente; g.ajouter = Math.max(0, g.fichier - g.deja);
    if (g.etat === 'ecarte') { g.ajouter = 0; continue; }
    if (g.lignes.length > 1 && g.etat === 'pret') { g.etat = 'verifier'; g.motif = `${g.lignes.length} lignes pour cet élève (lignes ${g.lignes.join(', ')}) : montants additionnés`; }
    if (!g.fichier) { g.etat = 'ecarte'; g.motif = 'Rien payé selon le fichier'; continue; }
    if (g.fichier <= g.deja) { g.etat = 'ecarte'; g.motif = g.fichier === g.deja ? 'Déjà à jour dans Scolaris' : `Scolaris a déjà plus (${nbf(g.deja)}) que le fichier : rien à ajouter`; g.ajouter = 0; continue; }
    if (g.attente > 0 && g.etat === 'pret') { g.etat = 'verifier'; g.motif = 'Un paiement de cet élève attend encore une validation dans Scolaris'; }
    if (g.ajouter > Math.max(0, g.eleve.reste) && g.etat === 'pret') { g.etat = 'verifier'; g.motif = g.eleve.facture_net > 0 ? `Plus que le reste à payer (${nbf(g.eleve.reste)}) : l'excédent deviendra une avance` : 'Aucun frais facturé à cet élève : tout deviendra une avance'; }
  }
  return [...groupes.values()];
}
