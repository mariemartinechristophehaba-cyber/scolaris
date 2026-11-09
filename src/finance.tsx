import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaBuildingColumns, FaFileExcel, FaFilePdf, FaMagnifyingGlass, FaMoneyBillWave, FaMoneyBillTrendUp, FaMoneyBill1Wave, FaPlus, FaUser, FaWallet, FaMobileScreen, FaCheck, FaBan, FaCircleXmark } from 'react-icons/fa6';
import { PiBankDuotone, PiCalendarCheckDuotone, PiCheckBold, PiMagnifyingGlassBold, PiMoneyDuotone, PiPaperclipDuotone, PiPlusBold, PiReceiptDuotone, PiShieldCheckDuotone, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiCoinsDuotone, PiHandCoinsDuotone, PiHourglassMediumDuotone, PiMoneyWavyDuotone, PiPiggyBankDuotone, PiShoppingCartDuotone, PiStudentDuotone, PiTrendUpBold, PiUserPlusDuotone, PiWalletDuotone, PiWarningCircleFill, PiWarningDuotone, PiXCircleFill } from 'react-icons/pi';
import { db } from './api';
import { Anneau, Barres, Cumul, Jauge, Segments } from './charts';
import { auj, dateFr, entier, gnf, heure, moisAnnee, nb, parMois, telechargerExcel } from './lib';
import { EtatPaiement } from './gestion';
import { Avatar, Bandeau, Champ, Erreur, Etat, Gnf, Lien, Modale, Montant, SelAnnee, Titre, Tuile, Verre, Vide, naviguer, useApp, useEnvoi, useQ } from './ui';

const STAFF = ['directeur', 'comptable', 'caissier', 'secretaire'];

