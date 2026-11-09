import { useState } from 'react';
import { PiSignOutBold, PiCalendarCheckDuotone, PiCheckBold, PiCheckCircleFill, PiCoinsDuotone, PiHourglassMediumDuotone, PiMagnifyingGlassBold, PiPhoneDuotone, PiReceiptDuotone, PiStudentDuotone, PiWarningCircleFill, PiWarningDuotone, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, db } from './api';
import { auj, dateFr, gnf, nb, tel, telAff } from './lib';
import { Chargement, Champ, Ctx, Erreur, Etat, Gnf, Lien, Logo, Modale, Montant, Mot, Pastille, Titre, Tuile, Vide, useApp, useEnvoi, useQ } from './ui';

const LIB_T: any = { moins_200: "Jusqu'à 200 élèves", '201_500': '201 à 500 élèves', '501_1000': '501 à 1 000 élèves', plus_1000: 'Plus de 1 000 élèves' };
const SIT: any = { essai: ['partiel', 'Essai gratuit'], actif: ['a_jour', 'Actif'], grace: ['retard', 'Terminé'], expire: ['rien', 'Expiré'], suspendu: ['rien', 'Suspendu'] };
const MOYENS: [string, string][] = [['orange_money', 'Orange Money'], ['mtn_money', 'MTN Money'], ['especes', 'Espèces'], ['virement', 'Virement']];
const LIB_M: any = Object.fromEntries(MOYENS);
const LIB_P: any = { mois: '1 mois', an: '1 an' };
const ST_P: any = { en_attente: ['retard', 'À vérifier'], valide: ['a_jour', 'Validé'], rejete: ['rien', 'Rejeté'] };
const waUrl = (n: string, t = '') => { const x = tel(n); return `https://wa.me/${x.length === 9 ? '224' + x : x}${t ? `?text=${encodeURIComponent(t)}` : ''}`; };

export function BandeauAbonnement({ cache }: { cache: boolean }) {
  const { abo, role } = useApp();
  if (!abo || cache) return null;
  const { situation: s, jours, jours_grace: g } = abo; let t = ''; let ton = 'orange';
  if ((s === 'essai' || s === 'actif') && jours <= 7) t = `Votre ${s === 'essai' ? 'essai gratuit' : 'abonnement'} se termine ${jours === 0 ? "aujourd'hui" : jours === 1 ? 'demain' : `dans ${jours} jours`}.`;
  else if (s === 'grace') t = `Votre abonnement est terminé. Plus que ${g} jour${g > 1 ? 's' : ''} avant le passage en lecture seule.`;
  else if (s === 'expire') { t = "Abonnement expiré : vous pouvez consulter vos données, mais plus rien enregistrer."; ton = 'rouge'; } else if (s === 'suspendu') { t = 'Cet établissement est suspendu : contactez Scolaris.'; ton = 'rouge'; }
  if (!t) return null;
  return <div className={`band-abo ${ton}`} role="status"><PiWarningCircleFill aria-hidden="true" /><span>{t}</span>{role === 'fondateur' ? <Lien to="/abonnement" className="btn plein mini">Renouveler</Lien> : <small>Prévenez le fondateur.</small>}</div>;
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
          <h2>Renouveler</h2>
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

function Prolonger({ x, fermer, fini }: any) {
  const [m, setM] = useState(1); const [n, setN] = useState(''); const e = useEnvoi();
  return <Modale titre={`Prolonger ${x.nom}`} fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); e.envoyer(async () => { await db.rpc('admin_prolonger', { p_etab: x.id, p_mois: m, p_note: n.trim() || null }); fini(); }); }}>
    <div className="champ"><span>Ajouter</span><div className="segment seg-g">{[1, 3, 6, 12].map((k) => <button type="button" key={k} aria-pressed={m === k} className={m === k ? 'on' : ''} onClick={() => setM(k)}>{k} mois</button>)}</div></div>
    <Champ label="Note (facultatif)"><input value={n} onChange={(v) => setN(v.target.value)} placeholder="Geste commercial, retard de paiement…" /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Prolonger</button></form></Modale>;
}

