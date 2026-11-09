import { useState } from 'react';
import { PiArrowLeftBold, PiArrowRightBold, PiBankDuotone, PiBellRingingFill, PiChartBarFill, PiCheckBold, PiCheckCircleFill, PiClockCountdownFill, PiCopySimpleBold, PiInfoFill, PiMoneyWavyDuotone, PiReceiptDuotone, PiReceiptFill, PiUsersThreeFill, PiWarningCircleFill, PiWhatsappLogoFill } from 'react-icons/pi';
import { db } from './api';
import { dateFr, gnf, nb, tel, telAff } from './lib';
import { Erreur, Lien, Modale, Pastille, Titre, Tuile, Vide, useApp, useEnvoi } from './ui';

export const LIB_T: any = { moins_200: "Jusqu'à 200 élèves", '201_500': '201 à 500 élèves', '501_1000': '501 à 1 000 élèves', plus_1000: 'Plus de 1 000 élèves' };
export const SIT: any = { essai: ['partiel', 'Essai gratuit'], actif: ['a_jour', 'Actif'], grace: ['retard', 'Terminé'], expire: ['rien', 'Expiré'], suspendu: ['rien', 'Suspendu'] };
export const MOYENS: [string, string][] = [['orange_money', 'Orange Money'], ['mtn_money', 'MTN Money'], ['especes', 'Espèces'], ['virement', 'Virement']];
export const LIB_M: any = Object.fromEntries(MOYENS);
export const LIB_P: any = { mois: '1 mois', an: '1 an' };
export const ST_P: any = { en_attente: ['retard', 'À vérifier'], valide: ['a_jour', 'Validé'], rejete: ['rien', 'Rejeté'] };
export const waUrl = (n: string, t = '') => { const x = tel(n); return `https://wa.me/${x.length === 9 ? '224' + x : x}${t ? `?text=${encodeURIComponent(t)}` : ''}`; };

export function BandeauAbonnement({ cache, accueil }: { cache: boolean; accueil: boolean }) {
  const { abo, role } = useApp();
  if (!abo || cache) return null;
  const { situation: s, jours, jours_grace: g } = abo; let t = ''; let ton = 'orange';
  if ((s === 'essai' || s === 'actif') && jours <= 7) t = `Votre ${s === 'essai' ? 'essai gratuit' : 'abonnement'} se termine ${jours === 0 ? "aujourd'hui" : jours === 1 ? 'demain' : `dans ${jours} jours`}.`;
  else if (s === 'grace') t = `Votre abonnement est terminé. Plus que ${g} jour${g > 1 ? 's' : ''} avant le passage en lecture seule.`;
  else if (s === 'expire') { t = "Abonnement expiré : vous pouvez consulter vos données, mais plus rien enregistrer."; ton = 'rouge'; } else if (s === 'suspendu') { t = 'Cet établissement est suspendu : contactez Scolaris.'; ton = 'rouge'; }
  if (!t && s === 'essai' && accueil && role === 'fondateur') { t = `Essai gratuit : il vous reste ${jours} jours.`; ton = 'bleu'; }
  if (!t) return null;
  return <div className={`band-abo ${ton}`} role="status"><PiWarningCircleFill aria-hidden="true" /><span>{t}</span>{role === 'fondateur' ? <Lien to="/abonnement" className="btn plein mini">{s === 'essai' ? 'Acheter un abonnement' : 'Renouveler'}</Lien> : <small>Prévenez le fondateur.</small>}</div>;
}

function Gemme() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="abp-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B8BFF" /><stop offset="1" stopColor="#0B43D6" /></linearGradient></defs><path fill="url(#abp-g)" d="M12 8h24l9 12-21 22L3 20z" /><path fill="#8CC0FF" d="M12 8 3 20h15z" /><path fill="#C4DEFF" d="M12 8h24l-6 12H18z" /><path fill="#5FA3FF" d="m36 8 9 12H30z" /><path fill="#6FAEFF" d="M18 20h12l-6 22z" /></svg>;
}
function Couronne({ blanc }: { blanc?: boolean }) {
  const c = blanc ? '#fff' : 'url(#abp-c)';
  return <svg viewBox="0 0 48 48" aria-hidden="true">{!blanc && <defs><linearGradient id="abp-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3B8BFF" /><stop offset="1" stopColor="#0B43D6" /></linearGradient></defs>}<path fill={c} stroke={c} strokeWidth="3" strokeLinejoin="round" d="M9 34 6 15l11 8 7-14 7 14 11-8-3 19z" /><rect x="9" y="37" width="30" height="4.5" rx="2.2" fill={c} /></svg>;
}

