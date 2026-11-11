import { PiBuildingsFill, PiCalendarBlankFill, PiCaretRightBold, PiStudentFill, PiTargetBold, PiUserCircleFill } from 'react-icons/pi';
import { Haut } from './abonnement';
import { useMemo, useRef, useState } from 'react';
import { PiKeyDuotone, PiCalendarCheckDuotone, PiCheckBold, PiCheckCircleFill, PiCloudArrowUpDuotone, PiDownloadSimpleBold, PiFileArrowUpDuotone, PiMagnifyingGlassBold, PiMoneyWavyDuotone, PiSignOutBold, PiUserPlusDuotone, PiWarningDuotone, PiWhatsappLogoDuotone, PiWhatsappLogoFill } from 'react-icons/pi';
import { SUPA, auth, db, getSession, message } from './api';
import { TRANCHES, auj, dateFr, erreurTel, gnf, lireTableau, nb, tel, telechargerExcel, trancheDe } from './lib';
import { Avatar, Champ, Erreur, Etat, Gnf, Lien, Modale, Montant, Pastille, Titre, Tuile, Vide, naviguer, useApp, useEnvoi, useQ } from './ui';

const premier = (l: any[]) => { const m = new Map<string, any>(); l.forEach((x) => { if (!m.has(x.eleve_id)) m.set(x.eleve_id, x); }); return m; };

function FormPromesse({ r, resp, fermer, fini }: any) {
  const { eid } = useApp(); const [d, setD] = useState(auj()); const [m, setM] = useState<number>(r.impaye_echu); const e = useEnvoi();
  return <Modale titre="Promesse de paiement" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.ins('promesses', { etablissement_id: eid, eleve_id: r.eleve_id, responsable_id: resp?.id || null, date_promise: d, montant: m || null }); fini(); }); }}>
    <div className="rappel-d"><span>{r.prenom} {r.nom}, {r.classe}</span><Gnf n={r.impaye_echu} /></div>
    <Champ label="Date promise par le parent"><input type="date" value={d} min={auj()} onChange={(x) => setD(x.target.value)} required /></Champ>
    <Champ label="Montant promis"><Montant value={m} onChange={setM} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />Enregistrer la promesse</button></form></Modale>;
}

