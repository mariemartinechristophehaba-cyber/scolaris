// Espaces par rôle : secrétaire, caissier, et blocs propres au fondateur et au comptable.
import { PiCalendarCheckDuotone, PiCaretRightBold, PiEyeSlashDuotone, PiMoneyWavyDuotone, PiStudentDuotone, PiUserPlusDuotone, PiWarningCircleFill } from 'react-icons/pi';
import { db, getSession } from './api';
import { auj, dateFr, gnf, grouperClasses, nb, dv } from './lib';
import { Avatar, Bandeau, Etat, Lien, SelAnnee, Tuile, Vague, useApp, useQ } from './ui';

export const prenomUtil = () => { const md = getSession()?.user?.user_metadata || {}; return String(md.prenom || md.nom || '').trim(); };
export const Bonjour = () => { const p = prenomUtil(); return <span className="hero-bj">Bonjour{p ? ` ${p}` : ''}</span>; };
const quand = (v: string) => { const j = String(v).slice(0, 10); if (j === auj()) return "aujourd'hui"; const h = new Date(Date.now() - 86400000).toISOString().slice(0, 10); return j === h ? 'hier' : dateFr(v); };
const LIB_MOYEN: any = { especes: 'Espèces', orange_money: 'Orange Money', mtn_money: 'MTN Mobile Money', virement: 'Virement', depot: 'Dépôt bancaire', autre: 'Autre' };
const jourLong = () => { const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); return s.charAt(0).toUpperCase() + s.slice(1); };

export function GrosBouton({ to, t, s, I = PiMoneyWavyDuotone }: any) {
  return <Lien to={to} className="gros-btn"><span className="gb-i"><I aria-hidden="true" /></span><span className="gb-t"><b>{t}</b>{s && <small>{s}</small>}</span><PiCaretRightBold className="gb-f" aria-hidden="true" /></Lien>;
}

const Ligne = ({ nom, s, droite, to, bouton }: any) => {
  const corps = <><Avatar nom={nom} /><div><b>{nom}</b><small>{s}</small></div>{droite}{bouton && <span className="btn-doux">{bouton}</span>}</>;
  return <li>{to ? <Lien to={to} className="ligne-e">{corps}</Lien> : <div className="ligne-e">{corps}</div>}</li>;
};

/* ---------- Secrétaire : élèves et inscriptions, sans l'argent de l'école ---------- */
export function TableauSecretaire() {
  const { annee } = useApp();
  const q = useQ(async () => {
    const l = await db.tout(`inscriptions?annee_scolaire_id=eq.${annee.id}&statut=eq.inscrit&select=id,cree_le,date_inscription,eleve_id,classes(nom),eleves(id,prenom,nom,date_naissance,statut,eleve_responsables(responsables(telephone)))&order=cree_le.desc,id`);
    return l.filter((x: any) => x.eleves && x.eleves.statut !== 'archive');
  }, [annee.id]);
  const mois = auj().slice(0, 7);
  return <Etat q={q}>{(l: any[]) => {
    const ceMois = l.filter((x) => String(x.date_inscription || x.cree_le).startsWith(mois)).length;
    const manque = (x: any) => { const tel = (x.eleves.eleve_responsables || []).some((r: any) => r.responsables?.telephone); return !tel ? 'Pas de téléphone du parent' : !x.eleves.date_naissance ? 'Date de naissance manquante' : ''; };
    const dossiers = l.map((x) => ({ x, m: manque(x) })).filter((y) => y.m);
    const nomE = (x: any) => `${x.eleves.nom} ${x.eleves.prenom}`;
    return <>
      <Bandeau><section className="hero hero-simple">
        <div className="hero-haut"><div className="hero-g">
          <Bonjour />
          <div className="hero-titre"><h1>Accueil</h1><SelAnnee className="tel" /></div>
          <span className="hero-sur">{jourLong()} · Année {annee.libelle}</span>
        </div></div>
        <Vague />
      </section></Bandeau>
      <div className="esp-actions">
        <Lien to="/eleves?ajout=1" className="ea plein"><span className="gb-i"><PiUserPlusDuotone aria-hidden="true" /></span><b>Inscrire un élève</b></Lien>
        <Lien to="/paiements/nouveau" className="ea"><span className="gb-i"><PiMoneyWavyDuotone aria-hidden="true" /></span><b>Enregistrer un paiement</b></Lien>
      </div>
      <div className="kpis k2">
        <div className="kpi"><div><Tuile i={PiStudentDuotone} ton="bleu" t={34} /><span>Élèves inscrits</span></div><span className="gnf"><b>{nb(l.length)}</b></span></div>
        <div className="kpi"><div><Tuile i={PiCalendarCheckDuotone} ton="vert" t={34} /><span>Inscrits ce mois</span></div><span className="gnf"><b>{nb(ceMois)}</b></span></div>
      </div>
      <div className="rang r-ordre">
        <section className="carte c-large"><div className="tete-carte"><h2>Dossiers à compléter{dossiers.length ? ` (${nb(dossiers.length)})` : ''}</h2><Lien to="/eleves" className="voir">Tout voir</Lien></div>
          {dossiers.length === 0 ? <p className="note">Tous les dossiers sont complets.</p> : <ul className="lignes-e">{dossiers.slice(0, 4).map(({ x, m }) => <Ligne key={x.id} nom={`${nomE(x)} · ${x.classes?.nom || ''}`} s={m} to={`/eleves/${x.eleves.id}`} bouton="Compléter" />)}</ul>}</section>
        <section className="carte c-etat"><h2>Dernières inscriptions</h2>
          {l.length === 0 ? <p className="note">Aucune inscription pour le moment.</p> : <ul className="lignes-e">{l.slice(0, 4).map((x) => <Ligne key={x.id} nom={nomE(x)} s={`${x.classes?.nom || ''} · ${quand(x.cree_le)}`} to={`/eleves/${x.eleves.id}`} />)}</ul>}</section>
      </div>
    </>;
  }}</Etat>;
}