function PrixEcole({ x, fermer, fini }: any) {
  const [a, setA] = useState<number>(x.prix_mois || 0); const [b, setB] = useState<number>(x.prix_an || 0); const e = useEnvoi();
  const enreg = (m: number | null, an: number | null) => e.envoyer(async () => { await db.rpc('admin_prix_ecole', { p_etab: x.id, p_prix_mois: m, p_prix_an: an }); fini(); });
  return <Modale titre={`Prix de ${x.nom}`} fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); if (!a || !b) return e.setE('Indiquez les deux prix'); enreg(a, b); }}>
    <Champ label="Prix par mois"><Montant value={a} onChange={setA} /></Champ><Champ label="Prix par an"><Montant value={b} onChange={setB} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button>{x.prix_perso && <button type="button" className="btn lien" onClick={() => enreg(null, null)}>Revenir au prix de la tranche</button>}</form></Modale>;
}

function Rejeter({ p, fermer, fini }: any) {
  const [m, setM] = useState(''); const e = useEnvoi();
  return <Modale titre="Rejeter ce paiement" fermer={fermer}><form onSubmit={(v) => { v.preventDefault(); if (!m.trim()) return e.setE('Indiquez le motif'); e.envoyer(async () => { await db.rpc('admin_rejeter_paiement', { p_id: p.id, p_motif: m.trim() }); fini(); }); }}>
    <Champ label="Motif *"><input value={m} onChange={(v) => setM(v.target.value)} autoFocus placeholder="Argent non reçu" /></Champ><Erreur t={e.erreur} /><button className="btn contour rouge" disabled={e.occupe}>Rejeter</button></form></Modale>;
}

function Suspendre({ x, fermer, fini }: any) {
  const e = useEnvoi();
  return <Modale titre={`Suspendre ${x.nom} ?`} fermer={fermer}><div className="ident-c"><p>L'école pourra consulter ses données, mais plus rien enregistrer.</p><Erreur t={e.erreur} /><button className="btn contour rouge" disabled={e.occupe} onClick={() => e.envoyer(async () => { await db.rpc('admin_suspendre', { p_etab: x.id, p_suspendre: true }); fini(); })}>Suspendre l'école</button><button className="btn lien" onClick={fermer}>Annuler</button></div></Modale>;
}

function Reglages({ d, fini }: any) {
  const [f, setF] = useState({ orange_money: d.orange_money || '', mtn_money: d.mtn_money || '', whatsapp: d.whatsapp || '' }); const [t, setT] = useState<any[]>(d.tarifs); const [ok, setOk] = useState(false); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => { setOk(false); setF({ ...f, [k]: x.target.value }); } });
  const maj = (i: number, k: string, v: number) => { setOk(false); setT(t.map((x, j) => (j === i ? { ...x, [k]: v } : x))); };
  return <form className="param-g" onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.rpc('admin_reglages_maj', { p: { ...f, tarifs: t } }); await fini(); setOk(true); }); }}>
    <section className="carte para"><h2>Prix par tranche</h2>{t.map((x, i) => <div className="reg-t" key={x.tranche}><b>{LIB_T[x.tranche]}</b><div className="deux"><Champ label="Par mois"><Montant value={x.prix_mois || 0} onChange={(v: number) => maj(i, 'prix_mois', v)} placeholder="À discuter" /></Champ><Champ label="Par an"><Montant value={x.prix_an || 0} onChange={(v: number) => maj(i, 'prix_an', v)} placeholder="À discuter" /></Champ></div></div>)}</section>
    <section className="carte para"><h2>Numéros de paiement</h2><p className="note">Affichés aux écoles sur la page Abonnement.</p>
      <Champ label="Orange Money"><input inputMode="tel" {...c('orange_money')} placeholder="620 12 34 56" /></Champ><Champ label="MTN Money"><input inputMode="tel" {...c('mtn_money')} placeholder="664 12 34 56" /></Champ><Champ label="WhatsApp Scolaris"><input inputMode="tel" {...c('whatsapp')} placeholder="620 12 34 56" /></Champ>
      <Erreur t={e.erreur} />{ok && <div className="alerte ok">Réglages enregistrés</div>}<button className="btn plein" disabled={e.occupe}>Enregistrer</button></section>
  </form>;
}

