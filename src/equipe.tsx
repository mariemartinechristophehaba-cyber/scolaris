import { useState } from 'react';
import { PiChatTextFill, PiEnvelopeSimpleFill, PiAddressBookDuotone, PiCalculatorDuotone, PiCalendarBlankDuotone, PiChalkboardTeacherDuotone, PiCheckBold, PiCheckCircleDuotone, PiCheckCircleFill, PiCopyBold, PiHandCoinsDuotone, PiKeyDuotone, PiPlusBold, PiReceiptDuotone, PiShoppingCartDuotone, PiStudentDuotone, PiTagDuotone, PiTargetDuotone, PiUserMinusDuotone, PiUserPlusDuotone, PiUsersFourDuotone, PiUsersThreeDuotone, PiWhatsappLogoFill, PiWifiHighDuotone, PiXCircleDuotone } from 'react-icons/pi';
import { db, equipeApi } from './api';
import { auj, dateFr, erreurTel, gnf, heure, nb, tel, telAff, paysActif } from './lib';
import { Avatar, Champ, Erreur, Etat, Modale, Titre, Tuile, Vide, useApp, useEnvoi, useQ } from './ui';

const ROLES: [string, string, string, any][] = [
  ['directeur', 'Directeur', 'Suit les élèves, valide les paiements, autorise les dépenses.', PiChalkboardTeacherDuotone],
  ['comptable', 'Comptable', 'Valide les paiements, paie les dépenses, suit les caisses et les rapports.', PiCalculatorDuotone],
  ['caissier', 'Caissier', 'Enregistre l\'argent reçu et paie les dépenses. Ne valide pas les paiements.', PiHandCoinsDuotone],
  ['secretaire', 'Secrétaire', 'Inscrit les élèves, relance les parents, enregistre les paiements.', PiAddressBookDuotone],
];
const NOM_ROLE: any = { fondateur: 'Fondateur', directeur: 'Directeur', comptable: 'Comptable', caissier: 'Caissier', secretaire: 'Secrétaire', enseignant: 'Enseignant' };
const nomDe = (m: any) => `${m.prenom || ''} ${m.nom || ''}`.trim() || telAff(m.telephone);
const hier = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const connexion = (d: any) => { if (!d) return 'Jamais connecté'; const j = String(d).slice(0, 10); return j === auj() ? `Aujourd'hui à ${heure(d)}` : j === hier() ? `Hier à ${heure(d)}` : `Le ${dateFr(d)}`; };

function ChoixRole({ v, set }: any) {
  return <div className="choix-r">{ROLES.map(([k, t, d, I]) => <button type="button" key={k} aria-pressed={v === k} className={v === k ? 'on' : ''} onClick={() => set(k)}><Tuile i={I} ton="bleu" t={40} /><span><b>{t}</b><small>{d}</small></span>{v === k && <PiCheckCircleFill aria-hidden="true" />}</button>)}</div>;
}

function AjouterMembre({ fermer, fini }: any) {
  const { eid } = useApp(); const [f, setF] = useState({ prenom: '', nom: '', telephone: '', email: '', role: 'comptable' }); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => setF({ ...f, [k]: x.target.value }) });
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!f.prenom.trim() || !f.nom.trim()) return e.setE('Indiquez le prénom et le nom');
    if (!tel(f.telephone)) return e.setE('Indiquez le téléphone'); { const er = erreurTel(f.telephone); if (er) return e.setE(er); }
    e.envoyer(async () => { const r = await equipeApi({ action: 'ajouter', etablissement_id: eid, ...f }); fini({ ...r, email: (f.email || '').trim(), nom: `${f.prenom.trim()} ${f.nom.trim()}`, titre: 'Membre ajouté' }); });
  };
  return <Modale titre="Ajouter un membre" fermer={fermer}><form onSubmit={envoyer} noValidate>
    <div className="deux"><Champ label="Prénom *"><input {...c('prenom')} autoFocus /></Champ><Champ label="Nom *"><input {...c('nom')} /></Champ></div>
    <Champ label="Téléphone *"><input inputMode="tel" placeholder="620 12 34 56" {...c('telephone')} /></Champ>
    <Champ label="E-mail (facultatif)"><input type="email" {...c('email')} /></Champ>
    <div className="champ"><span>Son rôle</span><ChoixRole v={f.role} set={(role: string) => setF({ ...f, role })} /></div>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Création…' : 'Ajouter ce membre'}</button>
  </form></Modale>;
}