const AVANTAGES: [any, string][] = [[PiUsersThreeFill, 'Élèves, classes et frais'], [PiReceiptFill, 'Paiements et reçus aux parents'], [PiBellRingingFill, 'Relance des retards'], [PiChartBarFill, 'Caisse et rapports clairs']];
const MODES: [string, string, string | null, any][] = [
  ['orange_money', 'Orange Money', '/img/paiement/orange-money.png', null],
  ['mtn_money', 'MTN Money', '/img/paiement/mtn-money.png', null],
  ['especes', 'Espèces', null, PiMoneyWavyDuotone],
  ['virement', 'Virement', null, PiBankDuotone],
];

function Haut({ t, retour }: { t: string; retour: () => void }) {
  return <header className="abp-haut"><button type="button" className="abp-ret" onClick={retour} aria-label="Retour"><PiArrowLeftBold aria-hidden="true" /></button><h1>{t}</h1></header>;
}
function Historique({ abo, fermer }: any) {
  return <Modale titre="Historique des paiements" fermer={fermer}>{abo.historique.length === 0 ? <Vide t="Aucun paiement pour le moment." /> : <ul className="hist">{abo.historique.map((p: any) => <li key={p.id}><Tuile i={PiReceiptDuotone} ton={p.statut === 'valide' ? 'vert' : p.statut === 'rejete' ? 'rouge' : 'orange'} t={40} /><div><b>{gnf(p.montant)}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}, {dateFr(p.declare_le)}{p.fin ? `, jusqu'au ${dateFr(p.fin)}` : ''}{p.motif ? `. ${p.motif}` : ''}</small></div><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></li>)}</ul>}</Modale>;
}

