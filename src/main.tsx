import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PiCrownSimpleDuotone, PiClockCounterClockwiseDuotone, PiUsersFourDuotone, PiBellSimpleDuotone, PiBuildingsDuotone, PiChartBarDuotone, PiDotsThreeCircleDuotone, PiFileArrowUpDuotone, PiGearSixDuotone, PiHouseSimpleDuotone, PiInvoiceDuotone, PiMegaphoneDuotone, PiMoneyWavyDuotone, PiPlusBold, PiReceiptDuotone, PiSignOutDuotone, PiStudentDuotone, PiUsersThreeDuotone, PiWalletDuotone } from 'react-icons/pi';
import { auth, db, getSession, poserLectureSeule, surSession } from './api';
import { Chargement, Ctx, Erreur, Lien, Logo, Mot, SelAnnee, naviguer, useQ } from './ui';
import { Accueil, Connexion, ConnexionAdmin, Finalisation, Inscription, prendreLogo, NouveauMdp, Oublie, PremierEtablissement } from './acces';
import { Conditions, FamillePublic, RecuPublic } from './public';
import { DetailEleve, Classes, Eleves, Frais } from './gestion';
import { Depenses, NouveauPaiement, Paiements, Rapports, Tableau } from './finance';
import { Importation, Parametres, Relances } from './outils';
import { Activite, Equipe } from './equipe';
import { Abonnement, BandeauAbonnement } from './abonnement';
import { PiGearSixFill, PiHouseSimpleFill, PiReceiptFill, PiStudentFill, PiUsersThreeFill } from 'react-icons/pi';
import { EspaceAdmin } from './admin';

const STAFF = ['directeur', 'comptable', 'caissier', 'secretaire'];
const MENU: [string, string, any, string[]?, string?][] = [
  ['/tableau', 'Tableau de bord', PiHouseSimpleDuotone],
  ['/eleves', 'Élèves', PiStudentDuotone],
  ['/classes', 'Classes', PiUsersThreeDuotone],
  ['/frais', 'Frais scolaires', PiInvoiceDuotone, STAFF],
  ['/paiements', 'Paiements', PiMoneyWavyDuotone, STAFF, 'attente'],
  ['/depenses', 'Dépenses', PiWalletDuotone, ['directeur', 'comptable', 'caissier']],
  ['/rapports', 'Rapports', PiChartBarDuotone, ['directeur', 'comptable']],
  ['/relances', 'Relances', PiMegaphoneDuotone, STAFF, 'retard'],
  ['/importation', 'Importation', PiFileArrowUpDuotone, ['directeur', 'secretaire']],
  ['/equipe', 'Équipe', PiUsersFourDuotone, ['fondateur']],
  ['/activite', 'Qui a fait quoi', PiClockCounterClockwiseDuotone, ['fondateur']],
  ['/abonnement', 'Abonnement', PiCrownSimpleDuotone, ['fondateur']],
  ['/parametres', 'Paramètres', PiGearSixDuotone],
];
const ROLES: any = { fondateur: 'Fondateur', directeur: 'Directeur', comptable: 'Comptable', caissier: 'Caissier', secretaire: 'Secrétaire', enseignant: 'Enseignant' };

function BarreBas({ chemin, can, ouvrir }: any) {
  const fin = can(...STAFF);
  const it = (to: string, t: string, I: any, F: any) => { const on = chemin.startsWith(to); const X = on ? F : I; return <Lien to={to} className={on ? 'on' : ''}><X aria-hidden="true" /><span>{t}</span></Lien>; };
  const fab = <Lien to="/paiements/nouveau" className="fab" aria-label="Enregistrer un paiement"><PiPlusBold aria-hidden="true" /></Lien>;
  return (
    <nav className="barre-bas" aria-label="Navigation principale">
      {it('/tableau', 'Accueil', PiHouseSimpleDuotone, PiHouseSimpleFill)}
      {it('/eleves', 'Élèves', PiStudentDuotone, PiStudentFill)}
      {fin ? fab : it('/classes', 'Classes', PiUsersThreeDuotone, PiUsersThreeFill)}
      {fin ? it('/paiements', 'Paiements', PiReceiptDuotone, PiReceiptFill) : it('/parametres', 'Paramètres', PiGearSixDuotone, PiGearSixFill)}
      <button type="button" onClick={ouvrir}><PiDotsThreeCircleDuotone aria-hidden="true" /><span>Plus</span></button>
    </nav>
  );
}