function Identifiants({ r, fermer }: any) {
  const { etab } = useApp(); const [copie, setC] = useState(false);
  const lien = `${location.origin}/connexion`; const mail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email || '') && !/@membres\.scolaris\.app$/i.test(r.email) ? r.email : '';
  if (!r.mot_de_passe) return <Modale titre={r.titre} fermer={fermer}><div className="ident-c"><p><b>{r.nom}</b> a déjà un compte Scolaris. Cette personne se connecte avec son mot de passe habituel.</p><button className="btn plein" onClick={fermer}>Compris</button></div></Modale>;
  const msg = `Bonjour ${r.nom}, voici votre accès à Scolaris pour ${etab.nom}.\nLien : ${lien}\nTéléphone : ${telAff(r.telephone)}\nMot de passe provisoire : ${r.mot_de_passe}\nVous choisirez votre mot de passe à la première connexion.`;
  const copier = async () => { try { await navigator.clipboard.writeText(msg); setC(true); } catch { setC(false); } };
  return <Modale titre={r.titre} fermer={fermer}><div className="ident-c">
    <p>Envoyez ces informations à <b>{r.nom}</b>. Ce mot de passe ne sera plus affiché.</p>
    <dl className="ident"><div><dt>Téléphone</dt><dd>{telAff(r.telephone)}</dd></div><div><dt>Mot de passe provisoire</dt><dd className="code">{r.mot_de_passe}</dd></div></dl>
    <div className="ident-env"><span>Envoyer ces informations par</span>
      <a className="ie wa" href={`https://wa.me/224${tel(r.telephone)}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" /><b>WhatsApp</b><small>Gratuit avec Internet</small></a>
      <a className="ie sms" href={`sms:+${paysActif().ind}${tel(r.telephone)}?&body=${encodeURIComponent(msg)}`}><PiChatTextFill aria-hidden="true" /><b>SMS</b><small>Depuis votre téléphone</small></a>
      {mail ? <a className="ie mail" href={`mailto:${mail}?subject=${encodeURIComponent(`Votre accès à Scolaris, ${etab.nom}`)}&body=${encodeURIComponent(msg)}`}><PiEnvelopeSimpleFill aria-hidden="true" /><b>E-mail</b><small>{mail}</small></a> : null}
    </div>
    <button className="btn contour" onClick={copier}><PiCopyBold aria-hidden="true" />{copie ? 'Message copié' : 'Copier le message'}</button>
  </div></Modale>;
}

function ChangerRole({ m, fermer, fini }: any) {
  const [role, setR] = useState(m.role); const e = useEnvoi();
  return <Modale titre={`Rôle de ${nomDe(m)}`} fermer={fermer}><form onSubmit={(x) => { x.preventDefault(); e.envoyer(async () => { await db.upd(`membres?id=eq.${m.membre_id}`, { role }); fini(); }); }}>
    <ChoixRole v={role} set={setR} /><Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}>Enregistrer</button></form></Modale>;
}

function Retirer({ m, fermer, fini }: any) {
  const e = useEnvoi();
  return <Modale titre={`Retirer ${nomDe(m)} ?`} fermer={fermer}><div className="ident-c"><p>Cette personne ne pourra plus entrer dans l'application. Tout ce qu'elle a déjà fait reste enregistré.</p><Erreur t={e.erreur} /><button className="btn contour rouge" disabled={e.occupe} onClick={() => e.envoyer(async () => { await db.upd(`membres?id=eq.${m.membre_id}`, { actif: false }); fini(); })}>Retirer de l'équipe</button><button className="btn lien" onClick={fermer}>Annuler</button></div></Modale>;
}

export function Equipe() {
  const { eid } = useApp(); const e = useEnvoi(); const [aj, setAj] = useState(false); const [ident, setId] = useState<any>(null); const [rol, setRol] = useState<any>(null); const [ret, setRet] = useState<any>(null);
  const q = useQ(() => db.rpc('equipe_liste', { p_etab: eid }), [eid]);
  const reinit = (m: any) => e.envoyer(async () => { const r = await equipeApi({ action: 'reinitialiser', etablissement_id: eid, membre_id: m.membre_id }); setId({ ...r, telephone: r.telephone || m.telephone, email: m.email || '', nom: nomDe(m), titre: 'Nouveau mot de passe' }); });
  const actions = (m: any) => (m.role === 'fondateur' ? null : m.actif ? <>
    <button className="btn contour mini" onClick={() => setRol(m)}>Rôle</button>
    <button className="btn contour mini" onClick={() => reinit(m)} disabled={e.occupe}><PiKeyDuotone aria-hidden="true" />Mot de passe</button>
    <button className="btn contour mini rouge" onClick={() => setRet(m)}>Retirer</button>
  </> : <button className="btn contour mini" onClick={() => e.envoyer(async () => { await db.upd(`membres?id=eq.${m.membre_id}`, { actif: true }); await q.reload(); })}>Réactiver</button>);
  const role = (m: any) => <span className={m.role === 'fondateur' ? 'puce p-bleu' : 'puce'}>{NOM_ROLE[m.role] || m.role}</span>;
  return (
    <>
      <Titre t="Équipe"><button className="btn plein mini" onClick={() => setAj(true)}><PiPlusBold />Ajouter</button></Titre>
      <Erreur t={e.erreur} />
      <Etat q={q}>{(l: any[]) => {
        const actifs = l.filter((m) => m.actif); const jour = actifs.filter((m) => String(m.derniere_connexion || '').slice(0, 10) === auj());
        return <>
          <div className="minis"><div className="carte mini-c"><Tuile i={PiUsersFourDuotone} ton="bleu" t={44} /><div><span>Membres actifs</span><span className="gnf"><b>{nb(actifs.length)}</b></span></div></div><div className="carte mini-c"><Tuile i={PiWifiHighDuotone} ton="vert" t={44} /><div><span>Connectés aujourd'hui</span><span className="gnf"><b>{nb(jour.length)}</b></span></div></div></div>
          <section className="carte c-table">
            {l.length <= 1 && <Vide t="Ajoutez votre comptable, votre caissier ou votre secrétaire." />}
            <div className="table vue-bureau"><table><thead><tr><th>Membre</th><th>Rôle</th><th>Dernière connexion</th><th /></tr></thead><tbody>{l.map((m) => <tr key={m.membre_id} className={m.actif ? '' : 'inactif'}><td><div className="nom-el"><Avatar nom={nomDe(m)} /><span><b>{nomDe(m)}</b><small className="bloc">{telAff(m.telephone)}</small></span></div></td><td>{role(m)}{!m.actif && <small className="bloc gr">Retiré</small>}</td><td className="gr">{connexion(m.derniere_connexion)}</td><td><div className="acts-l">{actions(m)}</div></td></tr>)}</tbody></table></div>
            <ul className="vue-tel liste-p">{l.map((m) => <li key={m.membre_id} className={m.actif ? '' : 'inactif'}><div className="lp-h"><Avatar nom={nomDe(m)} /><div><b>{nomDe(m)}</b><small>{connexion(m.derniere_connexion)}</small></div><div className="fin">{role(m)}</div></div>{m.role !== 'fondateur' && <div className="acts-l">{actions(m)}</div>}</li>)}</ul>
          </section>
        </>;
      }}</Etat>
      {aj && <AjouterMembre fermer={() => setAj(false)} fini={(r: any) => { setAj(false); setId(r); q.reload(); }} />}
      {ident && <Identifiants r={ident} fermer={() => setId(null)} />}
      {rol && <ChangerRole m={rol} fermer={() => setRol(null)} fini={() => { setRol(null); q.reload(); }} />}
      {ret && <Retirer m={ret} fermer={() => setRet(null)} fini={() => { setRet(null); q.reload(); }} />}
    </>
  );
}

const FILTRES: [string, string, string[] | null][] = [['tous', 'Tout', null], ['paiements', 'Paiements', ['paiements']], ['depenses', 'Dépenses', ['depenses']], ['eleves', 'Élèves', ['eleves']], ['equipe', 'Équipe', ['membres']]];

function phrase(x: any, noms: Map<string, string>): [string, any, string] {
  const a = x.action; const av = x.avant || {}; const ap = x.apres || {}; const st = ap.statut; const m = ap.montant ?? av.montant; const mt = m != null ? gnf(m) : ''; const lib = ap.libelle || av.libelle || '';
  switch (x.table_nom) {
    case 'paiements':
      if (a === 'INSERT') return [`a enregistré un paiement de ${mt}`, PiReceiptDuotone, 'bleu'];
      if (st === 'valide') return [`a validé un paiement de ${mt}`, PiCheckCircleDuotone, 'vert'];
      if (st === 'rejete') return [`a rejeté un paiement de ${mt}`, PiXCircleDuotone, 'rouge'];
      if (st === 'annule') return [`a annulé un paiement de ${mt}`, PiXCircleDuotone, 'rouge'];
      return [`a modifié un paiement de ${mt}`, PiReceiptDuotone, 'bleu'];
    case 'depenses':
      if (a === 'INSERT') return [`a ajouté la dépense « ${lib} » de ${mt}`, PiShoppingCartDuotone, 'orange'];
      if (st === 'autorisee') return [`a autorisé la dépense « ${lib} » de ${mt}`, PiCheckCircleDuotone, 'vert'];
      if (st === 'payee') return [`a payé la dépense « ${lib} » de ${mt}`, PiHandCoinsDuotone, 'violet'];
      if (st === 'rejetee') return [`a rejeté la dépense « ${lib} »`, PiXCircleDuotone, 'rouge'];
      if (st === 'annulee') return [`a annulé la dépense « ${lib} »`, PiXCircleDuotone, 'rouge'];
      return [`a modifié la dépense « ${lib} »`, PiShoppingCartDuotone, 'orange'];
    case 'eleves': return [a === 'INSERT' ? 'a ajouté un élève' : a === 'DELETE' ? 'a supprimé un élève' : 'a modifié une fiche élève', PiStudentDuotone, 'bleu'];
    case 'membres': {
      const n = noms.get(ap.profil_id) || 'un membre'; const r = NOM_ROLE[ap.role] || '';
      if (a === 'INSERT') return [`a ajouté ${n} comme ${r.toLowerCase()}`, PiUserPlusDuotone, 'violet'];
      if (av.actif && ap.actif === false) return [`a retiré ${n} de l'équipe`, PiUserMinusDuotone, 'rouge'];
      if (av.actif === false && ap.actif) return [`a réactivé ${n}`, PiUserPlusDuotone, 'violet'];
      if (av.role !== ap.role) return [`a changé le rôle de ${n} : ${r.toLowerCase()}`, PiUsersThreeDuotone, 'violet'];
      return [`a modifié ${n}`, PiUsersThreeDuotone, 'violet'];
    }
    case 'reductions':
      if (a === 'INSERT' && st !== 'autorisee') return [`a demandé une réduction de ${mt}`, PiTagDuotone, 'orange'];
      if (st === 'autorisee') return [`a accordé une réduction de ${mt}`, PiTagDuotone, 'vert'];
      if (st === 'refusee') return [`a refusé une réduction de ${mt}`, PiXCircleDuotone, 'rouge'];
      return [`a annulé une réduction de ${mt}`, PiXCircleDuotone, 'rouge'];
    case 'tarifs': return [a === 'INSERT' ? `a fixé un tarif de ${mt}` : `a changé un tarif : ${mt}`, PiTagDuotone, 'bleu'];
    case 'classes': return [`${a === 'INSERT' ? 'a créé' : a === 'DELETE' ? 'a supprimé' : 'a modifié'} la classe ${ap.nom || av.nom || ''}`, PiUsersThreeDuotone, 'bleu'];
    case 'annees_scolaires': return [st === 'active' && av.statut !== 'active' ? `a activé l'année ${lib}` : a === 'INSERT' ? `a créé l'année ${lib}` : `a modifié l'année ${lib}`, PiCalendarBlankDuotone, 'orange'];
    case 'objectifs_financiers': return [`a fixé l'objectif à ${mt}`, PiTargetDuotone, 'vert'];
    default: return ['a modifié des données', PiReceiptDuotone, 'bleu'];
  }
}

