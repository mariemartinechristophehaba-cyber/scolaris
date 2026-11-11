import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiArrowsLeftRightBold, PiBooksDuotone, PiBusDuotone, PiFilePdfDuotone, PiFileXlsDuotone, PiHouseLineDuotone, PiLightningDuotone, PiUsersThreeDuotone, PiBankDuotone, PiCalendarCheckDuotone, PiCalendarDotsFill, PiChartBarFill, PiCheckBold, PiMagnifyingGlassBold, PiMoneyDuotone, PiPaperclipDuotone, PiPlusBold, PiReceiptDuotone, PiShieldCheckDuotone, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiCoinsDuotone, PiHandCoinsDuotone, PiHourglassMediumDuotone, PiMoneyWavyDuotone, PiPiggyBankDuotone, PiShoppingCartDuotone, PiStudentDuotone, PiTrendUpBold, PiUserPlusDuotone, PiWalletDuotone, PiWarningCircleFill, PiWarningDuotone, PiXCircleFill } from 'react-icons/pi';
import { db } from './api';
import { Anneau, Barres, Cumul, Jauge, Segments } from './charts';
import { auj, dateFr, entier, gnf, heure, moisAnnee, nb, parMois, telechargerExcel } from './lib';
import { EtatPaiement } from './gestion';
import { Avatar, Bandeau, Champ, Erreur, Etat, Gnf, Lien, Modale, Montant, OptClasses, Pastille, SelAnnee, Titre, Tuile, Vague, Verre, Vide, naviguer, useApp, useEnvoi, useQ } from './ui';

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
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,nom,niveaux(nom)&order=ordre,nom`),
      fin ? db.get(`paiements?annee_scolaire_id=eq.${annee.id}&select=id,montant,cree_le,statut,eleves(prenom,nom)&order=cree_le.desc&limit=4`) : [],
      db.get(`inscriptions?annee_scolaire_id=eq.${annee.id}&select=id,cree_le,classes(nom),eleves(prenom,nom)&order=cree_le.desc&limit=3`),
      can('directeur', 'comptable', 'caissier') ? db.get(`depenses?annee_scolaire_id=eq.${annee.id}&select=id,libelle,montant,cree_le&order=cree_le.desc&limit=3`) : [],
    ]);
    return { t: tb[0] || {}, obj, pay, sit, st, cls, p3, ins, dep };
  }, [annee.id]);
  const mois = moisAnnee(annee);
  const filtres = zoneFiltres && fin ? createPortal(<>
    <Verre value={per} onChange={setPer} label="Période"><option value="">Toute l'année</option>{mois.map((m) => <option key={m.cle} value={m.cle}>{m.label} {m.cle.slice(0, 4)}</option>)}</Verre>
    {q.data && <Verre value={classe} onChange={setCl} label="Classe"><option value="">Toutes les classes</option><OptClasses l={(q.data as any).cls} /></Verre>}
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
            {!objectif && can('directeur') && <Lien to="/parametres" className="chip-l"><PiCalendarDotsFill aria-hidden="true" />Définir l'objectif annuel</Lien>}
          </div>
          {pct !== null && <Jauge p={pct}><b>{pct} %</b><small>de l'objectif</small></Jauge>}
        </div>
        <Vague />
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
          {can('directeur', 'comptable', 'caissier') && <div className="kpi"><div><Tuile i={PiWalletDuotone} ton="violet" t={34} /><span>Trésorerie</span></div><Gnf n={d.t.tresorerie} /></div>}
        </div>
        <div className="rang">
          <section className="carte c-large"><div className="tete-carte"><h2>Encaissements cumulés</h2>{objectif > 0 && <div className="legende"><span><i className="trait" />Encaissé</span><span><i className="pts" />Rythme prévu</span></div>}</div>
            {reel.length ? <Cumul labels={mois.map((m) => m.label)} reel={reel} objectif={objectif} /> : <Vide t="L'année scolaire n'a pas encore commencé." />}</section>
          <section className="carte c-etat"><h2><PiChartBarFill aria-hidden="true" />État des paiements</h2>
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
          {can('directeur', 'comptable', 'caissier') && <div className="carte mini-c"><Tuile i={PiShoppingCartDuotone} ton="orange" t={44} /><div><span>Dépenses</span><Gnf n={d.t.depenses_payees} /></div></div>}
          {can('directeur', 'comptable', 'caissier') && <div className="carte mini-c tres"><Tuile i={PiPiggyBankDuotone} ton="vert" t={44} /><div><span>Trésorerie</span><Gnf n={d.t.tresorerie} /></div></div>}
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
  const { annee, can, majNotif } = useApp(); const [f, setF] = useState('en_attente'); const e = useEnvoi(); const [mot, setMot] = useState<any>(null); const [max, setMax] = useState(100);
  const q = useQ(async () => {
    const [l, jet] = await Promise.all([db.tout(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&order=date_paiement.desc,id`), db.tout(`paiements?annee_scolaire_id=eq.${annee.id}&select=id,jeton_public,justificatif_chemin&order=id`)]);
    const j = Object.fromEntries(jet.map((x: any) => [x.id, x.jeton_public])); const pj = Object.fromEntries(jet.filter((x: any) => x.justificatif_chemin).map((x: any) => [x.id, x.justificatif_chemin])); return { l, j, pj };
  }, [annee.id]);
  const act = async (id: string, b: any) => { await db.upd(`paiements?id=eq.${id}`, b); await q.reload(); majNotif(); };
  const v = can('directeur', 'comptable');
  const voirPj = (c: string) => { const w = window.open('about:blank', '_blank'); e.envoyer(async () => { const u = await db.voirFichier(c); if (w) w.location.href = u; else location.href = u; }); };
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
          {d.pj[p.id] && <button className="btn contour mini" onClick={() => voirPj(d.pj[p.id])}><PiPaperclipDuotone aria-hidden="true" />Justificatif</button>}
          {p.statut === 'en_attente' && v && <><button className="btn plein mini" onClick={() => e.envoyer(() => act(p.id, { statut: 'valide' }))}><PiCheckBold />Valider</button><button className="btn contour mini rouge" onClick={() => setMot({ t: 'Rejeter ce paiement', b: (m: string) => act(p.id, { statut: 'rejete', motif_rejet: m }) })}>Rejeter</button></>}
          {p.numero_recu && <Lien className="btn contour mini" to={`/r/${d.j[p.id]}`}><PiReceiptDuotone />Reçu</Lien>}
          {p.statut === 'valide' && v && <button className="ico rouge" aria-label="Annuler ce paiement" title="Annuler" onClick={() => setMot({ t: 'Annuler ce paiement', b: (m: string) => act(p.id, { statut: 'annule', annule_motif: m }) })}><PiXCircleFill /></button>}
        </>;
        return <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiHourglassMediumDuotone} ton="orange" t={44} /><div><span>À vérifier ({nb(att.length)})</span><Gnf n={som(att)} /></div></div><div className="carte mini-c"><Tuile i={PiCalendarCheckDuotone} ton="bleu" t={44} /><div><span>Validés ce mois</span><Gnf n={som(mois)} /></div></div><div className="carte mini-c"><Tuile i={PiCoinsDuotone} ton="vert" t={44} /><div><span>Encaissé sur l'année</span><Gnf n={som(val)} /></div></div></div>
          <div className="segment" role="tablist">{[['en_attente', 'En attente', att.length], ['valide', 'Validés', val.length], ['tous', 'Tous', d.l.length]].map(([k, t, n]: any) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{t}<em>{nb(n)}</em></button>)}</div>
          <section className="carte c-table">
            {l.length === 0 ? <Vide t={f === 'en_attente' ? 'Aucun paiement à vérifier.' : 'Aucun paiement ici.'} /> : <>
              <div className="table vue-bureau"><table><thead><tr><th>Date</th><th>Élève</th><th className="dr">Montant</th><th>Moyen</th><th>Statut</th><th /></tr></thead><tbody>{l.slice(0, max).map((p: any) => <tr key={p.id}>
                <td className="gr">{dateFr(p.date_paiement)}</td><td><Lien to={`/eleves/${p.eleve_id}`} className="nom-el"><Avatar nom={`${p.nom} ${p.prenom}`} /><span><b>{p.nom} {p.prenom}</b><small className="bloc">{p.classe}</small></span></Lien></td><td className="dr fort">{nb(p.montant)}</td><td>{p.moyen}{p.reference && <small className="bloc">{p.reference}</small>}</td><td><EtatPaiement s={p.statut} /></td><td><div className="acts-l">{actions(p)}</div></td></tr>)}</tbody></table></div>
              <ul className="vue-tel liste-p">{l.slice(0, max).map((p: any) => <li key={p.id}><div className="lp-h"><Avatar nom={`${p.nom} ${p.prenom}`} /><div><b>{p.nom} {p.prenom}</b><small>{dateFr(p.date_paiement)}, {p.moyen}</small></div><div className="fin"><span className="gnf"><b>{nb(p.montant)}</b></span><EtatPaiement s={p.statut} /></div></div>{(p.statut === 'en_attente' ? v : true) && (p.statut === 'en_attente' || p.numero_recu) && <div className="acts-l">{actions(p)}</div>}</li>)}</ul>
              {l.length > max && <div className="plus-l"><button className="btn contour mini" onClick={() => setMax(max + 100)}>Voir la suite ({nb(l.length - max)})</button></div>}
            </>}
          </section>
          <p className="note ctr">Un paiement en attente n'est pas compté dans l'encaissé tant qu'il n'est pas validé.</p>
          {mot && <Motif titre={mot.t} fermer={() => setMot(null)} valider={mot.b} />}
        </>;
      }}</Etat>
    </>
  );
}

