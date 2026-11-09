import { useEffect, useState } from 'react';
import { PiArrowDownBold, PiBuildingsDuotone, PiCalendarCheckDuotone, PiCheckBold, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiCoinsDuotone, PiGaugeDuotone, PiGearSixDuotone, PiHourglassMediumDuotone, PiMagnifyingGlassBold, PiProhibitFill, PiReceiptDuotone, PiShieldStarDuotone, PiSignOutDuotone, PiSparkleDuotone, PiStudentDuotone, PiTrendUpBold, PiUsersThreeDuotone, PiWarningCircleFill, PiWarningDuotone, PiWhatsappLogoFill, PiXCircleFill } from 'react-icons/pi';
import { auth, db, getSession } from './api';
import { Barres, Jauge, Segments } from './charts';
import { auj, dateFr, gnf, nb, telAff } from './lib';
import { Bandeau, Chargement, Champ, Ctx, Erreur, Etat, Gnf, Lien, Logo, Modale, Montant, Mot, Pastille, Titre, Tuile, Vide, useApp, useEnvoi, useQ } from './ui';
import { LIB_M, LIB_P, LIB_T, SIT, ST_P, waUrl } from './abonnement';

const ITEMS: [string, string, any, string][] = [['/admin', "Vue d'ensemble", PiGaugeDuotone, 'Accueil'], ['/admin/ecoles', 'Écoles', PiBuildingsDuotone, 'Écoles'], ['/admin/paiements', 'Paiements', PiReceiptDuotone, 'Paiements'], ['/admin/reglages', 'Réglages', PiGearSixDuotone, 'Réglages']];
const MOIS_C = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const NOM_ROLE: any = { fondateur: 'Fondateur', directeur: 'Directeur', comptable: 'Comptable', caissier: 'Caissier', secretaire: 'Secrétaire', enseignant: 'Enseignant' };
const taille = (o: number) => (o < 1048576 ? `${Math.round(o / 1024)} Ko` : o < 1073741824 ? `${(o / 1048576).toFixed(0)} Mo` : `${(o / 1073741824).toFixed(1).replace('.', ',')} Go`);
const hier = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const quand = (d: any) => { if (!d) return 'Jamais'; const j = String(d).slice(0, 10); return j === auj() ? "Aujourd'hui" : j === hier() ? 'Hier' : dateFr(d); };
const relancer = (x: any) => waUrl(x.tel || x.fondateur_tel, `Bonjour ${x.fondateur || ''}, ${['grace', 'expire'].includes(x.situation) ? `l'abonnement Scolaris de ${x.nom} est terminé depuis le ${dateFr(x.fin)}` : `l'abonnement Scolaris de ${x.nom} se termine le ${dateFr(x.fin)}`}. Vous pouvez le renouveler depuis votre espace, page Abonnement. Merci.`);
const Sit = ({ x }: any) => <Pastille k={SIT[x.situation][0]} t={SIT[x.situation][1]} />;
const Mini = ({ i, ton, t, children }: any) => <div className="carte mini-c"><Tuile i={i} ton={ton} t={44} /><div><span>{t}</span>{children}</div></div>;
const Nb = ({ n }: { n: any }) => <span className="gnf"><b>{nb(n)}</b></span>;
const Barre = ({ p, ton = 'bleu' }: any) => <span className="adm-b"><i className={ton} style={{ width: `${Math.min(Math.max(p, p > 0 ? 2 : 0), 100)}%` }} /></span>;