/* ---------- Caissier : ses encaissements du jour ---------- */
export function TableauCaissier() {
  const { annee } = useApp();
  const uid = getSession()?.user?.id;
  const q = useQ(async () => {
    const [mes, det] = await Promise.all([
      db.get(`paiements?annee_scolaire_id=eq.${annee.id}&saisi_par=eq.${uid}&date_paiement=eq.${auj()}&select=id&order=cree_le.desc`),
      db.get(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&date_paiement=eq.${auj()}&order=id.desc`),
    ]);
    const ids = new Set(mes.map((x: any) => x.id));
    return det.filter((x: any) => ids.has(x.id) && x.statut !== 'annule');
  }, [annee.id, uid]);
  return <Etat q={q}>{(l: any[]) => {
    const ok = l.filter((x) => x.statut !== 'rejete');
    const total = ok.reduce((a, x) => a + Number(x.montant), 0);
    const att = ok.filter((x) => x.statut === 'en_attente').length;
    const esp = ok.filter((x) => x.type_moyen === 'especes').reduce((a, x) => a + Number(x.montant), 0);
    const etat = (x: any) => x.statut === 'valide' ? `Validé · reçu n° ${x.numero_recu}` : x.statut === 'rejete' ? 'Refusé par le comptable' : 'En attente du comptable';
    return <>
      <Bandeau><section className="hero hero-simple">
        <div className="hero-haut"><div className="hero-g">
          <Bonjour />
          <div className="hero-titre"><span className="hero-lab">Encaissé aujourd'hui</span><SelAnnee className="tel" /></div>
          <div className="hero-val"><b>{nb(total)}</b><small>{dv()}</small></div>
          <span className="hero-sur">{nb(ok.length)} paiement{ok.length > 1 ? 's' : ''}{att ? ` · dont ${nb(att)} en attente de validation` : ''}</span>
        </div></div>
        <Vague />
      </section></Bandeau>
      <GrosBouton to="/paiements/nouveau" t="Enregistrer un paiement" s="Chercher l'élève, taper le montant" />
      <section className="carte"><div className="tete-carte"><h2>Mes paiements d'aujourd'hui</h2><Lien to="/paiements" className="voir">Tout voir</Lien></div>
        {l.length === 0 ? <p className="note">Aucun paiement enregistré aujourd'hui.</p> : <ul className="lignes-e">{l.map((x) => <Ligne key={x.id} nom={`${x.nom} ${x.prenom}`} s={`${x.classe || ''} · ${etat(x)}`} droite={<b className={`le-m${x.statut === 'rejete' ? ' barre' : ''}`}>{nb(x.montant)}</b>} />)}</ul>}
      </section>
      {esp > 0 && <div className="rappel"><PiWarningCircleFill aria-hidden="true" /><div><b>Fin de journée</b><span>Remettez {gnf(esp)} en espèces au comptable.</span></div></div>}
      <p className="note centre"><PiEyeSlashDuotone aria-hidden="true" /> Trésorerie, dépenses et rapports non visibles</p>
    </>;
  }}</Etat>;
}

/* ---------- Comptable et directeur : à vérifier, à payer ---------- */
export function BlocCompta() {
  const { annee, can } = useApp();
  const dir = can('directeur');
  const q = useQ(async () => {
    const [p, dep] = await Promise.all([
      db.get(`v_paiements_detail?annee_scolaire_id=eq.${annee.id}&statut=eq.en_attente&order=date_paiement.desc,id&limit=50`),
      db.get(`depenses?annee_scolaire_id=eq.${annee.id}&statut=in.(${dir ? 'soumise,autorisee' : 'autorisee'})&select=id,libelle,beneficiaire,montant,statut&order=cree_le.desc&limit=20`),
    ]);
    return { p, dep };
  }, [annee.id]);
  return <>
    <GrosBouton to="/paiements/nouveau" t="Enregistrer un paiement" s="Espèces, Orange Money, MTN" />
    <Etat q={q}>{(d: any) => <div className="rang r-ordre">
      <section className="carte c-large"><div className="tete-carte"><h2>Paiements à vérifier{d.p.length ? ` (${nb(d.p.length)})` : ''}</h2><Lien to="/paiements" className="voir">Tout voir</Lien></div>
        {d.p.length === 0 ? <p className="note">Rien à vérifier. Tout est à jour.</p> : <ul className="lignes-e">{d.p.slice(0, 3).map((x: any) => <Ligne key={x.id} nom={`${x.nom} ${x.prenom}`} s={`${x.classe || ''} · ${LIB_MOYEN[x.type_moyen] || x.moyen || ''} · ${dateFr(x.date_paiement).slice(0, 5)}`} droite={<b className="le-m">{nb(x.montant)}</b>} to="/paiements" />)}</ul>}</section>
      <section className="carte c-etat"><div className="tete-carte"><h2>Dépenses {dir ? 'à traiter' : 'à payer'}</h2><Lien to="/depenses" className="voir">{d.dep.length ? 'Tout voir' : 'Ajouter'}</Lien></div>
        {d.dep.length === 0 ? <p className="note">Aucune dépense en attente.</p> : <ul className="lignes-e">{d.dep.slice(0, 3).map((x: any) => <Ligne key={x.id} nom={x.libelle} s={x.statut === 'soumise' ? 'À autoriser' : `Autorisée, à payer${x.beneficiaire ? ' · ' + x.beneficiaire : ''}`} droite={<b className="le-m">{nb(x.montant)}</b>} to="/depenses" />)}</ul>}</section>
    </div>}</Etat>
  </>;
}

/* ---------- Fondateur : ce qu'il doit décider ---------- */
export function ADecider({ retard, echu, sit, cls }: any) {
  const { annee } = useApp();
  const q = useQ(async () => {
    const [p, dep] = await Promise.all([
      db.get(`paiements?annee_scolaire_id=eq.${annee.id}&statut=eq.en_attente&select=montant`),
      db.get(`depenses?annee_scolaire_id=eq.${annee.id}&statut=eq.soumise&select=montant`),
    ]);
    return { p, dep };
  }, [annee.id]);
  const som = (l: any[]) => l.reduce((a, x) => a + Number(x.montant || 0), 0);
  const nivDe: any = {}; for (const [lib, l] of grouperClasses(cls)) for (const c of l as any[]) nivDe[c.id] = lib;
  const parNiv: [string, number, number][] = [];
  for (const x of sit) { const n = nivDe[x.classe_id]; if (!n) continue; let g = parNiv.find((y) => y[0] === n); if (!g) { g = [n, 0, 0]; parNiv.push(g); } g[1] += Number(x.facture_net || 0); g[2] += Number(x.facture_net || 0) - Number(x.reste || 0); }
  const ordre = grouperClasses(cls).map((g) => g[0]);
  parNiv.sort((a, b) => ordre.indexOf(a[0]) - ordre.indexOf(b[0]));
  const COUL = ['#0FA968', '#1D5BFF', '#F79009', '#8B5CF6'];
  return <div className="rang r-ordre">
    <section className="carte c-large"><div className="tete-carte"><h2>À décider</h2></div>
      <Etat q={q}>{(d: any) => {
        const l = [
          d.p.length > 0 && { n: d.p.length, ton: 'orange', t: `${nb(d.p.length)} paiement${d.p.length > 1 ? 's' : ''} à valider`, s: `${gnf(som(d.p))} en attente`, to: '/paiements', b: 'Valider', plein: true },
          d.dep.length > 0 && { n: d.dep.length, ton: 'violet', t: `${nb(d.dep.length)} dépense${d.dep.length > 1 ? 's' : ''} à autoriser`, s: gnf(som(d.dep)), to: '/depenses', b: 'Voir' },
          retard > 0 && { n: retard, ton: 'rouge', t: `${nb(retard)} élève${retard > 1 ? 's' : ''} en retard`, s: `${gnf(echu)} d'impayés`, to: '/relances', b: 'Relancer' },
        ].filter(Boolean) as any[];
        return l.length === 0 ? <p className="note">Rien à décider pour le moment. Tout est à jour.</p> : <ul className="lignes-e decide">{l.map((x) => <li key={x.to}><Lien to={x.to} className="ligne-e"><span className={`rond ${x.ton}`}>{x.n > 99 ? '99+' : x.n}</span><div><b>{x.t}</b><small>{x.s}</small></div><span className={x.plein ? 'btn plein mini' : 'btn-doux'}>{x.b}</span></Lien></li>)}</ul>;
      }}</Etat>
    </section>
    <section className="carte c-etat"><div className="tete-carte"><h2>Encaissé par niveau</h2><Lien to="/rapports" className="voir">Rapports</Lien></div>
      {parNiv.filter((g) => g[1] > 0).length === 0 ? <p className="note">Définissez les frais de vos classes pour voir ce suivi.</p> : <ul className="niv-taux">{parNiv.filter((g) => g[1] > 0).map((g, i) => { const t = Math.round((g[2] / g[1]) * 100); return <li key={g[0]}><div><i style={{ background: COUL[i % 4] }} />{g[0]}<b>{t} %</b></div><div className="barre-p"><i style={{ width: `${Math.min(t, 100)}%`, background: COUL[i % 4] }} /></div></li>; })}</ul>}
    </section>
  </div>;
}