const iconeDep = (l = '') => (/salaire/i.test(l) ? PiUsersThreeDuotone : /fourn/i.test(l) ? PiBooksDuotone : /loyer|bail/i.test(l) ? PiHouseLineDuotone : /[ée]lec|eau|courant/i.test(l) ? PiLightningDuotone : /transp|carbur/i.test(l) ? PiBusDuotone : PiReceiptDuotone);
const typeCaisse = (c: any) => { const t = `${c.type} ${c.nom}`.toLowerCase(); return /orange/.test(t) ? 'orange_money' : /mtn/.test(t) ? 'mtn_money' : /banq|virement/.test(t) ? 'virement' : 'especes'; };
const ST_D: any = { soumise: ['retard', 'À autoriser'], autorisee: ['partiel', 'À payer'], payee: ['a_jour', 'Payée'], rejetee: ['rien', 'Rejetée'], annulee: ['sans', 'Annulée'] };
const som = (l: any[]) => l.reduce((t, x) => t + Number(x.montant), 0);
const Mini = ({ i, ton, t, children }: any) => <div className="carte mini-c"><Tuile i={i} ton={ton} t={44} /><div><span>{t}</span>{children}</div></div>;

export function Depenses() {
  const { annee, eid, can } = useApp(); const [aj, setAj] = useState(false); const [mv, setMv] = useState(false); const [f, setF] = useState('traiter'); const [rej, setRej] = useState<any>(null); const [max, setMax] = useState(100); const [pay, setPay] = useState<any>(null); const e = useEnvoi();
  const q = useQ(async () => {
    const [l, cat, cai] = await Promise.all([db.tout(`depenses?annee_scolaire_id=eq.${annee.id}&select=*,categories_depense(libelle)&order=date_depense.desc,cree_le.desc,id`), db.get(`categories_depense?etablissement_id=eq.${eid}&order=libelle`), db.get(`v_tresorerie_caisses?etablissement_id=eq.${eid}&order=nom`)]);
    return { l, cat, cai };
  }, [annee.id]);
  const maj = async (id: string, b: any) => { await db.upd(`depenses?id=eq.${id}`, b); await q.reload(); };
  return (
    <>
      <Titre t="Dépenses">{can('directeur', 'comptable') && <button className="btn contour mini" aria-label="Mouvement de caisse" onClick={() => setMv(true)}><PiArrowsLeftRightBold /><span className="bureau-seul-t">Mouvement de caisse</span></button>}<button className="btn plein mini" onClick={() => setAj(true)}><PiPlusBold />Ajouter</button></Titre>
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d) => {
        const payees = d.l.filter((x: any) => x.statut === 'payee'); const att = d.l.filter((x: any) => x.statut === 'soumise' || x.statut === 'autorisee');
        const solde = d.cai.reduce((t: number, c: any) => t + Number(c.solde), 0);
        const l = f === 'traiter' ? att : f === 'payee' ? payees : d.l;
        const statut = (x: any) => <Pastille k={ST_D[x.statut][0]} t={ST_D[x.statut][1]} />;
        const actions = (x: any) => <>
          {x.statut === 'soumise' && can('directeur') && <><button className="btn plein mini" onClick={() => e.envoyer(() => maj(x.id, { statut: 'autorisee' }))}><PiCheckBold />Autoriser</button><button className="btn contour mini rouge" onClick={() => setRej(x)}>Rejeter</button></>}
          {x.statut === 'autorisee' && can('directeur', 'comptable', 'caissier') && <button className="btn plein mini" onClick={() => setPay(x)}><PiHandCoinsDuotone />Payer</button>}
        </>;
        const agir = (x: any) => (x.statut === 'soumise' && can('directeur')) || (x.statut === 'autorisee' && can('directeur', 'comptable', 'caissier'));
        return <>
          <div className="minis"><Mini i={PiShoppingCartDuotone} ton="rouge" t="Dépenses payées"><Gnf n={som(payees)} /></Mini><Mini i={PiHourglassMediumDuotone} ton="orange" t={`À traiter (${nb(att.length)})`}><Gnf n={som(att)} /></Mini><Mini i={PiPiggyBankDuotone} ton="vert" t="Trésorerie disponible"><Gnf n={solde} /></Mini></div>
          {d.cai.length > 0 && <div className="minis caisses-m">{d.cai.map((c: any) => <div className="carte mini-c" key={c.caisse_id}><TuileMoyen type={typeCaisse(c)} /><div><span>{c.nom}</span><Gnf n={c.solde} /></div></div>)}</div>}
          <div className="segment" role="tablist">{[['traiter', 'À traiter', att.length], ['payee', 'Payées', payees.length], ['toutes', 'Toutes', d.l.length]].map(([k, t, n]: any) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{t}<em>{nb(n)}</em></button>)}</div>
          <section className="carte c-table">
            {l.length === 0 ? <Vide t={f === 'traiter' ? 'Aucune dépense à traiter.' : 'Aucune dépense ici.'} /> : <>
              <div className="table vue-bureau"><table><thead><tr><th>Date</th><th>Dépense</th><th>Bénéficiaire</th><th className="dr">Montant</th><th>Statut</th><th /></tr></thead><tbody>{l.slice(0, max).map((x: any) => <tr key={x.id}>
                <td className="gr">{dateFr(x.date_depense)}</td><td><div className="nom-el"><Tuile i={iconeDep(x.categories_depense?.libelle)} ton="bleu" t={40} /><span><b>{x.libelle}</b><small className="bloc">{x.categories_depense?.libelle}</small></span></div></td><td>{x.beneficiaire || <span className="gr">Non renseigné</span>}</td><td className="dr fort">{nb(x.montant)}</td><td>{statut(x)}</td><td><div className="acts-l">{actions(x)}</div></td></tr>)}</tbody></table></div>
              <ul className="vue-tel liste-p">{l.slice(0, max).map((x: any) => <li key={x.id}><div className="lp-h"><Tuile i={iconeDep(x.categories_depense?.libelle)} ton="bleu" t={40} /><div><b>{x.libelle}</b><small>{dateFr(x.date_depense)}, {x.categories_depense?.libelle}</small></div><div className="fin"><span className="gnf"><b>{nb(x.montant)}</b></span>{statut(x)}</div></div>{agir(x) && <div className="acts-l">{actions(x)}</div>}</li>)}</ul>
              {l.length > max && <div className="plus-l"><button className="btn contour mini" onClick={() => setMax(max + 100)}>Voir la suite ({nb(l.length - max)})</button></div>}
            </>}
          </section>
          {aj && <FormDepense d={d} fermer={() => setAj(false)} fini={() => { setAj(false); q.reload(); }} />}
          {mv && <FormMouvement d={d} fermer={() => setMv(false)} fini={() => { setMv(false); q.reload(); }} />}
          {rej && <Motif titre="Rejeter cette dépense" fermer={() => setRej(null)} valider={(m: string) => maj(rej.id, { statut: 'rejetee', motif_statut: m })} />}
          {pay && <PayerDepense x={pay} cai={d.cai} fermer={() => setPay(null)} valider={(c: string) => maj(pay.id, { statut: 'payee', caisse_id: c })} />}
        </>;
      }}</Etat>
    </>
  );
}

