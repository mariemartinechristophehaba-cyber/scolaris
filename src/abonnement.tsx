import { PiChatCircleDotsFill } from 'react-icons/pi';
import { useEffect, useState } from 'react';
import { PiLockKeyFill } from 'react-icons/pi';
import { PiCaretRightBold, PiArrowLeftBold, PiArrowRightBold, PiBellRingingFill, PiChartBarFill, PiCheckBold, PiCheckCircleFill, PiClockCountdownFill, PiCrownSimpleFill, PiInfoFill, PiReceiptDuotone, PiReceiptFill, PiUsersThreeFill, PiWarningCircleFill, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, db, getSession, payerAbonnement } from './api';
import { TRANCHES, dateFr, drapeau, erreurTel, fcfa, gnf, nb, paysActif, symbole, tel } from './lib';
import { Erreur, Lien, Modale, Pastille, Titre, Tuile, Vide, useApp, useEnvoi } from './ui';

export const LIB_T: any = { ...Object.fromEntries(TRANCHES), moins_200: "Jusqu'à 200 élèves", '201_500': '201 à 500 élèves', '501_1000': '501 à 1 000 élèves' };
export const SIT: any = { attente: ['retard', 'En attente de paiement'], essai: ['partiel', 'Essai gratuit'], actif: ['a_jour', 'Actif'], grace: ['retard', 'Terminé'], expire: ['rien', 'Expiré'], suspendu: ['rien', 'Suspendu'] };
export const MOYENS: [string, string][] = [['chariow', 'Paiement en ligne'], ['orange_money', 'Orange Money'], ['mtn_money', 'MTN Money'], ['especes', 'Espèces'], ['virement', 'Virement']];
export const LIB_M: any = Object.fromEntries(MOYENS);
export const LIB_P: any = { mois: '1 mois', an: '1 an', sms: 'Pack SMS' };
export const ST_P: any = { en_attente: ['retard', 'À vérifier'], valide: ['a_jour', 'Validé'], rejete: ['rien', 'Rejeté'] };
// WhatsApp Scolaris : numéro guinéen sur 9 chiffres, ou numéro étranger déjà avec son indicatif.
export const waScolaris = (n: string, t = '') => `https://wa.me/${String(n).length === 9 ? '224' + n : n}${t ? `?text=${encodeURIComponent(t)}` : ''}`;
export const waUrl = (n: string, t = '') => { const x = tel(n); return `https://wa.me/${x.length >= paysActif().mn && x.length <= paysActif().ch && paysActif().c !== 'GN' || x.length === 9 && paysActif().c === 'GN' ? paysActif().ind + x : x}${t ? `?text=${encodeURIComponent(t)}` : ''}`; };

export function BandeauAbonnement({ cache, accueil }: { cache: boolean; accueil: boolean }) {
  const { abo, role } = useApp();
  if (!abo || cache) return null;
  const { situation: s, jours, jours_grace: g } = abo; let t = ''; let ton = 'orange';
  if (s === 'attente') { if (abo.en_attente) t = 'Paiement en cours de vérification. Votre école sera activée dès sa validation.'; else { t = 'Payez votre abonnement pour activer votre école.'; ton = 'paye'; } } else if ((s === 'essai' || s === 'actif') && jours <= 7) t = `Votre ${s === 'essai' ? 'essai gratuit' : 'abonnement'} se termine ${jours === 0 ? "aujourd'hui" : jours === 1 ? 'demain' : `dans ${jours} jours`}.`;
  else if (s === 'grace') t = `Votre abonnement est terminé. Plus que ${g} jour${g > 1 ? 's' : ''} avant le passage en lecture seule.`;
  else if (s === 'expire') { t = "Abonnement expiré : vous pouvez consulter vos données, mais plus rien enregistrer."; ton = 'rouge'; } else if (s === 'suspendu') { t = 'Cet établissement est suspendu : contactez Scolaris.'; ton = 'rouge'; }
  if (!t && s === 'essai' && accueil && role === 'fondateur') { t = `Essai gratuit : il vous reste ${jours} jours.`; ton = 'bleu'; }
  if (!t) return null;
  return <div className={`band-abo ${ton}`} role="status">{ton === 'bleu' ? <PiInfoFill aria-hidden="true" /> : <PiWarningCircleFill aria-hidden="true" />}<span>{t}</span>{role === 'fondateur' ? <Lien to="/abonnement" className="btn plein mini"><PiCrownSimpleFill aria-hidden="true" />{s === 'attente' ? (abo.en_attente ? 'Voir' : 'Payer') : s === 'essai' ? 'Acheter un abonnement' : 'Renouveler'}</Lien> : <small>Prévenez le fondateur.</small>}</div>;
}