function Coque({ m, annees, recharger, abo }: any) {
  const [ouvert, setO] = useState(false);
  const [chemin, setC] = useState(location.pathname);
  const [anneeId, setA] = useState<string>(() => { try { return localStorage.getItem('scolaris_annee') || ''; } catch { return ''; } });
  const [zoneBandeau, setZB] = useState<HTMLDivElement | null>(null);
  const [zoneFiltres, setZF] = useState<HTMLDivElement | null>(null);
  useEffect(() => { const f = () => { setC(location.pathname); setO(false); }; addEventListener('popstate', f); return () => removeEventListener('popstate', f); }, []);
  const annee = annees.find((a: any) => a.id === anneeId) || annees.find((a: any) => a.statut === 'active') || annees[0];
  const role = m.role;
  const can = (...r: string[]) => role === 'fondateur' || r.includes(role);
  const etab = m.etablissements; const eid = m.etablissement_id;
  const s = getSession();
  const notif = useQ(async () => {
    if (!can(...STAFF) || !annee) return { attente: 0, retard: 0 };
    const [p, v] = await Promise.all([db.tout(`paiements?etablissement_id=eq.${eid}&statut=eq.en_attente&select=id&order=id`), db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&en_retard=is.true&select=inscription_id&order=inscription_id`)]);
    return { attente: p.length, retard: v.length };
  }, [annee?.id, chemin]);
  const attente = abo?.situation === 'attente';
  poserLectureSeule(!!abo?.lecture_seule, attente);
  // École pas encore payée : elle visite tout, mais chaque action d'ajout mène à l'abonnement.
  useEffect(() => {
    if (!attente || role !== 'fondateur') return;
    const f = (e: MouseEvent) => {
      const b = (e.target as Element)?.closest?.('a,button') as HTMLElement | null;
      if (!b || !b.closest('.app') || b.closest('.band-abo') || /^\/(abonnement|parametres\/compte)/.test(location.pathname)) return;
      const t = (b.getAttribute('aria-label') || b.textContent || '').trim();
      if (!/^(ajouter|nouveau|nouvelle|créer|importer|inscrire|enregistrer|activer|valider|saisir)/i.test(t)) return;
      e.preventDefault(); e.stopPropagation(); naviguer('/abonnement');
    };
    document.addEventListener('click', f, true);
    return () => document.removeEventListener('click', f, true);
  }, [attente, role]);
  const ctx = { abo, eid, etab, role, can, annee, annees, zoneBandeau, zoneFiltres, setAnnee: (id: string) => { setA(id); try { localStorage.setItem('scolaris_annee', id); } catch { /* ignoré */ } }, recharger, majNotif: notif.reload };
  const seg = chemin.split('/').filter(Boolean);
  let page: any = <Tableau />;
  if (!annee) page = <Parametres vue={seg[0] === 'parametres' ? seg[1] : 'annee'} />;
  else if (seg[0] === 'eleves' && seg[1]) page = <DetailEleve id={seg[1]} key={seg[1]} />;
  else if (seg[0] === 'eleves') page = <Eleves />;
  else if (seg[0] === 'classes') page = <Classes />;
  else if (seg[0] === 'frais') page = <Frais />;
  else if (seg[0] === 'paiements' && seg[1] === 'nouveau') page = <NouveauPaiement />;
  else if (seg[0] === 'paiements') page = <Paiements />;
  else if (seg[0] === 'depenses') page = <Depenses />;
  else if (seg[0] === 'rapports') page = <Rapports />;
  else if (seg[0] === 'relances') page = <Relances />;
  else if (seg[0] === 'importation') page = <Importation />;
  else if (seg[0] === 'equipe' && role === 'fondateur') page = <Equipe />;
  else if (seg[0] === 'activite' && role === 'fondateur') page = <Activite />;
  else if (seg[0] === 'abonnement' && role === 'fondateur') page = <Abonnement />;
  else if (seg[0] === 'parametres') page = <Parametres key={seg[1] || 'liste'} vue={seg[1]} />;
  const md = s?.user?.user_metadata || {};
  const nom = `${md.prenom || ''} ${md.nom || ''}`.trim() || s?.user?.email || etab.nom;
  const init = nom.split(/\s+/).slice(0, 2).map((x: string) => x[0]).join('').toUpperCase();
  const nd: any = notif.data || {};
  return (
    <Ctx.Provider value={ctx}>
      <div className={`app${chemin.startsWith('/abonnement') || (seg[0] === 'parametres' && seg[1]) ? ' plein' : ''}${chemin === '/' || seg[0] === 'tableau' ? ' ondule' : ''}`}>
        {ouvert && <div className="voile" onClick={() => setO(false)} />}
        <aside className={ouvert ? 'menu ouvert' : 'menu'}>
          <Lien to="/tableau" className="marque"><img src="/img/icone.png" alt="" /><Mot taille={26} /></Lien>
          <nav aria-label="Menu">{MENU.filter((x) => !x[3] || can(...x[3])).map(([to, t, I, , cle]) => <Lien key={to} to={to} className={chemin.startsWith(to) ? 'actif' : ''}><I aria-hidden="true" /><span>{t}</span>{cle && nd[cle] > 0 && <em>{nd[cle] > 999 ? '999+' : nd[cle]}</em>}</Lien>)}</nav>
          <div className="profil"><span className="av">{init}</span><div><b>{nom}</b><small>{ROLES[role]}</small></div><button onClick={auth.deconnexion} aria-label="Se déconnecter" title="Se déconnecter"><PiSignOutDuotone aria-hidden="true" /></button></div>
        </aside>
        <div className="corps">
          <div className="lignes" aria-hidden="true" />
          <header className="haut">
            <img className="logo-tel" src="/img/icone.png" alt="" />
            <div className="ecole"><PiBuildingsDuotone aria-hidden="true" /><span className="ecole-mq">Scolaris</span><b>{etab.nom}</b></div>
            <div className="esp" />
            <SelAnnee className="bureau" />
            <div className="zone-filtres" ref={setZF} />
            <Lien to="/relances" className="cloche" aria-label="Notifications"><PiBellSimpleDuotone aria-hidden="true" />{nd.attente > 0 && <i>{nd.attente > 99 ? '99+' : nd.attente}</i>}</Lien>
          </header>
          <div className="zone-bandeau" ref={setZB} />
          <main className="feuille"><BandeauAbonnement cache={chemin.startsWith('/abonnement')} accueil={chemin.startsWith('/tableau')} />{page}</main>
        </div>
        <BarreBas chemin={chemin} can={can} ouvrir={() => setO(true)} />
      </div>
    </Ctx.Provider>
  );
}

function Espace() {
  const [nouvelle, setNouvelle] = useState(() => { try { return !!sessionStorage.getItem('scolaris_nouvelle'); } catch { return false; } });
  const uid = getSession()?.user?.id;
  const q = useQ(async () => {
    let l = await db.get(`membres?profil_id=eq.${uid}&actif=is.true&select=role,etablissement_id,etablissements(*)&order=cree_le`);
    if (!l.length) {
      const md = getSession()?.user?.user_metadata || {}; const nom = md.etablissement;
      if (nom) { const idE = await db.rpc('creer_etablissement', { p_nom: nom, p_ville: md.ville || null, p_telephone: md.tel_ecole || null, p_email: getSession()?.user?.email || null, p_details: md.eleves ? { quartier: md.quartier, eleves: md.eleves, classes: md.classes, niveaux: md.niveaux } : null }); const lg = prendreLogo(); if (lg) await db.poserLogo(idE, lg).catch(() => null); l = await db.get(`membres?profil_id=eq.${uid}&actif=is.true&select=role,etablissement_id,etablissements(*)`); }
    }
    if (!l.length) return { m: null, annees: [] };
    const annees = await db.get(`annees_scolaires?etablissement_id=eq.${l[0].etablissement_id}&order=date_debut.desc`);
    const abo = await db.rpc('abonnement_etat', { p_etab: l[0].etablissement_id }).catch(() => null);
    return { m: l[0], annees, abo };
  }, [uid]);
  if (nouvelle) return <Finalisation pret={!!q.data} erreur={q.erreur} abo={(q.data as any)?.abo} ecole={(q.data as any)?.m?.etablissements} fini={(to: string) => { try { sessionStorage.removeItem('scolaris_nouvelle'); } catch { /* ignoré */ } history.replaceState(null, '', to); setNouvelle(false); }} />;
  if (q.erreur && !q.data) return <main className="pub"><section className="carte-pub"><Logo /><Erreur t={q.erreur} /><button className="btn plein" onClick={q.reload}>Réessayer</button><button className="btn lien" onClick={auth.deconnexion}>Se déconnecter</button></section></main>;
  if (!q.data) return <main className="pub"><Chargement /></main>;
  const d: any = q.data;
  if (!d.m) return <PremierEtablissement fini={q.reload} />;
  return <Coque m={d.m} annees={d.annees} recharger={q.reload} abo={d.abo} />;
}

const PUB = ['/', '/connexion', '/inscription', '/mot-de-passe-oublie'];
function Racine() {
  const [, maj] = useState(0);
  const [recup, setR] = useState(false);
  const [pret, setP] = useState(false);
  useEffect(() => {
    const f = () => maj((n) => n + 1);
    const a = surSession(f); addEventListener('popstate', f);
    auth.retour().then((t) => { if (t === 'recovery') setR(true); }).catch(() => {}).finally(() => setP(true));
    return () => { a(); removeEventListener('popstate', f); };
  }, []);
  if (!pret) return <main className="pub"><Chargement /></main>;
  const c = location.pathname; const seg = c.split('/').filter(Boolean);
  if (seg[0] === 'r' && seg[1]) return <RecuPublic jeton={seg[1]} />;
  if (seg[0] === 'f' && seg[1]) return <FamillePublic jeton={seg[1]} />;
  if (c === '/conditions') return <Conditions />;
  const connecte = !!getSession()?.access_token;
  if (recup && connecte) return <NouveauMdp fini={() => { setR(false); naviguer('/tableau'); }} />;
  if (connecte && getSession()?.user?.user_metadata?.mdp_temporaire) return <NouveauMdp fini={() => naviguer(seg[0] === 'admin' ? '/admin' : '/tableau')} />;
  // Espace réservé à Scolaris : adresse et connexion séparées, aucun lien depuis l'application des écoles.
  if (seg[0] === 'admin') return connecte ? <EspaceAdmin /> : <ConnexionAdmin />;
  if (connecte) { if (PUB.includes(c)) { history.replaceState(null, '', '/tableau'); } return <Espace />; }
  if (c === '/connexion') return <Connexion />;
  if (c === '/inscription') return <Inscription />;
  if (c === '/mot-de-passe-oublie') return <Oublie />;
  if (c !== '/') history.replaceState(null, '', '/');
  return <Accueil />;
}

createRoot(document.getElementById('root')!).render(<Racine />);