export function Tableau() {
  const { annee, eid, can, zoneFiltres } = useApp();
  const fin = can(...STAFF);
  const [classe, setCl] = useState(''); const [per, setPer] = useState('');
  const q = useQ(async () => {
    const [tb, obj, pay, sit, st, cls, p3, ins, dep] = await Promise.all([
      db.get(`v_tableau_bord?annee_scolaire_id=eq.${annee.id}`),
      can('directeur', 'comptable') ? db.get(`v_objectifs_resultats?annee_scolaire_id=eq.${annee.id}&periode=eq.annuel`) : [],
      fin ? db.tout(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&statut=eq.valide&select=id,montant,date_paiement,classe_id&order=id`) : [],
      fin ? db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&order=inscription_id`) : [],
      fin ? db.get(`v_stats_classes?annee_scolaire_id=eq.${annee.id}&facture_net=gt.0&order=taux_recouvrement.desc&limit=5`) : [],
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,nom&order=ordre,nom`),
      fin ? db.get(`paiements?annee_scolaire_id=eq.${annee.id}&select=id,montant,cree_le,statut,eleves(prenom,nom)&order=cree_le.desc&limit=4`) : [],
      db.get(`inscriptions?annee_scolaire_id=eq.${annee.id}&select=id,cree_le,classes(nom),eleves(prenom,nom)&order=cree_le.desc&limit=3`),
      can('directeur', 'comptable', 'caissier') ? db.get(`depenses?annee_scolaire_id=eq.${annee.id}&select=id,libelle,montant,cree_le&order=cree_le.desc&limit=3`) : [],
    ]);
    return { t: tb[0] || {}, obj, pay, sit, st, cls, p3, ins, dep };
  }, [annee.id]);
  const mois = moisAnnee(annee);
  const filtres = zoneFiltres && fin ? createPortal(<>
    <Verre value={per} onChange={setPer} label="Période"><option value="">Toute l'année</option>{mois.map((m) => <option key={m.cle} value={m.cle}>{m.label} {m.cle.slice(0, 4)}</option>)}</Verre>
    {q.data && <Verre value={classe} onChange={setCl} label="Classe"><option value="">Toutes les classes</option>{(q.data as any).cls.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}</Verre>}
  </>, zoneFiltres) : null;
  return <>{filtres}<Etat q={q}>{(d) => {
    const s = classe ? d.sit.filter((x: any) => x.classe_id === classe) : d.sit;
    const payC = classe ? d.pay.filter((x: any) => x.classe_id === classe) : d.pay;
    const payP = per ? payC.filter((x: any) => String(x.date_paiement).startsWith(per)) : payC;
    const som = (l: any[], k: string) => l.reduce((a, x) => a + Number(x[k] || 0), 0);
    const compte = (f: (x: any) => boolean) => s.filter(f).length;
    const encaisse = som(payP, 'montant'), frais = som(s, 'facture_net'), reste = som(s, 'reste'), echu = som(s, 'impaye_echu'), avances = som(s, 'avance');
    const tot = fin ? s.length : d.t.eleves || 0;
    const aJour = compte((x) => x.situation === 'a_jour'), partiels = compte((x) => x.situation === 'partiel'), rien = compte((x) => x.situation === 'rien_paye'), retard = compte((x) => x.en_retard);
    const pc = (n: number) => (tot ? Math.round((n / tot) * 100) : 0);
    const objet = d.obj.find((o: any) => (classe ? o.classe_id === classe : !o.classe_id));
    const objectif = objet ? Number(objet.objectif) : 0;
    const pct = objectif && !per ? Math.round((encaisse / objectif) * 100) : null;
    const fini = auj().slice(0, 7);
    const courants = mois.filter((m) => m.cle <= fini);
    let cumul = 0;
    const reel = courants.map((m) => { cumul += payC.filter((x: any) => String(x.date_paiement).startsWith(m.cle)).reduce((a: number, x: any) => a + Number(x.montant), 0); return cumul; });
    const attendu = objectif && courants.length ? Math.round((objectif * courants.length) / mois.length) : 0;
    const ecart = attendu ? encaisse - attendu : 0;
    const bonne = ecart >= 0;
    const fil = [
      ...d.p3.map((p: any) => ({ cle: 'p' + p.id, date: p.cree_le, I: PiMoneyWavyDuotone, ton: p.statut === 'en_attente' ? 'orange' : 'vert', t: `${p.statut === 'en_attente' ? 'Paiement à vérifier' : 'Paiement reçu'} : ${gnf(p.montant)}`, s: `${p.eleves?.prenom || ''} ${p.eleves?.nom || ''}` })),
      ...d.ins.map((x: any) => ({ cle: 'i' + x.id, date: x.cree_le, I: PiUserPlusDuotone, ton: 'bleu', t: 'Nouvelle inscription', s: `${x.eleves?.prenom || ''} ${x.eleves?.nom || ''}, ${x.classes?.nom || ''}` })),
      ...d.dep.map((x: any) => ({ cle: 'd' + x.id, date: x.cree_le, I: PiShoppingCartDuotone, ton: 'orange', t: `Dépense : ${gnf(x.montant)}`, s: x.libelle })),
    ].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 4);
    const quand = (v: string) => { const j = String(v).slice(0, 10); if (j === auj()) return heure(v); const h = new Date(Date.now() - 86400000).toISOString().slice(0, 10); return j === h ? 'Hier' : dateFr(v); };
    const titreLab = per ? 'Encaissé sur la période' : 'Déjà encaissé';
    return <>
      <Bandeau><section className="hero">
        <div className="hero-haut">
          <div className="hero-g">
            <div className="hero-titre"><h1>Tableau de bord</h1><SelAnnee className="tel" /></div>
            <span className="hero-lab">{titreLab}</span>
            <div className="hero-val"><b>{nb(encaisse)}</b><small>GNF</small></div>
            {objectif > 0 && <span className="hero-sur">sur {gnf(objectif)}</span>}
            {pct !== null && <div className="hero-etat"><span className={bonne ? 'chip-v' : 'chip-a'}>{bonne ? <PiTrendUpBold aria-hidden="true" /> : <PiWarningCircleFill aria-hidden="true" />}{bonne ? 'Objectif en bonne voie' : 'Objectif à surveiller'}</span><span className="hero-note">{bonne ? 'En avance' : 'En retard'} de {gnf(Math.abs(ecart))} sur le rythme prévu</span></div>}
            {!objectif && can('directeur') && <Lien to="/parametres" className="chip-l">Définir l'objectif annuel</Lien>}
          </div>
          {pct !== null && <Jauge p={pct}><b>{pct} %</b><small>de l'objectif</small></Jauge>}
        </div>
        {fin && <div className="hero-bas">
          {objectif > 0 && <div><span>Objectif annuel</span><Gnf n={objectif} /></div>}
          <div><span>Total des frais</span><Gnf n={frais} /></div>
          <div><span>Reste à encaisser</span><Gnf n={reste} /></div>
          <div><span>Élèves inscrits</span><span className="gnf"><b>{nb(tot)}</b></span></div>
        </div>}
      </section></Bandeau>
      {!fin ? <section className="carte"><h2>Votre établissement</h2><p className="note">{nb(tot)} élèves inscrits, {nb(d.t.classes)} classes et {nb(d.t.enseignants)} enseignants.</p></section> : <>
        <div className="kpis">
          <div className="kpi"><div><Tuile i={PiStudentDuotone} ton="bleu" t={34} /><span>Élèves inscrits</span></div><span className="gnf"><b>{nb(tot)}</b></span></div>
          <div className="kpi"><div><Tuile i={PiCoinsDuotone} ton="vert" t={34} /><span>Total des frais</span></div><Gnf n={frais} /></div>
          <div className="kpi"><div><Tuile i={PiHourglassMediumDuotone} ton="rouge" t={34} /><span>Reste à encaisser</span></div><span className="rg"><Gnf n={reste} /></span></div>
          <div className="kpi"><div><Tuile i={PiWalletDuotone} ton="violet" t={34} /><span>Trésorerie</span></div><Gnf n={d.t.tresorerie} /></div>
        </div>
        <div className="rang">
          <section className="carte c-large"><div className="tete-carte"><h2>Encaissements cumulés</h2>{objectif > 0 && <div className="legende"><span><i className="trait" />Encaissé</span><span><i className="pts" />Rythme prévu</span></div>}</div>
            {reel.length ? <Cumul labels={mois.map((m) => m.label)} reel={reel} objectif={objectif} /> : <Vide t="L'année scolaire n'a pas encore commencé." />}</section>
          <section className="carte c-etat"><h2>État des paiements</h2>
            <Segments parts={[[aJour, '#0FA968'], [partiels, '#F79009'], [rien, '#E5484D']]} />
            <ul className="etats">
              <li><PiCheckCircleFill className="c-vert" aria-hidden="true" />Entièrement payé<b className="vert">{nb(aJour)}</b><small>{pc(aJour)} %</small></li>
              <li><PiCircleHalfFill className="c-orange" aria-hidden="true" />Paiement partiel<b className="orange">{nb(partiels)}</b><small>{pc(partiels)} %</small></li>
              <li><PiXCircleFill className="c-rouge" aria-hidden="true" />Sans paiement<b className="rouge">{nb(rien)}</b><small>{pc(rien)} %</small></li>
            </ul>
            {tot === 0 ? <div className="action bleu"><PiStudentDuotone aria-hidden="true" /><div><b>Commencez ici</b><small>Créez vos classes puis vos élèves.</small></div><Lien to="/classes" className="btn plein mini">Créer</Lien></div>
              : retard > 0 ? <div className="action"><PiClockCountdownFill aria-hidden="true" /><div><b>{nb(retard)} élève{retard > 1 ? 's' : ''} en retard</b><small>{gnf(echu)} d'impayés échus</small></div><Lien to="/relances" className="btn plein mini">Relancer</Lien></div>
                : <div className="action vert"><PiCheckCircleFill aria-hidden="true" /><div><b>Tout se passe bien !</b><small>Aucun impayé échu.</small></div></div>}
          </section>
        </div>
        <div className="minis">
          <div className="carte mini-c"><Tuile i={PiWarningDuotone} ton="rouge" t={44} /><div><span>Impayés échus</span><Gnf n={echu} /></div></div>
          <div className="carte mini-c"><Tuile i={PiHandCoinsDuotone} ton="bleu" t={44} /><div><span>Avances</span><Gnf n={avances} /></div></div>
          <div className="carte mini-c"><Tuile i={PiShoppingCartDuotone} ton="orange" t={44} /><div><span>Dépenses</span><Gnf n={d.t.depenses_payees} /></div></div>
          <div className="carte mini-c tres"><Tuile i={PiPiggyBankDuotone} ton="vert" t={44} /><div><span>Trésorerie</span><Gnf n={d.t.tresorerie} /></div></div>
        </div>
        <div className="rang">
          <section className="carte c-large"><div className="tete-carte"><h2>Activités récentes</h2><Lien to="/paiements" className="voir">Voir tout</Lien></div>
            {fil.length === 0 ? <p className="note">Aucune activité pour le moment.</p> : <ul className="activites">{fil.map((a) => <li key={a.cle}><Tuile i={a.I} ton={a.ton} t={40} /><div><b>{a.t}</b><small>{a.s}</small></div><time>{quand(a.date)}</time></li>)}</ul>}</section>
          <section className="carte c-etat"><h2>Classes les plus à jour</h2>
            {d.st.length === 0 ? <p className="note">Définissez les frais de vos classes pour voir ce classement.</p> : <ul className="rangs">{d.st.map((c: any) => { const t = Math.round(c.taux_recouvrement); return <li key={c.classe_id}><b>{c.nom}</b><div className="barre-p"><i style={{ width: `${t}%` }} /></div><span>{t} %</span></li>; })}</ul>}
          </section>
        </div>
      </>}
    </>;
  }}</Etat></>;
}

const ORDRE_M = ['especes', 'virement', 'depot', 'orange_money', 'mtn_money', 'autre'];
const TuileMoyen = ({ type }: { type: string }) => {
  if (type === 'orange_money') return <span className="tuile t-om">OM</span>;
  if (type === 'mtn_money') return <span className="tuile t-mtn">MoMo</span>;
  return <Tuile i={type === 'especes' ? PiMoneyDuotone : type === 'autre' ? PiWalletDuotone : PiBankDuotone} ton={type === 'especes' ? 'vert' : 'bleu'} />;
};

export function NouveauPaiement() {
  const { annee, eid, can, majNotif } = useApp();
  const pre = new URLSearchParams(location.search).get('eleve') || '';
  const [el, setEl] = useState(pre); const [txt, setT] = useState(''); const [m, setM] = useState(0); const [moy, setMoy] = useState(''); const [ref, setR] = useState(''); const [date, setD] = useState(auj()); const [fic, setF] = useState<File | null>(null); const e = useEnvoi();
  const q = useQ(async () => {
    const [l, mo] = await Promise.all([db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&order=nom,prenom,inscription_id`), db.get(`moyens_paiement?etablissement_id=eq.${eid}&actif=is.true`)]);
    return { l, mo };
  }, [annee.id]);
  const valider = can('directeur', 'comptable');
  return (
    <>
      <Titre t="Enregistrer un paiement" retour="/paiements" />
      <Etat q={q}>{(d) => {
        const moyens = [...d.mo].sort((a: any, b: any) => ORDRE_M.indexOf(a.type) - ORDRE_M.indexOf(b.type));
        const choix = moy || moyens[0]?.id; const s = d.l.find((x: any) => x.eleve_id === el); const t = txt.trim().toLowerCase();
        const apres = s ? Math.max(s.reste - m, 0) : 0; const avance = s ? Math.max(m - s.reste, 0) : 0;
        const envoyer = (x: any) => {
          x.preventDefault();
          if (!el) return e.setE('Choisissez un élève'); if (!m) return e.setE('Indiquez le montant reçu');
          e.envoyer(async () => {
            const justificatif_chemin = fic ? await db.fichier(eid, fic) : null;
            const [p] = await db.ins('paiements', { etablissement_id: eid, eleve_id: el, annee_scolaire_id: annee.id, montant: m, date_paiement: date, moyen_id: choix, reference: ref.trim() || null, justificatif_chemin });
            majNotif();
            if (valider) { await db.upd(`paiements?id=eq.${p.id}`, { statut: 'valide' }); naviguer(`/r/${p.jeton_public}`); } else naviguer('/paiements');
          });
        };
        return <div className="paie-g">
          <form className="carte paie-f" onSubmit={envoyer} noValidate>
            {s ? <div className="eleve-choisi"><Avatar nom={`${s.nom} ${s.prenom}`} /><div><b>{s.nom} {s.prenom}</b><small>{s.matricule}, {s.classe}</small></div><button type="button" className="btn lien" onClick={() => setEl('')}>Changer</button></div> :
              <div className="choix-eleve"><div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={txt} onChange={(v) => setT(v.target.value)} placeholder="Rechercher l'élève" aria-label="Rechercher l'élève" /></div>
                {t && <ul>{d.l.filter((y: any) => `${y.matricule} ${y.nom} ${y.prenom}`.toLowerCase().includes(t)).slice(0, 6).map((y: any) => <li key={y.eleve_id}><button type="button" onClick={() => { setEl(y.eleve_id); setT(''); }}><Avatar nom={`${y.nom} ${y.prenom}`} /><span>{y.nom} {y.prenom}<small>{y.classe}</small></span></button></li>)}</ul>}</div>}
            <label className="saisie-m"><span>Montant reçu</span><div><input inputMode="numeric" value={m ? nb(m) : ''} placeholder="0" onChange={(v) => setM(entier(v.target.value))} aria-label="Montant reçu" /><b>GNF</b></div></label>
            {s && s.reste > 0 && <div className="vite"><button type="button" className={m === s.reste ? 'on' : ''} onClick={() => setM(s.reste)}>Tout le reste<b>{nb(s.reste)}</b></button>{s.impaye_echu > 0 && s.impaye_echu !== s.reste && <button type="button" className={m === s.impaye_echu ? 'on' : ''} onClick={() => setM(s.impaye_echu)}>En retard<b>{nb(s.impaye_echu)}</b></button>}</div>}
            <div className="champ"><span>Moyen de paiement</span><div className="moyens">{moyens.map((y: any) => <button type="button" key={y.id} aria-pressed={choix === y.id} className={choix === y.id ? 'on' : ''} onClick={() => setMoy(y.id)}><TuileMoyen type={y.type} /><span>{y.libelle}</span></button>)}</div></div>
            <Champ label="Référence de la transaction"><input value={ref} onChange={(v) => setR(v.target.value)} placeholder="Facultatif" /></Champ>
            <div className="deux"><Champ label="Date du paiement"><input type="date" value={date} max={auj()} onChange={(v) => setD(v.target.value)} required /></Champ><Champ label="Justificatif"><label className="joindre"><PiPaperclipDuotone aria-hidden="true" /><span>{fic ? fic.name : 'Joindre'}</span><input type="file" accept="image/*,application/pdf" onChange={(v) => setF(v.target.files?.[0] || null)} /></label></Champ></div>
            <Erreur t={e.erreur} />
            <button className="btn plein" disabled={e.occupe}><PiCheckBold aria-hidden="true" />{e.occupe ? 'Enregistrement…' : valider ? 'Enregistrer et valider' : 'Enregistrer le paiement'}</button>
            {!valider && <p className="note ctr">Le paiement restera en attente jusqu'à sa vérification par le directeur ou le comptable.</p>}
          </form>
          {s && <aside className="carte paie-r"><h2>Situation de l'élève</h2>
            <dl className="cl-d"><div><dt>Frais dus</dt><dd>{gnf(s.facture_net)}</dd></div><div><dt>Déjà payé</dt><dd className="vert">{gnf(s.regle)}</dd></div><div><dt>Reste à payer</dt><dd>{gnf(s.reste)}</dd></div></dl>
            {m > 0 && <div className="apres"><span>Après ce paiement</span><b>{avance > 0 ? `Soldé, avance de ${gnf(avance)}` : apres > 0 ? `Reste ${gnf(apres)}` : 'Élève à jour'}</b></div>}
            <div className="securite"><PiShieldCheckDuotone aria-hidden="true" /><p>Scolaris n'encaisse jamais l'argent. Il enregistre et vérifie les paiements reçus par l'école.</p></div>
          </aside>}
        </div>;
      }}</Etat>
    </>
  );
}