function Vue() {
  const { tableau: q } = useApp();
  return <Etat q={q}>{(d: any) => {
    const e = d.ecoles; const reglees = Number(e.essai) + Number(e.actif); const pct = e.total ? Math.round((reglees / e.total) * 100) : 0; const pc = (n: number) => (e.total ? Math.round((n / e.total) * 100) : 0);
    const prec = Number(d.encaisse_mois_prec); const mois = Number(d.encaisse_mois); const evo = prec > 0 ? Math.round(((mois - prec) / prec) * 100) : null;
    const data = d.series.map((s: any) => ({ label: MOIS_C[Number(s.mois.slice(5, 7)) - 1], valeur: Number(s.montant) }));
    const vide = data.every((x: any) => x.valeur === 0); const maxT = Math.max(...d.tranches.map((t: any) => Number(t.ecoles)), 1);
    const apres = mois - Number(d.cout_mensuel); const mB = d.usage.base_octets / 1048576; const mF = d.usage.fichiers_octets / 1048576;
    const pB = (mB / d.limite_base_mo) * 100; const pF = (mF / d.limite_fichiers_mo) * 100;
    const ETATS: [string, number, any, string][] = [['Actives', e.actif, PiCheckCircleFill, 'c-vert'], ['En attente de paiement', e.attente || 0, PiCircleHalfFill, 'c-gris'], ['En essai', e.essai, PiCircleHalfFill, 'c-bleu'], ['Terminées', e.grace, PiClockCountdownFill, 'c-orange'], ['Expirées', e.expire, PiXCircleFill, 'c-rouge'], ['Suspendues', e.suspendu, PiProhibitFill, 'c-gris']];
    return <>
      <Bandeau><section className="hero">
        <div className="hero-haut">
          <div className="hero-g">
            <div className="hero-titre"><h1>Vue d'ensemble</h1></div>
            <span className="hero-lab">Encaissé ce mois</span>
            <div className="hero-val"><b>{nb(mois)}</b><small>GNF</small></div>
            {evo !== null && <div className="hero-etat"><span className={evo >= 0 ? 'chip-v' : 'chip-a'}>{evo >= 0 ? <PiTrendUpBold aria-hidden="true" /> : <PiArrowDownBold aria-hidden="true" />}{evo >= 0 ? '+' : ''}{evo} %</span><span className="hero-note">par rapport au mois dernier</span></div>}
          </div>
          <Jauge p={pct}><b>{pct} %</b><small>écoles en règle</small></Jauge>
        </div>
        <div className="hero-bas">
          <div><span>Revenu mensuel récurrent</span><Gnf n={d.mrr} /></div>
          <div><span>Encaissé cette année</span><Gnf n={d.encaisse_annee} /></div>
          <div><span>Écoles</span><span className="gnf"><b>{nb(e.total)}</b></span></div>
          <div><span>Élèves gérés</span><span className="gnf"><b>{nb(d.eleves_total)}</b></span></div>
        </div>
      </section></Bandeau>
      <div className="kpis">
        <div className="kpi"><div><Tuile i={PiTrendUpBold} ton="vert" t={34} /><span>Revenu mensuel</span></div><Gnf n={d.mrr} /></div>
        <div className="kpi"><div><Tuile i={PiCoinsDuotone} ton="bleu" t={34} /><span>Cette année</span></div><Gnf n={d.encaisse_annee} /></div>
        <div className="kpi"><div><Tuile i={PiBuildingsDuotone} ton="violet" t={34} /><span>Écoles</span></div><Nb n={e.total} /></div>
        <div className="kpi"><div><Tuile i={PiStudentDuotone} ton="bleu" t={34} /><span>Élèves gérés</span></div><Nb n={d.eleves_total} /></div>
      </div>
      <div className="rang">
        <section className="carte c-large"><div className="tete-carte"><h2>Encaissements des 12 derniers mois</h2></div>{vide ? <Vide t="Aucun abonnement encaissé pour le moment." /> : <Barres data={data} />}</section>
        <section className="carte c-etat"><h2>État des écoles</h2>
          <Segments parts={[[Number(e.actif), '#0FA968'], [Number(e.essai), '#1557F0'], [Number(e.grace), '#F79009'], [Number(e.expire), '#E5484D'], [Number(e.suspendu), '#94A0B8']]} />
          <ul className="etats">{ETATS.map(([t, n, I, c]) => <li key={t}><I className={c} aria-hidden="true" />{t}<b>{nb(n)}</b><small>{pc(Number(n))} %</small></li>)}</ul>
          {d.a_verifier.nombre > 0 ? <div className="action"><PiHourglassMediumDuotone aria-hidden="true" /><div><b>{nb(d.a_verifier.nombre)} paiement{d.a_verifier.nombre > 1 ? 's' : ''} à vérifier</b><small>{gnf(d.a_verifier.somme)}</small></div><Lien to="/admin/paiements" className="btn plein mini">Vérifier</Lien></div> : <div className="action vert"><PiCheckCircleFill aria-hidden="true" /><div><b>Rien à vérifier</b><small>Tous les paiements sont traités.</small></div></div>}
        </section>
      </div>
      <div className="minis">
        <Mini i={PiHourglassMediumDuotone} ton="orange" t="À vérifier"><Gnf n={d.a_verifier.somme} /></Mini>
        <Mini i={PiWarningDuotone} ton="rouge" t="À renouveler"><Nb n={d.a_renouveler.length} /></Mini>
        <Mini i={PiSparkleDuotone} ton="violet" t="Nouvelles écoles, 30 jours"><Nb n={e.nouvelles_30j} /></Mini>
        <Mini i={PiUsersThreeDuotone} ton="vert" t="Écoles actives, 7 jours"><Nb n={e.actives_7j} /></Mini>
      </div>
      <div className="rang">
        <section className="carte c-large"><div className="tete-carte"><h2>À renouveler</h2><Lien to="/admin/ecoles" className="voir">Toutes les écoles</Lien></div>
          {d.a_renouveler.length === 0 ? <p className="note">Aucun abonnement ne se termine dans les 14 prochains jours.</p> : <ul className="hist">{d.a_renouveler.map((x: any) => <li key={x.id}><div><Lien to={`/admin/ecoles/${x.id}`}><b>{x.nom}</b></Lien><small>Fin le {dateFr(x.fin)}{x.prix_mois ? `, ${gnf(x.prix_mois)} par mois` : ''}</small></div><Sit x={x} />{x.tel && <a className="btn wa mini" href={relancer(x)} target="_blank" rel="noreferrer" aria-label={`Relancer ${x.nom} sur WhatsApp`}><PiWhatsappLogoFill aria-hidden="true" /><span className="bureau-seul-t">Relancer</span></a>}</li>)}</ul>}
        </section>
        <section className="carte c-etat"><h2>Écoles sans activité</h2>
          {d.inactives.length === 0 ? <p className="note">Toutes les écoles ont travaillé ces 14 derniers jours.</p> : <ul className="hist">{d.inactives.map((x: any) => <li key={x.id}><div><Lien to={`/admin/ecoles/${x.id}`}><b>{x.nom}</b></Lien><small>Dernière activité : {quand(x.activite)}</small></div></li>)}</ul>}
        </section>
      </div>
      <div className="rang">
        <section className="carte c-large"><h2>Écoles par tranche d'élèves</h2><ul className="adm-l">{d.tranches.map((t: any) => <li key={t.tranche}><div><span>{LIB_T[t.tranche]}</span><b>{nb(t.ecoles)} école{t.ecoles > 1 ? 's' : ''}</b></div><Barre p={(t.ecoles / maxT) * 100} /><small>{nb(t.eleves)} élèves</small></li>)}</ul></section>
        <section className="carte c-etat"><h2>Hébergement</h2>
          <dl className="cl-d"><div><dt>Coût par mois</dt><dd>{gnf(d.cout_mensuel)}</dd></div><div><dt>Reste ce mois</dt><dd className={apres < 0 ? 'rouge' : 'vert'}>{apres < 0 ? '-' : ''}{gnf(Math.abs(apres))}</dd></div></dl>
          <ul className="adm-l">
            <li><div><span>Base de données</span><b>{taille(d.usage.base_octets)} sur {taille(d.limite_base_mo * 1048576)}</b></div><Barre p={pB} ton={pB >= 80 ? 'rouge' : pB >= 60 ? 'orange' : 'vert'} /></li>
            <li><div><span>Fichiers ({nb(d.usage.fichiers_nombre)})</span><b>{taille(d.usage.fichiers_octets)} sur {taille(d.limite_fichiers_mo * 1048576)}</b></div><Barre p={pF} ton={pF >= 80 ? 'rouge' : pF >= 60 ? 'orange' : 'vert'} /></li>
          </ul>
        </section>
      </div>
    </>;
  }}</Etat>;
}