function PayerDepense({ x, cai, fermer, valider }: any) {
  const [c, setC] = useState(cai[0]?.caisse_id); const e = useEnvoi(); const choisie = cai.find((y: any) => y.caisse_id === c);
  return <Modale titre="Payer cette dépense" fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); if (!c) return e.setE('Choisissez une caisse'); e.envoyer(async () => { await valider(c); fermer(); }); }}>
    <div className="rappel-d"><span>{x.libelle}</span><Gnf n={x.montant} /></div>
    <div className="champ"><span>Payer depuis</span><div className="choix-c">{cai.map((y: any) => <button type="button" key={y.caisse_id} aria-pressed={c === y.caisse_id} className={c === y.caisse_id ? 'on' : ''} onClick={() => setC(y.caisse_id)}><TuileMoyen type={typeCaisse(y)} /><span>{y.nom}</span><b>{nb(y.solde)}</b></button>)}</div></div>
    {choisie && Number(choisie.solde) < Number(x.montant) && <div className="alerte err">Le solde de cette caisse est inférieur au montant de la dépense.</div>}
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Enregistrement…' : 'Confirmer le paiement'}</button></form></Modale>;
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

const Taux = ({ v }: { v: number }) => { const t = Math.round(v); return <span className="taux-b"><u><i className={t >= 80 ? 'vert' : t >= 60 ? 'orange' : 'rouge'} style={{ width: `${Math.min(t, 100)}%` }} /></u><b>{t} %</b></span>; };