export function Relances() {
  const { annee, eid, etab, majNotif } = useApp(); const e = useEnvoi(); const [f, setF] = useState('retards'); const [txt, setT] = useState(''); const [cl, setCl] = useState(''); const [pro, setPro] = useState<any>(null); const [n, setN] = useState(30);
  const q = useQ(async () => {
    const [ret, att, ins, lien, rap, pr] = await Promise.all([
      db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&en_retard=is.true&order=impaye_echu.desc,inscription_id`),
      db.get(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&statut=eq.en_attente&order=date_paiement.desc&limit=30`),
      db.get(`inscriptions?annee_scolaire_id=eq.${annee.id}&select=id,cree_le,classes(nom),eleves(prenom,nom)&order=cree_le.desc&limit=10`),
      db.tout(`eleve_responsables?etablissement_id=eq.${eid}&select=eleve_id,principal,responsables(id,nom,telephone,jeton_public)&order=principal.desc,eleve_id,responsable_id`),
      db.tout(`rappels?etablissement_id=eq.${eid}&select=eleve_id,cree_le&order=cree_le.desc,id`),
      db.tout(`promesses?etablissement_id=eq.${eid}&select=eleve_id,date_promise&order=date_promise.desc,id`),
    ]);
    return { ret, att, ins, lien: premier(lien), rap: premier(rap), pro: premier(pr) };
  }, [annee.id]);
  const relancer = (r: any, resp: any) => {
    const msg = `Bonjour ${resp.nom}, ${etab.nom} vous rappelle que ${r.prenom} ${r.nom} (${r.classe}) a un retard de paiement de ${gnf(r.impaye_echu)}. Détail : ${location.origin}/f/${resp.jeton_public}`;
    window.open(`https://wa.me/224${resp.telephone}?text=${encodeURIComponent(msg)}`, '_blank');
    e.envoyer(async () => {
      await db.ins('rappels', { etablissement_id: eid, eleve_id: r.eleve_id, responsable_id: resp.id, telephone: resp.telephone, montant: r.impaye_echu, canal: 'whatsapp', message: msg, statut: 'envoye', envoye_par: getSession()?.user?.id, envoye_le: new Date().toISOString() });
      await q.reload(); majNotif();
    });
  };
  return (
    <>
      <Titre t="Relances" />
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d) => {
        const jour = auj(); const som = d.ret.reduce((t: number, x: any) => t + Number(x.impaye_echu), 0);
        const dernier = (r: any) => d.rap.get(r.eleve_id); const fait = (r: any) => String(dernier(r)?.cree_le || '').slice(0, 10) === jour;
        const promis = (r: any) => { const p = d.pro.get(r.eleve_id); return p && p.date_promise >= jour ? p : null; };
        const relances = d.ret.filter(fait).length; const promesses = d.ret.filter(promis).length;
        const classes = [...new Set(d.ret.map((r: any) => r.classe))].sort() as string[];
        const t = txt.trim().toLowerCase(); const l = d.ret.filter((r: any) => (!cl || r.classe === cl) && (!t || `${r.nom} ${r.prenom} ${r.matricule}`.toLowerCase().includes(t)));
        const actions = (r: any) => { const resp = d.lien.get(r.eleve_id)?.responsables; return <>
          {resp ? <button className="btn wa mini" disabled={fait(r)} onClick={() => relancer(r, resp)}>{fait(r) ? <PiCheckBold /> : <PiWhatsappLogoFill />}{fait(r) ? 'Relancé' : 'Relancer'}</button> : <small className="gr">Pas de téléphone</small>}
          <button className="btn contour mini" onClick={() => setPro({ r, resp })}><PiCalendarCheckDuotone />Promesse</button>
        </>; };
        const suivi = (r: any) => { const dn = dernier(r); const p = promis(r); return <>{p ? <span className="puce p-vert">Promis le {dateFr(p.date_promise)}</span> : dn ? <small className="gr">Relancé le {dateFr(dn.cree_le)}</small> : <small className="gr">Jamais relancé</small>}</>; };
        return <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiWarningDuotone} ton="rouge" t={44} /><div><span>En retard ({nb(d.ret.length)})</span><Gnf n={som} /></div></div><div className="carte mini-c"><Tuile i={PiWhatsappLogoDuotone} ton="vert" t={44} /><div><span>Relancés aujourd'hui</span><span className="gnf"><b>{nb(relances)}</b></span></div></div><div className="carte mini-c"><Tuile i={PiCalendarCheckDuotone} ton="bleu" t={44} /><div><span>Promesses en cours</span><span className="gnf"><b>{nb(promesses)}</b></span></div></div></div>
          <div className="segment" role="tablist">{[['retards', 'Retards', d.ret.length], ['verifier', 'À vérifier', d.att.length], ['inscriptions', 'Inscriptions', d.ins.length]].map(([k, x, n]: any) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{x}<em>{nb(n)}</em></button>)}</div>
          {f === 'retards' && <>
            <div className="barre-outils"><div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={txt} onChange={(x) => setT(x.target.value)} placeholder="Rechercher un élève" aria-label="Rechercher un élève" /></div><select value={cl} onChange={(x) => setCl(x.target.value)} aria-label="Classe"><option value="">Toutes les classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select></div>
            <section className="carte c-table">{l.length === 0 ? <Vide t={d.ret.length ? 'Aucun élève trouvé.' : 'Aucun élève en retard.'} /> : <>
              <div className="table vue-bureau"><table><thead><tr><th>Élève</th><th className="dr">En retard</th><th>Suivi</th><th /></tr></thead><tbody>{l.slice(0, n).map((r: any) => <tr key={r.inscription_id}><td><Lien to={`/eleves/${r.eleve_id}`} className="nom-el"><Avatar nom={`${r.nom} ${r.prenom}`} /><span><b>{r.nom} {r.prenom}</b><small className="bloc">{r.classe}</small></span></Lien></td><td className="dr fort rouge">{nb(r.impaye_echu)}</td><td>{suivi(r)}</td><td><div className="acts-l">{actions(r)}</div></td></tr>)}</tbody></table></div>
              <ul className="vue-tel liste-p">{l.slice(0, n).map((r: any) => <li key={r.inscription_id}><div className="lp-h"><Avatar nom={`${r.nom} ${r.prenom}`} /><div><b>{r.nom} {r.prenom}</b><small>{r.classe}</small></div><div className="fin"><span className="gnf rouge"><b>{nb(r.impaye_echu)}</b></span>{suivi(r)}</div></div><div className="acts-l">{actions(r)}</div></li>)}</ul>
              {l.length > n && <div className="plus-l"><button className="btn contour mini" onClick={() => setN(n + 30)}>Voir la suite ({nb(l.length - n)})</button></div>}
            </>}</section>
          </>}
          {f === 'verifier' && <section className="carte">{d.att.length === 0 ? <Vide t="Aucun paiement à vérifier." /> : <ul className="hist">{d.att.map((p: any) => <li key={p.id}><Tuile i={PiMoneyWavyDuotone} ton="orange" t={40} /><div><b>{p.prenom} {p.nom}</b><small>{dateFr(p.date_paiement)}, {p.moyen}</small></div><span className="gnf"><b>{nb(p.montant)}</b></span><Lien to="/paiements" className="btn contour mini">Vérifier</Lien></li>)}</ul>}</section>}
          {f === 'inscriptions' && <section className="carte">{d.ins.length === 0 ? <Vide t="Aucune inscription récente." /> : <ul className="hist">{d.ins.map((x: any) => <li key={x.id}><Tuile i={PiUserPlusDuotone} ton="violet" t={40} /><div><b>{x.eleves.prenom} {x.eleves.nom}</b><small>Classe {x.classes.nom}</small></div><small>{dateFr(x.cree_le)}</small></li>)}</ul>}</section>}
          {pro && <FormPromesse r={pro.r} resp={pro.resp} fermer={() => setPro(null)} fini={() => { setPro(null); q.reload(); }} />}
        </>;
      }}</Etat>
    </>
  );
}

