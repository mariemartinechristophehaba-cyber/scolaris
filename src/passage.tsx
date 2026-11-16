import { useMemo, useState } from 'react';
import { PiArrowRightBold, PiCheckCircleFill, PiMagnifyingGlassBold, PiStudentDuotone, PiSignOutDuotone, PiArrowCounterClockwiseDuotone } from 'react-icons/pi';
import { Haut } from './abonnement';
import { db } from './api';
import { dateFr, gnf, nb, trierClasses } from './lib';
import { Avatar, Champ, Erreur, Etat, Modale, Titre, naviguer, useApp, useEnvoi, useQ } from './ui';

// ---- Classe supérieure proposée à partir du nom de la classe (CM1 A -> CM2 A, 7e Année B -> 8e Année B, 3e -> 2nde...) ----
const sans = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const SUITE: [RegExp, string][] = [
  [/^ps\b|^petite section/, 'MS'], [/^ms\b|^moyenne section/, 'GS'], [/^gs\b|^grande section/, 'CP'],
  [/^cp1\b/, 'CP2'], [/^cp2\b/, 'CE1'], [/^cp\b/, 'CE1'], [/^ce1\b/, 'CE2'], [/^ce2\b/, 'CM1'], [/^cm1\b/, 'CM2'],
  [/^(seconde|2nde)\b/, '1ère'], [/^(premiere|1ere)\b/, 'Terminale'],
];
const BASE = /^(petite section|moyenne section|grande section|ps|ms|gs|cp1|cp2|cp|ce1|ce2|cm1|cm2|seconde|2nde|premiere|1ere|terminale|tle|\d{1,2}\s*(?:e|eme|ere)\b)/;
export function baseDe(nom: string) { const m = sans(nom).match(BASE); return m ? m[1].replace(/\s+/g, ' ') : ''; }
export function suite(nom: string, noms: string[]): string {
  const s = sans(nom); const b = baseDe(nom); if (!b) return '';
  const reste = nom.trim().slice(nom.trim().length - (s.length - b.length)); // « A », « Année B »...
  const bases = new Set(noms.map(baseDe)); const num = (x: string) => { const m = x.match(/^(\d{1,2})\s*(e|eme|ere)$/); return m ? Number(m[1]) : null; };
  const nums = new Set([...bases].map(num).filter((x) => x !== null) as number[]);
  const seconde = [...bases].some((x) => /^(seconde|2nde)/.test(x));
  // Système français (6e, 5e, 4e, 3e puis 2nde) : les numéros descendent. Système guinéen (7e à 12e) : ils montent.
  const desc = seconde || (nums.has(5) && !nums.has(7) && !nums.has(8));
  // Nom réel d'une classe existante : même niveau et même suffixe (« A »), sinon la première de ce niveau.
  const reel = (ok: (x: string) => boolean, propose: string) => noms.find((x) => ok(baseDe(x)) && sans(x).endsWith(sans(reste))) || propose || noms.find((x) => ok(baseDe(x))) || '';
  const numero = (k: number) => nom.trim().replace(/^(\d{1,2})\s*(e|ème|eme|ère|ere)/i, (_m, _d, suf) => `${k}${/^e$/i.test(suf) ? 'e' : 'ème'}`);
  if (/^(terminale|tle)/.test(b)) return '';
  if (b === 'cm2') { const k = nums.has(7) ? 7 : nums.has(6) ? 6 : 0; return k ? noms.find((x) => num(baseDe(x)) === k && sans(x).endsWith(sans(reste))) || noms.find((x) => num(baseDe(x)) === k) || '' : ''; }
  const n = num(b);
  if (n !== null && !(desc && b === '1ere')) {
    let k = 0;
    if (desc) { if (n >= 4 && n <= 6) k = n - 1; else if (n === 3) return seconde ? reel((x) => /^(seconde|2nde)/.test(x), `2nde${reste}`) : ''; else return ''; }
    else if (n === 12) return reel((x) => /^(terminale|tle)/.test(x), '') ;
    else if (nums.has(n + 1)) k = n + 1; else return '';
    return reel((x) => num(x) === k, numero(k));
  }
  for (const [re, t] of SUITE) if (re.test(b)) return reel((x) => sans(x).startsWith(sans(t)) && baseDe(x) === baseDe(t), `${t}${reste}`);
  return '';
}