export function Abonnement() {
  const { abo, eid, recharger } = useApp(); const [per, setPer] = useState('an'); const [moy, setMoy] = useState(''); const [num, setNum] = useState(''); const [etape, setEtape] = useState(1); const [hist, setHist] = useState(false); const [copie, setCopie] = useState(false); const e = useEnvoi();
  if (!abo) return <><Titre t="Abonnement" /><Vide t="Aucun abonnement trouvé pour cet établissement." /></>;
  const m = abo.prix_mois; const a = abo.prix_an; const plein = (m ?? 0) * 12; const remise = a != null && a < plein;
  const offerts = remise ? (plein - a) / m : 0;
  const cadeau = Number.isInteger(offerts) && offerts > 0 ? `${nb(offerts)} mois offerts` : remise ? `${Math.round((1 - a / plein) * 100)} % d'économie` : 'Un seul paiement';
  const PLANS: any = {
    an: { nom: 'Annuel', unite: 'an', Ic: Gemme, sous: remise ? 'Le plus avantageux' : "Pour toute l'année", prix: a, points: [cadeau, "Un seul paiement dans l'année", 'Toutes les fonctions de Scolaris'] },
    mois: { nom: 'Mensuel', unite: 'mois', Ic: Couronne, sous: 'Sans engagement', prix: m, points: ['Vous payez chaque mois', 'Vous arrêtez quand vous voulez', 'Toutes les fonctions de Scolaris'] },
  };
  const plan = PLANS[per]; const montant = plan.prix;
  const aller = (n: number) => { setEtape(n); window.scrollTo(0, 0); };
  const mobile = moy === 'orange_money' || moy === 'mtn_money'; const numero = moy === 'orange_money' ? abo.orange_money : moy === 'mtn_money' ? abo.mtn_money : null;
  const j = abo.jours; const duree = `${nb(j)} jour${j > 1 ? 's' : ''} restant${j > 1 ? 's' : ''}`;
  const etat = abo.situation === 'essai' ? `Essai gratuit, ${duree}` : abo.situation === 'actif' ? `Abonnement actif, ${duree}` : abo.situation === 'suspendu' ? 'Établissement suspendu' : `Abonnement terminé le ${dateFr(abo.fin)}`;
  const dernier = [...abo.historique].sort((x: any, y: any) => String(y.declare_le).localeCompare(String(x.declare_le)))[0];
  const copier = async () => { try { await navigator.clipboard.writeText(numero); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { setCopie(false); } };
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!moy) return e.setE('Choisissez un moyen de paiement');
    const n = tel(num);
    if (mobile && !/^\d{9}$/.test(n)) return e.setE("Indiquez les 9 chiffres du numéro qui a envoyé l'argent");
    e.envoyer(async () => { await db.rpc('abonnement_declarer', { p_etab: eid, p_periode: per, p_moyen: moy, p_reference: mobile ? n : null }); setNum(''); setMoy(''); setEtape(1); window.scrollTo(0, 0); await recharger(); });
  };
  const lienHist = <button type="button" className="abp-lien" onClick={() => setHist(true)}>Historique des paiements</button>;

  if (abo.en_attente) {
    const att = abo.historique.find((p: any) => p.statut === 'en_attente'); const pl = PLANS[att?.periode === 'mois' ? 'mois' : 'an'];
    return (
      <><Titre t="Abonnement" />
        <div className="abp abp-fin">
          <div className="abp-merci"><svg viewBox="0 0 120 92" aria-hidden="true"><g stroke="#2F7BFF" strokeWidth="3.5" strokeLinecap="round"><path d="M21 14l8 12" /><path d="M6 31l13 5" /><path d="M6 52l13-3" /></g><circle cx="72" cy="46" r="44" fill="#E5EEFF" /><circle cx="72" cy="46" r="31" fill="#0B4FE8" /><path d="M58 47l10 10 19-21" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
          <h1>Paiement envoyé !</h1>
          <p>Scolaris vérifie l'argent reçu, puis prolonge votre abonnement.</p>
          <div className="abp-recap"><span className="abp-tuile"><pl.Ic /></span><div><b>Plan {pl.nom}</b><strong>{gnf(att?.montant ?? pl.prix)} / {pl.unite}</strong></div><em className="abp-att">À vérifier</em></div>
          <ul className="abp-suivi"><li className="ok"><PiCheckCircleFill aria-hidden="true" />Paiement envoyé</li><li className="cours"><PiClockCountdownFill aria-hidden="true" />Vérification par Scolaris</li><li><i aria-hidden="true" />Abonnement prolongé</li></ul>
          <div className="abp-bas"><Lien to="/tableau" className="abp-cta">Retour au tableau de bord</Lien>{lienHist}</div>
        </div>
        {hist && <Historique abo={abo} fermer={() => setHist(false)} />}
      </>
    );
  }

  if (etape === 2) return (
    <><Titre t="Abonnement" />
      <div className="abp">
        <Haut t="Détails du plan" retour={() => aller(1)} />
        <div className="abp-det"><span className="abp-tuile g"><plan.Ic /></span><h2>Plan {plan.nom}</h2><strong>{gnf(montant)} / {plan.unite}</strong><small>{LIB_T[abo.tranche]}</small></div>
        <div className="abp-co">
          <h3>Avantages inclus :</h3>
          <ul className="abp-av">{AVANTAGES.map(([I, t]) => <li key={t}><span><I aria-hidden="true" /></span>{t}</li>)}</ul>
          <p className="abp-info"><PiInfoFill aria-hidden="true" />Votre abonnement sera prolongé dès que Scolaris aura vérifié votre paiement.</p>
          <div className="abp-bas"><button type="button" className="abp-cta" onClick={() => aller(3)}>Payer maintenant<PiArrowRightBold aria-hidden="true" /></button></div>
        </div>
      </div>
    </>
  );

  if (etape === 3) return (
    <><Titre t="Abonnement" />
      <form className="abp" onSubmit={envoyer} noValidate>
        <Haut t="Paiement" retour={() => aller(2)} />
        <div className="abp-co">
          <div className="abp-resume"><span className="abp-tuile"><plan.Ic /></span><div><b>Plan {plan.nom}</b><small>Abonnement {per === 'an' ? 'annuel' : 'mensuel'}</small></div><strong>{gnf(montant)}</strong></div>
          <h3>Choisissez un moyen de paiement</h3>
          <div className="abp-moyens" role="radiogroup" aria-label="Moyen de paiement">{MODES.map(([k, t, logo, I]) => <button type="button" role="radio" aria-checked={moy === k} key={k} className={moy === k ? 'on' : ''} onClick={() => { setMoy(k); e.setE(''); }}><span className="abp-logo">{logo ? <img src={logo} alt="" /> : <I aria-hidden="true" />}</span><b>{t}</b><i aria-hidden="true" /></button>)}</div>
          {mobile && (numero ? <div className="abp-envoi"><small>Envoyez {gnf(montant)} à ce numéro</small><div className="abp-num"><b>{telAff(numero)}</b><button type="button" onClick={copier}>{copie ? <PiCheckBold aria-hidden="true" /> : <PiCopySimpleBold aria-hidden="true" />}{copie ? 'Copié' : 'Copier'}</button></div><label htmlFor="abp-tel">Puis indiquez le numéro qui a envoyé l'argent</label><div className="abp-tel"><span>+224</span><input id="abp-tel" inputMode="numeric" autoComplete="tel-national" value={num} onChange={(x) => { setNum(x.target.value); e.setE(''); }} placeholder="621 34 56 78" /></div></div> : <p className="abp-info"><PiInfoFill aria-hidden="true" />Le numéro de paiement n'est pas encore disponible. Contactez Scolaris.</p>)}
          {(moy === 'especes' || moy === 'virement') && <div className="abp-envoi"><small>Convenez avec Scolaris de la remise de {gnf(montant)}.</small>{abo.whatsapp && <a className="btn wa" href={waUrl(abo.whatsapp, `Bonjour Scolaris, je souhaite payer mon abonnement ${plan.nom.toLowerCase()} de ${gnf(montant)}.`)} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Écrire à Scolaris</a>}</div>}
          <Erreur t={e.erreur} />
          <div className="abp-bas"><button className="abp-cta" disabled={e.occupe || (mobile && !numero)}>{e.occupe ? 'Envoi…' : <><PiCheckBold aria-hidden="true" />J'ai envoyé l'argent</>}</button></div>
        </div>
      </form>
    </>
  );

  return (
    <><Titre t="Abonnement" />
      <div className="abp">
        <section className="abp-hero">
          <header className="abp-haut"><Lien to="/tableau" className="abp-ret" aria-label="Retour"><PiArrowLeftBold aria-hidden="true" /></Lien><h1>Abonnement</h1></header>
          <span className="abp-cou"><Couronne blanc /></span>
          <h2>Gérez votre école sans impayés</h2>
          <p>{etat}</p>
        </section>
        <div className="abp-co abp-feuille">
          {dernier?.statut === 'rejete' && <p className="abp-rejet"><PiWarningCircleFill aria-hidden="true" />Votre dernier paiement a été rejeté{dernier.motif ? ` : ${dernier.motif}` : ''}.</p>}
          {m == null || a == null ? <div className="abp-contact"><p>Pour une école de cette taille, le tarif se fixe directement avec Scolaris.</p>{abo.whatsapp && <a className="btn wa" href={waUrl(abo.whatsapp, 'Bonjour Scolaris, je souhaite connaître le tarif pour mon école.')} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Contacter Scolaris</a>}</div> : <>
            <div className="abp-bascule" role="group" aria-label="Durée de l'abonnement">{['an', 'mois'].map((k) => <button type="button" key={k} aria-pressed={per === k} className={per === k ? 'on' : ''} onClick={() => setPer(k)}>{PLANS[k].nom}</button>)}</div>
            {['an', 'mois'].map((k) => { const P = PLANS[k]; return <button type="button" key={k} aria-pressed={per === k} className={`abp-plan${per === k ? ' on' : ''}`} onClick={() => setPer(k)}><span className="abp-sel" aria-hidden="true">{per === k ? <PiCheckCircleFill /> : <i />}</span><span className="abp-ph"><span className="abp-tuile"><P.Ic /></span><span className="abp-pt"><b>{P.nom}</b><small>{P.sous}</small><strong>{nb(P.prix)} <em>GNF / {P.unite}</em></strong></span></span><span className="abp-pts">{P.points.map((t: string) => <span key={t}><PiCheckCircleFill aria-hidden="true" />{t}</span>)}</span></button>; })}
            <div className="abp-bas"><button type="button" className="abp-cta" onClick={() => aller(2)}>Continuer<PiArrowRightBold aria-hidden="true" /></button></div>
          </>}
          {lienHist}
        </div>
      </div>
      {hist && <Historique abo={abo} fermer={() => setHist(false)} />}
    </>
  );
}
