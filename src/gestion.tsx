import { useMemo, useState } from 'react';
import { PiBooksDuotone, PiBusDuotone, PiCoinsDuotone, PiGraduationCapDuotone, PiIdentificationBadgeDuotone, PiNotePencilDuotone, PiCaretLeftBold, PiCaretRightBold, PiCheckBold, PiClockCountdownFill, PiEyeDuotone, PiFileArrowUpDuotone, PiHandCoinsDuotone, PiMagnifyingGlassBold, PiMoneyWavyDuotone, PiPencilSimpleDuotone, PiPhoneDuotone, PiPlusBold, PiReceiptDuotone, PiStudentDuotone, PiTrashDuotone, PiWhatsappLogoFill, PiCrownSimpleFill } from 'react-icons/pi';
import { db } from './api';
import { Jauge } from './charts';
import { dateFr, gnf, nb, tel, telAff } from './lib';
import { Avatar, Champ, Erreur, Etat, Gnf, Lien, Modale, Montant, Pastille, Titre, Tuile, Vide, naviguer, useApp, useEnvoi, useQ } from './ui';

const etat = (s: any) => (s.situation === 'a_jour' ? 'a_jour' : s.situation === 'rien_paye' && s.facture_net > 0 ? 'rien' : s.en_retard ? 'retard' : s.situation === 'partiel' ? 'partiel' : 'sans');
export const Statut = ({ s }: { s: any }) => <Pastille k={etat(s)} />;
const FINANCE = ['directeur', 'comptable', 'caissier', 'secretaire'];

function FormEleve({ init, classes, fermer, fini }: any) {
  const { eid, annee } = useApp();
  const [f, setF] = useState<any>(init || { prenom: '', nom: '', matricule: '', classe_id: classes[0]?.id || '', parent_nom: '', parent_telephone: '', date_naissance: '', sexe: '' });
  const e = useEnvoi();
  const c = (k: string, req = false) => ({ value: f[k] ?? '', onChange: (x: any) => setF({ ...f, [k]: x.target.value }), required: req });
  return (
    <Modale titre={init ? 'Modifier l\'élève' : 'Ajouter un élève'} fermer={fermer}>
      <form onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.rpc('enregistrer_eleve', { p: { ...f, parent_telephone: tel(f.parent_telephone), etablissement_id: eid, annee_scolaire_id: annee.id } }); fini(); }); }}>
        <div className="deux"><Champ label="Prénom *"><input {...c('prenom', true)} /></Champ><Champ label="Nom *"><input {...c('nom', true)} /></Champ></div>
        <Champ label="Classe *"><select {...c('classe_id', true)}><option value="">Choisir…</option>{classes.map((k: any) => <option key={k.id} value={k.id}>{k.nom}</option>)}</select></Champ>
        <div className="deux"><Champ label="Matricule" aide="Automatique si vide"><input {...c('matricule')} /></Champ><Champ label="Date de naissance"><input type="date" {...c('date_naissance')} /></Champ></div>
        <div className="deux"><Champ label="Nom du parent"><input {...c('parent_nom')} /></Champ><Champ label="Téléphone du parent"><input inputMode="tel" {...c('parent_telephone')} /></Champ></div>
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>{e.occupe ? 'Enregistrement…' : 'Enregistrer'}</button>
      </form>
    </Modale>
  );
}

const FILTRES: [string, string][] = [['tous', 'Tous'], ['a_jour', 'À jour'], ['partiel', 'Partiel'], ['retard', 'Retard'], ['rien', 'Non payé']];

