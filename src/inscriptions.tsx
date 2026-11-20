// Inscription (nouveaux élèves) et réinscription (anciens élèves).
import { useMemo, useState } from 'react';
import { PiArrowRightBold, PiArrowsClockwiseDuotone, PiCalendarCheckDuotone, PiCheckCircleFill, PiMagnifyingGlassBold, PiMoneyWavyDuotone, PiStudentDuotone, PiUserPlusDuotone } from 'react-icons/pi';
import { db } from './api';
import { FormEleve } from './gestion';
import { suite } from './passage';
import { auj, dateFr, gnf, nb, trierClasses } from './lib';
import { Avatar, Champ, Erreur, Etat, Lien, Modale, OptClasses, Titre, Tuile, naviguer, useApp, useEnvoi, useQ } from './ui';

const nomE = (e: any) => `${e?.nom || ''} ${e?.prenom || ''}`.trim();
const quand = (v: string) => { const j = String(v).slice(0, 10); return j === auj() ? "aujourd'hui" : dateFr(v); };
const POUR: any = { nouveaux: 'inscription', anciens: 'reinscription' };
// Frais payés par un élève de cette classe selon qu'il s'inscrit ou se réinscrit.
export const fraisPour = (tarifs: any[], classe: string, type: 'inscription' | 'reinscription') =>
  tarifs.filter((t: any) => t.classe_id === classe && (!t.types_frais?.pour || t.types_frais.pour === 'tous' || POUR[t.types_frais.pour] === type));

function Recherche({ v, set, ph }: any) {
  return <div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={v} onChange={(x) => set(x.target.value)} placeholder={ph} aria-label={ph} /></div>;
}

function ListeIns({ l, vide }: any) {
  if (!l.length) return <p className="note">{vide}</p>;
  return <ul className="lignes-e">{l.map((x: any) => <li key={x.id}><Lien to={`/eleves/${x.eleves.id}`} className="ligne-e"><Avatar nom={nomE(x.eleves)} /><div><b>{nomE(x.eleves)}</b><small>{x.classes?.nom || ''} · {quand(x.date_inscription || x.cree_le)}</small></div><span className="ins-mat">{x.eleves.matricule}</span></Lien></li>)}</ul>;
}