const FILTRES: [string, string, (s: string) => boolean][] = [['toutes', 'Toutes', () => true], ['attente', 'À payer', (s) => s === 'attente'], ['essai', 'Essai', (s) => s === 'essai'], ['actif', 'Actives', (s) => s === 'actif'], ['retard', 'À renouveler', (s) => s === 'grace' || s === 'expire'], ['suspendu', 'Suspendues', (s) => s === 'suspendu']];

function Ecoles() {
  const [f, setF] = useState('toutes'); const [t, setT] = useState('');
  const q = useQ(() => db.rpc('admin_ecoles'), []);
  return <>
    <Titre t="Écoles" />
    <Etat q={q}>{(ecoles: any[]) => {
      const fil = FILTRES.find(([k]) => k === f)![2]; const s = t.trim().toLowerCase();
      const l = ecoles.filter((x) => fil(x.situation) && (!s || `${x.nom} ${x.ville || ''} ${x.fondateur || ''} ${x.fondateur_tel || ''}`.toLowerCase().includes(s)));
      return <>
        <div className="segment" role="tablist">{FILTRES.map(([k, x, g]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{x}<em>{nb(ecoles.filter((y) => g(y.situation)).length)}</em></button>)}</div>
        <div className="barre-outils"><div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={t} onChange={(x) => setT(x.target.value)} placeholder="Rechercher une école, un fondateur, un numéro" aria-label="Rechercher une école" /></div></div>
        <section className="carte c-table">{l.length === 0 ? <Vide t="Aucune école trouvée." /> : <>
          <div className="table vue-bureau"><table><thead><tr><th>École</th><th className="dr">Élèves</th><th>Prix</th><th>Abonnement</th><th>Activité</th><th /></tr></thead><tbody>{l.map((x) => <tr key={x.id}><td><Lien to={`/admin/ecoles/${x.id}`}><b>{x.nom}</b></Lien><small className="bloc">{[x.fondateur, telAff(x.fondateur_tel), x.ville].filter(Boolean).join(', ')}</small></td><td className="dr fort">{nb(x.eleves)}</td><td>{x.prix_mois ? `${nb(x.prix_mois)} / mois` : 'À discuter'}{x.prix_perso && <small className="bloc gr">Prix spécial</small>}</td><td><Sit x={x} /><small className="bloc gr">Jusqu'au {dateFr(x.fin)}</small></td><td className="gr">{quand(x.derniere_activite)}</td><td><div className="acts-l"><Lien className="btn contour mini" to={`/admin/ecoles/${x.id}`}>Ouvrir</Lien></div></td></tr>)}</tbody></table></div>
          <ul className="vue-tel liste-p">{l.map((x) => <li key={x.id}><Lien to={`/admin/ecoles/${x.id}`} className="lp-h"><div><b>{x.nom}</b><small>{nb(x.eleves)} élèves, jusqu'au {dateFr(x.fin)}</small></div><div className="fin"><Sit x={x} /></div></Lien></li>)}</ul>
        </>}</section>
      </>;
    }}</Etat>
  </>;
}

function Prolonger({ x, fermer, fini }: any) {
  const [m, setM] = useState(1); const e = useEnvoi();
  return <Modale titre={`Prolonger ${x.nom}`} fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); e.envoyer(async () => { await db.rpc('admin_prolonger', { p_etab: x.id, p_mois: m }); fini(); }); }}>
    <div className="champ"><span>Ajouter</span><div className="segment seg-g">{[1, 3, 6, 12].map((k) => <button type="button" key={k} aria-pressed={m === k} className={m === k ? 'on' : ''} onClick={() => setM(k)}>{k} mois</button>)}</div></div>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Prolonger</button></form></Modale>;
}

function PrixEcole({ x, fermer, fini }: any) {
  const [a, setA] = useState<number>(x.prix_mois || 0); const [b, setB] = useState<number>(x.prix_an || 0); const e = useEnvoi();
  const enreg = (m: number | null, an: number | null) => e.envoyer(async () => { await db.rpc('admin_prix_ecole', { p_etab: x.id, p_prix_mois: m, p_prix_an: an }); fini(); });
  return <Modale titre={`Prix de ${x.nom}`} fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); if (!a || !b) return e.setE('Indiquez les deux prix'); enreg(a, b); }}>
    <Champ label="Prix par mois"><Montant value={a} onChange={setA} /></Champ><Champ label="Prix par an"><Montant value={b} onChange={setB} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button>{x.prix_perso && <button type="button" className="btn lien" onClick={() => enreg(null, null)}>Revenir au prix de la tranche</button>}</form></Modale>;
}