export function Eleves() {
  const { annee, can } = useApp();
  const [txt, setT] = useState(''); const [cl, setCl] = useState(''); const [f, setF] = useState('tous'); const [p, setP] = useState(1); const [aj, setAj] = useState(false);
  const q = useQ(async () => {
    const [l, classes] = await Promise.all([db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&order=nom,prenom,inscription_id`), db.get(`classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`)]);
    return { l, classes };
  }, [annee.id]);
  const base = useMemo(() => {
    const t = txt.trim().toLowerCase();
    return (q.data?.l || []).filter((s: any) => (!cl || s.classe_id === cl) && (!t || `${s.matricule} ${s.nom} ${s.prenom}`.toLowerCase().includes(t)));
  }, [q.data, txt, cl]);
  const compte = (k: string) => (k === 'tous' ? base.length : base.filter((s: any) => etat(s) === k).length);
  const filtres = f === 'tous' ? base : base.filter((s: any) => etat(s) === f);
  const PAR = 10; const pages = Math.max(1, Math.ceil(filtres.length / PAR)); const page = Math.min(p, pages);
  const vue = filtres.slice((page - 1) * PAR, page * PAR);
  const bouge = (fn: any) => (x: any) => { fn(x.target.value); setP(1); };
  return (
    <>
      <Titre t="Élèves">{can('directeur', 'secretaire') && <><Lien to="/importation" className="btn contour mini bureau-seul"><PiFileArrowUpDuotone />Importer</Lien><button className="btn plein mini" onClick={() => setAj(true)}><PiPlusBold />Ajouter un élève</button></>}</Titre>
      <Etat q={q}>{(d) => <>
        <div className="barre-outils">
          <div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={txt} onChange={bouge(setT)} placeholder="Rechercher un élève ou un matricule" aria-label="Rechercher un élève" /></div>
          <select value={cl} onChange={bouge(setCl)} aria-label="Classe"><option value="">Toutes les classes</option>{d.classes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>
        </div>
        <div className="segment" role="tablist">{FILTRES.map(([k, t]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => { setF(k); setP(1); }}>{t}<em>{nb(compte(k))}</em></button>)}</div>
        <section className="carte c-table">
          {filtres.length === 0 ? <Vide t={d.l.length ? 'Aucun élève ne correspond à cette recherche.' : d.classes.length ? 'Aucun élève inscrit pour le moment.' : 'Créez d\'abord une classe.'}>{!d.classes.length && <Lien to="/classes" className="btn contour mini">Créer une classe</Lien>}</Vide> : <>
            <div className="table vue-bureau"><table><thead><tr><th>Élève</th><th>Matricule</th><th>Classe</th><th className="dr">Frais</th><th className="dr">Payé</th><th className="dr">Reste</th><th>Statut</th><th /></tr></thead>
              <tbody>{vue.map((s: any) => <tr key={s.inscription_id}>
                <td><Lien to={`/eleves/${s.eleve_id}`} className="nom-el"><Avatar nom={`${s.nom} ${s.prenom}`} /><b>{s.nom} {s.prenom}</b></Lien></td><td className="gr">{s.matricule}</td><td><span className="puce">{s.classe}</span></td>
                <td className="dr">{nb(s.facture_net)}</td><td className="dr">{nb(s.regle)}</td><td className={s.en_retard ? 'dr rouge fort' : 'dr fort'}>{nb(s.reste)}</td><td><Statut s={s} /></td>
                <td className="acts"><Lien className="ico" to={`/eleves/${s.eleve_id}`} aria-label={`Voir la fiche de ${s.prenom} ${s.nom}`}><PiEyeDuotone /></Lien></td>
              </tr>)}</tbody></table></div>
            <ul className="vue-tel liste-el">{vue.map((s: any) => <li key={s.inscription_id}><Lien to={`/eleves/${s.eleve_id}`}><Avatar nom={`${s.nom} ${s.prenom}`} /><div><b>{s.nom} {s.prenom}</b><small>{s.matricule}, {s.classe}</small></div><div className="fin"><Statut s={s} />{s.reste > 0 && <small className={s.en_retard ? 'rouge' : ''}>Reste {nb(s.reste)}</small>}</div></Lien></li>)}</ul>
            {pages > 1 && <div className="pagin"><span>{(page - 1) * PAR + 1} à {Math.min(page * PAR, filtres.length)} sur {nb(filtres.length)}</span><div><button onClick={() => setP(page - 1)} disabled={page === 1} aria-label="Page précédente"><PiCaretLeftBold /></button>{Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 3).map((n) => <button key={n} className={n === page ? 'on' : ''} onClick={() => setP(n)}>{n}</button>)}<button onClick={() => setP(page + 1)} disabled={page === pages} aria-label="Page suivante"><PiCaretRightBold /></button></div></div>}
          </>}
        </section>
      </>}</Etat>
      {aj && q.data && <FormEleve classes={q.data.classes} fermer={() => setAj(false)} fini={() => { setAj(false); q.reload(); }} />}
    </>
  );
}

export function DetailEleve({ id }: { id: string }) {
  const { annee, can, eid } = useApp();
  const fin = can(...FINANCE);
  const [onglet, setO] = useState('hist');
  const [mod, setMod] = useState(false); const [red, setRed] = useState(false);
  const q = useQ(async () => {
    const [el, sit, pay, ech, res, classes, jet] = await Promise.all([
      db.get(`eleves?id=eq.${id}`), db.get(`v_situation_eleves?eleve_id=eq.${id}&annee_scolaire_id=eq.${annee.id}`),
      fin ? db.get(`v_paiements_detail?eleve_id=eq.${id}&order=date_paiement.desc`) : [],
      fin ? db.get(`v_echeances_soldes?eleve_id=eq.${id}&annee_scolaire_id=eq.${annee.id}&order=date_limite`) : [],
      fin ? db.get(`eleve_responsables?eleve_id=eq.${id}&select=principal,lien,responsables(*)&order=principal.desc`) : [],
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`),
      fin ? db.get(`paiements?eleve_id=eq.${id}&select=id,jeton_public`) : [],
    ]);
    return { el: el[0], sit: sit[0], pay, ech, res, classes, jet: Object.fromEntries(jet.map((x: any) => [x.id, x.jeton_public])) };
  }, [id, annee.id]);
  return (
    <>
      <Titre t="Fiche de l'élève" retour="/eleves">{fin && <Lien to={`/paiements/nouveau?eleve=${id}`} className="btn plein mini bureau-seul"><PiPlusBold />Enregistrer un paiement</Lien>}</Titre>
      <Etat q={q}>{(d) => {
        if (!d.el) return <Vide t="Élève introuvable." />;
        const s = d.sit || { facture_net: 0, regle: 0, reste: 0, avance: 0, situation: 'sans_frais' };
        const r = d.res[0]?.responsables; const pct = s.facture_net ? Math.round((s.regle / s.facture_net) * 100) : 0;
        const nom = `${d.el.nom} ${d.el.prenom}`;
        return <div className="fiche-g">
          <section className="carte profil-el">
            <Jauge clair p={pct}><Avatar nom={nom} grand /></Jauge>
            <h2>{nom}</h2>
            <div className="puces"><span className="puce">{d.el.matricule}</span>{s.classe && <span className="puce">{s.classe}</span>}<Statut s={s} /></div>
            <div className="actions-el">
              {fin && <Lien to={`/paiements/nouveau?eleve=${id}`}><Tuile i={PiMoneyWavyDuotone} ton="bleu" t={44} /><span>Paiement</span></Lien>}
              {r && <a href={`https://wa.me/224${r.telephone}`} target="_blank" rel="noreferrer"><span className="tuile vert t44"><PiWhatsappLogoFill aria-hidden="true" /></span><span>WhatsApp</span></a>}
              {r && <a href={`tel:${r.telephone}`}><Tuile i={PiPhoneDuotone} ton="violet" t={44} /><span>Appeler</span></a>}
            </div>
            {d.res.length > 0 && <dl className="contacts">{d.res.map((x: any, i: number) => <div key={i}><dt>{x.principal ? 'Parent principal' : 'Parent'}</dt><dd>{x.responsables.nom}<small>{telAff(x.responsables.telephone)}</small></dd></div>)}</dl>}
          </section>
          <div className="fiche-d">
            {fin && <section className="carte"><h2>Situation financière</h2>
              <div className="trois"><div><span>Frais dus</span><Gnf n={s.facture_net} /></div><div><span>Payé</span><span className="vert"><Gnf n={s.regle} /></span></div><div><span>Reste</span><span className={s.reste > 0 ? 'rouge' : ''}><Gnf n={s.reste} /></span></div></div>
              <div className="prog"><div className="barre-p verte"><i style={{ width: `${pct}%` }} /></div><b>{pct} %</b></div>
              {s.avance > 0 && <p className="note">Avance disponible : <b>{gnf(s.avance)}</b></p>}
            </section>}
            {fin && d.ech.length > 0 && <section className="carte"><h2>Échéancier</h2>
              <ol className="frise">{d.ech.map((e: any) => <li key={e.id} className={e.etat}><i>{e.etat === 'soldee' ? <PiCheckBold aria-hidden="true" /> : e.etat === 'echue' ? <PiClockCountdownFill aria-hidden="true" /> : null}</i><b>{e.libelle}</b><Gnf n={e.net} /><small>{e.etat === 'soldee' ? 'Payée' : e.etat === 'echue' ? `En retard, reste ${nb(e.reste)}` : e.regle > 0 ? `Reste ${nb(e.reste)}` : 'À venir'}</small><small>{dateFr(e.date_limite)}</small></li>)}</ol>
            </section>}
            <section className="carte">
              <div className="segment" role="tablist">{[['hist', 'Historique'], ['infos', 'Informations'], ['autres', 'Autres']].map(([k, t]) => <button key={k} role="tab" aria-selected={onglet === k} className={onglet === k ? 'on' : ''} onClick={() => setO(k)}>{t}</button>)}</div>
              {onglet === 'hist' && (d.pay.length === 0 ? <Vide t="Aucun paiement enregistré." /> : <ul className="hist">{d.pay.map((p: any) => <li key={p.id}><Tuile i={PiReceiptDuotone} ton={p.statut === 'valide' ? 'bleu' : 'orange'} t={40} /><div><b>{gnf(p.montant)}</b><small>{dateFr(p.date_paiement)}, {p.moyen}{p.numero_recu ? `, reçu n° ${p.numero_recu}` : ''}</small></div><EtatPaiement s={p.statut} />{p.numero_recu && d.jet[p.id] && <Lien className="btn lien" to={`/r/${d.jet[p.id]}`}>Reçu</Lien>}</li>)}</ul>)}
              {onglet === 'infos' && <div><dl className="dl"><dt>Matricule</dt><dd>{d.el.matricule}</dd><dt>Naissance</dt><dd>{dateFr(d.el.date_naissance) || 'Non renseignée'}</dd><dt>Classe</dt><dd>{s.classe || 'Sans classe'}</dd></dl>
                {can('directeur', 'secretaire') && <div className="ligne-btn"><button className="btn contour mini" onClick={() => setMod(true)}><PiPencilSimpleDuotone />Modifier</button><button className="btn contour mini rouge" onClick={async () => { if (confirm('Archiver cet élève ?')) { await db.upd(`eleves?id=eq.${id}`, { statut: 'archive', archive_le: new Date().toISOString() }); await db.upd(`inscriptions?eleve_id=eq.${id}&annee_scolaire_id=eq.${annee.id}`, { statut: 'archive' }); naviguer('/eleves'); } }}>Archiver</button></div>}</div>}
              {onglet === 'autres' && <div>{d.ech.some((e: any) => e.reductions > 0) ? <ul className="hist">{d.ech.filter((e: any) => e.reductions > 0).map((e: any) => <li key={e.id}><Tuile i={PiHandCoinsDuotone} ton="vert" t={40} /><div><b>Réduction de {gnf(e.reductions)}</b><small>{e.libelle}</small></div></li>)}</ul> : <p className="note">Aucune réduction ni exonération accordée.</p>}
                {d.ech.some((e: any) => e.reste > 0) && can('directeur', 'comptable', 'secretaire') && <button className="btn contour mini" onClick={() => setRed(true)}>Réduction ou exonération</button>}</div>}
            </section>
          </div>
          {mod && <FormEleve init={{ id, prenom: d.el.prenom, nom: d.el.nom, matricule: d.el.matricule, date_naissance: d.el.date_naissance, classe_id: s.classe_id || '', parent_nom: r?.nom || '', parent_telephone: r?.telephone || '' }} classes={d.classes} fermer={() => setMod(false)} fini={() => { setMod(false); q.reload(); }} />}
          {red && <FormReduction ech={d.ech.filter((e: any) => e.reste > 0)} eid={eid} fermer={() => setRed(false)} fini={() => { setRed(false); q.reload(); }} />}
        </div>;
      }}</Etat>
    </>
  );
}

