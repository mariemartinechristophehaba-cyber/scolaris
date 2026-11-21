import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiCakeDuotone, PiCrownDuotone, PiNotebookDuotone, PiSunDuotone, PiTrendDownDuotone, PiTrendUpDuotone, PiChartLineUpDuotone, PiFileTextDuotone, PiMedalDuotone, PiStudentDuotone, PiTargetDuotone, PiArrowDownBold, PiArrowUpBold, PiCaretLeftBold, PiCaretRightBold, PiCheckBold, PiPencilSimpleDuotone, PiPlusBold, PiPrinterDuotone, PiTrashDuotone } from 'react-icons/pi';
import { db, getSession } from './api';
import { Bonjour, jourLong } from './espaces';
import { dateFr, nb } from './lib';
import { Carte, Entete, LogoEcole, Photo, Qr, fonctionDe, logoUrl, nomP, useEleves, useImpression, usePhotos } from './personnel';
import { Bandeau, Champ, Erreur, Etat, Lien, Modale, Tuile, Vague, Vide, useApp, useEnvoi, usePc, useQ } from './ui';

// ---------------------------------------------------------------- calculs
const MOIS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MAJ = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const dec = (n: number, d = 2) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const court = (n: number) => (Math.round(n * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
export const rangTxt = (r: number, f?: boolean) => (r === 1 ? (f ? '1re' : '1er') : `${r}e`);
export function moisListe(annee: any) {
  const l: { cle: string; label: string; date: string }[] = [];
  if (!annee) return l;
  const d = new Date(annee.date_debut + 'T00:00:00'); const f = new Date(annee.date_fin + 'T00:00:00');
  for (let y = d.getFullYear(), m = d.getMonth(); y < f.getFullYear() || (y === f.getFullYear() && m <= f.getMonth());) {
    l.push({ cle: `${y}-${String(m + 1).padStart(2, '0')}-01`, label: MAJ(MOIS_L[m]), date: `${MOIS_L[m]} ${y}` });
    if (++m === 12) { m = 0; y++; }
  }
  return l;
}
function moisCourant(l: { cle: string }[]) {
  const n = new Date(); const c = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-01`;
  return l.find((x) => x.cle === c)?.cle || (l.length ? (c < l[0].cle ? l[0].cle : l[l.length - 1].cle) : '');
}
const estSecondaire = (nom: string) => /\b(7|8|9|10|11|12)\s*e|terminale|seconde|premi[eè]re|coll[eè]ge|lyc[eé]e/i.test(nom);
const MAT_PRIM: [string, number][] = [['Français', 2], ['Calcul', 2], ['Sciences', 1], ['Histoire-Géographie', 1], ['Éducation civique', 1], ['Dictée', 1]];
const MAT_SEC: [string, number][] = [['Français', 3], ['Mathématiques', 3], ['Anglais', 2], ['Physique-Chimie', 2], ['SVT', 2], ['Histoire-Géographie', 2], ['ECM', 1], ['EPS', 1]];
// Mention selon la moyenne (barème sur 10 ou sur 20)
export function mention(m: number, sur: number) {
  const r = m / sur;
  if (r >= 0.9) return { t: 'Excellent', c: 'or' };
  if (r >= 0.8) return { t: 'Très bien', c: 'vert' };
  if (r >= 0.7) return { t: 'Bien', c: 'vert' };
  if (r >= 0.6) return { t: 'Assez bien', c: 'bleu' };
  if (r >= 0.5) return { t: 'Passable', c: 'gris' };
  return { t: 'Insuffisant', c: 'rouge' };
}
const appreciation = (n: number, sur: number) => mention(n, sur).t;
const appreciationG = (m: number, sur: number) => { const r = m / sur; return r >= 0.9 ? 'Excellent travail, très sérieux et appliqué. Continue ainsi.' : r >= 0.8 ? 'Très bon travail. Continue tes efforts.' : r >= 0.7 ? 'Bon travail. Peut encore progresser.' : r >= 0.6 ? 'Travail assez bien. Doit fournir un peu plus d’efforts.' : r >= 0.5 ? 'Travail juste passable. Doit travailler davantage.' : 'Résultats insuffisants. Il faut beaucoup plus de travail.'; };

// Classement d'une classe pour un mois : moyenne pondérée, rang avec ex aequo, évolution.
export function classement(eleves: any[], matieres: any[], notes: any[], mois: string, moisPrec?: string) {
  const sur = matieres[0]?.sur || 10;
  const par: Record<string, Record<string, Record<string, number>>> = {};
  for (const n of notes) ((par[n.mois] ||= {})[n.eleve_id] ||= {})[n.matiere_id] = Number(n.note);
  const moy = (m: string, id: string) => { const x = par[m]?.[id]; if (!x) return null; let s = 0, c = 0; for (const mt of matieres) if (x[mt.id] != null) { s += x[mt.id] * Number(mt.coef); c += Number(mt.coef); } return c ? s / c : null; };
  const lignes = eleves.map((e) => ({ e, notes: par[mois]?.[e.id] || {}, moy: moy(mois, e.id), prec: moisPrec ? moy(moisPrec, e.id) : null }));
  const notees = lignes.filter((l) => l.moy != null).sort((a, b) => (b.moy as number) - (a.moy as number) || `${a.e.nom} ${a.e.prenom}`.localeCompare(`${b.e.nom} ${b.e.prenom}`, 'fr'));
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const out = notees.map((l) => ({ ...l, rang: 1 + notees.filter((o) => r2(o.moy as number) > r2(l.moy as number)).length }));
  for (const l of out) (l as any).exaequo = out.filter((o) => o.rang === l.rang).length > 1;
  const ms = out.map((l) => l.moy as number);
  const moyClasse = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0;
  const parMat: Record<string, number> = {};
  for (const mt of matieres) { const v = out.map((l) => l.notes[mt.id]).filter((x) => x != null); parMat[mt.id] = v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; }
  return { lignes: out, sansNote: lignes.filter((l) => l.moy == null), sur, moyClasse, max: ms.length ? Math.max(...ms) : 0, min: ms.length ? Math.min(...ms) : 0, parMat, effectif: eleves.length };
}

// Matières + notes de l'année pour une classe
function useClasse(classe: string) {
  const { eid } = useApp();
  return useQ(async () => {
    if (!classe) return { mat: [], notes: [] };
    const mat = await db.get(`matieres?classe_id=eq.${classe}&select=*&order=ordre,nom`);
    const notes = mat.length ? await db.tout(`notes?etablissement_id=eq.${eid}&matiere_id=in.(${mat.map((m: any) => m.id).join(',')})&select=eleve_id,matiere_id,mois,note&order=id`) : [];
    return { mat, notes };
  }, [classe]);
}

// ---------------------------------------------------------------- sélecteurs
function Selecteurs({ classes, par, classe, setCl, mois, setMois, liste, avecNotes, compte = true }: any) {
  const pc = usePc();
  const C = <div className="puces-cl dense" role="tablist" aria-label="Classe">{classes.map((c: any) => <button key={c.id} role="tab" aria-selected={classe === c.id} className={classe === c.id ? 'on' : ''} onClick={() => setCl(c.id)}>{c.nom}{compte && <em>{(par[c.id] || []).length}</em>}</button>)}</div>;
  const M = liste && <div className="puces-mois" role="tablist" aria-label="Mois">{liste.map((m: any) => <button key={m.cle} role="tab" aria-selected={mois === m.cle} className={`${mois === m.cle ? 'on' : ''}${avecNotes?.has(m.cle) ? ' fait' : ''}`} onClick={() => setMois(m.cle)}>{avecNotes && <i />}{m.label}</button>)}</div>;
  if (!pc) return <>{C}{M}</>;
  return <section className="carte filtres-p"><div className="fl"><span className="filtre-l">Classe</span>{C}</div>{M && <div className="fl"><span className="filtre-l">{liste.length > 6 && liste[0].cle.length > 8 ? 'Mois' : 'Période'}</span>{M}</div>}</section>;
}
function useChoix(annee: any) {
  const q = useEleves(); const d: any = q.data; const [cl, setCl] = useState(''); const liste = useMemo(() => moisListe(annee), [annee?.id]); const [mois, setMois] = useState(() => moisCourant(liste));
  const classe = cl || d?.classes?.[0]?.id || ''; const c = d?.classes?.find((x: any) => x.id === classe);
  const eleves: any[] = d?.par?.[classe] || [];
  const iM = liste.findIndex((m) => m.cle === mois); const prec = iM > 0 ? liste[iM - 1] : null; const lm = liste[iM];
  return { q, d, classe, setCl, c, eleves, liste, mois, setMois, prec, lm };
}

// ---------------------------------------------------------------- Notes mensuelles
function Matieres({ classe, c, mat, fermer, fini }: any) {
  const { eid } = useApp(); const e = useEnvoi();
  const [l, setL] = useState<any[]>(() => mat.length ? mat.map((m: any) => ({ ...m })) : (estSecondaire(c?.nom || '') ? MAT_SEC : MAT_PRIM).map(([nom, coef], i) => ({ nom, coef, sur: estSecondaire(c?.nom || '') ? 20 : 10, ordre: i })));
  const sur = l[0]?.sur || (estSecondaire(c?.nom || '') ? 20 : 10);
  const enr = (x: any) => { x.preventDefault(); if (l.some((m) => !String(m.nom).trim())) return e.setE('Donnez un nom à chaque matière'); if (new Set(l.map((m) => m.nom.trim().toLowerCase())).size !== l.length) return e.setE('Deux matières ont le même nom');
    e.envoyer(async () => {
      const gardes = new Set(l.filter((m) => m.id).map((m) => m.id));
      for (const m of mat) if (!gardes.has(m.id)) await db.del(`matieres?id=eq.${m.id}`);
      for (const [i, m] of l.entries()) { const b = { nom: m.nom.trim(), coef: Number(m.coef) || 1, sur, ordre: i }; if (m.id) await db.upd(`matieres?id=eq.${m.id}`, b); else await db.ins('matieres', { ...b, etablissement_id: eid, classe_id: classe }); }
      fini();
    }); };
  return <Modale titre={`Matières de ${c?.nom || 'la classe'}`} fermer={fermer}><form onSubmit={enr} className="form-mat">
    <p className="note">Les moyennes et les rangs sont calculés avec ces coefficients.</p>
    <div className="seg-cat" role="radiogroup" aria-label="Barème">{[10, 20].map((s) => <button type="button" key={s} role="radio" aria-checked={sur === s} className={sur === s ? 'on' : ''} onClick={() => setL(l.map((m) => ({ ...m, sur: s })))}>Notes sur {s}</button>)}</div>
    <div className="mat-l">{l.map((m, i) => <div key={i} className="mat-r"><input value={m.nom} placeholder="Matière" aria-label="Matière" onChange={(x) => setL(l.map((y, j) => j === i ? { ...y, nom: x.target.value } : y))} /><label><small>Coef.</small><input inputMode="decimal" value={m.coef} aria-label="Coefficient" onChange={(x) => setL(l.map((y, j) => j === i ? { ...y, coef: x.target.value.replace(',', '.') } : y))} /></label><button type="button" className="btn-ic" aria-label="Retirer la matière" onClick={() => setL(l.filter((_, j) => j !== i))}><PiTrashDuotone /></button></div>)}</div>
    <button type="button" className="btn contour mini" onClick={() => setL([...l, { nom: '', coef: 1, sur, ordre: l.length }])}><PiPlusBold />Ajouter une matière</button>
    {mat.length > 0 && <p className="note">Retirer une matière efface aussi ses notes.</p>}
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Enregistrement…' : 'Enregistrer les matières'}</button>
  </form></Modale>;
}

function Saisie({ eleves, mat, notes, mois, lm, c, fermer, fini }: any) {
  const { eid } = useApp(); const e = useEnvoi(); const sur = mat[0]?.sur || 10;
  const init = () => { const v: Record<string, string> = {}; for (const n of notes) if (n.mois === mois) v[`${n.eleve_id}|${n.matiere_id}`] = String(Number(n.note)).replace('.', ','); return v; };
  const [v, setV] = useState<Record<string, string>>(init); const [ini] = useState(init);
  const enr = () => {
    const ch = Object.keys({ ...v, ...ini }).filter((k) => (v[k] || '') !== (ini[k] || ''));
    for (const k of ch) { const x = (v[k] || '').trim(); if (x && (isNaN(Number(x.replace(',', '.'))) || Number(x.replace(',', '.')) < 0 || Number(x.replace(',', '.')) > sur)) return e.setE(`Une note n'est pas valide : elle doit être entre 0 et ${sur}`); }
    e.envoyer(async () => {
      const aj: any[] = []; const sup: string[] = [];
      for (const k of ch) { const [el, mt] = k.split('|'); const x = (v[k] || '').trim(); if (x) aj.push({ etablissement_id: eid, eleve_id: el, matiere_id: mt, mois, note: Number(x.replace(',', '.')) }); else sup.push(k); }
      if (aj.length) await db.ups('notes', aj, 'eleve_id,matiere_id,mois');
      for (const k of sup) { const [el, mt] = k.split('|'); await db.del(`notes?eleve_id=eq.${el}&matiere_id=eq.${mt}&mois=eq.${mois}`); }
      fini();
    });
  };
  return <Modale titre={`Notes de ${c?.nom} · ${lm?.date || ''}`} fermer={fermer}><div className="saisie">
    <p className="note">Notes sur {sur}. Laissez vide si l'élève n'a pas de note. La moyenne et le rang se calculent tout seuls.</p>
    <div className="saisie-t"><table><thead><tr><th>Élève</th>{mat.map((m: any) => <th key={m.id}>{m.nom}<small>coef. {court(Number(m.coef))}</small></th>)}</tr></thead>
      <tbody>{eleves.map((el: any) => <tr key={el.id}><td>{el.nom} {el.prenom}</td>{mat.map((m: any) => { const k = `${el.id}|${m.id}`; const x = (v[k] || '').trim(); const bad = x !== '' && (isNaN(Number(x.replace(',', '.'))) || Number(x.replace(',', '.')) > sur); return <td key={m.id}><input inputMode="decimal" className={bad ? 'err' : ''} value={v[k] || ''} aria-label={`${m.nom} de ${el.prenom} ${el.nom}`} onChange={(ev) => setV({ ...v, [k]: ev.target.value })} /></td>; })}</tr>)}</tbody></table></div>
    <Erreur t={e.erreur} /><button className="btn plein" onClick={enr} disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Enregistrement…' : 'Enregistrer les notes'}</button>
  </div></Modale>;
}

const Rang = ({ r, f }: any) => <span className={`rg r${Math.min(r, 4)}`}>{rangTxt(r, f)}</span>;
const Init = ({ e }: any) => <span className="ini-e">{`${(e.nom || '')[0] || ''}${(e.prenom || '')[0] || ''}`.toUpperCase()}</span>;

export function NotesMensuelles() {
  const { annee, can } = useApp(); const pc = usePc(); const s = useChoix(annee); const cq = useClasse(s.classe);
  const [mat, setMat] = useState(false); const [saisie, setSaisie] = useState(false); const [imp, setImp] = useState(false);
  useImpression(imp, () => setImp(false));
  const peutMat = can('directeur', 'secretaire'); const peutNote = can('directeur', 'secretaire', 'enseignant');
  const cd: any = cq.data; const matieres: any[] = cd?.mat || [];
  const cl = useMemo(() => cd ? classement(s.eleves, matieres, cd.notes, s.mois, s.prec?.cle) : null, [cd, s.eleves, s.mois]);
  const avec = useMemo(() => new Set<string>((cd?.notes || []).map((n: any) => n.mois)), [cd]);
  const top = cl?.lignes.slice(0, 3) || [];
  const tableau = cl && <table className="tab-notes"><thead><tr><th>Rang</th><th className="g">Élève</th>{matieres.map((m) => <th key={m.id}>{m.nom}<small>coef. {court(Number(m.coef))}</small></th>)}<th>Moyenne</th><th>Mention</th>{s.prec && <th>vs {s.prec.label.slice(0, 4).toLowerCase()}.</th>}</tr></thead>
    <tbody>{cl.lignes.map((l: any) => { const mn = mention(l.moy, cl.sur); const dv = l.prec != null ? l.moy - l.prec : null; return <tr key={l.e.id}><td><Rang r={l.rang} />{l.exaequo && <small className="exa">ex æquo</small>}</td><td className="g"><span className="nom-n"><Init e={l.e} />{l.e.nom} {l.e.prenom}</span></td>
      {matieres.map((m) => <td key={m.id}><span className="nt">{l.notes[m.id] != null ? court(l.notes[m.id]) : '—'}</span></td>)}<td><b className="moy">{dec(l.moy)}</b></td><td><span className={`ment m-${mn.c}`}>{mn.t}</span></td>
      {s.prec && <td>{dv == null ? <span className="gris">—</span> : <span className={dv >= 0 ? 'hausse' : 'baisse'}>{dv >= 0 ? <PiArrowUpBold aria-hidden="true" /> : <PiArrowDownBold aria-hidden="true" />}{dv >= 0 ? '+' : '−'}{dec(Math.abs(dv))}</span>}</td>}</tr>; })}</tbody></table>;
  const actions = <>{peutNote && matieres.length > 0 && <button className="btn contour" onClick={() => setSaisie(true)}><PiPencilSimpleDuotone aria-hidden="true" />Saisir les notes</button>}{cl?.lignes.length ? <button className="btn plein" onClick={() => setImp(true)}><PiPrinterDuotone aria-hidden="true" />Imprimer le classement</button> : null}</>;
  return <>
    <Entete t="Notes mensuelles" sous={pc ? 'Classement automatique par ordre de mérite : moyennes avec coefficients, rangs et ex æquo calculés par Scolaris.' : ''} action={pc && actions}>{!pc && s.d?.classes?.length > 0 && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} avecNotes={avec} compte={false} />}</Entete>
    <Etat q={s.q}>{() => !s.d.classes.length ? <section className="carte"><Vide t="Créez d'abord vos classes dans « Classes »." /></section> : <>
      {pc && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} avecNotes={avec} />}
      <Etat q={cq}>{() => matieres.length === 0 ? <section className="carte vide-mat"><h3>Matières de {s.c?.nom}</h3><p>Pour calculer les moyennes, Scolaris a besoin des matières et de leurs coefficients. Nous avons préparé la liste habituelle {estSecondaire(s.c?.nom || '') ? 'du collège' : 'du primaire'} : vous pouvez la modifier.</p>{peutMat ? <button className="btn plein" onClick={() => setMat(true)}>Voir et valider les matières</button> : <p className="note">Demandez à la direction ou au secrétariat d'enregistrer les matières.</p>}</section> : <>
        {!pc && <div className="actions-tel">{actions}</div>}
        {cl && cl.lignes.length === 0 ? <section className="carte vide-mat"><h3>Pas encore de notes pour {s.lm?.label.toLowerCase()}</h3><p>Touchez « Saisir les notes » : le classement se fait tout seul.</p>{peutNote && <button className="btn plein" onClick={() => setSaisie(true)}><PiPencilSimpleDuotone aria-hidden="true" />Saisir les notes de {s.c?.nom}</button>}</section> : cl && <>
          {!pc && <div className="titre-cl"><b>Classement · {s.c?.nom}</b><small>{nb(s.eleves.length)} élèves · moy. {dec(cl.moyClasse)}</small></div>}
          <div className={`podium${pc ? '' : ' tel'}`}>{(pc ? top : [top[2], top[0], top[1]].filter(Boolean)).map((l: any) => { const mn = mention(l.moy, cl.sur); return <div key={l.e.id} className={`pod r${l.rang}`}><Rang r={l.rang} /><span><b>{l.e.nom} {l.e.prenom}</b>{pc && <small>{s.c?.nom} · {mn.t}</small>}</span><em>{dec(l.moy)}</em></div>; })}</div>
          {pc ? <section className="carte tab-z">{tableau}<p className="note pied-t">{nb(cl.lignes.length)} élève{cl.lignes.length > 1 ? 's' : ''} notés sur {nb(s.eleves.length)} · moyenne de la classe <b>{dec(cl.moyClasse)}</b> · {nb(cl.lignes.filter((l: any) => l.moy < cl.sur / 2).length)} sous {cl.sur / 2}/{cl.sur}{cl.sansNote.length ? ` · ${nb(cl.sansNote.length)} sans note` : ''}</p></section>
            : <div className="liste-cl">{cl.lignes.slice(3).map((l: any) => { const mn = mention(l.moy, cl.sur); return <div key={l.e.id} className="ligne-cl"><Rang r={l.rang} /><span><b>{l.e.nom} {l.e.prenom}</b><small className={`m-t-${mn.c}`}>{mn.t}</small></span><em>{dec(l.moy)}</em></div>; })}</div>}
        </>}
        {peutMat && <button className="btn lien" onClick={() => setMat(true)}>Modifier les matières et coefficients de {s.c?.nom}</button>}
      </>}</Etat>
    </>}</Etat>
    {mat && <Matieres classe={s.classe} c={s.c} mat={matieres} fermer={() => setMat(false)} fini={() => { setMat(false); cq.reload(); }} />}
    {saisie && <Saisie eleves={s.eleves} mat={matieres} notes={cd?.notes || []} mois={s.mois} lm={s.lm} c={s.c} fermer={() => setSaisie(false)} fini={() => { setSaisie(false); cq.reload(); }} />}
    {imp && cl && <ZoneImp><div className="feuille-doc"><EnteteDoc titre={`Classement · ${s.c?.nom}`} sous={`Mois de ${s.lm?.date}`} />{tableau}</div></ZoneImp>}
  </>;
}

