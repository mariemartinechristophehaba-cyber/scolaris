import { useEffect, useState } from 'react';
import { PiBuildings, PiBuildingsFill, PiGearSix, PiGearSixFill, PiMoneyWavy, PiMoneyWavyFill, PiSquaresFour, PiSquaresFourFill, PiArrowDownBold, PiBuildingsDuotone, PiCalendarCheckDuotone, PiCheckBold, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiCoinsDuotone, PiGaugeDuotone, PiHourglassMediumDuotone, PiMagnifyingGlassBold, PiProhibitFill, PiReceiptDuotone, PiShieldStarDuotone, PiSignOutDuotone, PiSparkleDuotone, PiStudentDuotone, PiTrendUpBold, PiUsersThreeDuotone, PiWhatsappLogoFill, PiXCircleFill, PiPhoneCallFill, PiChatCircleDots, PiChatCircleDotsFill, PiShoppingCartFill, PiInfoFill, PiDatabaseDuotone, PiDownloadSimpleBold } from 'react-icons/pi';
import { auth, db, getSession } from './api';
import { Barres, Jauge, Segments } from './charts';
import { PAYS, auj, dateFr, drapeau, erreurTel, fcfa as gnf, nb, paysDe, telAff } from './lib';
import { Avatar, Bandeau, Chargement, Champ, Ctx, Erreur, Etat, Gnf, Lien, Logo, Modale, Montant, Mot, Pastille, Titre, Tuile, Vague, Vide, useApp, useEnvoi, useQ } from './ui';
import { LIB_M, LIB_P, LIB_T, SIT, ST_P, waUrl } from './abonnement';

const ITEMS: [string, string, any, string, any][] = [['/admin', "Vue d'ensemble", PiSquaresFour, 'Accueil', PiSquaresFourFill], ['/admin/ecoles', 'Écoles', PiBuildings, 'Écoles', PiBuildingsFill], ['/admin/paiements', 'Paiements', PiMoneyWavy, 'Paiements', PiMoneyWavyFill], ['/admin/sms', 'SMS', PiChatCircleDots, 'SMS', PiChatCircleDotsFill], ['/admin/reglages', 'Réglages', PiGearSix, 'Réglages', PiGearSixFill]];
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

const telUrl = (t: string) => { const x = String(t || '').replace(/\D/g, ''); return `tel:${x.length === 9 ? '+224' + x : '+' + x}`; };
const Contact = ({ tel, msg, nom }: any) => tel ? <span className="contact-b"><a className="btn-doux rond-i" href={telUrl(tel)} aria-label={`Appeler ${nom}`}><PiPhoneCallFill aria-hidden="true" /></a><a className="btn wa mini rond-i" href={waUrl(tel, msg)} target="_blank" rel="noreferrer" aria-label={`Écrire à ${nom} sur WhatsApp`}><PiWhatsappLogoFill aria-hidden="true" /></a></span> : null;
const sansPrefixe = (n: any) => String(n || '').replace(/^(école|ecole|groupe scolaire|complexe scolaire|complexe)\s+/i, '');