const COLS: [string, string, RegExp][] = [['matricule', 'Matricule', /matri/i], ['prenom', 'Prénom', /pr[ée]nom/i], ['nom', 'Nom', /^nom|nom.*[ée]l[èe]ve|^[ée]l[èe]ve/i], ['classe', 'Classe', /classe/i], ['parent_nom', 'Parent', /parent|tuteur|responsable/i], ['parent_telephone', 'Téléphone', /t[ée]l|phone|contact/i]];
const norm = (s: any) => String(s ?? '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Importation() {
  const { annee, eid } = useApp();
  const [tab, setTab] = useState<string[][] | null>(null); const [nomF, setNF] = useState(''); const [map, setMap] = useState<Record<string, number>>({}); const [rap, setRap] = useState<any>(null); const [av, setAv] = useState(0); const [sur, setSur] = useState(false);
  const e = useEnvoi(); const inp = useRef<HTMLInputElement>(null);
  const ex = useQ(async () => db.tout(`eleves?etablissement_id=eq.${eid}&select=id,matricule,prenom,nom&order=id`), [eid, rap]);
  const ouvrir = (f?: File | null) => { if (!f) return; setRap(null); e.envoyer(async () => {
    const t = await lireTableau(f); if (t.length < 2) throw new Error('Le fichier ne contient aucune ligne');
    const m: Record<string, number> = {}; COLS.forEach(([k, , r]) => { const i = t[0].findIndex((h, n) => r.test(h) && !Object.values(m).includes(n)); if (i >= 0) m[k] = i; });
    setTab(t); setNF(f.name); setMap(m);
  }); };
  const lignes = useMemo(() => {
    if (!tab) return [];
    const mats = new Set((ex.data || []).map((x: any) => norm(x.matricule))); const noms = new Set((ex.data || []).map((x: any) => `${norm(x.nom)}|${norm(x.prenom)}`));
    const vus = new Set<string>();
    return tab.slice(1).map((l, i) => {
      const v: any = { n: i + 2 }; COLS.forEach(([k]) => { v[k] = map[k] !== undefined ? String(l[map[k]] ?? '').trim() : ''; });
      const cle = `${norm(v.nom)}|${norm(v.prenom)}`;
      v.etat = !v.nom || !v.prenom ? 'Nom ou prénom manquant' : !v.classe ? 'Classe manquante' : erreurTel(v.parent_telephone) ? 'Téléphone invalide' : (v.matricule && mats.has(norm(v.matricule))) || noms.has(cle) ? 'Déjà inscrit' : vus.has(cle) ? 'Doublon dans le fichier' : '';
      vus.add(cle); return v;
    });
  }, [tab, map, ex.data]);
  const bonnes = lignes.filter((l) => !l.etat);
  const lancer = () => e.envoyer(async () => {
    const existantes = await db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,nom`); const cl: Record<string, string> = Object.fromEntries(existantes.map((c: any) => [norm(c.nom), c.id]));
    let ok = 0; const err: string[] = []; setAv(0);
    for (const l of bonnes) {
      try {
        if (!cl[norm(l.classe)]) { const [c] = await db.ins('classes', { etablissement_id: eid, annee_scolaire_id: annee.id, nom: l.classe }); cl[norm(l.classe)] = c.id; }
        await db.rpc('enregistrer_eleve', { p: { etablissement_id: eid, annee_scolaire_id: annee.id, classe_id: cl[norm(l.classe)], matricule: l.matricule, prenom: l.prenom, nom: l.nom, parent_nom: l.parent_nom, parent_telephone: tel(l.parent_telephone) } });
        ok++;
      } catch (x) { err.push(`Ligne ${l.n} : ${message(x)}`); }
      setAv(ok + err.length);
    }
    const ecartees = lignes.length - bonnes.length;
    await db.ins('imports', { etablissement_id: eid, type: 'eleves', fichier: nomF, statut: err.length ? 'echec' : 'termine', total: lignes.length, importees: ok, doublons: lignes.filter((l) => /Déjà|Doublon/.test(l.etat)).length, erreurs: err.length, rapport: { erreurs: err } });
    setRap({ ok, ecartees, err }); setTab(null);
  });
  const modele = () => telechargerExcel('modele-import-eleves', [['Matricule', 'Prénom', 'Nom', 'Classe', 'Parent', 'Téléphone'], ['SC-0001', 'Alpha', 'Diallo', '6e A', 'Mamadou Diallo', '620123456']]);
  return (
    <>
      <Titre t="Importation" />
      <div className="imp">
        <ol className="etapes">{['Fichier', 'Contrôle', 'Résultat'].map((t, i) => { const n = tab ? 1 : rap ? 2 : 0; return <li key={t} className={i < n || (rap && i === 2) ? 'fait' : i === n ? 'on' : ''}><i>{i < n || (rap && i === 2) ? <PiCheckBold aria-hidden="true" /> : i + 1}</i><span>{t}</span></li>; })}</ol>
        <Erreur t={e.erreur} />
        {rap && <section className="carte res-imp"><Tuile i={PiCheckCircleFill} ton="vert" t={44} /><div><h2>Import terminé</h2><p>{nb(rap.ok)} élève(s) importé(s), {nb(rap.ecartees)} ligne(s) écartée(s), {nb(rap.err.length)} erreur(s).</p>{rap.err.slice(0, 5).map((x: string) => <small key={x} className="bloc rouge">{x}</small>)}</div></section>}
        {!tab ? <>
          <section className={sur ? 'carte depot sur' : 'carte depot'} onDragOver={(x) => { x.preventDefault(); setSur(true); }} onDragLeave={() => setSur(false)} onDrop={(x) => { x.preventDefault(); setSur(false); ouvrir(x.dataTransfer.files[0]); }}>
            <PiCloudArrowUpDuotone aria-hidden="true" /><h2>Importez la liste de vos élèves</h2><p>Fichier Excel (.xlsx) ou CSV</p>
            <button className="btn plein mini" onClick={() => inp.current?.click()} disabled={e.occupe}><PiFileArrowUpDuotone />Choisir un fichier</button>
            <input ref={inp} type="file" hidden accept=".xlsx,.csv" onChange={(x) => { ouvrir(x.target.files?.[0]); x.target.value = ''; }} />
          </section>
          <section className="carte modele-i"><div><h2>Colonnes attendues</h2><div className="puces g">{COLS.map(([k, t]) => <span className="puce" key={k}>{t}</span>)}</div></div><button className="btn contour mini" onClick={modele}><PiDownloadSimpleBold />Télécharger le modèle</button></section>
        </> : <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiCheckCircleFill} ton="vert" t={44} /><div><span>Lignes prêtes</span><span className="gnf"><b>{nb(bonnes.length)}</b></span></div></div><div className="carte mini-c"><Tuile i={PiWarningDuotone} ton="orange" t={44} /><div><span>Lignes écartées</span><span className="gnf"><b>{nb(lignes.length - bonnes.length)}</b></span></div></div></div>
          <section className="carte"><h2>Correspondance des colonnes</h2><div className="corresp">{COLS.map(([k, t]) => <Champ key={k} label={t}><select value={map[k] ?? ''} onChange={(x) => { const m = { ...map }; if (x.target.value === '') delete m[k]; else m[k] = Number(x.target.value); setMap(m); }}><option value="">Ignorer</option>{tab[0].map((h, i) => <option key={i} value={i}>{h}</option>)}</select></Champ>)}</div></section>
          <section className="carte c-table">
            <div className="table court vue-bureau"><table><thead><tr><th>Ligne</th><th>Nom</th><th>Prénom</th><th>Classe</th><th>Téléphone</th><th>Contrôle</th></tr></thead><tbody>{lignes.slice(0, 100).map((l) => <tr key={l.n}><td className="gr">{l.n}</td><td>{l.nom}</td><td>{l.prenom}</td><td>{l.classe}</td><td>{l.parent_telephone}</td><td>{l.etat ? <Pastille k="rien" t={l.etat} /> : <Pastille k="a_jour" t="Prêt" />}</td></tr>)}</tbody></table></div>
            <ul className="vue-tel liste-p">{lignes.slice(0, 100).map((l) => <li key={l.n}><div className="lp-h"><Avatar nom={`${l.nom} ${l.prenom}`} /><div><b>{l.nom} {l.prenom}</b><small>{l.classe}, {l.parent_telephone}</small></div><div className="fin">{l.etat ? <Pastille k="rien" t={l.etat} /> : <Pastille k="a_jour" t="Prêt" />}</div></div></li>)}</ul>
          </section>
          <div className="ligne-btn fin-imp"><button className="btn contour mini" onClick={() => setTab(null)} disabled={e.occupe}>Annuler</button><button className="btn plein mini" onClick={lancer} disabled={e.occupe || !bonnes.length}>{e.occupe ? `Import… ${av}/${bonnes.length}` : `Importer ${nb(bonnes.length)} élève(s)`}</button></div>
        </>}
      </div>
    </>
  );
}



export function Parametres({ vue }: { vue?: string }) {
  const { annee, annees, eid, etab, can, recharger, role } = useApp();
  const ROLES: any = { fondateur: 'Fondateur', directeur: 'Directeur', comptable: 'Comptable', caissier: 'Caissier', secretaire: 'Secrétaire', enseignant: 'Enseignant' };
  const [f, setF] = useState({ nom: etab.nom || '', ville: etab.ville || '', telephone: etab.telephone || '' });
  const [obj, setO] = useState<number | null>(null); const [na, setNa] = useState({ libelle: '', date_debut: '', date_fin: '' }); const [ok, setOk] = useState(''); const e = useEnvoi();
  const [sel, setSel] = useState<string | null>(null);
  const q = useQ(async () => (annee && can('directeur', 'comptable') ? db.get(`objectifs_financiers?annee_scolaire_id=eq.${annee.id}&periode=eq.annuel&classe_id=is.null`) : []), [annee?.id]);
  const tb = useQ(async () => (annee && role === 'fondateur' ? db.get(`v_tableau_bord?annee_scolaire_id=eq.${annee.id}&select=eleves`) : []), [annee?.id]);
  const tarifs = useQ(async () => (role === 'fondateur' ? db.rpc('tarifs_liste', {}) : []), []);
  const [mdp, setMdp] = useState(false);
  const courant = q.data?.[0]; const valeur = obj ?? courant?.montant ?? 0; const d = can('directeur');
  const fait = (t: string) => { setOk(t); setTimeout(() => setOk(''), 3000); };
  const u = getSession()?.user; const nomU = `${u?.user_metadata?.prenom || ''} ${u?.user_metadata?.nom || ''}`.trim() || u?.email || '';
  const retour = () => naviguer('/parametres');
  const Ecran = ({ t, children }: any) => <><Titre t="Paramètres" /><div className="abp"><Haut t={t} retour={retour} /><div className="abp-co par-co">{children}</div></div></>;
  const Msg = <><Erreur t={e.erreur} />{ok && <div className="alerte ok">{ok}</div>}</>;

  if (vue === 'ecole') return Ecran({ t: 'Mon école', children: <form className="par-f" onSubmit={(x) => { x.preventDefault(); const er = erreurTel(f.telephone, true); if (er) return e.setE(`Téléphone de l'école : ${er}`); e.envoyer(async () => { await db.upd(`etablissements?id=eq.${eid}`, { ...f, telephone: tel(f.telephone) || null }); await recharger(); fait('École enregistrée'); }); }}><fieldset disabled={!d}>
    {d && <div className="par-logo">{etab.logo_chemin ? <img src={`${SUPA}/storage/v1/object/public/logos/${etab.logo_chemin}`} alt="" /> : <span className="par-logo-v" aria-hidden="true"><PiBuildingsFill /></span>}<label className="btn contour mini">{etab.logo_chemin ? 'Changer le logo' : 'Ajouter le logo'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(x) => { const fi = x.target.files?.[0]; if (fi) e.envoyer(async () => { await db.poserLogo(eid, fi); await recharger(); fait('Logo enregistré'); }); }} /></label></div>}
    <Champ label="Nom de l'école"><input value={f.nom} onChange={(x) => setF({ ...f, nom: x.target.value })} required /></Champ>
    <Champ label="Ville"><input placeholder="Ex. Conakry" value={f.ville} onChange={(x) => setF({ ...f, ville: x.target.value })} /></Champ>
    <Champ label="Téléphone de l'école"><input inputMode="tel" placeholder="Ex. 621 34 56 78" value={f.telephone} onChange={(x) => setF({ ...f, telephone: x.target.value })} /></Champ>
  </fieldset>{Msg}{d && <div className="abp-bas"><button className="abp-cta" disabled={e.occupe}>Enregistrer</button></div>}</form> });

  if (vue === 'taille' && role === 'fondateur') {
    const choix = sel ?? etab.tranche_eleves ?? ''; const n = Number((tb.data as any)?.[0]?.eleves || 0); const reel = trancheDe(n); const ordre = TRANCHES.map(([k]) => k);
    const prix = (k: string) => { const t = ((tarifs.data as any[]) || []).find((x) => x.tranche === k); return t?.prix_mois ? `${gnf(t.prix_mois)} par mois` : 'Tarif à voir avec Scolaris'; };
    return Ecran({ t: "Taille de l'école", children: <form className="par-f" onSubmit={(x) => { x.preventDefault(); if (!choix) return e.setE('Choisissez la taille de votre école'); e.envoyer(async () => { await db.upd(`etablissements?id=eq.${eid}`, { tranche_eleves: choix }); await recharger(); fait('Taille enregistrée'); }); }}>
      <h2 className="par-q">Combien d'élèves compte votre école ?</h2><p className="par-s">Votre tarif dépend de cette réponse. Élèves inscrits cette année : {nb(n)}.</p>
      <div className="par-ch" role="radiogroup" aria-label="Taille de l'école">{TRANCHES.map(([k, t]) => <button type="button" role="radio" aria-checked={choix === k} key={k} className={choix === k ? 'on' : ''} onClick={() => setSel(k)}><i aria-hidden="true" /><span><b>{t}</b><small>{prix(k)}</small></span></button>)}</div>
      {etab.tranche_eleves && ordre.indexOf(reel) > ordre.indexOf(etab.tranche_eleves) && <div className="alerte err">L'école a dépassé la tranche annoncée : elle compte maintenant dans « {TRANCHES.find(([k]) => k === reel)?.[1]} ».</div>}
      {Msg}<div className="abp-bas"><button className="abp-cta" disabled={e.occupe}>Enregistrer</button></div></form> });
  }

  if (vue === 'objectif' && annee && can('directeur', 'comptable')) return Ecran({ t: "Objectif de l'année", children: <form className="par-f" onSubmit={(x) => { x.preventDefault(); if (!valeur) return e.setE('Indiquez un montant'); e.envoyer(async () => { if (courant) await db.upd(`objectifs_financiers?id=eq.${courant.id}`, { montant: valeur }); else await db.ins('objectifs_financiers', { etablissement_id: eid, annee_scolaire_id: annee.id, periode: 'annuel', montant: valeur }); await q.reload(); fait('Objectif enregistré'); }); }}>
    <h2 className="par-q">Combien voulez-vous encaisser cette année ?</h2><p className="par-s">Année scolaire {annee.libelle}</p><Montant value={valeur} onChange={setO} label="Objectif de l'année" /><p className="abp-info">L'accueil vous montrera si l'école est en avance ou en retard sur cet objectif.</p>{Msg}{d && <div className="abp-bas"><button className="abp-cta" disabled={e.occupe}>Enregistrer</button></div>}</form> });

  if (vue === 'annee') return Ecran({ t: 'Année scolaire', children: <>
    <ul className="hist">{annees.map((a: any) => <li key={a.id}><div><b>{a.libelle}</b><small>{dateFr(a.date_debut)} au {dateFr(a.date_fin)}</small></div>{a.statut === 'active' ? <Pastille k="a_jour" t="Active" /> : a.statut === 'preparation' ? (d ? <button className="btn contour mini" onClick={() => e.envoyer(async () => { await db.rpc('activer_annee', { p_annee: a.id }); await recharger(); })}>Activer</button> : <Pastille k="sans" t="En préparation" />) : <Pastille k="sans" t="Clôturée" />}</li>)}</ul>
    {d && <form className="par-f" onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.ins('annees_scolaires', { ...na, etablissement_id: eid }); setNa({ libelle: '', date_debut: '', date_fin: '' }); await recharger(); }); }}><p className="par-s">À remplir seulement à l'approche de la prochaine rentrée.</p>
      <Champ label="Nouvelle année"><input placeholder="2027-2028" value={na.libelle} onChange={(x) => setNa({ ...na, libelle: x.target.value })} required /></Champ>
      <div className="deux"><Champ label="Début"><input type="date" value={na.date_debut} onChange={(x) => setNa({ ...na, date_debut: x.target.value })} required /></Champ><Champ label="Fin"><input type="date" value={na.date_fin} onChange={(x) => setNa({ ...na, date_fin: x.target.value })} required /></Champ></div>
      {Msg}<div className="abp-bas"><button className="abp-cta" disabled={e.occupe}>Ajouter l'année</button></div></form>}</> });

  if (vue === 'compte') return <>{Ecran({ t: 'Mon compte', children: <>
    <div className="compte-l"><Avatar nom={nomU} /><div><b>{nomU}</b><small>{u?.email}</small></div><span className="puce">{ROLES[role]}</span></div>{Msg}
    <div className="par-bt"><button className="btn contour" onClick={() => setMdp(true)}><PiKeyDuotone />Changer le mot de passe</button><button className="btn contour rouge" onClick={auth.deconnexion}><PiSignOutBold />Se déconnecter</button></div></> })}
    {mdp && <ChangerMdp fermer={() => setMdp(false)} fini={() => { setMdp(false); fait('Mot de passe changé'); }} />}</>;

  const Rang = ({ to, I, t, s, tag }: any) => <Lien to={`/parametres/${to}`} className="par-l"><span className="par-i"><I aria-hidden="true" /></span><span className="par-t"><b>{t}</b><small>{s}</small></span>{tag}<PiCaretRightBold className="par-c" aria-hidden="true" /></Lien>;
  return (
    <>
      <Titre t="Paramètres" />
      <nav className="par-liste" aria-label="Paramètres">
        <Rang to="ecole" I={PiBuildingsFill} t="Mon école" s="Nom, ville, téléphone" />
        {role === 'fondateur' && <Rang to="taille" I={PiStudentFill} t="Taille de l'école" s={etab.tranche_eleves ? TRANCHES.find(([k]) => k === etab.tranche_eleves)?.[1] : 'Elle fixe votre tarif'} tag={!etab.tranche_eleves && <em className="par-tag">À choisir</em>} />}
        {annee && can('directeur', 'comptable') && <Rang to="objectif" I={PiTargetBold} t="Objectif de l'année" s={courant?.montant ? gnf(courant.montant) : 'Pas encore défini'} />}
        <Rang to="annee" I={PiCalendarBlankFill} t="Année scolaire" s={annee?.libelle || 'À créer'} tag={annee?.statut === 'active' && <em className="par-tag ok">Active</em>} />
        <Rang to="compte" I={PiUserCircleFill} t="Mon compte" s="Mot de passe, déconnexion" />
      </nav>
    </>
  );
}

export function ChangerMdp({ fermer, fini }: any) {
  const [a, setA] = useState(''); const [b, setB] = useState(''); const e = useEnvoi();
  return <Modale titre="Changer le mot de passe" fermer={fermer}><form noValidate onSubmit={(x) => { x.preventDefault(); if (a.length < 8) return e.setE('Le mot de passe doit contenir au moins 8 caractères'); if (a !== b) return e.setE('Les deux mots de passe sont différents'); e.envoyer(async () => { await auth.nouveauMotDePasse(a); fini(); }); }}>
    <Champ label="Nouveau mot de passe"><input type="password" autoComplete="new-password" value={a} onChange={(x) => setA(x.target.value)} autoFocus /></Champ>
    <Champ label="Confirmer"><input type="password" autoComplete="new-password" value={b} onChange={(x) => setB(x.target.value)} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}