export const EtatPaiement = ({ s }: any) => <Pastille k={s === 'valide' ? 'a_jour' : s === 'en_attente' ? 'retard' : 'rien'} t={s === 'valide' ? 'Validé' : s === 'en_attente' ? 'En attente' : s === 'rejete' ? 'Rejeté' : 'Annulé'} />;

function FormReduction({ ech, eid, fermer, fini }: any) {
  const { can } = useApp();
  const [f, setF] = useState<any>({ echeance_id: ech[0].id, type: 'reduction', montant: 0, motif: '' }); const e = useEnvoi();
  const max = ech.find((x: any) => x.id === f.echeance_id)?.reste || 0;
  return <Modale titre="Réduction ou exonération" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!f.montant) return e.setE('Indiquez un montant'); e.envoyer(async () => { await db.ins('reductions', { ...f, etablissement_id: eid, statut: can('directeur') ? 'autorisee' : 'demandee' }); fini(); }); }}>
    <Champ label="Échéance"><select value={f.echeance_id} onChange={(x) => setF({ ...f, echeance_id: x.target.value })}>{ech.map((x: any) => <option key={x.id} value={x.id}>{x.libelle} (reste {nb(x.reste)})</option>)}</select></Champ>
    <Champ label="Type"><select value={f.type} onChange={(x) => setF({ ...f, type: x.target.value })}><option value="reduction">Réduction</option><option value="exoneration">Exonération</option></select></Champ>
    <Champ label="Montant" aide={`Maximum : ${gnf(max)}`}><Montant value={f.montant} onChange={(v: number) => setF({ ...f, montant: v })} /></Champ>
    <Champ label="Motif *"><input value={f.motif} onChange={(x) => setF({ ...f, motif: x.target.value })} required /></Champ>
    {!can('directeur') && <p className="note">La demande devra être autorisée par le directeur.</p>}
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}