function Suspendre({ x, fermer, fini }: any) {
  const e = useEnvoi();
  return <Modale titre={`Suspendre ${x.nom} ?`} fermer={fermer}><div className="ident-c"><p>L'école pourra consulter ses données, mais plus rien enregistrer.</p><Erreur t={e.erreur} /><button className="btn contour rouge" disabled={e.occupe} onClick={() => e.envoyer(async () => { await db.rpc('admin_suspendre', { p_etab: x.id, p_suspendre: true }); fini(); })}>Suspendre l'école</button><button className="btn lien" onClick={fermer}>Annuler</button></div></Modale>;
}

function Fiche({ id }: { id: string }) {
  const { tableau } = useApp(); const [pro, setPro] = useState(false); const [prix, setPrix] = useState(false); const [sus, setSus] = useState(false); const [note, setNote] = useState<string | null>(null); const [ok, setOk] = useState(false); const e = useEnvoi();
  const q = useQ(() => db.rpc('admin_ecole_detail', { p_etab: id }), [id]);
  const fini = (f: (v: boolean) => void) => () => { f(false); q.reload(); tableau.reload(); };
  return <>
    <Titre t={(q.data as any)?.nom || 'École'} retour="/admin/ecoles">{(q.data as any)?.fondateur_tel && <a className="btn plein mini" href={waUrl((q.data as any).fondateur_tel)} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />WhatsApp</a>}</Titre>
    <Erreur t={e.erreur} />
    <Etat q={q}>{(x: any) => {
      const val = note ?? x.note ?? '';
      return <>
        <div className="minis"><Mini i={PiStudentDuotone} ton="bleu" t="Élèves"><Nb n={x.eleves} /></Mini><Mini i={PiUsersThreeDuotone} ton="violet" t="Classes"><Nb n={x.classes} /></Mini><Mini i={PiReceiptDuotone} ton="vert" t="Paiements, 30 jours"><Nb n={x.paiements_30j} /></Mini><Mini i={PiGaugeDuotone} ton="orange" t="Actions, 30 jours"><Nb n={x.actions_30j} /></Mini></div>
        <div className="param-g">
          <div className="param-c">
            <section className="carte para"><div className="tete-carte"><h2>Abonnement</h2><Sit x={x} /></div>
              <dl className="cl-d"><div><dt>Date de fin</dt><dd>{dateFr(x.fin)}</dd></div><div><dt>Tranche</dt><dd>{LIB_T[x.tranche]}</dd></div><div><dt>Tranche annoncée</dt><dd>{x.tranche_declaree ? LIB_T[x.tranche_declaree] : 'Non indiquée'}</dd></div>{x.eleves_annonces != null && <div><dt>Élèves annoncés</dt><dd>{nb(x.eleves_annonces)}</dd></div>}{x.classes_annoncees != null && <div><dt>Classes annoncées</dt><dd>{nb(x.classes_annoncees)}</dd></div>}{x.niveaux?.length > 0 && <div><dt>Niveaux</dt><dd>{x.niveaux.join(', ')}</dd></div>}{x.quartier && <div><dt>Quartier</dt><dd>{x.quartier}</dd></div>}<div><dt>Prix par mois</dt><dd>{x.prix_mois ? gnf(x.prix_mois) : 'À discuter'}{x.prix_perso ? ' (spécial)' : ''}</dd></div><div><dt>Prix par an</dt><dd>{x.prix_an ? gnf(x.prix_an) : 'À discuter'}</dd></div></dl>
              <div className="ligne-btn"><button className="btn plein mini" onClick={() => setPro(true)}><PiCalendarCheckDuotone aria-hidden="true" />Prolonger</button><button className="btn contour mini" onClick={() => setPrix(true)}>Prix spécial</button>{x.situation === 'suspendu' ? <button className="btn contour mini" onClick={() => e.envoyer(async () => { await db.rpc('admin_suspendre', { p_etab: x.id, p_suspendre: false }); q.reload(); tableau.reload(); })}>Réactiver</button> : <button className="btn contour mini rouge" onClick={() => setSus(true)}>Suspendre</button>}</div>
            </section>
            <section className="carte para"><h2>Paiements d'abonnement</h2>{x.paiements.length === 0 ? <p className="note">Aucun paiement pour le moment.</p> : <ul className="hist">{x.paiements.map((p: any) => <li key={p.id}><div><b>{gnf(p.montant)}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}, {dateFr(p.declare_le)}{p.reference ? `, ${p.reference}` : ''}</small></div><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></li>)}</ul>}</section>
          </div>
          <div className="param-c">
            <section className="carte para"><h2>École et fondateur</h2><dl className="cl-d"><div><dt>Fondateur</dt><dd>{x.fondateur || 'Non renseigné'}</dd></div><div><dt>Téléphone</dt><dd>{telAff(x.fondateur_tel) || 'Non renseigné'}</dd></div><div><dt>E-mail</dt><dd className="adm-e">{x.fondateur_email || 'Non renseigné'}</dd></div><div><dt>Ville</dt><dd>{x.ville || 'Non renseignée'}</dd></div><div><dt>Inscrite le</dt><dd>{dateFr(x.cree_le)}</dd></div></dl></section>
            <section className="carte para"><h2>Équipe de l'école</h2><ul className="hist">{x.membres.map((m: any) => <li key={m.id} className={m.actif ? '' : 'inactif'}><div><b>{m.nom || telAff(m.telephone)}</b><small>Dernière connexion : {quand(m.derniere_connexion)}</small></div><span className="puce">{NOM_ROLE[m.role] || m.role}</span></li>)}</ul></section>
            <section className="carte para"><h2>Note interne</h2><form onSubmit={(v) => { v.preventDefault(); setOk(false); e.envoyer(async () => { await db.rpc('admin_note', { p_etab: x.id, p_note: val }); setNote(null); await q.reload(); setOk(true); }); }}><textarea rows={3} value={val} onChange={(v) => { setOk(false); setNote(v.target.value); }} placeholder="Visible par vous seul" aria-label="Note interne" />{ok && <div className="alerte ok">Note enregistrée</div>}<button className="btn contour mini" disabled={e.occupe}>Enregistrer</button></form></section>
          </div>
        </div>
        {pro && <Prolonger x={x} fermer={() => setPro(false)} fini={fini(setPro)} />}
        {prix && <PrixEcole x={x} fermer={() => setPrix(false)} fini={fini(setPrix)} />}
        {sus && <Suspendre x={x} fermer={() => setSus(false)} fini={fini(setSus)} />}
      </>;
    }}</Etat>
  </>;
}