export function Rapports() {
  const { annee } = useApp(); const [o, setO] = useState('recettes'); const [mois, setM] = useState(''); const [txt, setT] = useState('');
  const q = useQ(async () => {
    const [p, s, c, dep] = await Promise.all([db.tout(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&statut=eq.valide&order=date_paiement,id`), db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&order=nom,prenom,inscription_id`), db.get(`v_stats_classes?annee_scolaire_id=eq.${annee.id}&order=ordre,nom`), db.tout(`depenses?annee_scolaire_id=eq.${annee.id}&statut=eq.payee&select=*,categories_depense(libelle)&order=date_depense,id`)]);
    return { p, s, c, dep };
  }, [annee.id]);
  const ONGLETS = [['recettes', 'Recettes'], ['eleves', 'Élèves'], ['classes', 'Classes'], ['depenses', 'Dépenses']];
  const nom = `scolaris-${o}-${annee.libelle}${mois ? '-' + mois : ''}`;
  return (
    <>
      <Titre t="Rapports" />
      <Etat q={q}>{(d) => {
        const dansMois = (x: string) => !mois || String(x).startsWith(mois);
        const p = d.p.filter((x: any) => dansMois(x.date_paiement)); const dep = d.dep.filter((x: any) => dansMois(x.date_depense));
        const groupe = (l: any[], cle: (x: any) => string) => Object.entries(l.reduce((a: any, x: any) => { const k = cle(x); a[k] = (a[k] || 0) + Number(x.montant); return a; }, {})).map(([label, valeur]: any) => ({ label, valeur }));
        const moyens = groupe(p, (x) => x.moyen); const cats = groupe(dep, (x) => x.categories_depense?.libelle || 'Autres');
        const base = o === 'classes' ? d.c : d.s; const cumul = (k: string) => base.reduce((t: number, x: any) => t + Number(x[k]), 0);
        const t = txt.trim().toLowerCase(); const eleves = t ? d.s.filter((x: any) => `${x.matricule} ${x.nom} ${x.prenom} ${x.classe}`.toLowerCase().includes(t)) : d.s;
        const excel = () => {
          if (o === 'recettes') telechargerExcel(nom, [['Date', 'Reçu', 'Élève', 'Classe', 'Moyen', 'Montant GNF'], ...p.map((x: any) => [x.date_paiement, x.numero_recu, `${x.nom} ${x.prenom}`, x.classe || '', x.moyen, x.montant])]);
          if (o === 'eleves') telechargerExcel(nom, [['Matricule', 'Élève', 'Classe', 'Frais', 'Payé', 'Reste', 'Impayé échu', 'Avance'], ...d.s.map((x: any) => [x.matricule || '', `${x.nom} ${x.prenom}`, x.classe, x.facture_net, x.regle, x.reste, x.impaye_echu, x.avance])]);
          if (o === 'classes') telechargerExcel(nom, [['Classe', 'Effectif', 'Frais', 'Payé', 'Reste', 'Impayé échu', 'Taux %'], ...d.c.map((x: any) => [x.nom, x.effectif, x.facture_net, x.regle, x.reste, x.impaye_echu, Number(x.taux_recouvrement)])]);
          if (o === 'depenses') telechargerExcel(nom, [['Date', 'Libellé', 'Catégorie', 'Bénéficiaire', 'Montant GNF'], ...dep.map((x: any) => [x.date_depense, x.libelle, x.categories_depense?.libelle || '', x.beneficiaire || '', x.montant])]);
        };
        return <>
          <div className="segment noprint" role="tablist">{ONGLETS.map(([k, l]) => <button key={k} role="tab" aria-selected={o === k} className={o === k ? 'on' : ''} onClick={() => setO(k)}>{l}</button>)}</div>
          <div className="barre-outils noprint">
            {(o === 'recettes' || o === 'depenses') && <select value={mois} onChange={(x) => setM(x.target.value)} aria-label="Mois"><option value="">Toute l'année</option>{moisAnnee(annee).map((m) => <option key={m.cle} value={m.cle}>{m.label} {m.cle.slice(0, 4)}</option>)}</select>}
            {o === 'eleves' && <div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={txt} onChange={(x) => setT(x.target.value)} placeholder="Rechercher un élève ou une classe" aria-label="Rechercher" /></div>}
            <div className="exports"><button className="btn contour mini" onClick={() => print()}><PiFilePdfDuotone />PDF</button><button className="btn contour mini" onClick={excel}><PiFileXlsDuotone />Excel</button></div>
          </div>
          <h2 className="seul-print">Rapport {ONGLETS.find(([k]) => k === o)?.[1]}, {annee.libelle}</h2>
          {o === 'recettes' && <>
            <div className="minis"><Mini i={PiCoinsDuotone} ton="vert" t="Total encaissé"><Gnf n={som(p)} /></Mini><Mini i={PiReceiptDuotone} ton="bleu" t="Paiements validés"><span className="gnf"><b>{nb(p.length)}</b></span></Mini></div>
            <div className="rang"><section className="carte c-large"><h2>Recettes par mois</h2><Barres data={parMois(annee, mois ? p : d.p, 'date_paiement')} /></section><section className="carte c-etat"><h2>Par moyen de paiement</h2>{moyens.length ? <Anneau data={moyens} /> : <Vide t="Aucune recette." />}</section></div>
          </>}
          {o === 'depenses' && <>
            <div className="minis"><Mini i={PiShoppingCartDuotone} ton="rouge" t="Total payé"><Gnf n={som(dep)} /></Mini><Mini i={PiReceiptDuotone} ton="bleu" t="Dépenses payées"><span className="gnf"><b>{nb(dep.length)}</b></span></Mini></div>
            <div className="rang"><section className="carte c-large"><h2>Dépenses par mois</h2><Barres data={parMois(annee, mois ? dep : d.dep, 'date_depense')} /></section><section className="carte c-etat"><h2>Par catégorie</h2>{cats.length ? <Anneau data={cats} /> : <Vide t="Aucune dépense." />}</section></div>
          </>}
          {(o === 'eleves' || o === 'classes') && <div className="minis"><Mini i={PiStudentDuotone} ton="bleu" t="Frais dus"><Gnf n={cumul('facture_net')} /></Mini><Mini i={PiCoinsDuotone} ton="vert" t="Payé"><Gnf n={cumul('regle')} /></Mini><Mini i={PiWarningDuotone} ton="orange" t="Reste à payer"><Gnf n={cumul('reste')} /></Mini></div>}
          {o === 'eleves' && <section className="carte c-table">{eleves.length === 0 ? <Vide t="Aucun élève trouvé." /> : <>
            <div className="table vue-bureau"><table><thead><tr><th>Élève</th><th>Classe</th><th className="dr">Frais</th><th className="dr">Payé</th><th className="dr">Reste</th><th className="dr">Avance</th></tr></thead><tbody>{eleves.slice(0, 100).map((x: any) => <tr key={x.inscription_id}><td><div className="nom-el"><Avatar nom={`${x.nom} ${x.prenom}`} /><span><b>{x.nom} {x.prenom}</b><small className="bloc">{x.matricule}</small></span></div></td><td><span className="puce">{x.classe}</span></td><td className="dr">{nb(x.facture_net)}</td><td className="dr vert">{nb(x.regle)}</td><td className={x.en_retard ? 'dr fort rouge' : 'dr fort'}>{nb(x.reste)}</td><td className="dr">{nb(x.avance)}</td></tr>)}</tbody></table></div>
            <ul className="vue-tel liste-p">{eleves.slice(0, 100).map((x: any) => <li key={x.inscription_id}><div className="lp-h"><Avatar nom={`${x.nom} ${x.prenom}`} /><div><b>{x.nom} {x.prenom}</b><small>{x.classe}, payé {nb(x.regle)}</small></div><div className="fin"><span className={x.en_retard ? 'gnf rouge' : 'gnf'}><b>{nb(x.reste)}</b></span><small>reste</small></div></div></li>)}</ul>
            {eleves.length > 100 && <p className="note ctr">100 premiers sur {nb(eleves.length)}. L'export Excel contient toute la liste.</p>}
          </>}</section>}
          {o === 'classes' && <section className="carte c-table">{d.c.length === 0 ? <Vide t="Aucune classe." /> : <>
            <div className="table vue-bureau"><table><thead><tr><th>Classe</th><th className="dr">Effectif</th><th className="dr">Frais</th><th className="dr">Payé</th><th className="dr">Reste</th><th>Recouvrement</th></tr></thead><tbody>{d.c.map((x: any) => <tr key={x.classe_id}><td className="fort">{x.nom}</td><td className="dr">{nb(x.effectif)}</td><td className="dr">{nb(x.facture_net)}</td><td className="dr vert">{nb(x.regle)}</td><td className="dr fort">{nb(x.reste)}</td><td><Taux v={x.taux_recouvrement} /></td></tr>)}</tbody></table></div>
            <ul className="vue-tel liste-p">{d.c.map((x: any) => <li key={x.classe_id}><div className="lp-h"><span className="puce">{x.nom}</span><div><b>Reste {nb(x.reste)}</b><small>{nb(x.effectif)} élèves</small></div><Taux v={x.taux_recouvrement} /></div></li>)}</ul>
          </>}</section>}
        </>;
      }}</Etat>
    </>
  );
}