function Suivi({ s, d }: any) {
  const c = s.croissance; const taux = c.inscrites ? Math.round((c.payantes / c.inscrites) * 100) : 0;
  const risque = (x: any) => ['actif', 'essai'].includes(x.situation) && Number(x.pay_7j) === 0;
  const maxU = Math.max(...s.usage.map((x: any) => Number(x.pay_7j)), 1);
  return <>
    <div className="rang">
      <section className="carte c-large" id="demarrage"><div className="tete-carte"><h2>Écoles qui démarrent mal{s.demarrage.length ? ` (${nb(s.demarrage.length)})` : ''}</h2></div>
        <p className="note">Inscrites, mais sans classes ou sans élèves. Appelez-les pour les aider.</p>
        {s.demarrage.length === 0 ? <p className="note">Toutes les écoles ont créé leurs classes et leurs élèves.</p> : <ul className="lignes-e">{s.demarrage.map((x: any) => <li key={x.id}><div className="ligne-e"><Avatar nom={sansPrefixe(x.nom)} /><div><Lien to={`/admin/ecoles/${x.id}`}><b>{x.pays && <span className="drp" title={paysDe(x.pays).nom}>{drapeau(x.pays)}</span>}{x.nom}</b></Lien><small>{x.fondateur || 'Fondateur'}{x.tel ? ` · ${telAff(x.tel)}` : ''} · {nb(x.classes)} classe{x.classes > 1 ? 's' : ''}, {nb(x.eleves)} élève{x.eleves > 1 ? 's' : ''}</small></div><Contact tel={x.tel} nom={x.nom} msg={`Bonjour ${x.fondateur || ''}, c'est l'équipe Scolaris. Vous avez inscrit ${x.nom}. Je peux vous aider à créer vos classes et vos élèves ?`} /></div></li>)}</ul>}
      </section>
      <section className="carte c-etat"><h2>Écoles gagnées et perdues</h2>
        <div className="croiss">
          <div><span>Inscrites</span><b>{nb(c.inscrites)}</b></div>
          <div><span>Payantes</span><b className="vert">{nb(c.payantes)}</b></div>
          <div><span>Gagnées ce mois</span><b className="vert">{nb(c.gagnees_mois)}</b></div>
          <div><span>Perdues</span><b className="rouge">{nb(c.perdues)}</b></div>
        </div>
        <div className="taux-c"><div><span>Écoles qui paient</span><b>{taux} %</b></div><Barre p={taux} ton="vert" /></div>
        <p className="note">{nb(c.nouvelles_mois)} nouvelle{c.nouvelles_mois > 1 ? 's' : ''} école{c.nouvelles_mois > 1 ? 's' : ''} ce mois{c.essais_non_payes ? ` · ${nb(c.essais_non_payes)} essai${c.essais_non_payes > 1 ? 's' : ''} fini${c.essais_non_payes > 1 ? 's' : ''} sans payer` : ''}.</p>
      </section>
    </div>
    <div className="rang">
      <section className="carte c-large"><div className="tete-carte"><h2>Utilisation cette semaine</h2></div>
        <p className="note">Paiements de parents enregistrés ces 7 derniers jours.</p>
        {s.usage.length === 0 ? <p className="note">Aucune école pour le moment.</p> : <ul className="lignes-e">{s.usage.map((x: any) => <li key={x.id}><Lien to={`/admin/ecoles/${x.id}`} className="ligne-e"><Avatar nom={sansPrefixe(x.nom)} /><div><b>{x.nom}</b><small>{nb(x.eleves)} élève{x.eleves > 1 ? 's' : ''} · dernier paiement : {x.dernier_pay ? quand(x.dernier_pay) : 'jamais'}</small><Barre p={(Number(x.pay_7j) / maxU) * 100} ton={risque(x) ? 'rouge' : 'vert'} /></div>{risque(x) ? <span className="puce-r">À risque</span> : <b className="le-m">{nb(x.pay_7j)}</b>}</Lien></li>)}</ul>}
      </section>
      <section className="carte c-etat"><h2>Argent à venir, 30 jours</h2>
        <div className="a-venir"><Gnf n={s.a_venir.somme} /><small>si les {nb(s.a_venir.nombre)} école{s.a_venir.nombre > 1 ? 's' : ''} renouvelle{s.a_venir.nombre > 1 ? 'nt' : ''}</small></div>
        {s.a_venir.liste.length === 0 ? <p className="note">Aucun abonnement ne se termine dans les 30 prochains jours.</p> : <ul className="lignes-e">{s.a_venir.liste.map((x: any) => <li key={x.id}><Lien to={`/admin/ecoles/${x.id}`} className="ligne-e"><div><b>{x.nom}</b><small>Fin le {dateFr(x.fin)}{x.situation === 'essai' ? ' · essai' : ''}</small></div><b className="le-m">{nb(x.montant)}</b></Lien></li>)}</ul>}
      </section>
    </div>
    <div className="rang">
      <section className="carte c-large" id="sans-ecole"><div className="tete-carte"><h2>Comptes sans école{s.sans_ecole.length ? ` (${nb(s.sans_ecole.length)})` : ''}</h2></div>
        <p className="note">Ils ont créé un compte mais n'ont pas fini l'inscription de leur école.</p>
        {s.sans_ecole.length === 0 ? <p className="note">Aucun compte en attente.</p> : <ul className="lignes-e">{s.sans_ecole.map((x: any) => <li key={x.id}><div className="ligne-e"><Avatar nom={x.nom || x.email || '?'} /><div><b>{x.nom || x.email || 'Sans nom'}</b><small>{[x.telephone && telAff(x.telephone), x.email, `inscrit ${quand(x.cree_le).toLowerCase()}`].filter(Boolean).join(' · ')}</small></div><Contact tel={x.telephone} nom={x.nom || 'ce compte'} msg={`Bonjour ${x.nom || ''}, c'est l'équipe Scolaris. Vous avez créé un compte mais pas encore votre école. Je peux vous aider à finir ?`} /></div></li>)}</ul>}
      </section>
      <section className="carte c-etat vol"><h2>Argent géré dans Scolaris</h2>
        <p className="note">Payé par les parents dans toutes les écoles.</p>
        <div className="a-venir"><Gnf n={s.volume.total} /><small>{nb(s.volume.paiements)} paiement{s.volume.paiements > 1 ? 's' : ''} validé{s.volume.paiements > 1 ? 's' : ''} · {nb(d.eleves_total)} élèves</small></div>
        <dl className="cl-d"><div><dt>Ce mois</dt><dd>{gnf(s.volume.mois)}</dd></div></dl>
      </section>
    </div>
  </>;
}