function Rejeter({ p, fermer, fini }: any) {
  const [m, setM] = useState(''); const e = useEnvoi();
  return <Modale titre="Rejeter ce paiement" fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); if (!m.trim()) return e.setE('Indiquez le motif'); e.envoyer(async () => { await db.rpc('admin_rejeter_paiement', { p_id: p.id, p_motif: m.trim() }); fini(); }); }}>
    <Champ label="Motif *"><input value={m} onChange={(v) => setM(v.target.value)} autoFocus placeholder="Argent non reçu" /></Champ><Erreur t={e.erreur} /><button className="btn contour rouge" disabled={e.occupe}>Rejeter</button></form></Modale>;
}

function Paiements() {
  const { tableau } = useApp(); const [f, setF] = useState('en_attente'); const [rej, setRej] = useState<any>(null); const e = useEnvoi();
  const q = useQ(() => db.rpc('admin_paiements', { p_limite: 500 }), []);
  const rel = () => { q.reload(); tableau.reload(); };
  return <>
    <Titre t="Paiements" />
    <Erreur t={e.erreur} />
    <Etat q={q}>{(pay: any[]) => {
      const som = (l: any[]) => l.reduce((s, p) => s + Number(p.montant), 0); const att = pay.filter((p) => p.statut === 'en_attente'); const val = pay.filter((p) => p.statut === 'valide'); const rj = pay.filter((p) => p.statut === 'rejete');
      const l = f === 'tous' ? pay : pay.filter((p) => p.statut === f);
      const actions = (p: any) => <><button className="btn plein mini" disabled={e.occupe} onClick={() => e.envoyer(async () => { await db.rpc('admin_valider_paiement', { p_id: p.id }); rel(); })}><PiCheckBold />Valider</button><button className="btn contour mini rouge" onClick={() => setRej(p)}>Rejeter</button></>;
      return <>
        <div className="minis"><Mini i={PiHourglassMediumDuotone} ton="orange" t={`À vérifier (${nb(att.length)})`}><Gnf n={som(att)} /></Mini><Mini i={PiCoinsDuotone} ton="vert" t={`Validés (${nb(val.length)})`}><Gnf n={som(val)} /></Mini></div>
        <div className="segment" role="tablist">{[['en_attente', 'À vérifier', att.length], ['valide', 'Validés', val.length], ['rejete', 'Rejetés', rj.length], ['tous', 'Tous', pay.length]].map(([k, x, c]: any) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => setF(k)}>{x}<em>{nb(c)}</em></button>)}</div>
        <section className="carte c-table">{l.length === 0 ? <Vide t={f === 'en_attente' ? 'Aucun paiement à vérifier.' : 'Aucun paiement ici.'} /> : <>
          <div className="table vue-bureau"><table><thead><tr><th>Date</th><th>École</th><th className="dr">Montant</th><th>Durée</th><th>Moyen</th><th>Statut</th><th /></tr></thead><tbody>{l.map((p) => <tr key={p.id}><td className="gr">{dateFr(p.declare_le)}</td><td><Lien to={`/admin/ecoles/${p.etablissement_id}`}><b>{p.ecole}</b></Lien><small className="bloc">{nb(p.eleves)} élèves</small></td><td className="dr fort">{nb(p.montant)}</td><td>{LIB_P[p.periode]}</td><td>{LIB_M[p.moyen]}{p.reference && <small className="bloc">{p.reference}</small>}</td><td><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} />{p.motif && <small className="bloc gr">{p.motif}</small>}</td><td><div className="acts-l">{p.statut === 'en_attente' && actions(p)}</div></td></tr>)}</tbody></table></div>
          <ul className="vue-tel liste-p">{l.map((p) => <li key={p.id}><div className="lp-h"><div><b>{p.ecole}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}{p.reference ? `, ${p.reference}` : ''}</small></div><div className="fin"><span className="gnf"><b>{nb(p.montant)}</b></span><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></div></div>{p.statut === 'en_attente' && <div className="acts-l">{actions(p)}</div>}</li>)}</ul>
        </>}</section>
        {rej && <Rejeter p={rej} fermer={() => setRej(null)} fini={() => { setRej(null); rel(); }} />}
      </>;
    }}</Etat>
  </>;
}