export function Classes() {
  const { annee, can, eid } = useApp(); const [aj, setAj] = useState(false); const [niv, setNiv] = useState('');
  const q = useQ(async () => {
    const [st, cl, nv] = await Promise.all([db.get(`v_stats_classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`), db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,niveaux(nom)`), db.get(`niveaux?etablissement_id=eq.${eid}&order=ordre,nom`)]);
    const nom = Object.fromEntries(cl.map((c: any) => [c.id, c.niveaux?.nom || '']));
    return { st, nom, nv };
  }, [annee.id]);
  const fin = can(...FINANCE);
  return (
    <>
      <Titre t="Classes et niveaux">{can('directeur', 'secretaire') && <button className="btn plein mini" onClick={() => setAj(true)}><PiPlusBold /><span>Ajouter<span className="bureau-seul-t"> une classe</span></span></button>}</Titre>
      <Etat q={q}>{(d) => {
        const niveaux = Array.from(new Set(Object.values(d.nom).filter(Boolean))) as string[];
        const l = niv ? d.st.filter((c: any) => d.nom[c.classe_id] === niv) : d.st;
        const meilleur = Math.max(...d.st.filter((c: any) => c.facture_net > 0).map((c: any) => Number(c.taux_recouvrement)), 0);
        return <>
          {niveaux.length > 0 && <div className="segment" role="tablist"><button role="tab" aria-selected={!niv} className={!niv ? 'on' : ''} onClick={() => setNiv('')}>Toutes<em>{d.st.length}</em></button>{niveaux.map((n) => <button key={n} role="tab" aria-selected={niv === n} className={niv === n ? 'on' : ''} onClick={() => setNiv(n)}>{n}<em>{d.st.filter((c: any) => d.nom[c.classe_id] === n).length}</em></button>)}</div>}
          {l.length === 0 ? <section className="carte"><Vide t="Aucune classe pour cette année." /></section> : <div className="grille-cl">{l.map((c: any) => {
            const t = Math.round(c.taux_recouvrement); const a = c.facture_net > 0;
            return <section className="carte cl" key={c.classe_id}>
              <div className="cl-t"><div><h2>{c.nom}</h2>{d.nom[c.classe_id] && <span className="puce">{d.nom[c.classe_id]}</span>}</div>{fin && (a ? <Jauge clair petit ton={t >= 70 ? 'vert' : 'orange'} p={t}><b>{t} %</b></Jauge> : <span className="sans-frais">Frais à définir</span>)}</div>
              {a && Number(c.taux_recouvrement) === meilleur && <span className="meilleur"><PiCrownSimpleFill aria-hidden="true" />Meilleur taux</span>}
              <dl className="cl-d"><div><dt>Effectif</dt><dd>{nb(c.effectif)}</dd></div>{fin && a && <><div><dt>Facturé</dt><dd>{nb(c.facture_net)}</dd></div><div><dt>Payé</dt><dd className="vert">{nb(c.regle)}</dd></div><div><dt>Reste</dt><dd className={c.impaye_echu > 0 ? 'rouge' : ''}>{nb(c.reste)}</dd></div></>}</dl>
            </section>;
          })}</div>}
        </>;
      }}</Etat>
      {aj && q.data && <FormClasse nv={q.data.nv} fermer={() => setAj(false)} fini={() => { setAj(false); q.reload(); }} />}
    </>
  );
}

function FormClasse({ nv, fermer, fini }: any) {
  const { eid, annee } = useApp(); const [nom, setN] = useState(''); const [niv, setV] = useState(''); const e = useEnvoi();
  return <Modale titre="Ajouter une classe" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => {
    let niveau_id = null;
    if (niv.trim()) { const r = await db.ups('niveaux', { etablissement_id: eid, nom: niv.trim() }, 'etablissement_id,nom'); niveau_id = r[0].id; }
    await db.ins('classes', { etablissement_id: eid, annee_scolaire_id: annee.id, nom: nom.trim(), niveau_id }); fini();
  }); }}>
    <Champ label="Nom de la classe *"><input value={nom} onChange={(x) => setN(x.target.value)} placeholder="6e A" required /></Champ>
    <Champ label="Niveau"><input value={niv} onChange={(x) => setV(x.target.value)} list="niv" placeholder="Collège" /><datalist id="niv">{nv.map((n: any) => <option key={n.id} value={n.nom} />)}{['Primaire', 'Collège', 'Lycée'].map((n) => <option key={n} value={n} />)}</datalist></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}

const iconeFrais = (l = '') => (/inscri/i.test(l) ? PiIdentificationBadgeDuotone : /scolar/i.test(l) ? PiGraduationCapDuotone : /exam/i.test(l) ? PiNotePencilDuotone : /fourn/i.test(l) ? PiBooksDuotone : /transp/i.test(l) ? PiBusDuotone : PiCoinsDuotone);

export function Frais() {
  const { annee, can, eid } = useApp(); const [form, setF] = useState<any>(null); const [sel, setSel] = useState('');
  const q = useQ(async () => {
    const [classes, types, tarifs] = await Promise.all([db.get(`classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`), db.get(`types_frais?etablissement_id=eq.${eid}&actif=is.true&order=ordre`), db.get(`tarifs?annee_scolaire_id=eq.${annee.id}&select=*,tarif_tranches(*)`)]);
    return { classes, types, tarifs };
  }, [annee.id]);
  const edit = can('directeur', 'comptable');
  return (
    <>
      <Titre t="Frais scolaires">{edit && q.data?.classes.length > 0 && <button className="btn plein mini" onClick={() => setF({ classe: sel })}><PiPlusBold />Définir un tarif</button>}</Titre>
      <Etat q={q}>{(d) => {
        if (d.classes.length === 0) return <section className="carte"><Vide t="Créez d'abord une classe."><Lien to="/classes" className="btn contour mini">Créer une classe</Lien></Vide></section>;
        const totalDe = (id: string) => d.tarifs.filter((x: any) => x.classe_id === id).reduce((s: number, x: any) => s + x.montant, 0);
        const c = d.classes.find((x: any) => x.id === sel) || d.classes[0];
        const t = d.tarifs.filter((x: any) => x.classe_id === c.id);
        return <div className="frais-g">
          <nav className="carte frais-l" aria-label="Classes">{d.classes.map((x: any) => <button key={x.id} className={x.id === c.id ? 'on' : ''} onClick={() => setSel(x.id)}><b>{x.nom}</b><span>{totalDe(x.id) ? nb(totalDe(x.id)) : 'À définir'}</span></button>)}</nav>
          <section className="carte">
            <div className="tete-carte"><h2>{c.nom}</h2><div className="total-cl"><span>Total annuel</span><Gnf n={totalDe(c.id)} /></div></div>
            {t.length === 0 ? <Vide t="Aucun tarif défini pour cette classe.">{edit && <button className="btn contour mini" onClick={() => setF({ classe: c.id })}>Définir un tarif</button>}</Vide> : <ul className="tarifs">{t.map((x: any) => {
              const tr = [...x.tarif_tranches].sort((a: any, b: any) => a.ordre - b.ordre);
              return <li key={x.id}><Tuile i={iconeFrais(d.types.find((y: any) => y.id === x.type_frais_id)?.libelle)} ton="bleu" t={40} /><div className="tf-c"><div className="tf-l"><b>{d.types.find((y: any) => y.id === x.type_frais_id)?.libelle}</b><Gnf n={x.montant} />{edit && <button className="ico" aria-label="Modifier ce tarif" onClick={() => setF({ classe: c.id, x })}><PiPencilSimpleDuotone /></button>}</div>
                {tr.length > 0 ? <div className="tf-tr">{tr.map((y: any) => <span key={y.id}><b>{y.libelle}</b>{nb(y.montant)}<small>{dateFr(y.date_limite)}</small></span>)}</div> : <small className="gr">Paiement unique</small>}</div></li>;
            })}</ul>}
          </section>
        </div>;
      }}</Etat>
      {form && q.data && <FormTarif d={q.data} init={form} fermer={() => setF(null)} fini={() => { setF(null); q.reload(); }} />}
    </>
  );
}

function FormTarif({ d, init, fermer, fini }: any) {
  const x = init.x; const e = useEnvoi();
  const [classe, setC] = useState(init.classe || d.classes[0].id); const [type, setT] = useState(x?.type_frais_id || d.types[1]?.id || d.types[0].id); const [montant, setM] = useState(x?.montant || 0);
  const [tr, setTr] = useState<any[]>(x?.tarif_tranches?.length ? [...x.tarif_tranches].sort((a: any, b: any) => a.ordre - b.ordre).map((y: any) => ({ libelle: y.libelle, montant: y.montant, date_limite: y.date_limite })) : []);
  const som = tr.reduce((s, y) => s + y.montant, 0);
  const maj = (i: number, k: string, v: any) => setTr(tr.map((y, j) => (j === i ? { ...y, [k]: v } : y)));
  return <Modale titre="Définir un tarif" fermer={fermer}><form onSubmit={(z) => { z.preventDefault(); if (!montant) return e.setE('Indiquez un montant'); if (tr.length && som !== montant) return e.setE(`La somme des tranches (${gnf(som)}) doit égaler le montant`); e.envoyer(async () => { await db.rpc('enregistrer_tarif', { p_classe: classe, p_type: type, p_montant: montant, p_tranches: tr }); fini(); }); }}>
    <div className="deux"><Champ label="Classe"><select value={classe} onChange={(v) => setC(v.target.value)} disabled={!!x}>{d.classes.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select></Champ>
      <Champ label="Type de frais"><select value={type} onChange={(v) => setT(v.target.value)} disabled={!!x}>{d.types.map((c: any) => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></Champ></div>
    <Champ label="Montant total *"><Montant value={montant} onChange={setM} /></Champ>
    <div className="tete-carte"><b>Tranches</b><button type="button" className="btn lien" onClick={() => setTr([...tr, { libelle: `Tranche ${tr.length + 1}`, montant: Math.max(montant - som, 0), date_limite: '' }])}><PiPlusBold /> Ajouter</button></div>
    {tr.map((y, i) => <div className="tranche" key={i}><input value={y.libelle} onChange={(v) => maj(i, 'libelle', v.target.value)} aria-label="Libellé" required /><Montant value={y.montant} onChange={(v: number) => maj(i, 'montant', v)} /><input type="date" value={y.date_limite} onChange={(v) => maj(i, 'date_limite', v.target.value)} aria-label="Date limite" required /><button type="button" className="ico" aria-label="Retirer" onClick={() => setTr(tr.filter((_, j) => j !== i))}><PiTrashDuotone /></button></div>)}
    {x && <p className="note">Un nouveau montant s'applique aux prochaines factures, pas à celles déjà émises.</p>}
    <p className="note">S'applique à tous les élèves de la classe. Ceux qui ont déjà payé sur ce frais gardent leur montant.</p>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}