function AFaire({ d, s }: any) {
  const e = d.ecoles;
  const rg = s?.reglages; const vieille = rg && (!rg.derniere_sauvegarde || Date.now() - new Date(rg.derniere_sauvegarde).getTime() > 7 * 864e5);
  const l = [
    rg?.sans_paiement && { n: '!', ton: 'rouge', t: 'Un tarif n’a pas de lien Chariow', s: "Les écoles de cette tranche ne peuvent pas payer en ligne", to: '/admin/reglages', b: 'Remplir', plein: true },
    vieille && { n: '!', ton: 'orange', t: 'Sauvegarde de la semaine à faire', s: rg.derniere_sauvegarde ? `Dernière : ${dateFr(rg.derniere_sauvegarde)}` : 'Aucune sauvegarde pour le moment', to: '/admin/reglages', b: 'Sauvegarder' },
    d.a_verifier.nombre > 0 && { n: d.a_verifier.nombre, ton: 'orange', t: `${nb(d.a_verifier.nombre)} paiement${d.a_verifier.nombre > 1 ? 's' : ''} à vérifier`, s: `${gnf(d.a_verifier.somme)} d'abonnements`, to: '/admin/paiements', b: 'Vérifier', plein: true },
    d.a_renouveler.length > 0 && { n: d.a_renouveler.length, ton: 'rouge', t: `${nb(d.a_renouveler.length)} école${d.a_renouveler.length > 1 ? 's' : ''} à relancer`, s: 'Abonnement fini ou bientôt', to: '/admin/ecoles?f=retard', b: 'Relancer' },
    Number(e.attente) > 0 && { n: e.attente, ton: 'violet', t: `${nb(e.attente)} école${e.attente > 1 ? 's' : ''} pas encore payée${e.attente > 1 ? 's' : ''}`, s: 'En attente du premier paiement', to: '/admin/ecoles?f=attente', b: 'Voir' },
    s && s.demarrage.length > 0 && { n: s.demarrage.length, ton: 'orange', t: `${nb(s.demarrage.length)} école${s.demarrage.length > 1 ? 's' : ''} démarre${s.demarrage.length > 1 ? 'nt' : ''} mal`, s: 'Sans classes ou sans élèves : appelez', to: '#demarrage', b: 'Appeler' },
    s && s.sans_ecole.length > 0 && { n: s.sans_ecole.length, ton: 'violet', t: `${nb(s.sans_ecole.length)} compte${s.sans_ecole.length > 1 ? 's' : ''} sans école`, s: "Inscription pas terminée", to: '#sans-ecole', b: 'Voir' },
    d.inactives.length > 0 && { n: d.inactives.length, ton: 'bleu', t: `${nb(d.inactives.length)} école${d.inactives.length > 1 ? 's' : ''} sans activité`, s: 'Rien depuis 14 jours', to: '/admin/ecoles', b: 'Voir' },
  ].filter(Boolean) as any[];
  return <section className="carte"><div className="tete-carte"><h2>À faire</h2></div>
    {l.length === 0 ? <div className="action vert"><PiCheckCircleFill aria-hidden="true" /><div><b>Rien à faire</b><small>Tous les paiements sont traités et les écoles sont à jour.</small></div></div>
      : <ul className="lignes-e decide">{l.map((x) => { const C: any = x.to.startsWith('#') ? 'a' : Lien; const pr = x.to.startsWith('#') ? { href: x.to } : { to: x.to }; return <li key={x.t}><C {...pr} className="ligne-e"><span className={`rond ${x.ton}`}>{Number(x.n) > 99 ? '99+' : x.n}</span><div><b>{x.t}</b><small>{x.s}</small></div><span className={x.plein ? 'btn plein mini' : 'btn-doux'}>{x.b}</span></C></li>; })}</ul>}
  </section>;
}