function FormReglages({ d, fini }: any) {
  const [f, setF] = useState({ orange_money: d.orange_money || '', mtn_money: d.mtn_money || '', whatsapp: d.whatsapp || '' }); const [cout, setCout] = useState<number>(Number(d.cout_mensuel)); const [lb, setLb] = useState(String(d.limite_base_mo)); const [lf, setLf] = useState(String(d.limite_fichiers_mo)); const [t, setT] = useState<any[]>(d.tarifs); const [ok, setOk] = useState(false); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => { setOk(false); setF({ ...f, [k]: x.target.value }); } });
  const maj = (i: number, k: string, v: number) => { setOk(false); setT(t.map((x, j) => (j === i ? { ...x, [k]: v } : x))); };
  const entier = (v: string) => v.replace(/\D/g, '');
  return <form className="param-g" noValidate onSubmit={(x) => { x.preventDefault(); if (!Number(lb) || !Number(lf)) return e.setE('Indiquez les limites d’hébergement'); setOk(false); e.envoyer(async () => { await db.rpc('admin_reglages_maj', { p: { ...f, cout_mensuel: cout, limite_base_mo: Number(lb), limite_fichiers_mo: Number(lf), tarifs: t } }); await fini(); setOk(true); }); }}>
    <div className="param-c"><section className="carte para"><h2>Prix par tranche</h2>{t.map((x, i) => <div className="reg-t" key={x.tranche}><b>{LIB_T[x.tranche]}</b><div className="deux"><Champ label="Par mois"><Montant value={x.prix_mois || 0} onChange={(v: number) => maj(i, 'prix_mois', v)} placeholder="À discuter" /></Champ><Champ label="Par an"><Montant value={x.prix_an || 0} onChange={(v: number) => maj(i, 'prix_an', v)} placeholder="À discuter" /></Champ></div></div>)}</section></div>
    <div className="param-c">
      <section className="carte para"><h2>Numéros de paiement</h2><p className="note">Affichés aux écoles sur la page Abonnement.</p><Champ label="Orange Money"><input inputMode="tel" {...c('orange_money')} placeholder="620 12 34 56" /></Champ><Champ label="MTN Money"><input inputMode="tel" {...c('mtn_money')} placeholder="664 12 34 56" /></Champ><Champ label="WhatsApp Scolaris"><input inputMode="tel" {...c('whatsapp')} placeholder="620 12 34 56" /></Champ></section>
      <section className="carte para"><h2>Hébergement</h2><Champ label="Coût Vercel et Supabase par mois"><Montant value={cout} onChange={(v: number) => { setOk(false); setCout(v); }} /></Champ><div className="deux"><Champ label="Limite base (Mo)"><input inputMode="numeric" value={lb} onChange={(v) => { setOk(false); setLb(entier(v.target.value)); }} /></Champ><Champ label="Limite fichiers (Mo)"><input inputMode="numeric" value={lf} onChange={(v) => { setOk(false); setLf(entier(v.target.value)); }} /></Champ></div><p className="note">Forfait gratuit : 500 Mo et 1 024 Mo. Forfait Pro : 8 192 Mo et 102 400 Mo.</p></section>
      <Erreur t={e.erreur} />{ok && <div className="alerte ok">Réglages enregistrés</div>}<button className="btn plein" disabled={e.occupe}>Enregistrer</button>
    </div>
  </form>;
}