const anneeSuivante = (a: any) => {
  const m = String(a.libelle).match(/(\d{4})\D+(\d{4})/); const plus = (d: string) => { const x = new Date(d + 'T00:00:00'); x.setFullYear(x.getFullYear() + 1); return x.toISOString().slice(0, 10); };
  return { libelle: m ? `${Number(m[1]) + 1}-${Number(m[2]) + 1}` : '', date_debut: plus(a.date_debut), date_fin: plus(a.date_fin) };
};

const Cadre = ({ children }: any) => <><Titre t="Paramètres" /><div className="abp"><Haut t="Passer à l'année suivante" retour={() => naviguer('/parametres/annee')} /><div className="abp-co par-co">{children}</div></div></>;

const DEC: [string, string, any][] = [['passe', 'Passe', PiArrowRightBold], ['redouble', 'Redouble', PiArrowCounterClockwiseDuotone], ['part', 'Part', PiSignOutDuotone]];

export function Passage() {
  const { annee, annees, recharger, can } = useApp();
  const suivante = annees.find((a: any) => a.statut === 'preparation' && a.date_debut > annee.date_debut);
  const [na, setNa] = useState(() => anneeSuivante(annee)); const [frais, setFrais] = useState(true);
  const [cibles, setCibles] = useState<Record<string, string>>({}); const [dec, setDec] = useState<Record<string, string>>({});
  const [txt, setTxt] = useState(''); const [cl, setCl] = useState(''); const [n, setN] = useState(30); const [fin, setFin] = useState<any>(null); const [conf, setConf] = useState(false);
  const e = useEnvoi();
  const q = useQ(async () => {
    const [classes, el] = await Promise.all([db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,nom,ordre,niveaux(nom)&order=ordre,nom`), db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&select=eleve_id,inscription_id,nom,prenom,matricule,classe_id,classe,reste&order=nom,prenom,inscription_id`)]);
    return { classes: trierClasses(classes), el };
  }, [annee.id]);
  const retour = () => naviguer('/parametres/annee');
  if (!can('directeur')) return <Cadre><p className="note">Seul le directeur peut préparer l'année suivante.</p></Cadre>;
  if (fin) return <Cadre><div className="pas-fin"><PiCheckCircleFill aria-hidden="true" /><h2>L'année {fin.libelle} est prête</h2>
    <ul><li><b>{nb(fin.passe)}</b> élèves passent en classe supérieure</li><li><b>{nb(fin.redouble)}</b> redoublants</li><li><b>{nb(fin.sortants)}</b> sortants (fin de cycle) et <b>{nb(fin.part)}</b> départs</li><li><b>{nb(fin.classes)}</b> classes créées{frais ? ', frais recopiés' : ''}</li></ul>
    <p className="abp-info">L'année reste en préparation. Choisissez-la en haut de l'écran pour vérifier les frais et ajouter les nouveaux élèves. À la rentrée, activez-la dans « Année scolaire » : les dettes et les avances de chaque élève y seront reportées.</p>
    <button className="abp-cta" onClick={retour}>Terminé</button></div></Cadre>;
  if (suivante) return <Cadre><p className="note">L'année {suivante.libelle} est déjà en préparation. Activez-la à la rentrée ou supprimez-la dans « Année scolaire » pour recommencer.</p><button className="btn contour" onClick={retour}>Année scolaire</button></Cadre>;
  return <Cadre><Etat q={q}>{(d) => {
    const noms = d.classes.map((c: any) => c.nom);
    const cible = (c: any) => (c.id in cibles ? cibles[c.id] : suite(c.nom, noms));
    const effectif = (id: string) => d.el.filter((x: any) => x.classe_id === id).length;
    const choix = [...new Set([...noms, ...d.classes.map((c: any) => suite(c.nom, noms)).filter(Boolean)])].sort();
    const t = txt.trim().toLowerCase(); const liste = d.el.filter((x: any) => (!cl || x.classe_id === cl) && (!t || `${x.nom} ${x.prenom} ${x.matricule}`.toLowerCase().includes(t)));
    const compte = (k: string) => d.el.filter((x: any) => (dec[x.eleve_id] || 'passe') === k).length;
    const sortants = d.el.filter((x: any) => (dec[x.eleve_id] || 'passe') === 'passe' && !cible(d.classes.find((c: any) => c.id === x.classe_id) || {})).length;
    const lancer = () => e.envoyer(async () => {
      const cl2 = d.classes.map((c: any) => { const nom = cible(c); const mod = nom && d.classes.find((x: any) => baseDe(x.nom) === baseDe(nom) && x.nom !== c.nom); return { source_id: c.id, cible_nom: nom, modele_id: mod?.id || null }; });
      const visees = new Set(cl2.map((x: any) => sans(x.cible_nom)));
      const nouvelles = d.classes.filter((c: any) => !visees.has(sans(c.nom))).map((c: any) => ({ nom: c.nom, modele: c.id }));
      const decisions = Object.fromEntries(Object.entries(dec).filter(([, v]) => v !== 'passe'));
      const r = await db.rpc('passer_annee', { p: { annee_source: annee.id, ...na, copier_frais: frais, classes: cl2, decisions, nouvelles } });
      setConf(false); setFin(r); await recharger();
    });
    return <div className="par-f pas">
      <section><h2 className="par-q"><span className="pas-n">1</span>La nouvelle année</h2>
        <Champ label="Nom"><input value={na.libelle} onChange={(x) => setNa({ ...na, libelle: x.target.value })} placeholder="2027-2028" /></Champ>
        <div className="deux"><Champ label="Début"><input type="date" value={na.date_debut} onChange={(x) => setNa({ ...na, date_debut: x.target.value })} /></Champ><Champ label="Fin"><input type="date" value={na.date_fin} onChange={(x) => setNa({ ...na, date_fin: x.target.value })} /></Champ></div>
        <label className="pas-c"><input type="checkbox" checked={frais} onChange={(x) => setFrais(x.target.checked)} /><span><b>Garder les mêmes frais</b><small>Montants et tranches recopiés, dates décalées d'un an. Modifiables ensuite.</small></span></label>
      </section>
      <section><h2 className="par-q"><span className="pas-n">2</span>Où vont les élèves ?</h2><p className="par-s">Scolaris propose la classe supérieure. Changez-la si besoin.</p>
        <ul className="pas-cl">{d.classes.map((c: any) => { const v = cible(c); return <li key={c.id}><div><b>{c.nom}</b><small>{nb(effectif(c.id))} élève{effectif(c.id) > 1 ? 's' : ''}</small></div><PiArrowRightBold aria-hidden="true" />
          <select value={v} onChange={(x) => setCibles({ ...cibles, [c.id]: x.target.value })} aria-label={`Classe suivante de ${c.nom}`} className={v ? '' : 'sortie'}><option value="">Quittent l'école (fin de cycle)</option>{[...new Set([...choix, v].filter(Boolean))].map((nm) => <option key={nm} value={nm}>{nm}</option>)}</select></li>; })}</ul>
      </section>
      <section><h2 className="par-q"><span className="pas-n">3</span>Redoublants et départs</h2><p className="par-s">Par défaut, tout le monde passe. Indiquez seulement les exceptions.</p>
        <div className="pas-tot">{DEC.map(([k, l]) => <span key={k} className={`pas-t ${k}`}><b>{nb(compte(k))}</b>{l === 'Passe' ? 'passent' : l === 'Redouble' ? 'redoublent' : 'partent'}</span>)}</div>
        <div className="barre-outils"><div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={txt} onChange={(x) => { setTxt(x.target.value); setN(30); }} placeholder="Rechercher un élève" aria-label="Rechercher un élève" /></div>
          <select value={cl} onChange={(x) => { setCl(x.target.value); setN(30); }} aria-label="Classe"><option value="">Toutes les classes</option>{d.classes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <ul className="pas-el">{liste.slice(0, n).map((x: any) => { const v = dec[x.eleve_id] || 'passe'; return <li key={x.inscription_id}><Avatar nom={`${x.nom} ${x.prenom}`} /><div><b>{x.nom} {x.prenom}</b><small>{x.classe}{Number(x.reste) > 0 ? `, doit ${gnf(x.reste)}` : ''}</small></div>
          <div className="pas-dec" role="radiogroup" aria-label={`Décision pour ${x.prenom} ${x.nom}`}>{DEC.map(([k, l, I]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={v === k ? `on ${k}` : ''} onClick={() => setDec({ ...dec, [x.eleve_id]: k })}><I aria-hidden="true" /><span>{l}</span></button>)}</div></li>; })}</ul>
        {liste.length > n && <div className="plus-l"><button className="btn contour mini" onClick={() => setN(n + 30)}>Voir la suite ({nb(liste.length - n)})</button></div>}
        {liste.length === 0 && <p className="note">Aucun élève.</p>}
      </section>
      <Erreur t={e.erreur} />
      <div className="abp-bas"><button className="abp-cta" type="button" disabled={!na.libelle || !na.date_debut || !na.date_fin} onClick={() => setConf(true)}>Créer l'année {na.libelle}</button></div>
      {conf && <Modale titre={`Créer l'année ${na.libelle}`} fermer={() => !e.occupe && setConf(false)}>
        <ul className="pas-rec"><li><PiStudentDuotone aria-hidden="true" /><span><b>{nb(compte('passe') - sortants)}</b> élèves passent en classe supérieure</span></li><li><PiArrowCounterClockwiseDuotone aria-hidden="true" /><span><b>{nb(compte('redouble'))}</b> redoublent</span></li><li><PiSignOutDuotone aria-hidden="true" /><span><b>{nb(sortants + compte('part'))}</b> quittent l'école</span></li></ul>
        <p className="note">Du {dateFr(na.date_debut)} au {dateFr(na.date_fin)}. L'année en cours ({annee.libelle}) ne change pas : les paiements continuent normalement jusqu'à la rentrée.</p>
        <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe} onClick={lancer}>{e.occupe ? 'Création en cours…' : 'Oui, créer l\'année'}</button></Modale>}
    </div>;
  }}</Etat></Cadre>;
}

// Activer la nouvelle année à la rentrée : reports des dettes et avances, clôture de l'ancienne.
export function Bascule({ a, ancienne, fermer, fini }: any) {
  const [rep, setRep] = useState(true); const [r, setR] = useState<any>(null); const e = useEnvoi();
  return <Modale titre={`Activer l'année ${a.libelle}`} fermer={() => !e.occupe && (r ? fini() : fermer())}>
    {r ? <><div className="pas-fin court"><PiCheckCircleFill aria-hidden="true" /><h2>L'année {a.libelle} est active</h2>
      <ul>{rep && <><li><b>{nb(r.dettes)}</b> dettes reportées ({gnf(r.total_dettes)})</li><li><b>{nb(r.avances)}</b> avances reportées ({gnf(r.total_avances)})</li></>}<li>L'année {ancienne?.libelle} est clôturée (consultable, plus modifiable)</li></ul></div>
      <button className="btn plein" onClick={fini}>Terminé</button></>
      : <><p className="note">{ancienne ? <>L'année <b>{ancienne.libelle}</b> sera clôturée : on pourra toujours la consulter, mais plus y enregistrer de paiement.</> : 'Cette année deviendra l\'année active.'}</p>
        {ancienne && <label className="pas-c"><input type="checkbox" checked={rep} onChange={(x) => setRep(x.target.checked)} /><span><b>Reporter les dettes et les avances</b><small>Ce qu'un élève devait encore est ajouté à sa nouvelle année ; une avance est déduite de ses nouveaux frais.</small></span></label>}
        <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe} onClick={() => e.envoyer(async () => { setR(await db.rpc('basculer_annee', { p_annee: a.id, p_reporter: rep })); })}>{e.occupe ? 'Activation…' : 'Activer maintenant'}</button></>}
  </Modale>;
}

export function useSuivante() { const { annee, annees } = useApp(); return useMemo(() => annees.find((a: any) => a.statut === 'preparation' && annee && a.date_debut > annee.date_debut), [annees, annee]); }