function Vue() {
  const { tableau: q } = useApp();
  const sq = useQ(() => db.rpc('admin_suivi').catch(() => null), []);
  const s: any = sq.data;
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
      <AFaire d={d} s={s} />
      <section className="carte"><div className="tete-carte"><h2>À renouveler{d.a_renouveler.length ? ` (${nb(d.a_renouveler.length)})` : ''}</h2><Lien to="/admin/ecoles?f=retard" className="voir">Toutes les écoles</Lien></div>
        {d.a_renouveler.length === 0 ? <p className="note">Aucun abonnement ne se termine dans les 14 prochains jours.</p> : <ul className="lignes-e">{d.a_renouveler.map((x: any) => <li key={x.id}><div className="ligne-e"><Avatar nom={String(x.nom).replace(/^(école|ecole|groupe scolaire|complexe scolaire|complexe)\s+/i, '')} /><div><Lien to={`/admin/ecoles/${x.id}`}><b>{x.pays && <span className="drp" title={paysDe(x.pays).nom}>{drapeau(x.pays)}</span>}{x.nom}</b></Lien><small>{['grace', 'expire'].includes(x.situation) ? 'Terminé le' : 'Se termine le'} {dateFr(x.fin)}{x.prix_mois ? ` · ${gnf(x.prix_mois)} par mois` : ''}</small></div><span className="bureau-seul"><Sit x={x} /></span>{x.tel && <a className="btn wa mini" href={relancer(x)} target="_blank" rel="noreferrer" aria-label={`Relancer ${x.nom} sur WhatsApp`}><PiWhatsappLogoFill aria-hidden="true" /><span className="bureau-seul">Relancer</span></a>}</div></li>)}</ul>}
      </section>
      <div className="rang">
        <section className="carte c-large"><div className="tete-carte"><h2>Encaissements des 12 derniers mois</h2></div>{vide ? <Vide t="Aucun abonnement encaissé pour le moment." /> : <Barres data={data} />}</section>
        <section className="carte c-etat"><h2>État des écoles</h2>
          <Segments parts={[[Number(e.actif), '#0FA968'], [Number(e.essai), '#1557F0'], [Number(e.grace), '#F79009'], [Number(e.expire), '#E5484D'], [Number(e.suspendu), '#94A0B8']]} />
          <ul className="etats">{ETATS.map(([t, n, I, c]) => <li key={t}><I className={c} aria-hidden="true" />{t}<b>{nb(n)}</b><small>{pc(Number(n))} %</small></li>)}</ul>
        </section>
      </div>
      {s && <Suivi s={s} d={d} />}
      <div className="minis">
        <Mini i={PiSparkleDuotone} ton="violet" t="Nouvelles écoles, 30 jours"><Nb n={e.nouvelles_30j} /></Mini>
        <Mini i={PiUsersThreeDuotone} ton="vert" t="Écoles actives, 7 jours"><Nb n={e.actives_7j} /></Mini>
      </div>
      <div className="rang">
        <section className="carte c-large"><h2>Écoles sans activité</h2>
          {d.inactives.length === 0 ? <p className="note">Toutes les écoles ont travaillé ces 14 derniers jours.</p> : <ul className="lignes-e">{d.inactives.map((x: any) => <li key={x.id}><Lien to={`/admin/ecoles/${x.id}`} className="ligne-e"><Avatar nom={String(x.nom).replace(/^(école|ecole|groupe scolaire|complexe scolaire|complexe)\s+/i, '')} /><div><b>{x.nom}</b><small>Dernière activité : {quand(x.activite)}</small></div><span className="btn-doux">Voir</span></Lien></li>)}</ul>}
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
  const [f, setF] = useState(() => { const v = new URLSearchParams(location.search).get('f') || ''; return FILTRES.some(([k]) => k === v) ? v : 'toutes'; }); const [t, setT] = useState('');
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
          <div className="table vue-bureau"><table><thead><tr><th>École</th><th className="dr">Élèves</th><th>Prix</th><th>Abonnement</th><th>Activité</th><th /></tr></thead><tbody>{l.map((x) => <tr key={x.id}><td><Lien to={`/admin/ecoles/${x.id}`}><b>{x.pays && <span className="drp" title={paysDe(x.pays).nom}>{drapeau(x.pays)}</span>}{x.nom}</b></Lien><small className="bloc">{[x.fondateur, telAff(x.fondateur_tel), x.ville].filter(Boolean).join(', ')}</small></td><td className="dr fort">{nb(x.eleves)}</td><td>{x.prix_mois ? `${nb(x.prix_mois)} / mois` : 'À discuter'}{x.prix_perso && <small className="bloc gr">Prix spécial</small>}</td><td><Sit x={x} /><small className="bloc gr">Jusqu'au {dateFr(x.fin)}</small></td><td className="gr">{quand(x.derniere_activite)}</td><td><div className="acts-l"><Lien className="btn contour mini" to={`/admin/ecoles/${x.id}`}>Ouvrir</Lien></div></td></tr>)}</tbody></table></div>
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

function Sauvegarde({ d, fini }: any) {
  const e = useEnvoi(); const [ok, setOk] = useState('');
  const telecharger = () => e.envoyer(async () => {
    const r = await db.rpc('admin_sauvegarde');
    const b = new Blob([JSON.stringify(r)], { type: 'application/json' }); const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = `scolaris-sauvegarde-${auj()}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
    setOk(`Sauvegarde téléchargée : ${nb(r.lignes)} lignes. Gardez ce fichier sur votre téléphone et sur Google Drive.`); await fini();
  });
  const vieille = !d.derniere_sauvegarde || Date.now() - new Date(d.derniere_sauvegarde).getTime() > 7 * 864e5;
  return <section className="carte para sauv" id="sauvegarde"><div className="sauv-h"><Tuile i={PiDatabaseDuotone} ton={vieille ? 'orange' : 'vert'} t={44} /><div><h2>Sauvegarde des données</h2><p className="note">Toutes les écoles, élèves, parents, frais, paiements et dépenses dans un seul fichier. À faire chaque semaine.</p></div></div>
    <p className={vieille ? 'orange' : 'vert'}><b>{d.derniere_sauvegarde ? `Dernière sauvegarde : ${dateFr(d.derniere_sauvegarde)} à ${String(d.derniere_sauvegarde).slice(11, 16)}` : 'Aucune sauvegarde pour le moment'}</b></p>
    <Erreur t={e.erreur} />{ok && <div className="alerte ok">{ok}</div>}
    <button type="button" className="btn plein" onClick={telecharger} disabled={e.occupe}><PiDownloadSimpleBold aria-hidden="true" />{e.occupe ? 'Préparation…' : 'Télécharger la sauvegarde'}</button>
  </section>;
}

function FormReglages({ d, fini }: any) {
  const [f, setF] = useState({ orange_money: d.orange_money || '', mtn_money: d.mtn_money || '', whatsapp: d.whatsapp || '' }); const [cout, setCout] = useState<number>(Number(d.cout_mensuel)); const [lb, setLb] = useState(String(d.limite_base_mo)); const [lf, setLf] = useState(String(d.limite_fichiers_mo)); const [t, setT] = useState<any[]>(d.tarifs); const [pk, setPk] = useState({ q: Number(d.pack_sms_quantite || 500), p: Number(d.pack_sms_prix_guinee_fcfa || 8000), l: d.pack_sms_lien || '', pa: Number(d.pack_sms_prix_afrique_fcfa || 10000), la: d.pack_sms_lien_afrique || '' }); const [tx, setTx] = useState<any>(d.taux || {}); const DEVS = [...new Set(PAYS.map((p) => p.dev))].filter((v) => v !== 'XOF' && v !== 'XAF'); const [ok, setOk] = useState(false); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => { setOk(false); setF({ ...f, [k]: x.target.value }); } });
  const maj = (i: number, k: string, v: any) => { setOk(false); setT(t.map((x, j) => (j === i ? { ...x, [k]: v } : x))); };
  const entier = (v: string) => v.replace(/\D/g, '');
  return <form className="param-g" noValidate onSubmit={(x) => { x.preventDefault(); { const w = String(f.whatsapp || '').replace(/\D/g, '').replace(/^00/, ''); const er = w.length > 9 && !w.startsWith('224') ? (w.length > 15 ? 'numéro trop long' : '') : erreurTel(w); if (er) return e.setE(`WhatsApp : ${er}`); } for (const x of t) for (const k of ['lien_mois', 'lien_an']) { const v = String(x[k] || '').trim(); if (v && !/^https:\/\/\S+$/.test(v)) return e.setE(`${LIB_T[x.tranche]} : le lien de paiement doit commencer par https://`); } for (const l of [pk.l, pk.la]) if (l.trim() && !/^https:\/\/\S+$/.test(l.trim())) return e.setE('Pack SMS : le lien de paiement doit commencer par https://'); if (!pk.q || !pk.p) return e.setE('Indiquez la taille et le prix du pack de SMS'); if (!Number(lb) || !Number(lf)) return e.setE('Indiquez les limites d’hébergement'); setOk(false); e.envoyer(async () => { await db.rpc('admin_reglages_maj', { p: { ...f, cout_mensuel: cout, limite_base_mo: Number(lb), limite_fichiers_mo: Number(lf), tarifs: t, pack_sms_quantite: pk.q, pack_sms_prix_guinee_fcfa: pk.p, pack_sms_lien: pk.l.trim(), pack_sms_prix_afrique_fcfa: pk.pa, pack_sms_lien_afrique: pk.la.trim(), taux: Object.fromEntries(Object.entries(tx).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])) } }); await fini(); setOk(true); }); }}>
    <div className="param-c"><section className="carte para"><h2>Prix par tranche, en FCFA</h2><p className="note">Chaque école voit son prix converti dans la monnaie de son pays.</p>{t.map((x, i) => <div className="reg-t" key={x.tranche}><b>{LIB_T[x.tranche]}</b><div className="deux"><Champ label="Par mois"><Montant devise="FCFA" value={x.prix_mois || 0} onChange={(v: number) => maj(i, 'prix_mois', v)} placeholder="À discuter" /></Champ><Champ label="Par an"><Montant devise="FCFA" value={x.prix_an || 0} onChange={(v: number) => maj(i, 'prix_an', v)} placeholder="À discuter" /></Champ></div><div className="deux"><Champ label="Lien de paiement (mois)"><input inputMode="url" placeholder="https://…mychariow.store/…" value={x.lien_mois || ''} onChange={(ev) => maj(i, 'lien_mois', ev.target.value)} /></Champ><Champ label="Lien de paiement (an)"><input inputMode="url" placeholder="https://…mychariow.store/…" value={x.lien_an || ''} onChange={(ev) => maj(i, 'lien_an', ev.target.value)} /></Champ></div></div>)}</section><section className="carte para"><h2>Pack de SMS pour les écoles</h2><p className="note">Les écoles à l'abonnement payé peuvent acheter des SMS en plus.</p>
      <div className="deux"><Champ label="Nombre de SMS"><input inputMode="numeric" value={pk.q ? nb(pk.q) : ''} onChange={(ev) => { setOk(false); setPk({ ...pk, q: Number(ev.target.value.replace(/\D/g, '')) || 0 }); }} /></Champ><span /></div>
      <div className="reg-t"><b>Guinée (Nimba SMS)</b><div className="deux"><Champ label="Prix du pack"><Montant devise="FCFA" value={pk.p} onChange={(v: number) => { setOk(false); setPk({ ...pk, p: v }); }} /></Champ><Champ label="Lien Chariow"><input inputMode="url" placeholder="https://…mychariow.com/…" value={pk.l} onChange={(ev) => { setOk(false); setPk({ ...pk, l: ev.target.value }); }} /></Champ></div></div>
      <div className="reg-t"><b>Autres pays</b><div className="deux"><Champ label="Prix du pack"><Montant devise="FCFA" value={pk.pa} onChange={(v: number) => { setOk(false); setPk({ ...pk, pa: v }); }} /></Champ><Champ label="Lien Chariow"><input inputMode="url" placeholder="https://…mychariow.com/…" value={pk.la} onChange={(ev) => { setOk(false); setPk({ ...pk, la: ev.target.value }); }} /></Champ></div><p className="note">Vendu seulement quand un fournisseur de SMS est branché pour le pays.</p></div>
    </section><section className="carte para"><h2>Taux de change</h2><p className="note">Combien vaut 1 FCFA dans chaque monnaie. Vérifiez-les de temps en temps : ils servent à convertir vos prix.</p>
      <div className="reg-tx">{DEVS.map((v) => <label key={v} className="reg-tx-l"><span><b>{v}</b><small>{PAYS.filter((p) => p.dev === v).map((p) => p.nom).join(', ')}</small></span><span className="reg-tx-v"><em>1 FCFA =</em><input inputMode="decimal" value={tx[v] ?? ''} placeholder="0" onChange={(ev) => { setOk(false); setTx({ ...tx, [v]: ev.target.value.replace(',', '.').replace(/[^\d.]/g, '') }); }} /><em>{v}</em></span></label>)}</div>
    </section></div>
    <div className="param-c">
      <section className="carte para"><h2>Contact Scolaris</h2><p className="note">Les écoles paient en ligne par Chariow. Ce numéro WhatsApp leur sert à vous écrire (bouton « Support »). Numéro guinéen, ou étranger avec son indicatif.</p><Champ label="WhatsApp Scolaris"><input inputMode="tel" {...c('whatsapp')} placeholder="620 12 34 56 ou +233 24 123 4567" /></Champ></section>
      <section className="carte para"><h2>Hébergement</h2><Champ label="Coût Vercel et Supabase par mois"><Montant value={cout} onChange={(v: number) => { setOk(false); setCout(v); }} /></Champ><div className="deux"><Champ label="Limite base (Mo)"><input inputMode="numeric" value={lb} onChange={(v) => { setOk(false); setLb(entier(v.target.value)); }} /></Champ><Champ label="Limite fichiers (Mo)"><input inputMode="numeric" value={lf} onChange={(v) => { setOk(false); setLf(entier(v.target.value)); }} /></Champ></div><p className="note">Forfait gratuit : 500 Mo et 1 024 Mo. Forfait Pro : 8 192 Mo et 102 400 Mo.</p></section>
      <Erreur t={e.erreur} />{ok && <div className="alerte ok">Réglages enregistrés</div>}<button className="btn plein" disabled={e.occupe}>Enregistrer</button>
    </div>
  </form>;
}

function AchatSms({ prix, fermer, fini }: any) {
  const e = useEnvoi(); const [qte, setQ] = useState(1000); const [m, setM] = useState<number>(1000 * prix); const [note, setN] = useState('Nimba SMS');
  return <Modale titre="J'ai acheté des SMS" fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); if (!qte) return e.setE('Indiquez le nombre de SMS'); e.envoyer(async () => { await db.rpc('admin_sms_achat', { p_quantite: qte, p_montant: m || 0, p_note: note }); fini(); }); }}>
    <div className="chips-cl q-sms">{[100, 1000, 5000, 10000].map((n) => <button key={n} type="button" className={qte === n ? 'on' : ''} onClick={() => { setQ(n); setM(n * prix); }}>{nb(n)} SMS</button>)}</div>
    <Champ label="Nombre de SMS achetés"><input inputMode="numeric" value={qte ? nb(qte) : ''} onChange={(ev) => { const v = Number(ev.target.value.replace(/\D/g, '')) || 0; setQ(v); setM(v * prix); }} /></Champ>
    <Champ label="Montant payé"><Montant value={m} onChange={setM} /></Champ>
    <Champ label="Fournisseur ou note"><input value={note} onChange={(ev) => setN(ev.target.value)} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />Ajouter au stock</button></form></Modale>;
}

function Sms() {
  const q = useQ(() => db.rpc('admin_sms'), []); const [ach, setA] = useState(false);
  return <Etat q={q}>{(d: any) => {
    const reste = Number(d.restants), achetes = Number(d.achetes); const pct = achetes ? Math.max(0, Math.min(100, (reste / achetes) * 100)) : 0;
    const etat = !achetes ? ['Aucun stock', 'p-rouge'] : pct < 15 ? ['Bientôt vide', 'p-orange'] : ['Stock correct', 'p-vert'];
    const besoin = d.ecoles.reduce((a: number, x: any) => a + (x.auto ? Math.max(0, x.quota - x.utilises) : 0), 0);
    return <>
      <Bandeau><section className="hero hero-simple">
        <div className="hero-haut"><div className="hero-g">
          <div className="hero-titre"><h1>SMS</h1></div>
          <span className="hero-lab">SMS restants</span>
          <div className="hero-val"><b>{nb(reste)}</b><small>SMS</small></div>
          <span className="hero-sur">sur {nb(achetes)} achetés · {nb(d.prix_unitaire)} GNF le SMS</span>
        </div></div>
        <Vague />
      </section></Bandeau>
      <div className="rang r-ordre">
        <section className="carte c-large sms-stock"><div className="tete-carte"><h2>Stock Nimba SMS</h2><span className={`puce ${etat[1]}`}>{etat[0]}</span></div>
          <div className="barre-p"><i style={{ width: `${pct}%`, background: pct < 15 ? '#F79009' : '#0FA968' }} /></div>
          <div className="g-res"><div><span>Envoyés ce mois</span><b>{nb(d.envoyes_mois)}</b></div><div><span>Coût ce mois</span><b>{nb(d.envoyes_mois * d.prix_unitaire)}</b><span>GNF</span></div><div><span>Envoyés au total</span><b>{nb(d.envoyes)}</b></div></div>
          {besoin > reste && <p className="sms-b"><PiInfoFill aria-hidden="true" />Les écoles qui ont activé les SMS peuvent encore en utiliser {nb(besoin)} cette année : rechargez avant d'être à court.</p>}
          {!achetes && <p className="sms-b"><PiInfoFill aria-hidden="true" />Achetez un pack sur Nimba SMS, puis enregistrez-le ici pour suivre ce qu'il vous reste.</p>}
          <button type="button" className="btn plein" onClick={() => setA(true)}><PiShoppingCartFill />J'ai acheté des SMS</button>
        </section>
        <section className="carte c-etat"><div className="tete-carte"><h2>Derniers achats</h2></div>
          {d.achats.length === 0 ? <p className="note">Aucun achat enregistré.</p> : <ul className="lignes-e">{d.achats.map((a: any) => <li key={a.id}><div className="ligne-e"><Tuile i={PiShoppingCartFill} ton="vert" t={38} /><div><b>{nb(a.quantite)} SMS</b><small>{dateFr(a.cree_le)}{a.note ? ` · ${a.note}` : ''}</small></div><b className="le-m">{nb(a.montant)}</b></div></li>)}</ul>}
        </section>
      </div>
      <section className="carte"><div className="tete-carte"><h2>Par école, cette année scolaire</h2></div>
        <p className="note">Chaque école a {nb(3)} SMS par élève et par an, 300 au minimum.</p>
        <ul className="lignes-e">{d.ecoles.map((x: any) => { const p = x.quota ? (x.utilises / x.quota) * 100 : 0; return <li key={x.id}><Lien to={`/admin/ecoles/${x.id}`} className="ligne-e"><Avatar nom={sansPrefixe(x.nom)} /><div><b>{x.nom}</b><small>{nb(x.eleves)} élève{x.eleves > 1 ? 's' : ''} · {x.auto ? 'SMS automatiques activés' : 'SMS automatiques coupés'}</small><Barre p={p} ton={p >= 100 ? 'rouge' : p >= 80 ? 'orange' : 'vert'} /></div><b className={`le-m${p >= 100 ? ' rg' : ''}`}>{nb(x.utilises)} / {nb(x.quota)}</b></Lien></li>; })}</ul>
      </section>
      {ach && <AchatSms prix={d.prix_unitaire} fermer={() => setA(false)} fini={() => { setA(false); q.reload(); }} />}
    </>;
  }}</Etat>;
}

function Reglages() {
  const { tableau } = useApp(); const q = useQ(() => db.rpc('admin_reglages'), []);
  return <><Titre t="Réglages" /><Etat q={q}>{(d: any) => <><Sauvegarde d={d} fini={async () => { await q.reload(); tableau.reload(); }} /><FormReglages d={d} fini={async () => { await q.reload(); tableau.reload(); }} /></>}</Etat></>;
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
  const page = seg[1] === 'ecoles' && seg[2] ? <Fiche id={seg[2]} key={seg[2]} /> : seg[1] === 'ecoles' ? <Ecoles /> : seg[1] === 'paiements' ? <Paiements /> : seg[1] === 'reglages' ? <Reglages /> : seg[1] === 'sms' ? <Sms /> : <Vue />;
  const on = (to: string) => (to === '/admin' ? chemin === '/admin' || chemin === '/admin/' : chemin.startsWith(to));
  const att = Number((tableau.data as any)?.a_verifier?.nombre || 0);
  const md = getSession()?.user?.user_metadata || {}; const nom = `${md.prenom || ''} ${md.nom || ''}`.trim() || getSession()?.user?.email || 'Administrateur';
  const init = nom.split(/\s+/).slice(0, 2).map((x: string) => x[0]).join('').toUpperCase();
  return (
    <Ctx.Provider value={{ zoneBandeau, zoneFiltres: null, can: () => false, tableau }}>
      <div className="app adm">
        <aside className="menu">
          <Lien to="/admin" className="marque"><img src="/img/icone.png" alt="" /><Mot taille={26} /></Lien>
          <nav aria-label="Menu">{ITEMS.map(([to, t, I, , J]) => { const K = on(to) ? J : I; return <Lien key={to} to={to} className={on(to) ? 'actif' : ''}><span className="mi"><K aria-hidden="true" /></span><span>{t}</span>{to === '/admin/paiements' && att > 0 && <em>{att}</em>}</Lien>; })}</nav>
          <div className="profil"><span className="av">{init}</span><div><b>{nom}</b><small>Administrateur</small></div><button onClick={auth.deconnexion} aria-label="Se déconnecter" title="Se déconnecter"><PiSignOutDuotone aria-hidden="true" /></button></div>
        </aside>
        <div className="corps">
          <div className="lignes" aria-hidden="true" />
          <header className="haut"><img className="logo-tel" src="/img/icone.png" alt="" /><div className="ecole"><PiShieldStarDuotone aria-hidden="true" /><b>Administration Scolaris</b></div><div className="esp" /><button className="retour-v adm-sortie" onClick={auth.deconnexion} aria-label="Se déconnecter"><PiSignOutDuotone aria-hidden="true" /></button></header>
          <div className="zone-bandeau" ref={setZB} />
          <main className="feuille">{page}</main>
        </div>
        <nav className="barre-bas" aria-label="Navigation principale">{ITEMS.map(([to, , I, c, J]) => { const K = on(to) ? J : I; return <Lien key={to} to={to} className={on(to) ? 'on' : ''}><K aria-hidden="true" /><span>{c}</span></Lien>; })}</nav>
      </div>
    </Ctx.Provider>
  );
}