function Gemme() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="abp-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B8BFF" /><stop offset="1" stopColor="#0B43D6" /></linearGradient></defs><path fill="url(#abp-g)" d="M12 8h24l9 12-21 22L3 20z" /><path fill="#8CC0FF" d="M12 8 3 20h15z" /><path fill="#C4DEFF" d="M12 8h24l-6 12H18z" /><path fill="#5FA3FF" d="m36 8 9 12H30z" /><path fill="#6FAEFF" d="M18 20h12l-6 22z" /></svg>;
}
function Couronne({ blanc }: { blanc?: boolean }) {
  const c = blanc ? '#fff' : 'url(#abp-c)';
  return <svg viewBox="0 0 48 48" aria-hidden="true">{!blanc && <defs><linearGradient id="abp-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B8BFF" /><stop offset="1" stopColor="#0B43D6" /></linearGradient></defs>}<path fill={c} stroke={c} strokeWidth="3" strokeLinejoin="round" d="M9 34 6 15l11 8 7-14 7 14 11-8-3 19z" /><rect x="9" y="37" width="30" height="4.5" rx="2.2" fill={c} /></svg>;
}

const AVANTAGES: [any, string][] = [[PiUsersThreeFill, 'Élèves, classes et frais'], [PiReceiptFill, 'Paiements et reçus aux parents'], [PiBellRingingFill, 'Relance des retards'], [PiChartBarFill, 'Caisse et rapports clairs']];

export function Haut({ t, retour }: { t: string; retour: () => void }) {
  return <header className="abp-haut"><button type="button" className="abp-ret" onClick={retour} aria-label="Retour"><PiArrowLeftBold aria-hidden="true" /></button><h1>{t}</h1></header>;
}
function Historique({ abo, fermer }: any) {
  return <Modale titre="Historique des paiements" fermer={fermer}>{abo.historique.length === 0 ? <Vide t="Aucun paiement pour le moment." /> : <ul className="hist">{abo.historique.map((p: any) => <li key={p.id}><Tuile i={PiReceiptDuotone} ton={p.statut === 'valide' ? 'vert' : p.statut === 'rejete' ? 'rouge' : 'orange'} t={40} /><div><b>{fcfa(p.montant)}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}, {dateFr(p.declare_le)}{p.fin ? `, jusqu'au ${dateFr(p.fin)}` : ''}{p.motif ? `. ${p.motif}` : ''}</small></div><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></li>)}</ul>}</Modale>;
}

function Bulle() { return <PiChatCircleDotsFill className="abp-bulle" />; }