export function EspaceAdmin() {
  const [zoneBandeau, setZB] = useState<HTMLDivElement | null>(null);
  const q = useQ(() => db.rpc('suis_je_admin'), []);
  if (q.erreur && q.data == null) return <main className="pub"><section className="carte-pub"><Logo /><Erreur t={q.erreur} /><button className="btn plein" onClick={q.reload}>Réessayer</button><button className="btn lien" onClick={auth.deconnexion}>Se déconnecter</button></section></main>;
  if (q.data == null) return <main className="pub"><Chargement /></main>;
  if (q.data !== true) return <main className="pub"><section className="carte-pub"><Logo /><h1>Accès réservé</h1><p className="intro">Cette page n'est pas accessible avec ce compte.</p><button className="btn plein" onClick={auth.deconnexion}>Se déconnecter</button></section></main>;
  return (
    <Ctx.Provider value={{ zoneBandeau, zoneFiltres: null, can: () => false }}>
      <div className="app adm">
        <div className="corps">
          <div className="lignes" aria-hidden="true" />
          <header className="haut"><img className="adm-logo" src="/img/icone.png" alt="" /><Mot taille={24} /><div className="esp" /><button className="btn contour mini adm-sortie" onClick={auth.deconnexion} aria-label="Se déconnecter"><PiSignOutBold aria-hidden="true" /><span className="bureau-seul-t">Se déconnecter</span></button></header>
          <div className="zone-bandeau" ref={setZB} />
          <main className="feuille"><Administration /></main>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function Administration() {
  const [o, setO] = useState('ecoles'); const [t, setT] = useState(''); const [pro, setPro] = useState<any>(null); const [prix, setPrix] = useState<any>(null); const [sus, setSus] = useState<any>(null); const [rej, setRej] = useState<any>(null); const e = useEnvoi();
  const q = useQ(async () => { const [ecoles, pay, reg] = await Promise.all([db.rpc('admin_ecoles'), db.rpc('admin_paiements', { p_limite: 200 }), db.rpc('admin_reglages')]); return { ecoles, pay, reg }; }, []);
  const activite = (d: any) => { if (!d) return 'Aucune'; const j = String(d).slice(0, 10); return j === auj() ? "Aujourd'hui" : dateFr(d); };
  const rel = (f: any) => e.envoyer(async () => { await f(); await q.reload(); });
  return (
    <>
      <Titre t="Administration" />
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d: any) => {
        const n = (f: (x: any) => boolean) => d.ecoles.filter(f).length; const att = d.pay.filter((p: any) => p.statut === 'en_attente'); const mois = auj().slice(0, 7);
        const enc = d.pay.filter((p: any) => p.statut === 'valide' && String(p.declare_le).startsWith(mois)).reduce((s: number, p: any) => s + Number(p.montant), 0);
        const s = t.trim().toLowerCase(); const l = s ? d.ecoles.filter((x: any) => `${x.nom} ${x.ville || ''} ${x.fondateur || ''}`.toLowerCase().includes(s)) : d.ecoles;
        const statut = (x: any) => <Pastille k={SIT[x.situation][0]} t={SIT[x.situation][1]} />;
        const actions = (x: any) => <>
          <button className="btn contour mini" onClick={() => setPro(x)}><PiCalendarCheckDuotone aria-hidden="true" />Prolonger</button>
          <button className="btn contour mini" onClick={() => setPrix(x)}>Prix</button>
          {x.situation === 'suspendu' ? <button className="btn contour mini" onClick={() => rel(() => db.rpc('admin_suspendre', { p_etab: x.id, p_suspendre: false }))}>Réactiver</button> : <button className="btn contour mini rouge" onClick={() => setSus(x)}>Suspendre</button>}
        </>;
        const actP = (p: any) => (p.statut === 'en_attente' ? <><button className="btn plein mini" onClick={() => rel(() => db.rpc('admin_valider_paiement', { p_id: p.id }))}><PiCheckBold />Valider</button><button className="btn contour mini rouge" onClick={() => setRej(p)}>Rejeter</button></> : null);
        return <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiStudentDuotone} ton="bleu" t={44} /><div><span>Écoles ({nb(n((x) => x.situation === 'actif'))} actives, {nb(n((x) => x.situation === 'essai'))} en essai)</span><span className="gnf"><b>{nb(d.ecoles.length)}</b></span></div></div><div className="carte mini-c"><Tuile i={PiWarningDuotone} ton="rouge" t={44} /><div><span>Expirées ou suspendues</span><span className="gnf"><b>{nb(n((x) => ['grace', 'expire', 'suspendu'].includes(x.situation)))}</b></span></div></div><div className="carte mini-c"><Tuile i={PiCoinsDuotone} ton="vert" t={44} /><div><span>Encaissé ce mois</span><Gnf n={enc} /></div></div></div>
          <div className="segment" role="tablist">{[['ecoles', 'Écoles', d.ecoles.length], ['paiements', 'À vérifier', att.length], ['reglages', 'Réglages', null]].map(([k, x, c]: any) => <button key={k} role="tab" aria-selected={o === k} className={o === k ? 'on' : ''} onClick={() => setO(k)}>{x}{c != null && <em>{nb(c)}</em>}</button>)}</div>
          {o === 'ecoles' && <>
            <div className="barre-outils"><div className="recherche"><PiMagnifyingGlassBold aria-hidden="true" /><input value={t} onChange={(x) => setT(x.target.value)} placeholder="Rechercher une école" aria-label="Rechercher une école" /></div></div>
            <section className="carte c-table">{l.length === 0 ? <Vide t="Aucune école trouvée." /> : <>
              <div className="table vue-bureau"><table><thead><tr><th>École</th><th className="dr">Élèves</th><th>Prix</th><th>Abonnement</th><th>Activité</th><th /></tr></thead><tbody>{l.map((x: any) => <tr key={x.id}><td><b>{x.nom}</b><small className="bloc">{[x.fondateur, telAff(x.fondateur_tel), x.ville].filter(Boolean).join(', ')}</small></td><td className="dr fort">{nb(x.eleves)}</td><td>{x.prix_mois ? `${nb(x.prix_mois)} / mois` : 'À discuter'}{x.prix_perso && <small className="bloc gr">Prix spécial</small>}</td><td>{statut(x)}<small className="bloc gr">Jusqu'au {dateFr(x.fin)}</small></td><td className="gr">{activite(x.derniere_activite)}</td><td><div className="acts-l">{actions(x)}</div></td></tr>)}</tbody></table></div>
              <ul className="vue-tel liste-p">{l.map((x: any) => <li key={x.id}><div className="lp-h"><div><b>{x.nom}</b><small>{nb(x.eleves)} élèves, jusqu'au {dateFr(x.fin)}</small></div><div className="fin">{statut(x)}</div></div><div className="acts-l">{actions(x)}</div></li>)}</ul>
            </>}</section>
          </>}
          {o === 'paiements' && <section className="carte c-table">{d.pay.length === 0 ? <Vide t="Aucun paiement déclaré." /> : <>
            <div className="table vue-bureau"><table><thead><tr><th>Date</th><th>École</th><th className="dr">Montant</th><th>Durée</th><th>Moyen</th><th>Statut</th><th /></tr></thead><tbody>{d.pay.map((p: any) => <tr key={p.id}><td className="gr">{dateFr(p.declare_le)}</td><td><b>{p.ecole}</b><small className="bloc">{nb(p.eleves)} élèves</small></td><td className="dr fort">{nb(p.montant)}</td><td>{LIB_P[p.periode]}</td><td>{LIB_M[p.moyen]}{p.reference && <small className="bloc">{p.reference}</small>}</td><td><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></td><td><div className="acts-l">{actP(p)}</div></td></tr>)}</tbody></table></div>
            <ul className="vue-tel liste-p">{d.pay.map((p: any) => <li key={p.id}><div className="lp-h"><div><b>{p.ecole}</b><small>{LIB_P[p.periode]}, {LIB_M[p.moyen]}{p.reference ? `, ${p.reference}` : ''}</small></div><div className="fin"><span className="gnf"><b>{nb(p.montant)}</b></span><Pastille k={ST_P[p.statut][0]} t={ST_P[p.statut][1]} /></div></div>{p.statut === 'en_attente' && <div className="acts-l">{actP(p)}</div>}</li>)}</ul>
          </>}</section>}
          {o === 'reglages' && <Reglages d={d.reg} fini={q.reload} />}
          {pro && <Prolonger x={pro} fermer={() => setPro(null)} fini={() => { setPro(null); q.reload(); }} />}
          {prix && <PrixEcole x={prix} fermer={() => setPrix(null)} fini={() => { setPrix(null); q.reload(); }} />}
          {sus && <Suspendre x={sus} fermer={() => setSus(null)} fini={() => { setSus(null); q.reload(); }} />}
          {rej && <Rejeter p={rej} fermer={() => setRej(null)} fini={() => { setRej(null); q.reload(); }} />}
        </>;
      }}</Etat>
    </>
  );
}