// ---------------------------------------------------------------- documents imprimables
const ZoneImp = ({ children }: any) => createPortal(<div className="zone-impression">{children}</div>, document.body);
function EnteteDoc({ titre, sous }: any) {
  const { etab, annee } = useApp();
  return <><div className="drap" /><div className="doc-h"><div><b>RÉPUBLIQUE DE GUINÉE</b><i>Travail – Justice – Solidarité</i><small>Année scolaire {annee?.libelle}</small></div><div className="doc-ec"><LogoEcole etab={etab} taille={54} /><b>{String(etab.nom || '').toUpperCase()}</b></div><div className="dr"><small>{[etab.quartier || etab.adresse, etab.ville].filter(Boolean).join(', ')}</small>{etab.telephone && <small>{String(etab.telephone).replace(/^224/, '+224 ')}</small>}{etab.email && <small>{etab.email}</small>}</div></div>
    <div className="doc-bande"><b>{titre}</b><span>{sous}</span></div></>;
}

function Bulletin({ l, cl, mat, c, lm, prec, ens, url }: any) {
  const { etab } = useApp(); const mn = mention(l.moy, cl.sur); const tot = mat.reduce((a: number, m: any) => a + (l.notes[m.id] != null ? l.notes[m.id] * Number(m.coef) : 0), 0); const coefs = mat.reduce((a: number, m: any) => a + (l.notes[m.id] != null ? Number(m.coef) : 0), 0);
  const dv = l.prec != null ? l.moy - l.prec : null; const e = l.e;
  return <div className="bulletin">
    <EnteteDoc titre="BULLETIN DE NOTES" sous={`Mois de ${lm?.date}`} />
    <div className="bl-id"><Photo url={url} nom={nomP(e)} className="bl-ph" /><dl><div><dt>Élève :</dt><dd>{String(e.nom).toUpperCase()} {e.prenom}</dd></div><div><dt>Classe :</dt><dd>{c?.nom}</dd></div>{e.date_naissance && <div><dt>Né(e) le :</dt><dd>{dateFr(e.date_naissance)}</dd></div>}</dl><dl>{e.matricule && <div><dt>Matricule :</dt><dd>{e.matricule}</dd></div>}<div><dt>Effectif :</dt><dd>{nb(cl.effectif)} élèves</dd></div>{ens && <div><dt>Enseignant(e) :</dt><dd>{ens.sexe === 'F' ? 'Mme' : 'M.'} {nomP(ens)}</dd></div>}</dl></div>
    <table className="bl-t"><thead><tr><th>Matière</th><th>Note /{cl.sur}</th><th>Coef.</th><th>Note × coef.</th><th>Moy. classe</th><th>Appréciation</th></tr></thead>
      <tbody>{mat.map((m: any) => { const n = l.notes[m.id]; return <tr key={m.id}><td>{m.nom}</td><td>{n != null ? court(n) : '—'}</td><td>{court(Number(m.coef))}</td><td>{n != null ? court(n * Number(m.coef)) : '—'}</td><td>{isNaN(cl.parMat[m.id]) ? '—' : court(Math.round(cl.parMat[m.id] * 10) / 10)}</td><td>{n != null ? appreciation(n, cl.sur) : 'Pas de note'}</td></tr>; })}
        <tr className="tot"><td>Total</td><td /><td>{court(coefs)}</td><td>{court(tot)}</td><td /><td /></tr></tbody></table>
    <div className="bl-k"><div className="k bleu"><small>Moyenne générale</small><b>{dec(l.moy)} / {cl.sur}</b></div><div className="k or"><small>Rang</small><b>{rangTxt(l.rang, e.sexe === 'F')}{l.exaequo ? ' ex æquo' : ''} / {nb(cl.lignes.length)}</b></div><div className="k"><small>Moyenne de la classe</small><b>{dec(cl.moyClasse)}</b></div><div className="k"><small>Plus forte / plus faible</small><b>{dec(cl.max)} / {dec(cl.min)}</b></div></div>
    <div className="bl-a"><div className="appr"><b>Appréciation</b><span>{appreciationG(l.moy, cl.sur)}</span></div><div className="ment-b"><small>Mention</small><b className={`m-t-${mn.c}`}>{mn.t}</b></div></div>
    <div className="bl-3"><div><b>Évolution</b>{dv == null ? <span>Premier mois noté</span> : <><span>Mois précédent ({prec?.label.toLowerCase()}) <b>{dec(l.prec)}</b> → <b>{dec(l.moy)}</b></span><em className={dv >= 0 ? 'hausse' : 'baisse'}>{dv >= 0 ? '+' : '−'} {dec(Math.abs(dv))} point</em></>}</div>
      <div><b>Décision</b><span>{l.moy / cl.sur >= 0.8 ? 'Inscrit(e) au tableau d’honneur du mois' : l.moy / cl.sur >= 0.5 ? 'Peut mieux faire le mois prochain' : 'Doit redoubler d’efforts le mois prochain'}</span></div></div>
    <div className="sign"><span>L'enseignant(e)</span><span>Le Directeur</span><span>Le parent / tuteur</span></div>
    <div className="bl-p"><Qr texte={`${location.origin}/v/${e.code_carte}?doc=bulletin&p=${encodeURIComponent(lm?.date || '')}`} taille={72} /><span><b>Bulletin vérifiable</b><small>Scannez ce code avec un téléphone : la page de l'école confirme que ce bulletin et cet élève sont authentiques.</small></span><small>Fait à {etab.ville || '……'}, le {dateFr(new Date().toISOString().slice(0, 10))}</small></div>
  </div>;
}

