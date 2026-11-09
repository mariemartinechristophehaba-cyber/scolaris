import { useState } from 'react';
import { PiArrowRightBold, PiBankDuotone, PiBellRingingFill, PiChartBarFill, PiCheckBold, PiCheckCircleFill, PiCrownSimpleFill, PiHourglassMediumDuotone, PiMoneyWavyDuotone, PiPhoneDuotone, PiReceiptDuotone, PiReceiptFill, PiShieldCheckFill, PiStarFill, PiUsersThreeFill, PiWarningCircleFill, PiWhatsappLogoFill } from 'react-icons/pi';
import { db } from './api';
import { dateFr, gnf, nb, tel, telAff } from './lib';
import { Champ, Erreur, Gnf, Lien, Pastille, Titre, Tuile, Vide, useApp, useEnvoi } from './ui';

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

const INCLUS = ['Élèves, classes et frais', 'Paiements et reçus', 'Relances aux parents', 'Caisse et rapports'];
const ATOUTS: [any, string][] = [[PiUsersThreeFill, 'Suivi des élèves'], [PiReceiptFill, 'Reçus aux parents'], [PiBellRingingFill, 'Relance des retards'], [PiChartBarFill, 'Rapports clairs']];
const MODES: [string, string, string, string | null, any][] = [
  ['orange_money', 'Orange Money', 'Paiement mobile', '/img/paiement/orange-money.png', null],
  ['mtn_money', 'MTN Mobile Money', 'Paiement mobile', '/img/paiement/mtn-money.png', null],
  ['especes', 'Espèces', 'Remise en main propre', null, PiMoneyWavyDuotone],
  ['virement', 'Virement', 'Compte bancaire', null, PiBankDuotone],
];

function Plan({ k, on, nom, prix, unite, sous, barre, pct, badge, choisir }: any) {
  return (
    <article className={`ab-plan ${k}${on ? ' on' : ''}`}>
      {badge && <span className="ab-badge"><PiStarFill aria-hidden="true" />{badge}</span>}
      <div className="ab-tete">
        <h3><PiCrownSimpleFill aria-hidden="true" />{nom}</h3>
        <div className="ab-barre">{barre ? <><s>{nb(barre)} GNF</s><em>-{pct} %</em></> : <span>Sans engagement</span>}</div>
        <div className="ab-prix"><b>{nb(prix)}</b><span>GNF / {unite}</span></div>
        <small>{sous}</small>
      </div>
      <div className="ab-corps">
        <ul>{INCLUS.map((t) => <li key={t}><PiCheckCircleFill aria-hidden="true" />{t}</li>)}</ul>
        <button type="button" className="ab-choix" onClick={choisir}>{on ? 'Continuer' : `Choisir ${nom}`}<PiArrowRightBold aria-hidden="true" /></button>
      </div>
    </article>
  );
}