function Reglages() {
  const { tableau } = useApp(); const q = useQ(() => db.rpc('admin_reglages'), []);
  return <><Titre t="Réglages" /><Etat q={q}>{(d: any) => <FormReglages d={d} fini={async () => { await q.reload(); tableau.reload(); }} />}</Etat></>;
}

export function EspaceAdmin() {
  const [zoneBandeau, setZB] = useState<HTMLDivElement | null>(null);
  const [chemin, setC] = useState(location.pathname);
  useEffect(() => { const f = () => setC(location.pathname); addEventListener('popstate', f); return () => removeEventListener('popstate', f); }, []);
  const droit = useQ(() => db.rpc('suis_je_admin'), []);
  const estAdmin = droit.data === true;
  const tableau = useQ(() => (estAdmin ? db.rpc('admin_tableau') : Promise.resolve(null)), [estAdmin, chemin]);
  if (droit.erreur && droit.data == null) return <main className="pub"><section className="carte-pub"><Logo /><Erreur t={droit.erreur} /><button className="btn plein" onClick={droit.reload}>Réessayer</button><button className="btn lien" onClick={auth.deconnexion}>Se déconnecter</button></section></main>;
  if (droit.data == null) return <main className="pub"><Chargement /></main>;
  if (!estAdmin) return <main className="pub"><section className="carte-pub"><Logo /><h1>Accès réservé</h1><p className="intro">Cette page n'est pas accessible avec ce compte.</p><button className="btn plein" onClick={auth.deconnexion}>Se déconnecter</button></section></main>;
  const seg = chemin.split('/').filter(Boolean);
  const page = seg[1] === 'ecoles' && seg[2] ? <Fiche id={seg[2]} key={seg[2]} /> : seg[1] === 'ecoles' ? <Ecoles /> : seg[1] === 'paiements' ? <Paiements /> : seg[1] === 'reglages' ? <Reglages /> : <Vue />;
  const on = (to: string) => (to === '/admin' ? chemin === '/admin' || chemin === '/admin/' : chemin.startsWith(to));
  const att = Number((tableau.data as any)?.a_verifier?.nombre || 0);
  const md = getSession()?.user?.user_metadata || {}; const nom = `${md.prenom || ''} ${md.nom || ''}`.trim() || getSession()?.user?.email || 'Administrateur';
  const init = nom.split(/\s+/).slice(0, 2).map((x: string) => x[0]).join('').toUpperCase();
  return (
    <Ctx.Provider value={{ zoneBandeau, zoneFiltres: null, can: () => false, tableau }}>
      <div className="app adm">
        <aside className="menu">
          <Lien to="/admin" className="marque"><img src="/img/icone.png" alt="" /><Mot taille={26} /></Lien>
          <nav aria-label="Menu">{ITEMS.map(([to, t, I]) => <Lien key={to} to={to} className={on(to) ? 'actif' : ''}><I aria-hidden="true" /><span>{t}</span>{to === '/admin/paiements' && att > 0 && <em>{att}</em>}</Lien>)}</nav>
          <div className="profil"><span className="av">{init}</span><div><b>{nom}</b><small>Administrateur</small></div><button onClick={auth.deconnexion} aria-label="Se déconnecter" title="Se déconnecter"><PiSignOutDuotone aria-hidden="true" /></button></div>
        </aside>
        <div className="corps">
          <div className="lignes" aria-hidden="true" />
          <header className="haut"><img className="logo-tel" src="/img/icone.png" alt="" /><div className="ecole"><PiShieldStarDuotone aria-hidden="true" /><b>Administration Scolaris</b></div><div className="esp" /><button className="retour-v adm-sortie" onClick={auth.deconnexion} aria-label="Se déconnecter"><PiSignOutDuotone aria-hidden="true" /></button></header>
          <div className="zone-bandeau" ref={setZB} />
          <main className="feuille">{page}</main>
        </div>
        <nav className="barre-bas" aria-label="Navigation principale">{ITEMS.map(([to, , I, c]) => <Lien key={to} to={to} className={on(to) ? 'on' : ''}><I aria-hidden="true" /><span>{c}</span></Lien>)}</nav>
      </div>
    </Ctx.Provider>
  );
}