function useEnseignantsClasse() { const { eid } = useApp(); return useQ(() => db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&select=id,prenom,nom,sexe,categorie,fonction,classe_matiere,photo_chemin,code_carte,date_entree&order=ordre,nom`).catch(() => []), [eid]); }
const ensDe = (pers: any[], c: any) => c && pers.find((p) => p.categorie === 'enseignant' && p.classe_matiere && p.classe_matiere.trim().toLowerCase() === c.nom.trim().toLowerCase());

export function Bulletins() {
  const { annee } = useApp(); const pc = usePc(); const s = useChoix(annee); const cq = useClasse(s.classe); const pq = useEnseignantsClasse();
  const [sel, setSel] = useState(''); const [imp, setImp] = useState<'' | 'un' | 'tous'>('');
  useImpression(!!imp, () => setImp(''));
  const cd: any = cq.data; const matieres: any[] = cd?.mat || [];
  const cl = useMemo(() => cd ? classement(s.eleves, matieres, cd.notes, s.mois, s.prec?.cle) : null, [cd, s.eleves, s.mois]);
  useEffect(() => setSel(''), [s.classe, s.mois]);
  const idx = Math.max(0, cl?.lignes.findIndex((l: any) => l.e.id === sel) ?? 0); const l = cl?.lignes[idx];
  const urls = usePhotos(cl ? cl.lignes.map((x: any) => x.e.photo_chemin) : []);
  const ens = ensDe((pq.data as any) || [], s.c);
  const B = (x: any) => <Bulletin key={x.e.id} l={x} cl={cl} mat={matieres} c={s.c} lm={s.lm} prec={s.prec} ens={ens} url={urls[x.e.photo_chemin]} />;
  return <>
    <Entete t="Bulletins de notes" sous={pc ? "Touchez une classe : ses élèves s'affichent, classés par ordre de mérite. Nom et logo de l'école ajoutés automatiquement." : ''} action={pc && cl?.lignes.length ? <button className="btn plein" onClick={() => setImp('tous')}><PiPrinterDuotone aria-hidden="true" />Imprimer toute la {s.c?.nom} ({nb(cl.lignes.length)})</button> : null}>{!pc && s.d?.classes?.length > 0 && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} compte={false} />}</Entete>
    <Etat q={s.q}>{() => !s.d.classes.length ? <section className="carte"><Vide t="Créez d'abord vos classes dans « Classes »." /></section> : <>
      {pc && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} />}
      <Etat q={cq}>{() => !cl || cl.lignes.length === 0 ? <section className="carte vide-mat"><h3>Pas encore de bulletin pour {s.c?.nom} en {s.lm?.label.toLowerCase()}</h3><p>Les bulletins se remplissent tout seuls dès que les notes du mois sont saisies dans « Notes mensuelles ».</p></section> : pc ? <div className="bl-zone">
        <section className="carte liste-bl"><div className="lb-h"><b>Élèves de {s.c?.nom}</b><small>{nb(s.eleves.length)} élèves</small></div>{cl.lignes.map((x: any) => <button key={x.e.id} className={x.e.id === l?.e.id ? 'on' : ''} onClick={() => setSel(x.e.id)}><Rang r={x.rang} f={x.e.sexe === 'F'} /><span>{x.e.nom} {x.e.prenom}</span><em>{dec(x.moy)}</em></button>)}</section>
        <div className="bl-droite"><div className="bl-act"><button className="btn sombre" onClick={() => setImp('un')}><PiPrinterDuotone aria-hidden="true" />Imprimer ce bulletin</button><button className="btn contour" onClick={() => setImp('un')}>Télécharger en PDF</button></div><div className="feuille-ecran">{l && B(l)}</div></div>
      </div> : <>
        <div className="nav-bl"><button aria-label="Élève précédent" disabled={idx === 0} onClick={() => setSel(cl.lignes[idx - 1].e.id)}><PiCaretLeftBold /></button><span><b>{l.e.nom} {l.e.prenom}</b><small>{rangTxt(l.rang, l.e.sexe === 'F')} sur {nb(cl.lignes.length)} · {dec(l.moy)} / {cl.sur}</small></span><button aria-label="Élève suivant" disabled={idx >= cl.lignes.length - 1} onClick={() => setSel(cl.lignes[idx + 1].e.id)}><PiCaretRightBold /></button></div>
        <div className="feuille-ecran tel"><div style={{ width: 760, zoom: Math.min(1, (window.innerWidth - 28) / 760) } as any}>{B(l)}</div></div>
        <div className="bl-act tel"><button className="btn plein" onClick={() => setImp('un')}><PiPrinterDuotone aria-hidden="true" />Imprimer</button><button className="btn contour" onClick={() => setImp('un')}>PDF pour le parent</button></div>
        <button className="btn contour bloc" onClick={() => setImp('tous')}>Imprimer toute la {s.c?.nom} ({nb(cl.lignes.length)})</button>
      </>}</Etat>
    </>}</Etat>
    {imp && cl && <ZoneImp>{(imp === 'un' ? [l] : cl.lignes).map((x: any) => <div key={x.e.id} className="feuille-doc">{B(x)}</div>)}</ZoneImp>}
  </>;
}

// ---------------------------------------------------------------- Satisfecits & attestations
const MODELES_E = [['satisfecit', 'Satisfecit (classique bleu et or)'], ['honneur', "Tableau d'honneur"]];
const MODELES_P = [['merite', 'Attestation de mérite'], ['travail', 'Attestation de travail']];
function Certificat({ type, nom, texte, rang, num, code, f, per }: any) {
  const { etab, annee } = useApp();
  const titre = type === 'satisfecit' ? 'SATISFECIT' : type === 'honneur' ? "TABLEAU D'HONNEUR" : type === 'merite' ? 'ATTESTATION DE MÉRITE' : 'ATTESTATION DE TRAVAIL';
  return <div className="certif"><i className="cc a" /><i className="cc b" /><i className="cc c" /><i className="cc d" />
    {logoUrl(etab) && <img className="cert-fil" src={logoUrl(etab)} alt="" />}
    <div className="cert-in"><LogoEcole etab={etab} taille={64} /><b className="cert-ec">{String(etab.nom || '').toUpperCase()}</b><small className="cert-li">{[etab.quartier, etab.ville].filter(Boolean).join(' · ').toUpperCase()} · ANNÉE SCOLAIRE {annee?.libelle}</small>
      <h2 className={titre.length > 14 ? 'long' : ''}>{titre}</h2><div className="cert-sep"><i /><span>★</span><i /></div>
      <p className="cert-int">{type === 'travail' ? 'Le Directeur de l’école atteste que' : `Le Directeur de l’école décerne ${type === 'merite' ? 'la présente attestation' : 'le présent ' + (type === 'honneur' ? 'tableau d’honneur' : 'satisfecit')} à`}</p>
      <p className="cert-nom">{nom}</p><p className="cert-t">{texte}</p></div>
    <div className="cert-b"><div className="cert-qr">{code && <span className="cert-qrb"><Qr texte={`${location.origin}/v/${code}?doc=${type}${per ? `&p=${encodeURIComponent(per)}` : ''}`} taille={120} /></span>}<small><b>Scannez pour vérifier</b>N° {num}</small></div>
      {rang ? <div className="sceau"><b>{rangTxt(rang, f)}</b><small>{type === 'merite' ? 'MÉRITE' : 'CLASSE'}</small></div> : <div />}
      <div className="cert-s"><small>Fait à {etab.ville || '……'}, le {dateFr(new Date().toISOString().slice(0, 10))}</small><i /><b>Le Directeur</b></div></div>
  </div>;
}

export function Satisfecits() {
  const { annee, eid } = useApp(); const pc = usePc(); const s = useChoix(annee); const cq = useClasse(s.classe); const pq = useEnseignantsClasse();
  const [vue, setVue] = useState('eleves'); const [modele, setMod] = useState('satisfecit'); const [modP, setModP] = useState('merite'); const [coches, setCoches] = useState<Record<string, boolean>>({}); const [apercu, setAp] = useState(''); const [imp, setImp] = useState(false);
  useImpression(imp, () => setImp(false));
  const cd: any = cq.data; const matieres: any[] = cd?.mat || [];
  const cl = useMemo(() => cd ? classement(s.eleves, matieres, cd.notes, s.mois, s.prec?.cle) : null, [cd, s.eleves, s.mois]);
  const pers: any[] = (pq.data as any) || [];
  // Scolaris choisit tout seul : les 3 premiers, et tous ceux qui ont au moins le tableau d'honneur.
  const candidats = useMemo(() => cl ? cl.lignes.filter((l: any) => l.rang <= 3 || l.moy / cl.sur >= 0.7) : [], [cl]);
  useEffect(() => { const c: Record<string, boolean> = {}; for (const l of candidats) c[l.e.id] = l.rang <= 3; setCoches(c); setAp(''); }, [candidats]);
  useEffect(() => { setCoches(vue === 'pers' ? Object.fromEntries(pers.map((p) => [p.id, true])) : {}); setAp(''); }, [vue]);
  const num = (k: number) => `A-${(annee?.libelle || '').slice(0, 4)}-${String(k + 1).padStart(4, '0')}`;
  const texteE = (l: any) => `élève de la classe de ${s.c?.nom}, classé${l.e.sexe === 'F' ? 'e' : ''} ${rangTxt(l.rang, l.e.sexe === 'F')}${l.exaequo ? ' ex æquo' : ''} sur ${nb(cl!.lignes.length)} élèves au mois de ${s.lm?.date} avec une moyenne de ${dec(l.moy)} / ${cl!.sur}, pour son travail ${l.rang === 1 ? 'remarquable' : 'sérieux'} et sa conduite exemplaire.`;
  const texteP = (p: any) => modP === 'travail' ? `${p.sexe === 'F' ? 'Mme' : 'M.'} ${nomP(p)} exerce la fonction de ${fonctionDe(p).toLowerCase()}${p.classe_matiere ? ` (${p.classe_matiere})` : ''} dans notre établissement${p.date_entree ? ` depuis le ${dateFr(p.date_entree)}` : ''}. En foi de quoi la présente attestation lui est délivrée pour servir et valoir ce que de droit.` : `${fonctionDe(p)}${p.classe_matiere ? ` · ${p.classe_matiere}` : ''}, en reconnaissance de son dévouement, de son sérieux et de la qualité de son travail au service des élèves durant l’année scolaire ${annee?.libelle}.`;
  const certE = (l: any, k: number) => <Certificat key={l.e.id} type={modele} nom={`${l.e.prenom} ${l.e.nom}`} texte={texteE(l)} rang={l.rang} f={l.e.sexe === 'F'} num={num(k)} code={l.e.code_carte} per={s.lm?.date} />;
  const certP = (p: any, k: number) => <Certificat key={p.id} type={modP} nom={nomP(p)} texte={texteP(p)} num={`P-${(annee?.libelle || '').slice(0, 4)}-${String(k + 1).padStart(4, '0')}`} code={p.code_carte} />;
  const listeE = cl ? cl.lignes.filter((l: any) => candidats.includes(l)) : [];
  const choisisE = listeE.filter((l: any) => coches[l.e.id]); const choisisP = pers.filter((p) => coches[p.id]);
  const n = vue === 'eleves' ? choisisE.length : choisisP.length;
  const apE = listeE.find((l: any) => l.e.id === apercu) || choisisE[0] || listeE[0]; const apP = pers.find((p) => p.id === apercu) || choisisP[0] || pers[0];
  const segV = <div className="seg-gris" role="tablist">{[['eleves', 'Élèves'], ['pers', 'Personnel']].map(([k, t]) => <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'on' : ''} onClick={() => setVue(k)}>{t}</button>)}</div>;
  const btn = <button className="btn plein bloc" disabled={!n} onClick={() => setImp(true)}><PiPrinterDuotone aria-hidden="true" />Imprimer {nb(n)} {vue === 'eleves' ? (modele === 'satisfecit' ? `satisfecit${n > 1 ? 's' : ''}` : `diplôme${n > 1 ? 's' : ''}`) : `attestation${n > 1 ? 's' : ''}`}</button>;
  return <>
    <Entete t="Satisfecits & attestations" sous={pc ? 'Touchez une classe : les meilleurs élèves sont choisis automatiquement et leurs certificats sont prêts.' : ''} action={pc && segV}>{!pc && <>{segV}{vue === 'eleves' && s.d?.classes?.length > 0 && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} compte={false} />}</>}</Entete>
    {vue === 'eleves' ? <Etat q={s.q}>{() => !s.d.classes.length ? <section className="carte"><Vide t="Créez d'abord vos classes." /></section> : <>
      {pc && <Selecteurs classes={s.d.classes} par={s.d.par} classe={s.classe} setCl={s.setCl} mois={s.mois} setMois={s.setMois} liste={s.liste} compte={false} />}
      <Etat q={cq}>{() => !cl || cl.lignes.length === 0 ? <section className="carte vide-mat"><h3>Pas encore de notes pour {s.c?.nom} en {s.lm?.label.toLowerCase()}</h3><p>Dès que les notes du mois sont saisies, Scolaris choisit les meilleurs élèves et prépare leurs certificats.</p></section> : <div className="sat-zone">
        <section className="carte sat-g"><h3>Meilleurs élèves de {s.c?.nom}</h3><p className="note">Choisis automatiquement selon les moyennes. Touchez un nom pour voir son certificat.</p>
          {listeE.map((l: any) => <div key={l.e.id} className={`sat-l${apE?.e.id === l.e.id ? ' on' : ''}`}><input type="checkbox" checked={!!coches[l.e.id]} aria-label={`Choisir ${l.e.prenom} ${l.e.nom}`} onChange={(x) => setCoches({ ...coches, [l.e.id]: x.target.checked })} /><button onClick={() => setAp(l.e.id)}><Rang r={l.rang} f={l.e.sexe === 'F'} /><span>{l.e.nom} {l.e.prenom}</span><em>{dec(l.moy)}</em></button></div>)}
          <Champ label="Modèle"><select value={modele} onChange={(x) => setMod(x.target.value)}>{MODELES_E.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Champ>{btn}</section>
        <div className="cert-ap">{apE && certE(apE, listeE.indexOf(apE))}</div>
      </div>}</Etat>
    </>}</Etat> : <Etat q={pq}>{() => pers.length === 0 ? <section className="carte"><Vide t="Ajoutez d'abord le personnel dans « Enseignants & personnel »." /></section> : <div className="sat-zone">
      <section className="carte sat-g"><h3>Personnel de l'école</h3><p className="note">Une attestation prête pour chaque personne. Décochez celles à ne pas imprimer.</p>
        {pers.map((p) => <div key={p.id} className={`sat-l${apP?.id === p.id ? ' on' : ''}`}><input type="checkbox" checked={!!coches[p.id]} aria-label={`Choisir ${nomP(p)}`} onChange={(x) => setCoches({ ...coches, [p.id]: x.target.checked })} /><button onClick={() => setAp(p.id)}><span>{nomP(p)}<small>{fonctionDe(p)}</small></span></button></div>)}
        <Champ label="Modèle"><select value={modP} onChange={(x) => setModP(x.target.value)}>{MODELES_P.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select></Champ>{btn}</section>
      <div className="cert-ap">{apP && certP(apP, pers.indexOf(apP))}</div>
    </div>}</Etat>}
    {imp && <ZoneImp>{vue === 'eleves' ? choisisE.map((l: any) => <div key={l.e.id} className="feuille-cert">{certE(l, listeE.indexOf(l))}</div>) : choisisP.map((p) => <div key={p.id} className="feuille-cert">{certP(p, pers.indexOf(p))}</div>)}</ZoneImp>}
    <span hidden>{eid}</span>
  </>;
}

// ---------------------------------------------------------------- Bulletins de paie (avances = dépenses « Avance sur salaire »)
function FormAvance({ pers, mois, fermer, fini }: any) {
  const { eid, annee } = useApp(); const e = useEnvoi(); const auj = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState<any>({ p: pers[0]?.id || '', montant: 0, date: auj.slice(0, 7) === mois.slice(0, 7) ? auj : mois });
  return <Modale titre="Enregistrer une avance sur salaire" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!f.p) return e.setE('Choisissez la personne'); if (!f.montant) return e.setE('Indiquez le montant');
    e.envoyer(async () => {
      const cats = await db.get(`categories_depense?etablissement_id=eq.${eid}&select=id,libelle`);
      const cat = cats.find((c: any) => /salaire/i.test(c.libelle)) || cats[0]; const p = pers.find((x: any) => x.id === f.p);
      await db.ins('depenses', { etablissement_id: eid, annee_scolaire_id: annee.id, categorie_id: cat.id, libelle: 'Avance sur salaire', beneficiaire: nomP(p), montant: f.montant, date_depense: f.date, est_salaire: true, enseignant_id: p.id });
      fini();
    }); }}>
    <Champ label="Personne"><select value={f.p} onChange={(x) => setF({ ...f, p: x.target.value })}>{pers.map((p: any) => <option key={p.id} value={p.id}>{nomP(p)} · {fonctionDe(p)}</option>)}</select></Champ>
    <div className="deux"><div className="champ"><span>Montant</span><MontantSimple value={f.montant} onChange={(v: number) => setF({ ...f, montant: v })} /></div><Champ label="Date"><input type="date" value={f.date} onChange={(x) => setF({ ...f, date: x.target.value })} /></Champ></div>
    <p className="note">L'avance est enregistrée dans les Dépenses (catégorie Salaires) et retirée automatiquement du salaire du mois.</p>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />Enregistrer l'avance</button></form></Modale>;
}
const MontantSimple = ({ value, onChange }: any) => <div className="montant"><input inputMode="numeric" value={value ? nb(value) : ''} placeholder="0" onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} /><b>GNF</b></div>;

function FormSalaire({ p, s, fermer, fini }: any) {
  const { eid } = useApp(); const e = useEnvoi(); const [f, setF] = useState<any>({ salaire_base: s?.salaire_base || 0, prime: s?.prime || 0, prime_libelle: s?.prime_libelle || '' });
  return <Modale titre={`Salaire de ${nomP(p)}`} fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.ups('salaires', { enseignant_id: p.id, etablissement_id: eid, ...f, prime_libelle: f.prime_libelle.trim() || null }, 'enseignant_id'); fini(); }); }}>
    <div className="champ"><span>Salaire de base (par mois)</span><MontantSimple value={f.salaire_base} onChange={(v: number) => setF({ ...f, salaire_base: v })} /></div>
    <div className="deux"><div className="champ"><span>Prime chaque mois</span><MontantSimple value={f.prime} onChange={(v: number) => setF({ ...f, prime: v })} /></div><Champ label="Nom de la prime"><input placeholder="Heures supplémentaires…" value={f.prime_libelle} onChange={(x) => setF({ ...f, prime_libelle: x.target.value })} /></Champ></div>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />Enregistrer</button></form></Modale>;
}

function FichePaie({ r, lm }: any) {
  const { etab } = useApp();
  return <div className="fiche-paie"><div className="fp-h"><div><LogoEcole etab={etab} taille={44} /><span><b>{String(etab.nom || '').toUpperCase()}</b><small>Bulletin de paie</small></span></div><em>{lm?.label} {lm?.cle.slice(0, 4)}</em></div>
    <dl className="fp-id"><div><dt>Nom</dt><dd>{nomP(r.p)}</dd></div><div><dt>Fonction</dt><dd>{fonctionDe(r.p)}{r.p.classe_matiere ? ` · ${r.p.classe_matiere}` : ''}</dd></div></dl>
    <div className="fp-l"><div><span>Salaire de base</span><b>{nb(r.base)} GNF</b></div>{r.prime > 0 && <div><span>Prime{r.s?.prime_libelle ? ` (${r.s.prime_libelle.toLowerCase()})` : ''}</span><b>{nb(r.prime)} GNF</b></div>}
      {r.av.map((a: any) => <div key={a.id} className="rouge"><span>Avance du {dateFr(a.date_depense)}</span><b>− {nb(a.montant)} GNF</b></div>)}
      <div className="net"><span>Net à payer</span><b>{nb(r.net)} GNF</b></div></div>
    {r.av.length > 0 && <p className="fp-n">{r.av.length > 1 ? `Les ${r.av.length} avances viennent` : 'L’avance vient'} du menu Dépenses → « Avance sur salaire », au nom de {nomP(r.p)}.</p>}
    <div className="sign deux-s"><span>Signature de l'employé(e)</span><span>Le Comptable</span></div></div>;
}

export function Paie() {
  const { eid, annee, can } = useApp(); const pc = usePc(); const liste = useMemo(() => moisListe(annee), [annee?.id]); const [mois, setMois] = useState(() => moisCourant(liste));
  const [sel, setSel] = useState(''); const [av, setAv] = useState(false); const [sal, setSal] = useState<any>(null); const [imp, setImp] = useState<'' | 'un' | 'tous'>('');
  useImpression(!!imp, () => setImp(''));
  const lm = liste.find((m) => m.cle === mois); const fin = new Date(new Date(mois + 'T00:00:00').getFullYear(), new Date(mois + 'T00:00:00').getMonth() + 1, 0); const finS = `${fin.getFullYear()}-${String(fin.getMonth() + 1).padStart(2, '0')}-${String(fin.getDate()).padStart(2, '0')}`;
  const q = useQ(async () => {
    const [pers, sals, avs] = await Promise.all([
      db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&select=id,prenom,nom,sexe,categorie,fonction,classe_matiere&order=ordre,nom`),
      db.get(`salaires?etablissement_id=eq.${eid}&select=*`),
      db.get(`depenses?etablissement_id=eq.${eid}&enseignant_id=not.is.null&date_depense=gte.${mois}&date_depense=lte.${finS}&statut=not.in.(rejetee,annulee)&select=id,enseignant_id,montant,date_depense&order=date_depense`),
    ]);
    return { pers, sals, avs };
  }, [eid, mois]);
  const d: any = q.data;
  const lignes = d ? d.pers.map((p: any) => { const s = d.sals.find((x: any) => x.enseignant_id === p.id); const a = d.avs.filter((x: any) => x.enseignant_id === p.id); const base = Number(s?.salaire_base || 0), prime = Number(s?.prime || 0), avance = a.reduce((t: number, x: any) => t + Number(x.montant), 0); return { p, s, av: a, base, prime, avance, net: base + prime - avance }; }) : [];
  const payes = lignes.filter((r: any) => r.base + r.prime > 0);
  const tot = { masse: payes.reduce((t: number, r: any) => t + r.base + r.prime, 0), av: lignes.reduce((t: number, r: any) => t + r.avance, 0) };
  const r = lignes.find((x: any) => x.p.id === sel) || payes[0] || lignes[0];
  if (!can('directeur', 'comptable')) return <><Entete t="Bulletins de paie" /><section className="carte"><Vide t="Les salaires sont visibles seulement par la direction et la comptabilité." /></section></>;
  const actions = <><button className="btn contour" onClick={() => setAv(true)} disabled={!lignes.length}><PiPlusBold />Enregistrer une avance</button><button className="btn plein" onClick={() => setImp('tous')} disabled={!payes.length}><PiPrinterDuotone aria-hidden="true" />Imprimer tous les bulletins</button></>;
  const M = <div className="puces-mois" role="tablist" aria-label="Mois">{liste.map((m) => <button key={m.cle} role="tab" aria-selected={mois === m.cle} className={mois === m.cle ? 'on' : ''} onClick={() => setMois(m.cle)}>{m.label}</button>)}</div>;
  return <>
    <Entete t={pc ? `Bulletins de paie · ${lm?.label} ${mois.slice(0, 4)}` : 'Bulletins de paie'} sous={pc ? 'Les avances sur salaire enregistrées au nom de chaque personne sont déduites automatiquement.' : ''} action={pc && actions}>{!pc && M}</Entete>
    {pc && <section className="carte filtres-p"><div className="fl"><span className="filtre-l">Mois</span>{M}</div></section>}
    <Etat q={q}>{() => lignes.length === 0 ? <section className="carte"><Vide t="Ajoutez d'abord le personnel dans « Enseignants & personnel »." /></section> : <>
      <div className="kpi-p"><div><small>Masse salariale</small><b>{nb(tot.masse)} GNF</b></div><div><small>Avances déduites</small><b className="rouge">{tot.av ? '− ' : ''}{nb(tot.av)} GNF</b></div><div><small>Net à payer</small><b className="vert">{nb(tot.masse - tot.av)} GNF</b></div><div><small>Personnes payées</small><b>{nb(payes.length)}</b></div></div>
      {!pc && <div className="actions-tel">{actions}</div>}
      {payes.length < lignes.length && <div className="alerte-ph"><span><b>{nb(lignes.length - payes.length)} personne{lignes.length - payes.length > 1 ? 's' : ''} sans salaire enregistré.</b> Touchez une ligne puis « Salaire » pour l'indiquer.</span></div>}
      <section className="carte tab-z"><table className="tab-paie"><thead><tr><th className="g">Personne</th>{pc && <th>Salaire de base</th>}{pc && <th>Avances du mois</th>}<th>Net à payer</th><th /></tr></thead>
        <tbody>{lignes.map((x: any) => <tr key={x.p.id} className={r?.p.id === x.p.id ? 'on' : ''} onClick={() => setSel(x.p.id)}><td className="g"><b>{nomP(x.p)}</b><small>{fonctionDe(x.p)}</small></td>{pc && <td>{x.base + x.prime ? `${nb(x.base + x.prime)} GNF` : <span className="gris">À indiquer</span>}</td>}{pc && <td>{x.avance ? <span className="rouge">− {nb(x.avance)} GNF</span> : <span className="gris">—</span>}</td>}<td><b>{nb(x.net)} GNF</b></td><td><button className="btn contour mini" onClick={(ev) => { ev.stopPropagation(); setSal(x); }}>Salaire</button></td></tr>)}</tbody></table></section>
      {r && <section className="carte fp-z">{r.base + r.prime > 0 ? <><FichePaie r={r} lm={lm} /><button className="btn contour" onClick={() => setImp('un')}><PiPrinterDuotone aria-hidden="true" />Imprimer ce bulletin</button></> : <Vide t={`Indiquez le salaire de ${nomP(r.p)} pour préparer son bulletin.`}><button className="btn plein mini" onClick={() => setSal(r)}>Indiquer le salaire</button></Vide>}</section>}
    </>}</Etat>
    {av && d && <FormAvance pers={d.pers} mois={mois} fermer={() => setAv(false)} fini={() => { setAv(false); q.reload(); }} />}
    {sal && <FormSalaire p={sal.p} s={sal.s} fermer={() => setSal(null)} fini={() => { setSal(null); q.reload(); }} />}
    {imp && <ZoneImp>{(imp === 'un' ? [r] : payes).map((x: any) => <div key={x.p.id} className="feuille-doc"><FichePaie r={x} lm={lm} /></div>)}</ZoneImp>}
  </>;
}