export function Abonnement() {
  const { abo, eid, recharger } = useApp(); const [per, setPer] = useState('an'); const [moy, setMoy] = useState('orange_money'); const [ref, setRef] = useState(''); const e = useEnvoi();
  if (!abo) return <><Titre t="Abonnement" /><Vide t="Aucun abonnement trouvé pour cet établissement." /></>;
  const montant = per === 'mois' ? abo.prix_mois : abo.prix_an; const sit = SIT[abo.situation];
  const numero = moy === 'orange_money' ? abo.orange_money : moy === 'mtn_money' ? abo.mtn_money : null; const mobile = moy === 'orange_money' || moy === 'mtn_money';
  const envoyer = (x: any) => {
    x.preventDefault();
    if (mobile && !ref.trim()) return e.setE('Indiquez la référence de la transaction');
    e.envoyer(async () => { await db.rpc('abonnement_declarer', { p_etab: eid, p_periode: per, p_moyen: moy, p_reference: ref.trim() || null }); setRef(''); await recharger(); });
  };
  const reste = abo.situation === 'essai' || abo.situation === 'actif' ? abo.jours : 0;
  const m = abo.prix_mois; const a = abo.prix_an; const plein = m * 12; const remise = a < plein;
  const prendre = (p: string) => { setPer(p); document.getElementById('ab-payer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <>
      <Titre t="Abonnement" />
      <div className="ab">
        <header className="ab-entete">
          <h2>{abo.situation === 'essai' ? 'Choisissez votre abonnement' : 'Renouvelez votre abonnement'}</h2>
          <p>Suivez la scolarité et les impayés de votre école, toute l'année.</p>
        </header>
        <section className="ab-etat" aria-label="Votre formule">
          <div className="ab-jours"><b>{nb(reste)}</b><span>jour{reste > 1 ? 's' : ''}<br />restant{reste > 1 ? 's' : ''}</span></div>
          <div className="ab-infos"><b>Fin le {dateFr(abo.fin)}</b><small>{LIB_T[abo.tranche]}, {nb(abo.eleves)} inscrit{abo.eleves > 1 ? 's' : ''}</small></div>
          <Pastille k={sit[0]} t={sit[1]} />
        </section>
        {m == null || a == null ? (
          <section className="ab-bloc ab-msg"><p>Pour une école de cette taille, le tarif se fixe directement avec Scolaris.</p>{abo.whatsapp && <a className="btn wa" href={waUrl(abo.whatsapp, 'Bonjour Scolaris, je souhaite connaître le tarif pour mon école.')} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Contacter Scolaris</a>}</section>
        ) : abo.en_attente ? (
          <section className="ab-bloc ab-att"><Tuile i={PiHourglassMediumDuotone} ton="orange" t={44} /><div><b>Paiement en cours de vérification</b><small>Votre abonnement sera prolongé dès que Scolaris aura confirmé l'argent reçu.</small></div></section>
        ) : (
          <>
            <div className="ab-bascule" role="group" aria-label="Durée de l'abonnement">
              <button type="button" aria-pressed={per === 'an'} className={per === 'an' ? 'on' : ''} onClick={() => setPer('an')}><b>Annuel</b><small>Par an</small></button>
              <button type="button" aria-pressed={per === 'mois'} className={per === 'mois' ? 'on' : ''} onClick={() => setPer('mois')}><b>Mensuel</b><small>Par mois</small></button>
            </div>
            <div className="ab-plans">
              <Plan k="annuel" on={per === 'an'} nom="Annuel" prix={a} unite="an" badge={remise ? 'Le plus avantageux' : ''} barre={remise ? plein : 0} pct={Math.round((1 - a / plein) * 100)} sous={`${a % 12 ? 'environ' : 'soit'} ${nb(Math.round(a / 12))} GNF / mois`} choisir={() => prendre('an')} />
              <Plan k="mensuel" on={per === 'mois'} nom="Mensuel" prix={m} unite="mois" sous={`${nb(plein)} GNF / an`} choisir={() => prendre('mois')} />
            </div>
          </>
        )}
        <ul className="ab-atouts">{ATOUTS.map(([I, t]) => <li key={t}><I aria-hidden="true" /><span>{t}</span></li>)}</ul>
        {m != null && a != null && !abo.en_attente && (
          <form id="ab-payer" className="ab-bloc ab-paie" onSubmit={envoyer} noValidate>
            <div className="ab-sur"><PiShieldCheckFill aria-hidden="true" /><div><b>Paiement vérifié par Scolaris</b><small>Votre abonnement est prolongé après vérification</small></div></div>
            <div className="ab-modes" role="group" aria-label="Moyen de paiement">
              {MODES.map(([k, t, sous, logo, I]) => <button type="button" key={k} aria-pressed={moy === k} className={moy === k ? 'on' : ''} onClick={() => setMoy(k)}>{moy === k && <PiCheckCircleFill className="ab-coche" aria-hidden="true" />}<span className="ab-logo">{logo ? <img src={logo} alt="" /> : <I aria-hidden="true" />}</span><b>{t}</b><small>{sous}</small></button>)}
            </div>
            <div className="ab-num">{mobile ? (numero ? <><PiPhoneDuotone aria-hidden="true" /><span>Envoyez <b>{gnf(montant)}</b> au <b>{telAff(numero)}</b></span></> : <span>Le numéro de paiement n'est pas encore disponible. Contactez Scolaris.</span>) : <span>Convenez de la remise de <b>{gnf(montant)}</b> avec Scolaris.</span>}</div>
            <Champ label={mobile ? 'Référence de la transaction *' : 'Référence (facultatif)'}><input value={ref} onChange={(x) => setRef(x.target.value)} placeholder="Reçue par SMS" /></Champ>
            <Erreur t={e.erreur} />
            <button className="btn plein" disabled={e.occupe}><PiCheckBold aria-hidden="true" />{e.occupe ? 'Envoi…' : "J'ai payé"}</button>
          </form>
        )}
        <section className="ab-bloc ab-hist">
          <h3>Historique</h3>
          {abo.historique.length === 0 ? <p className="ab-rien">Aucun paiement pour le moment.</p> : <ul className="hist">{abo.historique.map((p: any) => <li key={p.id}><Tuile i={PiReceiptDuotone} ton={p.statut === 'valide' ? 'vert' : p.statut === 'rejete' ? 'rouge' : 'orange'} t={40} /><div><b>{gnf(p.montant)}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}, {dateFr(p.declare_le)}{p.fin ? `, jusqu'au ${dateFr(p.fin)}` : ''}{p.motif ? `. ${p.motif}` : ''}</small></div><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></li>)}</ul>}
        </section>
      </div>
    </>
  );
}