function Motif({ titre, fermer, valider }: any) {
  const [m, setM] = useState(''); const e = useEnvoi();
  return <Modale titre={titre} fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!m.trim()) return e.setE('Indiquez le motif'); e.envoyer(async () => { await valider(m.trim()); fermer(); }); }}><Champ label="Motif *"><input value={m} onChange={(x) => setM(x.target.value)} autoFocus /></Champ><Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Confirmer</button></form></Modale>;
}

export function Paiements() {
  const { annee, can, majNotif } = useApp(); const [f, setF] = useState('en_attente'); const e = useEnvoi(); const [mot, setMot] = useState<any>(null);
  const q = useQ(async () => {
    const [l, jet] = await Promise.all([db.tout(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&order=date_paiement.desc,id`), db.tout(`paiements?annee_scolaire_id=eq.${annee.id}&select=id,jeton_public&order=id`)]);
    const j = Object.fromEntries(jet.map((x: any) => [x.id, x.jeton_public])); return { l, j };
  }, [annee.id]);
  const act = async (id: string, b: any) => { await db.upd(`paiements?id=eq.${id}`, b); await q.reload(); majNotif(); };
  const v = can('directeur', 'comptable');
  return (
    <>
      <Titre t="Paiements"><Lien to="/paiements/nouveau" className="btn plein mini"><PiPlusBold />Enregistrer</Lien></Titre>
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d) => {
        const att = d.l.filter((p: any) => p.statut === 'en_attente'); const val = d.l.filter((p: any) => p.statut === 'valide');
        const som = (a: any[]) => a.reduce((s, x) => s + Number(x.montant), 0);
        const ce = auj().slice(0, 7); const mois = val.filter((p: any) => String(p.date_paiement).startsWith(ce));
        const l = f === 'tous' ? d.l : d.l.filter((p: any) => p.statut === f);
        const actions = (p: any) => <>
          {p.statut === 'en_attente' && v && <><button className="btn plein mini" onClick={() => e.envoyer(() => act(p.id, { statut: 'valide' }))}><PiCheckBold />Valider</button><button className="btn contour mini rouge" onClick={() => setMot({ t: 'Rejeter ce paiement', b: (m: string) => act(p.id, { statut: 'rejete', motif_rejet: m }) })}>Rejeter</button></>}
          {p.numero_recu && <Lien className="btn contour mini" to={`/r/${d.j[p.id]}`}><PiReceiptDuotone />Reçu</Lien>}
          {p.statut === 'valide' && v && <button className="ico rouge" aria-label="Annuler ce paiement" title="Annuler" onClick={() => setMot({ t: 'Annuler ce paiement', b: (m: string) => act(p.id, { statut: 'annule', annule_motif: m }) })}><PiXCircleFill /></button>}
        </>;
        return <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiHourglassMediumDuotone} ton="orange" t={44} /><div><span>À vérifier ({nb(att.length)})</span><Gnf n={som(att)} /></div></div><div className="carte mini-c"><Tuile i={PiCalendarCheckDuotone} ton="bleu" t={44} /><div><span>Validés ce mois</span><Gnf n={som(mois)} /></div></div><div className="carte mini-c"><Tuile i={PiCoinsDuotone} ton="vert" t={44} /><div><span>Encaissé sur l'année</span><Gnf n={som(val)} /></div></div></div>
          <div className="segment" role="tablist">{[['en_attente', 'En attente', att.length], ['valide', 'Validés', val.length], ['tous', 'Tous', d.l.length]].map(([k, t, n]: any) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{t}<em>{nb(n)}</em></button>)}</div>
          <section className="carte c-table">
            {l.length === 0 ? <Vide t={f === 'en_attente' ? 'Aucun paiement à vérifier.' : 'Aucun paiement ici.'} /> : <>
              <div className="table vue-bureau"><table><thead><tr><th>Date</th><th>Élève</th><th className="dr">Montant</th><th>Moyen</th><th>Statut</th><th /></tr></thead><tbody>{l.slice(0, 200).map((p: any) => <tr key={p.id}>
                <td className="gr">{dateFr(p.date_paiement)}</td><td><Lien to={`/eleves/${p.eleve_id}`} className="nom-el"><Avatar nom={`${p.nom} ${p.prenom}`} /><span><b>{p.nom} {p.prenom}</b><small className="bloc">{p.classe}</small></span></Lien></td><td className="dr fort">{nb(p.montant)}</td><td>{p.moyen}{p.reference && <small className="bloc">{p.reference}</small>}</td><td><EtatPaiement s={p.statut} /></td><td><div className="acts-l">{actions(p)}</div></td></tr>)}</tbody></table></div>
              <ul className="vue-tel liste-p">{l.slice(0, 200).map((p: any) => <li key={p.id}><div className="lp-h"><Avatar nom={`${p.nom} ${p.prenom}`} /><div><b>{p.nom} {p.prenom}</b><small>{dateFr(p.date_paiement)}, {p.moyen}</small></div><div className="fin"><span className="gnf"><b>{nb(p.montant)}</b></span><EtatPaiement s={p.statut} /></div></div>{(p.statut === 'en_attente' ? v : true) && (p.statut === 'en_attente' || p.numero_recu) && <div className="acts-l">{actions(p)}</div>}</li>)}</ul>
            </>}
          </section>
          <p className="note ctr">Un paiement en attente n'est pas compté dans l'encaissé tant qu'il n'est pas validé.</p>
          {mot && <Motif titre={mot.t} fermer={() => setMot(null)} valider={mot.b} />}
        </>;
      }}</Etat>
    </>
  );
}

export function Depenses() {
  const { annee, eid, can } = useApp(); const [aj, setAj] = useState(false); const [mv, setMv] = useState(false); const e = useEnvoi();
  const q = useQ(async () => {
    const [l, cat, cai, tb] = await Promise.all([db.get(`depenses?annee_scolaire_id=eq.${annee.id}&select=*,categories_depense(libelle)&order=date_depense.desc,cree_le.desc`), db.get(`categories_depense?etablissement_id=eq.${eid}&order=libelle`), db.get(`v_tresorerie_caisses?etablissement_id=eq.${eid}&order=nom`), db.get(`v_tableau_bord?annee_scolaire_id=eq.${annee.id}&select=depenses_payees`)]);
    return { l, cat, cai, tot: tb[0]?.depenses_payees || 0 };
  }, [annee.id]);
  const maj = (id: string, b: any) => e.envoyer(async () => { await db.upd(`depenses?id=eq.${id}`, b); await q.reload(); });
  return (
    <>
      <Titre t="Dépenses et caisse">{can('directeur', 'comptable') && <button className="btn contour mini" onClick={() => setMv(true)}>Mouvement</button>}<button className="btn plein mini" onClick={() => setAj(true)}><FaPlus /> Ajouter</button></Titre>
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d) => {
        const solde = d.cai.reduce((s: number, c: any) => s + c.solde, 0);
        return <>
          <div className="stats deux-s"><div className="stat bleu"><FaMoneyBillTrendUp /><span>Dépenses totales</span><b>{nb(d.tot)}</b><small>GNF</small></div><div className="stat vert"><FaWallet /><span>Solde de caisse</span><b>{nb(solde)}</b><small>GNF</small></div></div>
          <section className="carte"><h2>Caisses</h2><div className="caisses">{d.cai.map((c: any) => <div key={c.caisse_id}><span>{c.nom}</span><b>{gnf(c.solde)}</b></div>)}</div></section>
          <section className="carte"><h2>Dernières dépenses</h2>{d.l.length === 0 ? <Vide t="Aucune dépense enregistrée." /> : <ul className="liste">{d.l.map((x: any) => <li key={x.id}><div><b>{x.libelle}</b><small>{x.categories_depense?.libelle}{x.beneficiaire ? ` · ${x.beneficiaire}` : ''} · {dateFr(x.date_depense)}</small></div>
            <span className="d-fin"><b>{gnf(x.montant)}</b>
              {x.statut === 'soumise' && (can('directeur') ? <><button className="btn lien" onClick={() => maj(x.id, { statut: 'autorisee' })}>Autoriser</button><button className="btn lien rouge" onClick={() => { const m = prompt('Motif du rejet'); if (m) maj(x.id, { statut: 'rejetee', motif_statut: m }); }}>Rejeter</button></> : <span className="st orange">À autoriser</span>)}
              {x.statut === 'autorisee' && (can('directeur', 'comptable', 'caissier') ? <select aria-label="Payer depuis la caisse" value="" onChange={(ev) => ev.target.value && maj(x.id, { statut: 'payee', caisse_id: ev.target.value })}><option value="">Payer depuis…</option>{d.cai.map((c: any) => <option key={c.caisse_id} value={c.caisse_id}>{c.nom}</option>)}</select> : <span className="st bleu">Autorisée</span>)}
              {x.statut === 'payee' && <span className="st vert">Payée</span>}{x.statut === 'rejetee' && <span className="st rouge">Rejetée</span>}{x.statut === 'annulee' && <span className="st gris">Annulée</span>}
            </span></li>)}</ul>}</section>
          {aj && <FormDepense d={d} fermer={() => setAj(false)} fini={() => { setAj(false); q.reload(); }} />}
          {mv && <FormMouvement d={d} fermer={() => setMv(false)} fini={() => { setMv(false); q.reload(); }} />}
        </>;
      }}</Etat>
    </>
  );
}

function FormDepense({ d, fermer, fini }: any) {
  const { annee, eid } = useApp(); const [f, setF] = useState<any>({ libelle: '', beneficiaire: '', montant: 0, categorie_id: d.cat[0]?.id, date_depense: auj() }); const e = useEnvoi();
  return <Modale titre="Ajouter une dépense" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!f.montant) return e.setE('Indiquez le montant'); e.envoyer(async () => { const cat = d.cat.find((c: any) => c.id === f.categorie_id); await db.ins('depenses', { ...f, etablissement_id: eid, annee_scolaire_id: annee.id, est_salaire: cat?.libelle === 'Salaires' }); fini(); }); }}>
    <Champ label="Libellé *"><input value={f.libelle} onChange={(x) => setF({ ...f, libelle: x.target.value })} required /></Champ>
    <div className="deux"><Champ label="Catégorie"><select value={f.categorie_id} onChange={(x) => setF({ ...f, categorie_id: x.target.value })}>{d.cat.map((c: any) => <option key={c.id} value={c.id}>{c.libelle}</option>)}</select></Champ><Champ label="Date"><input type="date" value={f.date_depense} onChange={(x) => setF({ ...f, date_depense: x.target.value })} required /></Champ></div>
    <Champ label="Montant *"><Montant value={f.montant} onChange={(v: number) => setF({ ...f, montant: v })} /></Champ>
    <Champ label="Bénéficiaire"><input value={f.beneficiaire} onChange={(x) => setF({ ...f, beneficiaire: x.target.value })} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}

function FormMouvement({ d, fermer, fini }: any) {
  const { eid } = useApp(); const [f, setF] = useState<any>({ caisse_id: d.cai[0]?.caisse_id, sens: 'entree', montant: 0, libelle: '', date_mouvement: auj() }); const e = useEnvoi();
  return <Modale titre="Entrée ou sortie de caisse" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!f.montant) return e.setE('Indiquez le montant'); e.envoyer(async () => { await db.ins('mouvements_tresorerie', { ...f, etablissement_id: eid, origine: 'manuel' }); fini(); }); }}>
    <div className="deux"><Champ label="Caisse"><select value={f.caisse_id} onChange={(x) => setF({ ...f, caisse_id: x.target.value })}>{d.cai.map((c: any) => <option key={c.caisse_id} value={c.caisse_id}>{c.nom}</option>)}</select></Champ><Champ label="Sens"><select value={f.sens} onChange={(x) => setF({ ...f, sens: x.target.value })}><option value="entree">Entrée</option><option value="sortie">Sortie</option></select></Champ></div>
    <Champ label="Montant *"><Montant value={f.montant} onChange={(v: number) => setF({ ...f, montant: v })} /></Champ>
    <Champ label="Libellé *"><input value={f.libelle} onChange={(x) => setF({ ...f, libelle: x.target.value })} required /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}

export function Rapports() {
  const { annee, eid, can } = useApp(); const [o, setO] = useState('recettes'); const [mois, setM] = useState('');
  const q = useQ(async () => {
    const [p, s, c, dep] = await Promise.all([db.get(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&statut=eq.valide&order=date_paiement`), db.get(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&order=nom,prenom`), db.get(`v_stats_classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`), db.get(`depenses?annee_scolaire_id=eq.${annee.id}&statut=eq.payee&select=*,categories_depense(libelle)&order=date_depense`)]);
    return { p, s, c, dep };
  }, [annee.id]);
  const nom = `scolaris-${o}-${annee.libelle}${mois ? '-' + mois : ''}`;
  return (
    <>
      <Titre t="Rapports et statistiques" />
      <Etat q={q}>{(d) => {
        const dansMois = (x: string) => !mois || String(x).startsWith(mois);
        const p = d.p.filter((x: any) => dansMois(x.date_paiement)); const dep = d.dep.filter((x: any) => dansMois(x.date_depense));
        const moyens = Object.entries(p.reduce((a: any, x: any) => ({ ...a, [x.moyen]: (a[x.moyen] || 0) + x.montant }), {})).map(([label, valeur]: any) => ({ label, valeur }));
        const cats = Object.entries(dep.reduce((a: any, x: any) => { const k = x.categories_depense?.libelle || 'Autres'; return { ...a, [k]: (a[k] || 0) + x.montant }; }, {})).map(([label, valeur]: any) => ({ label, valeur }));
        const som = (l: any[]) => l.reduce((s, x) => s + x.montant, 0);
        const excel = () => {
          if (o === 'recettes') telechargerExcel(nom, [['Date', 'Reçu', 'Élève', 'Classe', 'Moyen', 'Montant GNF'], ...p.map((x: any) => [x.date_paiement, x.numero_recu, `${x.nom} ${x.prenom}`, x.classe || '', x.moyen, x.montant])]);
          if (o === 'eleves') telechargerExcel(nom, [['Matricule', 'Élève', 'Classe', 'Frais', 'Payé', 'Reste', 'Impayé échu', 'Avance'], ...d.s.map((x: any) => [x.matricule || '', `${x.nom} ${x.prenom}`, x.classe, x.facture_net, x.regle, x.reste, x.impaye_echu, x.avance])]);
          if (o === 'classes') telechargerExcel(nom, [['Classe', 'Effectif', 'Frais', 'Payé', 'Reste', 'Impayé échu', 'Taux %'], ...d.c.map((x: any) => [x.nom, x.effectif, x.facture_net, x.regle, x.reste, x.impaye_echu, Number(x.taux_recouvrement)])]);
          if (o === 'depenses') telechargerExcel(nom, [['Date', 'Libellé', 'Catégorie', 'Bénéficiaire', 'Montant GNF'], ...dep.map((x: any) => [x.date_depense, x.libelle, x.categories_depense?.libelle || '', x.beneficiaire || '', x.montant])]);
        };
        return <section className="carte">
          <div className="onglets noprint">{[['recettes', 'Recettes'], ['eleves', 'Élèves'], ['classes', 'Classes'], ['depenses', 'Dépenses']].map(([k, t]) => <button key={k} className={o === k ? 'on' : ''} onClick={() => setO(k)}>{t}</button>)}</div>
          <div className="filtres noprint"><select value={mois} onChange={(e) => setM(e.target.value)} aria-label="Mois"><option value="">Tous les mois</option>{moisAnnee(annee).map((m) => <option key={m.cle} value={m.cle}>{m.label} {m.cle.slice(0, 4)}</option>)}</select></div>
          {o === 'recettes' && <><div className="grille-2 sans"><div><h2>Recettes mensuelles</h2><Barres data={parMois(annee, mois ? p : d.p, 'date_paiement')} /></div><div><h2>Répartition des paiements</h2>{moyens.length ? <Anneau data={moyens} /> : <Vide t="Aucune recette." />}</div></div>
            <p className="total">Total validé : <b>{gnf(som(p))}</b></p></>}
          {o === 'eleves' && <div className="table"><table><thead><tr><th>Élève</th><th>Classe</th><th>Frais</th><th>Payé</th><th>Reste</th><th>Avance</th></tr></thead><tbody>{d.s.map((x: any) => <tr key={x.inscription_id}><td>{x.nom} {x.prenom}</td><td>{x.classe}</td><td>{nb(x.facture_net)}</td><td>{nb(x.regle)}</td><td className={x.en_retard ? 'rouge' : ''}>{nb(x.reste)}</td><td>{nb(x.avance)}</td></tr>)}</tbody></table></div>}
          {o === 'classes' && <div className="table"><table><thead><tr><th>Classe</th><th>Effectif</th><th>Frais</th><th>Payé</th><th>Reste</th><th>Taux</th></tr></thead><tbody>{d.c.map((x: any) => <tr key={x.classe_id}><td>{x.nom}</td><td>{x.effectif}</td><td>{nb(x.facture_net)}</td><td>{nb(x.regle)}</td><td>{nb(x.reste)}</td><td>{Math.round(x.taux_recouvrement)} %</td></tr>)}</tbody></table></div>}
          {o === 'depenses' && <><div className="grille-2 sans"><div><h2>Dépenses mensuelles</h2><Barres data={parMois(annee, mois ? dep : d.dep, 'date_depense')} /></div><div><h2>Par catégorie</h2>{cats.length ? <Anneau data={cats} /> : <Vide t="Aucune dépense." />}</div></div><p className="total">Total payé : <b>{gnf(som(dep))}</b></p></>}
          <div className="ligne-btn noprint"><button className="btn contour mini" onClick={() => print()}><FaFilePdf /> Exporter en PDF</button><button className="btn contour mini" onClick={excel}><FaFileExcel /> Exporter en Excel</button></div>
        </section>;
      }}</Etat>
    </>
  );
}