// ---------------------------------------------------------------- Tableau de bord de l'enseignant
export function TableauEnseignant() {
  const { eid, annee } = useApp(); const pc = usePc(); const uid = getSession()?.user?.id;
  const qp = useQ(async () => {
    // La fiche du professeur : reliée à son compte, ou retrouvée par son numéro de téléphone.
    const pr = await db.get(`profils?id=eq.${uid}&select=telephone`).catch(() => []); const t = pr[0]?.telephone;
    const l = await db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&or=(profil_id.eq.${uid}${t ? `,telephone.eq.${t}` : ''})&select=*&limit=1`);
    return l[0] || null;
  }, [eid, uid]);
  const moi: any = qp.data; const ce = useEleves(); const d: any = ce.data;
  const c = d && moi ? d.classes.find((x: any) => x.nom.trim().toLowerCase() === String(moi.classe_matiere || '').trim().toLowerCase()) : null;
  const cq = useClasse(c?.id || ''); const cd: any = cq.data; const eleves: any[] = (c && d?.par?.[c.id]) || [];
  const liste = useMemo(() => moisListe(annee), [annee?.id]);
  const avecNotes = liste.filter((m) => (cd?.notes || []).some((n: any) => n.mois === m.cle));
  const dernier = avecNotes[avecNotes.length - 1]; const avant = avecNotes[avecNotes.length - 2];
  const cl = useMemo(() => cd && dernier ? classement(eleves, cd.mat, cd.notes, dernier.cle, avant?.cle) : null, [cd, eleves.length, dernier?.cle]);
  const evol = useMemo(() => cd ? avecNotes.map((m) => ({ m, v: classement(eleves, cd.mat, cd.notes, m.cle).moyClasse })) : [], [cd, eleves.length]);
  const photos = usePhotos(moi?.photo_chemin ? [moi.photo_chemin] : []);
  const [imp, setImp] = useState(false); useImpression(imp, () => setImp(false));
  const { etab } = useApp();
  const ans = moi?.date_entree ? Math.max(1, new Date().getFullYear() - new Date(moi.date_entree).getFullYear()) : 0;
  const moisCour = moisListe(annee).find((m) => m.cle === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
  const aFaire = moisCour && cd?.mat?.length ? eleves.length * cd.mat.length - (cd.notes || []).filter((n: any) => n.mois === moisCour.cle).length : 0;
  const anniv = eleves.filter((e: any) => e.date_naissance && e.date_naissance.slice(5) === new Date().toISOString().slice(5, 10));
  const notesCour = moisCour ? (cd?.notes || []).filter((n: any) => n.mois === moisCour.cle).length : 0; const attendu = moisCour && cd?.mat?.length ? eleves.length * cd.mat.length : 0;
  const moyAvant = cd && avant ? classement(eleves, cd.mat, cd.notes, avant.cle).moyClasse : 0;
  const suivre = cl ? cl.lignes.filter((l: any) => l.moy < cl.sur / 2 || (l.prec != null && l.moy - l.prec <= -0.5)) : [];
  return <>
    <Bandeau><section className="hero hero-simple"><div className="hero-haut"><div className="hero-g"><Bonjour /><div className="hero-titre"><h1>Mon espace enseignant</h1></div><span className="hero-sur">{jourLong()} · {moi ? `${fonctionDe(moi)}${moi.classe_matiere ? ` · ${moi.classe_matiere}` : ''}` : ''} · Année {annee.libelle}</span></div></div><Vague /></section></Bandeau>
    <Etat q={qp}>{() => !moi ? <section className="carte vide-mat"><h3>Votre fiche n'est pas encore reliée</h3><p>Demandez à la direction d'ouvrir votre fiche dans Scolaris et de toucher « Donner l'accès à Scolaris » avec votre numéro de téléphone. Votre classe et vos résultats apparaîtront ici.</p></section> : <>
      <section className="carte jour"><div className="jour-h"><Tuile i={PiSunDuotone} ton="orange" /><div><b>Aujourd'hui</b><small>{jourLong()}</small></div></div>
        <ul className="jour-l">
          {anniv.length > 0 && <li><Tuile i={PiCakeDuotone} ton="violet" /><span><b>Anniversaire{anniv.length > 1 ? 's' : ''} dans votre classe</b><small>{anniv.map((e: any) => `${e.prenom} ${e.nom}`).join(', ')}</small></span></li>}
          {moisCour && <li><Tuile i={PiNotebookDuotone} ton={notesCour >= attendu && attendu > 0 ? 'vert' : 'bleu'} /><span><b>Notes de {moisCour.label.toLowerCase()}</b><small>{attendu === 0 ? 'Les matières de la classe ne sont pas encore enregistrées.' : notesCour >= attendu ? 'Toutes les notes du mois sont enregistrées.' : notesCour === 0 ? 'Pas encore de notes enregistrées ce mois-ci.' : `${Math.round(100 * notesCour / attendu)} % des notes du mois sont enregistrées.`}</small></span></li>}
          {cl && avant && <li><Tuile i={cl.moyClasse >= moyAvant ? PiTrendUpDuotone : PiTrendDownDuotone} ton={cl.moyClasse >= moyAvant ? 'vert' : 'rouge'} /><span><b>La classe est {cl.moyClasse >= moyAvant ? 'en progrès' : 'en baisse'}</b><small>Moyenne {avant.label.toLowerCase()} {dec(moyAvant)} → {dernier.label.toLowerCase()} {dec(cl.moyClasse)}</small></span></li>}
          {cl && cl.lignes[0] && <li><Tuile i={PiCrownDuotone} ton="orange" /><span><b>Premier{cl.lignes[0].e.sexe === 'F' ? 'e' : ''} de la classe en {dernier.label.toLowerCase()}</b><small>{cl.lignes[0].e.prenom} {cl.lignes[0].e.nom} · {dec(cl.lignes[0].moy)} / {cl.sur}</small></span></li>}
        </ul></section>
      <div className="kpi-p kpi-e">
        <div><Tuile i={PiStudentDuotone} ton="bleu" /><small>Mes élèves{c ? ` · ${c.nom}` : ''}</small><b>{nb(eleves.length)}</b></div>
        <div><Tuile i={PiChartLineUpDuotone} ton="vert" /><small>Moyenne de la classe{dernier ? ` · ${dernier.label.toLowerCase()}` : ''}</small><b>{cl ? dec(cl.moyClasse) : '—'}{cl && <em> / {cl.sur}</em>}</b></div>
        <div><Tuile i={PiTargetDuotone} ton="orange" /><small>Élèves qui ont la moyenne</small><b>{cl && cl.lignes.length ? Math.round(100 * cl.lignes.filter((l: any) => l.moy >= cl.sur / 2).length / cl.lignes.length) : '—'}{cl && <em> %</em>}</b></div>
        <div><Tuile i={PiMedalDuotone} ton="violet" /><small>Au service de l'école</small><b>{ans || '—'}{ans ? <em> an{ans > 1 ? 's' : ''}</em> : null}</b></div>
      </div>
      <div className="rang r-ordre">
        <section className="carte c-large"><div className="tete-carte"><h2>Évolution de ma classe</h2></div>
          {evol.length === 0 ? <p className="note">La courbe se remplit mois après mois, dès que les notes sont saisies.</p> : <div className="evol">{evol.map(({ m, v }) => <div key={m.cle}><span style={{ height: `${Math.max(6, (v / (cl?.sur || 10)) * 100)}%` }}><b>{dec(v)}</b></span><small>{m.label.slice(0, 4)}.</small></div>)}</div>}</section>
        <section className="carte c-etat"><div className="tete-carte"><h2>Élèves à suivre{suivre.length ? ` (${nb(suivre.length)})` : ''}</h2></div>
          {!cl ? <p className="note">Rien à signaler pour le moment.</p> : suivre.length === 0 ? <p className="note">Aucun élève en difficulté ce mois-ci. Bravo !</p> : <ul className="lignes-e">{suivre.slice(0, 5).map((l: any) => <li key={l.e.id}><div className="ligne-e"><Rang r={l.rang} f={l.e.sexe === 'F'} /><div><b>{l.e.nom} {l.e.prenom}</b><small className="m-t-rouge">{l.moy < cl.sur / 2 ? `Sous la moyenne : ${dec(l.moy)}` : `En baisse : ${dec(l.prec)} → ${dec(l.moy)}`}</small></div></div></li>)}</ul>}</section>
      </div>
      <div className="rang r-ordre">
        <section className="carte c-large"><div className="tete-carte"><h2>Classement de ma classe{dernier ? ` · ${dernier.label.toLowerCase()}` : ''}</h2></div>
          {!cl || !cl.lignes.length ? <p className="note">Le classement apparaîtra dès que les notes du mois seront saisies.</p> : <ul className="lignes-e">{cl.lignes.slice(0, 5).map((l: any) => { const mn = mention(l.moy, cl.sur); return <li key={l.e.id}><div className="ligne-e"><Rang r={l.rang} f={l.e.sexe === 'F'} /><div><b>{l.e.nom} {l.e.prenom}</b><small className={`m-t-${mn.c}`}>{mn.t}</small></div><b className="moy">{dec(l.moy)}</b></div></li>; })}</ul>}</section>
        <section className="carte c-etat"><div className="tete-carte"><h2>Ma carte professionnelle</h2><button className="voir btn-lien" onClick={() => setImp(true)}>Imprimer</button></div><Carte x={moi} etab={etab} annee={annee} url={photos[moi.photo_chemin]} /></section>
      </div>
    </>}</Etat>
    {imp && moi && <ZoneImp><div className="feuille-cs"><Carte x={moi} etab={etab} annee={annee} url={photos[moi.photo_chemin]} /></div><div className="feuille-cs dos"><Carte x={moi} etab={etab} annee={annee} verso /></div></ZoneImp>}
  </>;
}
