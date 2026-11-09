import { useState } from 'react';
import { PiCheckBold, PiHourglassMediumDuotone, PiPhoneDuotone, PiReceiptDuotone, PiWarningCircleFill, PiWhatsappLogoFill } from 'react-icons/pi';
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
  return (
    <>
      <Titre t="Abonnement" />
      <div className="abo-g">
        <section className="carte abo-e">
            <div className="tete-carte"><h2>Votre formule</h2><Pastille k={sit[0]} t={sit[1]} /></div>
            <div className="abo-j"><b>{nb(reste)}</b><span>jour{reste > 1 ? 's' : ''} restant{reste > 1 ? 's' : ''}</span></div>
            <dl className="cl-d"><div><dt>Date de fin</dt><dd>{dateFr(abo.fin)}</dd></div><div><dt>Élèves inscrits</dt><dd>{nb(abo.eleves)}</dd></div><div><dt>Tranche</dt><dd>{LIB_T[abo.tranche]}</dd></div></dl>
        </section>
        <section className="carte abo-p">
          <h2>{abo.situation === 'essai' ? 'Acheter mon abonnement' : 'Renouveler'}</h2>
          {abo.prix_mois == null || abo.prix_an == null ? <div className="ident-c"><p>Pour une école de cette taille, le tarif se fixe directement avec Scolaris.</p>{abo.whatsapp && <a className="btn wa" href={waUrl(abo.whatsapp, 'Bonjour Scolaris, je souhaite connaître le tarif pour mon école.')} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Contacter Scolaris</a>}</div>
            : abo.en_attente ? <div className="abo-att"><Tuile i={PiHourglassMediumDuotone} ton="orange" t={44} /><div><b>Paiement en cours de vérification</b><small>Votre abonnement sera prolongé dès que Scolaris aura confirmé l'argent reçu.</small></div></div>
              : <form onSubmit={envoyer} noValidate>
                <div className="plans">
                  <button type="button" aria-pressed={per === 'mois'} className={per === 'mois' ? 'on' : ''} onClick={() => setPer('mois')}><span>Par mois</span><Gnf n={abo.prix_mois} /></button>
                  <button type="button" aria-pressed={per === 'an'} className={per === 'an' ? 'on' : ''} onClick={() => setPer('an')}><span>Par an</span><Gnf n={abo.prix_an} />{abo.prix_an < abo.prix_mois * 12 && <em>au lieu de {nb(abo.prix_mois * 12)}</em>}</button>
                </div>
                <div className="champ"><span>Comment avez-vous payé ?</span><div className="segment seg-g">{MOYENS.map(([k, t]) => <button type="button" key={k} aria-pressed={moy === k} className={moy === k ? 'on' : ''} onClick={() => setMoy(k)}>{t}</button>)}</div></div>
                <div className="abo-num">{mobile ? (numero ? <><PiPhoneDuotone aria-hidden="true" /><span>Envoyez <b>{gnf(montant)}</b> au <b>{telAff(numero)}</b></span></> : <span>Le numéro de paiement n'est pas encore disponible. Contactez Scolaris.</span>) : <span>Convenez de la remise de <b>{gnf(montant)}</b> avec Scolaris.</span>}</div>
                <Champ label={mobile ? 'Référence de la transaction *' : 'Référence (facultatif)'}><input value={ref} onChange={(x) => setRef(x.target.value)} placeholder="Reçue par SMS" /></Champ>
                <Erreur t={e.erreur} />
                <button className="btn plein" disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Envoi…' : "J'ai payé"}</button>
                <p className="note ctr">Scolaris vérifie l'argent reçu, puis prolonge votre abonnement.</p>
              </form>}
        </section>
          <section className="carte abo-h">
            <h2>Historique</h2>
            {abo.historique.length === 0 ? <Vide t="Aucun paiement pour le moment." /> : <ul className="hist">{abo.historique.map((p: any) => <li key={p.id}><Tuile i={PiReceiptDuotone} ton={p.statut === 'valide' ? 'vert' : p.statut === 'rejete' ? 'rouge' : 'orange'} t={40} /><div><b>{gnf(p.montant)}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}, {dateFr(p.declare_le)}{p.fin ? `, jusqu'au ${dateFr(p.fin)}` : ''}{p.motif ? `. ${p.motif}` : ''}</small></div><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></li>)}</ul>}
          </section>
      </div>
    </>
  );
}