const jourDe = (d: string) => (d === auj() ? "Aujourd'hui" : d === hier() ? 'Hier' : dateFr(d));

export function Activite() {
  const { eid } = useApp(); const [f, setF] = useState('tous'); const [acteur, setA] = useState(''); const [plus, setP] = useState<any[]>([]); const [fini, setFini] = useState(false); const e = useEnvoi();
  const page = (avant: number | null) => db.rpc('journal_lecture', { p_etab: eid, p_avant: avant, p_acteur: acteur || null, p_tables: FILTRES.find(([k]) => k === f)?.[2] || null, p_limite: 40 });
  const eq = useQ(() => db.rpc('equipe_liste', { p_etab: eid }), [eid]);
  const q = useQ(() => page(null), [eid, f, acteur]);
  const changer = (fn: () => void) => { setP([]); setFini(false); fn(); };
  const equipe: any[] = (eq.data as any) || [];
  const noms = new Map<string, string>(equipe.map((m) => [m.profil_id, nomDe(m)]));
  return (
    <>
      <Titre t="Qui a fait quoi" />
      <div className="segment" role="tablist">{FILTRES.map(([k, t]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? 'on' : ''} onClick={() => changer(() => setF(k))}>{t}</button>)}</div>
      <div className="barre-outils"><select value={acteur} onChange={(x) => changer(() => setA(x.target.value))} aria-label="Personne"><option value="">Toute l'équipe</option>{equipe.map((m) => <option key={m.profil_id} value={m.profil_id}>{nomDe(m)}</option>)}</select></div>
      <Erreur t={e.erreur} />
      <Etat q={q}>{(d: any[]) => {
        const l = [...d, ...plus]; const groupes: [string, any[]][] = [];
        l.forEach((x) => { const j = String(x.cree_le).slice(0, 10); const g = groupes[groupes.length - 1]; if (g && g[0] === j) g[1].push(x); else groupes.push([j, [x]]); });
        const encore = !fini && d.length === 40 && (plus.length === 0 || plus.length % 40 === 0);
        return <section className="carte">
          {l.length === 0 ? <Vide t="Aucune action pour le moment." /> : groupes.map(([j, g]) => <div className="jr" key={j}><h2>{jourDe(j)}</h2><ul className="hist">{g.map((x) => { const [t, I, ton] = phrase(x, noms); return <li key={x.id}><Tuile i={I} ton={ton} t={40} /><div><p><b>{x.acteur_nom || 'Scolaris'}</b> {t}</p>{x.eleve_nom && x.table_nom !== 'membres' && <small>{x.eleve_nom}</small>}</div><small className="hr">{heure(x.cree_le)}</small></li>; })}</ul></div>)}
          {encore && <div className="plus-l"><button className="btn contour mini" disabled={e.occupe} onClick={() => e.envoyer(async () => { const s = await page(l[l.length - 1].id); setP([...plus, ...s]); if (s.length < 40) setFini(true); })}>Voir la suite</button></div>}
        </section>;
      }}</Etat>
    </>
  );
}