function CarteSms({ abo, pk, acheter }: any) {
  const q = abo.sms_quota ?? 0, u = abo.sms_utilises ?? 0, reste = abo.sms_restants ?? 0, ok = !!abo.sms_autorises;
  const pct = q ? Math.min(100, (u / q) * 100) : 0;
  if (abo.sms_pays === false) return <section className="abp-sms">
    <div className="as-h"><span className="abp-tuile"><Bulle /></span><div><b>SMS de l'école</b><small>Relances aux parents</small></div><em className="as-bt">Bientôt</em></div>
    <p className="as-info"><PiInfoFill aria-hidden="true" />Les SMS arrivent bientôt dans votre pays. En attendant, vos relances partent par WhatsApp, sans limite et sans frais.</p>
  </section>;
  return <section className="abp-sms">
    <div className="as-h"><span className="abp-tuile"><Bulle /></span><div><b>SMS de l'école</b><small>Relances automatiques aux parents</small></div>{ok ? <em className="as-ok">Inclus</em> : <em className="as-non">Après paiement</em>}</div>
    {ok ? <>
      <div className="as-mil"><div className="as-n"><strong>{nb(reste)}</strong><span>restants sur {nb(q)} ce mois-ci</span></div>
      <div className="as-b"><i style={{ width: `${pct}%`, background: pct >= 90 ? '#E5484D' : pct >= 70 ? '#F79009' : '#0FA968' }} /></div>
      <small className="as-r">{nb(abo.sms_mois ?? 500)} SMS inclus chaque mois dans votre abonnement, plus les packs achetés ce mois-ci. Le compteur repart à {nb(abo.sms_mois ?? 500)} au début de chaque mois.</small></div>
      <button type="button" className="as-btn" onClick={acheter}><span><b>Acheter {nb(pk.quantite)} SMS</b><small>{gnf(pk.prix)}</small></span><PiArrowRightBold aria-hidden="true" /></button>
    </> : <p className="as-info"><PiInfoFill aria-hidden="true" />Les SMS sont réservés aux écoles qui ont payé leur abonnement. Pendant l'essai, relancez gratuitement par WhatsApp.</p>}
  </section>;
}



// Attente de la confirmation Chariow : même style que la création de l'école (écran bleu, anneau qui avance).
function AttentePaiement({ plan, sms, essais, quitter }: any) {
  const [t, setT] = useState(0);
  useEffect(() => { const x = setInterval(() => setT((v) => v + 1), 250); return () => clearInterval(x); }, []);
  const pct = Math.min(92, Math.round(92 * (1 - Math.exp(-t / 60)))); const C = 2 * Math.PI * 84; const long = essais >= 24;
  const R: [string, string][] = [['Paiement lancé', 'd'], [`Confirmation de l’opérateur`, 'c'], [sms ? 'Ajout des SMS' : 'Activation de votre abonnement', '']];
  return <div className="pa-plein"><main className="fin1" aria-live="polite"><div className="fin-c">
    <div className="fin-r" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Confirmation du paiement"><svg viewBox="0 0 188 188"><defs><linearGradient id="pa-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#8DBBFF" /></linearGradient></defs><circle cx="94" cy="94" r="84" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="9" /><g className="fin-t"><circle cx="94" cy="94" r="84" fill="none" stroke="url(#pa-g)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * Math.max(0.08, pct / 100)} ${C}`} /></g></svg><img src="/img/icone.png" alt="" /></div>
    <h1>{long ? 'Vérification en cours' : 'Confirmation de votre paiement'}</h1>
    <p>{long ? 'Cela prend plus de temps que d’habitude. Si vous avez validé le paiement, votre accès s’activera tout seul.' : 'Validez le paiement sur votre téléphone si on vous le demande. Tout s’active automatiquement.'}</p>
    <div className="pa-chip"><span>{sms ? plan.nom : `Plan ${plan.nom}`}</span><b>{gnf(plan.prix)}{sms ? '' : ` / ${plan.unite}`}</b></div>
    <ul className="fin-l2">{R.map(([l, k]) => <li key={l} className={k}><u>{k === 'd' && <PiCheckBold aria-hidden="true" />}</u>{l}</li>)}</ul>
    <p className="pa-sec"><PiLockKeyFill aria-hidden="true" />Paiement sécurisé par Chariow</p>
  </div><div className="fin-pb"><div><span>{long ? 'En attente de l’opérateur' : 'Vérification'}</span><span>{pct} %</span></div><s><i style={{ width: `${pct}%` }} /></s><button type="button" className="pa-non" onClick={quitter}>{long ? 'Revenir à l’abonnement' : 'Je n’ai pas payé'}</button></div></main></div>;
}

export function Abonnement() {
  const { abo, eid, recharger } = useApp(); const [per, setPer] = useState('an'); const [num, setNum] = useState(''); const [etape, setEtape] = useState(1); const [hist, setHist] = useState(false); const e = useEnvoi();
  const [part, setPart] = useState(false); const [errP, setErrP] = useState('');
  const [att, setAtt] = useState(() => new URLSearchParams(location.search).get('retour') === '1'); const [essais, setEssais] = useState(0);
  useEffect(() => { if (!att) return; const t = setTimeout(async () => { await recharger(); setEssais((n) => n + 1); }, 5000); return () => clearTimeout(t); }, [att, essais]);
  useEffect(() => { if (att && abo?.situation === 'actif' && essais > 0 && (abo.historique || []).some((p: any) => p.statut === 'valide' && Date.now() - new Date(p.traite_le || p.declare_le).getTime() < 15 * 60000)) { setAtt(false); history.replaceState(null, '', '/abonnement?paye=1'); } }, [abo, essais]);
  if (!abo) return <><Titre t="Abonnement" /><Vide t="Aucun abonnement trouvé pour cet établissement." /></>;
  const m = abo.prix_mois; const a = abo.prix_an; const plein = (m ?? 0) * 12; const remise = a != null && a < plein;
  const offerts = remise ? (plein - a) / m : 0;
  const cadeau = Number.isInteger(offerts) && offerts > 0 ? `${nb(offerts)} mois offerts` : remise ? `${Math.round((1 - a / plein) * 100)} % d'économie` : 'Un seul paiement';
  const smsMois = abo.sms_mois ?? 500; const smsOk = abo.sms_pays !== false; const F = abo.fondatrice;
  const pointF = F ? [F.etat === 'active' ? `Prix réduit jusqu'au ${dateFr(F.jusqu)}` : `Offre de lancement : plus que ${nb(F.restantes)} place${F.restantes > 1 ? "s" : ""}`] : [];
  const PLANS: any = {
    an: { nom: 'Annuel', unite: 'an', Ic: Gemme, sous: remise ? 'Le plus avantageux' : "Pour toute l'année", prix: a, normal: F?.prix_an_normal, points: [...pointF, smsOk ? `${nb(smsMois)} SMS offerts chaque mois, 12 mois` : 'Relances WhatsApp illimitées', cadeau, "Un seul paiement dans l'année", 'Toutes les fonctions de Scolaris'] },
    mois: { nom: 'Mensuel', unite: 'mois', Ic: Couronne, sous: 'Sans engagement', prix: m, normal: F?.prix_mois_normal, points: [...pointF, smsOk ? `${nb(smsMois)} SMS inclus chaque mois` : 'Relances WhatsApp illimitées', 'Vous payez chaque mois', 'Vous arrêtez quand vous voulez', 'Toutes les fonctions de Scolaris'] },
  };
  const pk = abo.pack_sms || { quantite: 500, prix: 100000, lien: null };
  PLANS.sms = { nom: `Pack ${nb(pk.quantite)} SMS`, unite: 'pack', Ic: Bulle, sous: 'SMS en plus pour les relances', prix: pk.prix, points: [] };
  const plan = PLANS[per]; const montant = plan.prix;
  const aller = (n: number) => { setEtape(n); window.scrollTo(0, 0); };
  const j = abo.jours; const duree = `${nb(j)} jour${j > 1 ? 's' : ''} restant${j > 1 ? 's' : ''}`;
  const etat = abo.situation === 'essai' ? `Essai gratuit, ${duree}` : abo.situation === 'actif' ? `Abonnement actif, ${duree}` : abo.situation === 'attente' ? 'En attente de paiement' : abo.situation === 'suspendu' ? 'Établissement suspendu' : `Abonnement terminé le ${dateFr(abo.fin)}`;
  const dernier = [...abo.historique].sort((x: any, y: any) => String(y.declare_le).localeCompare(String(x.declare_le)))[0];
  const envoyer = (x: any) => {
    x.preventDefault();
    const r = num.trim();
    if (r.replace(/\W/g, '').length < 4) return e.setE('Indiquez le numéro qui a payé ou votre numéro de commande');
    e.envoyer(async () => { await db.rpc('abonnement_declarer', { p_etab: eid, p_periode: per, p_moyen: 'chariow', p_reference: r.slice(0, 80) }); setNum(''); setEtape(1); window.scrollTo(0, 0); await recharger(); });
  };
  const lienHist = <button type="button" className="abp-lien" onClick={() => setHist(true)}>Historique des paiements</button>;
  // Paiement en un geste : page Chariow déjà remplie (nom, téléphone, produit) ; la personne confirme sur son téléphone.

  // La page de paiement est celle de Chariow (officielle) : Scolaris l'ouvre déjà remplie (nom, numéro, produit).
  const payer = async (p0 = per) => {
    setPart(true); setErrP('');
    try { const r = await payerAbonnement({ etablissement_id: eid, periode: p0, retour: `${location.origin}/abonnement?retour=1&per=${p0}` }); try { sessionStorage.setItem('sc_paie', String(Date.now())); } catch { /* ignoré */ } location.href = r.url; }
    catch (x: any) { setErrP(x.message || 'Paiement indisponible, réessayez'); setPart(false); }
  };

  // Retour de Chariow : on attend la confirmation automatique (quelques secondes), sans rien demander.
  if (att) {
    const pq = new URLSearchParams(location.search).get('per'); const pl = PLANS[pq === 'mois' ? 'mois' : pq === 'sms' ? 'sms' : 'an'];
    return <AttentePaiement plan={pl} sms={pq === 'sms'} essais={essais} quitter={() => { setAtt(false); history.replaceState(null, '', '/abonnement'); }} />;
  }
  if (new URLSearchParams(location.search).get('paye') === '1' && abo.situation === 'actif') return <div className="pa-plein"><main className="fin1"><div className="fin-c">
    <div className="pa-ok"><span><PiCheckBold aria-hidden="true" /></span></div>
    <h1>Paiement reçu, merci !</h1><p>Votre abonnement Scolaris est actif jusqu'au {dateFr(abo.fin)}.</p>
    <ul className="fin-l2"><li className="d"><u><PiCheckBold aria-hidden="true" /></u>Paiement confirmé</li><li className="d"><u><PiCheckBold aria-hidden="true" /></u>Abonnement activé</li><li className="d"><u><PiCheckBold aria-hidden="true" /></u>Reçu disponible dans l'historique</li></ul>
  </div><div className="fin-pb"><Lien to="/tableau" className="pa-bt">Accéder à mon école<PiArrowRightBold aria-hidden="true" /></Lien></div></main></div>;

  if (abo.en_attente) {
    const att = abo.historique.find((p: any) => p.statut === 'en_attente'); const pl = PLANS[att?.periode === 'mois' ? 'mois' : att?.periode === 'sms' ? 'sms' : 'an'];
    return (
      <><Titre t="Abonnement" />
        <div className="abp abp-fin">
          <div className="abp-merci"><svg viewBox="0 0 120 92" aria-hidden="true"><g stroke="#2F7BFF" strokeWidth="3.5" strokeLinecap="round"><path d="M21 14l8 12" /><path d="M6 31l13 5" /><path d="M6 52l13-3" /></g><circle cx="72" cy="46" r="44" fill="#E5EEFF" /><circle cx="72" cy="46" r="31" fill="#0B4FE8" /><path d="M58 47l10 10 19-21" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
          <h1>Paiement envoyé !</h1>
          <p>{att?.periode === 'sms' ? 'Scolaris vérifie l’argent reçu, puis ajoute les SMS à votre école.' : 'Scolaris vérifie l’argent reçu, puis prolonge votre abonnement.'}</p>
          <div className="abp-recap"><span className="abp-tuile"><pl.Ic /></span><div><b>Plan {pl.nom}</b><strong>{gnf(att?.montant ?? pl.prix)}{att?.periode === 'sms' ? '' : ` / ${pl.unite}`}</strong></div><em className="abp-att">À vérifier</em></div>
          <ul className="abp-suivi"><li className="ok"><PiCheckCircleFill aria-hidden="true" />Paiement envoyé</li><li className="cours"><PiClockCountdownFill aria-hidden="true" />Vérification par Scolaris</li><li><i aria-hidden="true" />{att?.periode === 'sms' ? 'SMS ajoutés' : 'Abonnement prolongé'}</li></ul>
          <div className="abp-bas"><Lien to="/tableau" className="abp-cta">Retour au tableau de bord</Lien>{lienHist}{abo.situation === 'attente' && <button type="button" className="abp-lien" onClick={auth.deconnexion}>Se déconnecter</button>}</div>
        </div>
        {hist && <Historique abo={abo} fermer={() => setHist(false)} />}
      </>
    );
  }

  if (etape === 2) return <><Titre t="Abonnement" /><div className="abp">
    <Haut t="Paiement" retour={() => aller(1)} />
    <div className="abp-co"><p className="abp-info"><PiInfoFill aria-hidden="true" />Le paiement en ligne n'est pas encore ouvert pour ce tarif. Écrivez à Scolaris, on vous envoie le lien de paiement.</p>
      {abo.whatsapp && <div className="abp-bas"><a className="btn wa" href={waScolaris(abo.whatsapp, `Bonjour Scolaris, je souhaite payer : ${per === 'sms' ? plan.nom : `abonnement ${plan.nom.toLowerCase()}`} (${gnf(montant)}).`)} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Écrire à Scolaris</a></div>}</div>
  </div></>;

  if (etape === 3) return (
    <><Titre t="Abonnement" />
      <form className="abp" onSubmit={envoyer} noValidate>
        <Haut t="Paiement" retour={() => aller(2)} />
        <div className="abp-co">
          <div className="abp-resume"><span className="abp-tuile"><plan.Ic /></span><div><b>{per === 'sms' ? plan.nom : `Plan ${plan.nom}`}</b><small>{per === 'sms' ? 'SMS pour les relances' : `Abonnement ${per === 'an' ? 'annuel' : 'mensuel'}`}</small></div><strong>{gnf(montant)}</strong></div>
          <h3>Confirmez votre paiement en ligne</h3>
          <p className="abp-info"><PiInfoFill aria-hidden="true" />Indiquez le numéro de téléphone qui a payé, ou votre numéro de commande. Si le paiement est déjà reçu, {per === 'sms' ? 'vos SMS s’activent' : 'votre abonnement s’active'} tout de suite.</p>
          <div className="abp-envoi"><label htmlFor="abp-ref">Numéro qui a payé ou n° de commande</label><input id="abp-ref" className="abp-ref" autoComplete="off" value={num} onChange={(x) => { setNum(x.target.value); e.setE(''); }} placeholder={`Ex. : ${paysActif().ex}`} /></div>
          <Erreur t={e.erreur} />
          <div className="abp-bas"><button className="abp-cta" disabled={e.occupe}>{e.occupe ? 'Envoi…' : <><PiCheckBold aria-hidden="true" />J'ai payé</>}</button></div>
        </div>
      </form>
    </>
  );

  return (
    <><Titre t="Abonnement" />
      <div className="abp abp-acc">
        <section className="abp-hero">
          <header className="abp-haut"><Lien to="/tableau" className="abp-ret" aria-label="Retour"><PiArrowLeftBold aria-hidden="true" /></Lien><h1>Abonnement</h1></header>
          <span className="abp-cou"><Couronne blanc /></span>
          <h2>{abo.situation === 'attente' ? 'Activez votre école' : 'Gérez votre école sans impayés'}</h2>
          <p>{etat}</p>
        </section>
        <div className="abp-co abp-feuille">
          {dernier?.statut === 'rejete' && <p className="abp-rejet"><PiWarningCircleFill aria-hidden="true" />Votre dernier paiement a été rejeté{dernier.motif ? ` : ${dernier.motif}` : ''}.</p>}
          {m == null || a == null ? <div className="abp-contact"><p>Pour une école de cette taille, le tarif se fixe directement avec Scolaris.</p>{abo.whatsapp && <a className="btn wa" href={waScolaris(abo.whatsapp, 'Bonjour Scolaris, je souhaite connaître le tarif pour mon école.')} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Contacter Scolaris</a>}</div> : <>
            <div className="abp-bascule" role="group" aria-label="Durée de l'abonnement">{['an', 'mois'].map((k) => <button type="button" key={k} aria-pressed={per === k} className={per === k ? 'on' : ''} onClick={() => setPer(k)}>{PLANS[k].nom}</button>)}</div>
            <div className="abp-plans">{['an', 'mois'].map((k) => { const P = PLANS[k]; return <button type="button" key={k} aria-pressed={per === k} className={`abp-plan${per === k ? ' on' : ''}`} onClick={() => setPer(k)}><span className="abp-sel" aria-hidden="true">{per === k ? <PiCheckCircleFill /> : <i />}</span><span className="abp-ph"><span className="abp-tuile"><P.Ic /></span><span className="abp-pt"><b>{P.nom}</b><small>{P.sous}</small>{F && P.normal > P.prix && <span className="abp-barre"><s>{nb(P.normal)} {symbole(paysActif().dev)}</s><em>−{F.remise} %</em></span>}<strong>{nb(P.prix)} <em>{symbole(paysActif().dev)} / {P.unite}</em></strong></span></span><span className={`abp-pts${F ? ' af' : ''}`}>{P.points.map((t: string) => <span key={t}><PiCheckCircleFill aria-hidden="true" />{t}</span>)}</span></button>; })}</div>
            {errP && <p className="erreur" role="alert">{errP}</p>}
            <div className="abp-bas"><button type="button" className="abp-cta" disabled={part} onClick={() => { const p0 = per === 'sms' ? 'an' : per; if (per === 'sms') setPer('an'); if (abo[`lien_${p0}`]) payer(p0); else aller(2); }}>{part ? 'Ouverture du paiement…' : `Payer ${gnf(PLANS[per === 'sms' ? 'an' : per].prix)}`}{!part && <PiArrowRightBold aria-hidden="true" />}</button>
              <p className="mp-secu"><PiLockKeyFill aria-hidden="true" />Paiement sécurisé par Chariow · Orange Money, MTN, carte</p>
              <button type="button" className="abp-lien" onClick={() => { if (per === 'sms') setPer('an'); aller(3); }}>J'ai déjà payé</button></div>
          </>}
          <CarteSms abo={abo} pk={pk} acheter={() => { setPer('sms'); if (pk.lien) payer('sms'); else aller(2); }} />
          {lienHist}
          {abo.situation === 'attente' && <button type="button" className="abp-lien" onClick={auth.deconnexion}>Se déconnecter</button>}
        </div>
      </div>
      {hist && <Historique abo={abo} fermer={() => setHist(false)} />}
    </>
  );
}

// Bouton flottant « Support » : écrire à Scolaris sur WhatsApp depuis n'importe quelle page.
export function BoutonSupport() {
  const { abo, etab } = useApp();
  if (!abo?.whatsapp) return null;
  const msg = `Bonjour Scolaris, je vous écris depuis l'école ${etab?.nom || ''}. J'ai besoin d'aide : `;
  return <a className="support" href={waScolaris(abo.whatsapp, msg)} target="_blank" rel="noopener noreferrer" aria-label="Écrire au support Scolaris sur WhatsApp"><span className="support-r"><PiWhatsappLogoFill aria-hidden="true" /></span><b>Support</b></a>;
}

// Lien d'aide dans le menu : toujours accessible, sans rien cacher dans les pages.
export function AideMenu({ carte, haut }: { carte?: boolean; haut?: boolean }) {
  const { abo, etab } = useApp();
  if (!abo?.whatsapp) return null;
  const msg = `Bonjour Scolaris, je vous écris depuis l'école ${etab?.nom || ''}. J'ai besoin d'aide : `;
  if (haut) return <a className="aide-haut" href={waScolaris(abo.whatsapp, msg)} target="_blank" rel="noopener noreferrer" title="Support Scolaris sur WhatsApp"><PiWhatsappLogoFill aria-hidden="true" /><span>Aide</span></a>;
  return <a className={carte ? 'menu-aide aide-carte' : 'menu-aide'} href={waScolaris(abo.whatsapp, msg)} target="_blank" rel="noopener noreferrer"><span className="menu-aide-i"><PiWhatsappLogoFill aria-hidden="true" /></span><span><b>Besoin d'aide ?</b><small>Support Scolaris sur WhatsApp</small></span></a>;
}