/* ---------- Inscription : les nouveaux élèves ---------- */
export function Inscriptions() {
  const { annee, can } = useApp(); const [aj, setAj] = useState(false); const [txt, setT] = useState('');
  const q = useQ(async () => {
    const [l, classes, tarifs] = await Promise.all([
      db.tout(`inscriptions?annee_scolaire_id=eq.${annee.id}&type=eq.inscription&statut=eq.inscrit&select=id,cree_le,date_inscription,classes(nom),eleves(id,prenom,nom,matricule,statut)&order=cree_le.desc,id`),
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=*,niveaux(nom)&order=ordre,nom`),
      db.get(`tarifs?annee_scolaire_id=eq.${annee.id}&select=classe_id,montant,types_frais(libelle,pour)`),
    ]);
    return { l: l.filter((x: any) => x.eleves && x.eleves.statut !== 'archive'), classes: trierClasses(classes), tarifs };
  }, [annee.id]);
  const ecrire = can('directeur', 'secretaire') && annee.statut !== 'cloturee';
  return <>
    <Titre t="Inscription" />
    <Etat q={q}>{(d) => {
      const mois = auj().slice(0, 7); const ceMois = d.l.filter((x: any) => String(x.date_inscription || x.cree_le).startsWith(mois)).length;
      const ins = d.tarifs.filter((t: any) => t.types_frais?.pour === 'nouveaux'); const mins = ins.length ? Math.min(...ins.map((t: any) => t.montant)) : 0; const maxs = ins.length ? Math.max(...ins.map((t: any) => t.montant)) : 0;
      const t = txt.trim().toLowerCase(); const l = d.l.filter((x: any) => !t || `${nomE(x.eleves)} ${x.eleves.matricule} ${x.classes?.nom}`.toLowerCase().includes(t));
      return <div className="ins">
        <section className="ins-hero bleu"><span className="ins-hi"><PiUserPlusDuotone aria-hidden="true" /></span><div><h2>Nouveaux élèves</h2><p>Un enfant qui arrive pour la première fois dans votre école, année {annee.libelle}.</p></div>
          {ecrire && <button className="ins-cta" onClick={() => setAj(true)}><PiUserPlusDuotone aria-hidden="true" />Inscrire un nouvel élève</button>}</section>
        <div className="ins-k">
          <div><Tuile i={PiStudentDuotone} ton="bleu" t={36} /><span><small>Nouveaux inscrits</small><b>{nb(d.l.length)}</b></span></div>
          <div><Tuile i={PiCalendarCheckDuotone} ton="vert" t={36} /><span><small>Ce mois-ci</small><b>{nb(ceMois)}</b></span></div>
          <div><Tuile i={PiMoneyWavyDuotone} ton="orange" t={36} /><span><small>Frais d'inscription</small><b>{ins.length ? (mins === maxs ? gnf(mins) : `${nb(mins)} à ${gnf(maxs)}`) : 'Non fixés'}</b></span></div>
        </div>
        {!ins.length && can('directeur', 'comptable') && <p className="ins-info">Fixez le montant de l'<b>inscription</b> dans <Lien to="/frais">Frais scolaires</Lien> : il sera demandé seulement aux nouveaux élèves.</p>}
        <section className="carte"><div className="tete-carte"><h2>Inscrits cette année{d.l.length ? ` (${nb(d.l.length)})` : ''}</h2></div>
          {d.l.length > 5 && <div className="barre-outils"><Recherche v={txt} set={setT} ph="Rechercher un élève" /></div>}
          <ListeIns l={l.slice(0, 200)} vide={t ? 'Aucun élève trouvé.' : 'Aucun nouvel élève inscrit pour le moment.'} /></section>
        {aj && <FormEleve titre="Nouvelle inscription" type="inscription" classes={d.classes} fermer={() => setAj(false)} fini={() => { setAj(false); q.reload(); }} />}
      </div>;
    }}</Etat>
  </>;
}

/* ---------- Réinscription : les anciens élèves ---------- */
export function Reinscriptions() {
  const { annee, annees, eid, can } = useApp();
  const prev = useMemo(() => [...annees].filter((a: any) => a.date_debut < annee.date_debut).sort((a: any, b: any) => b.date_debut.localeCompare(a.date_debut))[0], [annees, annee]);
  const [ong, setO] = useState<'a' | 'd'>('a'); const [txt, setT] = useState(''); const [cl, setCl] = useState(''); const [sel, setSel] = useState<any>(null); const [aj, setAj] = useState(false); const [n, setN] = useState(40);
  const q = useQ(async () => {
    const [anc, cur, classes, tarifs] = await Promise.all([
      prev ? db.tout(`inscriptions?annee_scolaire_id=eq.${prev.id}&statut=eq.inscrit&select=id,eleve_id,classe_id,classes(nom),eleves(id,prenom,nom,matricule,date_naissance,sexe,statut)&order=id`) : [],
      db.tout(`inscriptions?annee_scolaire_id=eq.${annee.id}&select=id,eleve_id,type,cree_le,date_inscription,classes(nom),eleves(id,prenom,nom,matricule,statut)&order=cree_le.desc,id`),
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=*,niveaux(nom)&order=ordre,nom`),
      db.get(`tarifs?annee_scolaire_id=eq.${annee.id}&select=classe_id,montant,types_frais(libelle,pour)`),
    ]);
    return { anc: anc.filter((x: any) => x.eleves && x.eleves.statut !== 'archive'), cur, classes: trierClasses(classes), tarifs };
  }, [annee.id, prev?.id]);
  const ecrire = can('directeur', 'secretaire') && annee.statut !== 'cloturee';
  return <>
    <Titre t="Réinscription" />
    <Etat q={q}>{(d) => {
      const deja = new Map(d.cur.map((x: any) => [x.eleve_id, x]));
      const aFaire = d.anc.filter((x: any) => !deja.has(x.eleve_id));
      const reins = d.cur.filter((x: any) => x.type === 'reinscription' && x.eleves && x.eleves.statut !== 'archive');
      const total = d.anc.length; const fait = total - aFaire.length; const pc = total ? Math.round((fait / total) * 100) : 0;
      const noms = d.classes.map((c: any) => c.nom);
      const propose = (x: any) => { const nm = suite(x.classes?.nom || '', noms) || ''; return d.classes.find((c: any) => c.nom === nm)?.id || ''; };
      const anciennes = [...new Map(d.anc.map((x: any) => [x.classe_id, x.classes?.nom || ''])).entries()].sort((a: any, b: any) => String(a[1]).localeCompare(String(b[1])));
      const t = txt.trim().toLowerCase();
      const l1 = aFaire.filter((x: any) => (!cl || x.classe_id === cl) && (!t || `${nomE(x.eleves)} ${x.eleves.matricule}`.toLowerCase().includes(t)));
      const l2 = reins.filter((x: any) => !t || `${nomE(x.eleves)} ${x.eleves.matricule}`.toLowerCase().includes(t));
      return <div className="ins">
        <section className="ins-hero vert"><span className="ins-hi"><PiArrowsClockwiseDuotone aria-hidden="true" /></span><div><h2>Anciens élèves</h2><p>{prev ? <>Les élèves de <b>{prev.libelle}</b> qui reviennent en <b>{annee.libelle}</b>.</> : <>Un enfant qui était déjà dans votre école l'année dernière.</>}</p></div>
          {ecrire && <button className="ins-cta" onClick={() => setAj(true)}><PiUserPlusDuotone aria-hidden="true" />Réinscrire un ancien élève</button>}</section>
        {prev ? <section className="carte ins-prog"><div className="ins-ph"><div><small>Réinscriptions {annee.libelle}</small><b>{nb(fait)} / {nb(total)} <em>anciens élèves</em></b></div><span className="ins-pc">{pc} %</span></div>
          <s className="fr-bar"><i style={{ width: `${pc}%` }} /></s><p>{aFaire.length ? <>Il reste <b>{nb(aFaire.length)}</b> élève{aFaire.length > 1 ? 's' : ''} de {prev.libelle} à réinscrire.</> : 'Tous les anciens élèves sont réinscrits.'}</p></section>
          : <p className="ins-info">C'est votre première année sur Scolaris. Pour un élève qui était déjà chez vous l'an dernier, appuyez sur <b>Réinscrire un ancien élève</b> : il paiera les frais de <b>réinscription</b> au lieu de l'inscription.</p>}
        <section className="carte">
          {prev && <div className="onglets"><button className={ong === 'a' ? 'on' : ''} onClick={() => setO('a')}>À réinscrire ({nb(aFaire.length)})</button><button className={ong === 'd' ? 'on' : ''} onClick={() => setO('d')}>Déjà réinscrits ({nb(reins.length)})</button></div>}
          {!prev && <div className="tete-carte"><h2>Réinscrits cette année{reins.length ? ` (${nb(reins.length)})` : ''}</h2></div>}
          {(total > 5 || reins.length > 5) && <div className="barre-outils"><Recherche v={txt} set={(v: string) => { setT(v); setN(40); }} ph="Rechercher un élève" />{prev && ong === 'a' && <select value={cl} onChange={(x) => { setCl(x.target.value); setN(40); }} aria-label="Ancienne classe"><option value="">Toutes les classes</option>{anciennes.map(([id, nm]: any) => <option key={id} value={id}>{nm}</option>)}</select>}</div>}
          {prev && ong === 'a' ? (l1.length === 0 ? <p className="note">{t || cl ? 'Aucun élève trouvé.' : 'Aucun élève à réinscrire.'}</p> : <>
            <ul className="lignes-e ins-l">{l1.slice(0, n).map((x: any) => { const p = propose(x); const pn = d.classes.find((c: any) => c.id === p)?.nom; return <li key={x.id}><div className="ligne-e"><Avatar nom={nomE(x.eleves)} /><div><b>{nomE(x.eleves)}</b><small className="ins-tr">{x.classes?.nom}{pn && <><PiArrowRightBold aria-hidden="true" />{pn}</>}</small></div>{ecrire && <button className="btn-doux" onClick={() => setSel(x)}>Réinscrire</button>}</div></li>; })}</ul>
            {l1.length > n && <div className="plus-l"><button className="btn contour mini" onClick={() => setN(n + 40)}>Voir la suite ({nb(l1.length - n)})</button></div>}</>)
            : <ListeIns l={l2.slice(0, 200)} vide={t ? 'Aucun élève trouvé.' : 'Aucun élève réinscrit pour le moment.'} />}
        </section>
        {sel && <Reinscrire x={sel} classes={d.classes} tarifs={d.tarifs} init={propose(sel)} eid={eid} annee={annee} fermer={() => setSel(null)} fini={() => { q.reload(); }} />}
        {aj && <FormEleve titre="Réinscrire un ancien élève" type="reinscription" classes={d.classes} fermer={() => setAj(false)} fini={() => { setAj(false); setO('d'); q.reload(); }} />}
      </div>;
    }}</Etat>
  </>;
}

function Reinscrire({ x, classes, tarifs, init, eid, annee, fermer, fini }: any) {
  const [classe, setC] = useState(init); const [ok, setOk] = useState(false); const e = useEnvoi(); const el = x.eleves;
  const fr = fraisPour(tarifs, classe, 'reinscription'); const tot = fr.reduce((s: number, t: any) => s + Number(t.montant), 0);
  const go = () => e.envoyer(async () => {
    await db.rpc('enregistrer_eleve', { p: { id: el.id, prenom: el.prenom, nom: el.nom, matricule: el.matricule, date_naissance: el.date_naissance || '', sexe: el.sexe || '', classe_id: classe, type: 'reinscription', etablissement_id: eid, annee_scolaire_id: annee.id } });
    setOk(true); fini();
  });
  if (ok) return <Modale titre="Réinscription faite" fermer={fermer}><div className="ins-ok"><PiCheckCircleFill aria-hidden="true" /><h3>{el.prenom} est réinscrit{el.sexe === 'F' ? 'e' : ''}</h3><p>{classes.find((c: any) => c.id === classe)?.nom}, année {annee.libelle}{tot ? `. Frais de l'année : ${gnf(tot)}` : ''}.</p></div>
    <div className="ins-ok-b"><button className="btn plein" onClick={() => naviguer('/paiements/nouveau')}><PiMoneyWavyDuotone aria-hidden="true" />Encaisser un paiement</button><button className="btn contour" onClick={fermer}>Continuer les réinscriptions</button></div></Modale>;
  return <Modale titre="Réinscrire" fermer={() => !e.occupe && fermer()}>
    <div className="ins-el"><Avatar nom={nomE(el)} /><div><b>{nomE(el)}</b><small>{el.matricule} · était en {x.classes?.nom}</small></div></div>
    <Champ label="Nouvelle classe *"><select value={classe} onChange={(v) => setC(v.target.value)} required><option value="">Choisir…</option><OptClasses l={classes} /></select></Champ>
    {classe && <div className="ins-fr"><b>Ce qu'il paiera cette année</b>{fr.length ? <ul>{fr.map((t: any, i: number) => <li key={i}><span>{t.types_frais?.libelle}</span><span>{gnf(t.montant)}</span></li>)}<li className="tot"><span>Total</span><span>{gnf(tot)}</span></li></ul> : <p className="note">Aucun frais fixé pour cette classe.</p>}</div>}
    <Erreur t={e.erreur} /><button className="btn plein" disabled={!classe || e.occupe} onClick={go}>{e.occupe ? 'Réinscription…' : `Réinscrire ${el.prenom}`}</button>
  </Modale>;
}

