import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { PiArrowLeftBold, PiArrowRightBold, PiBellRingingDuotone, PiBuildingsDuotone, PiCaretLeftBold, PiChalkboardTeacherDuotone, PiChartLineUpDuotone, PiCheckBold, PiCheckCircleFill, PiEnvelopeSimpleDuotone, PiEyeDuotone, PiEyeSlashDuotone, PiLockKeyDuotone, PiMapPinDuotone, PiPhoneDuotone, PiSealCheckFill, PiStudentDuotone, PiTargetDuotone, PiUserDuotone, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, db } from './api';
import { TRANCHES, gnf, tel, trancheDe } from './lib';
import { Erreur, Gnf, Lien, Mot, Tuile, naviguer, useEnvoi } from './ui';

// Écrans d'accès : même habillage bleu nuit que l'application (voir app.css, classes acc-*).
function Apercu() {
  return (
    <div className="acc-h" aria-hidden="true">
      <div className="acc-hc">
        <div className="acc-hl"><Tuile i={PiTargetDuotone} ton="bleu" t={34} /><b>Objectif annuel</b><em>68 %</em></div>
        <Gnf n={340000000} />
        <p>encaissés sur 500 000 000 GNF</p>
        <div className="acc-bar"><i /></div>
      </div>
      <span className="acc-chip c1"><PiSealCheckFill />Reçu validé</span>
      <span className="acc-chip c2"><PiWhatsappLogoFill />Relance envoyée</span>
    </div>
  );
}

function Cadre({ v = 'logo', retour, titre, sous, simple, children }: any) {
  return (
    <main className={`acc acc-${v}`}>
      <section className="acc-c">
        <div className="lignes" aria-hidden="true" />
        <div className="acc-i">
          {retour && <Lien className="retour-v acc-ret" to={retour} aria-label="Retour"><PiArrowLeftBold /></Lien>}
          <div className="acc-m">
            <img src="/img/icone.png" width="512" height="512" alt="" />
            <Mot taille={40} />
            <p>La scolarité, sans impayés</p>
            <svg className="acc-sw" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true"><path d="M2 16C60-4 142-3 198 10 142 3 62 5 2 16Z" fill="currentColor" /></svg>
          </div>
          {!simple && <Apercu />}
          {v === 'compte' && <div className="acc-tt"><h1>{titre}</h1><p>{sous}</p></div>}
        </div>
      </section>
      <section className="acc-f">
        <div className="acc-fi">
          {v === 'compte' ? <><h2 className="acc-t2">{titre}</h2><p className="acc-s">{sous}</p></> : titre && <><h1>{titre}</h1>{sous && <p className="acc-s">{sous}</p>}</>}
          {children}
        </div>
      </section>
    </main>
  );
}

function Champ({ i, label, mdp, type, ...p }: any) {
  const [voir, setV] = useState(false);
  return (
    <label className="acc-ch">
      <Tuile i={i} ton="bleu" t={34} />
      <span className="acc-l"><small>{label}</small><input type={mdp ? (voir ? 'text' : 'password') : type || 'text'} {...p} /></span>
      {mdp && <button type="button" className="acc-oeil" onClick={() => setV(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}</button>}
    </label>
  );
}

export function Accueil() {
  return (
    <Cadre v="accueil" titre="Bienvenue sur Scolaris" sous="Gérez facilement les paiements et le suivi de votre établissement.">
      <div className="acc-bt">
        <Lien className="btn plein" to="/connexion">Se connecter</Lien>
        <Lien className="btn contour" to="/inscription">Créer un compte</Lien>
      </div>
      <div className="acc-at">
        <div><Tuile i={PiChartLineUpDuotone} ton="bleu" />Suivi des paiements</div>
        <div><Tuile i={PiBellRingingDuotone} ton="bleu" />Relances aux parents</div>
        <div><Tuile i={PiStudentDuotone} ton="bleu" />Gestion des élèves</div>
      </div>
    </Cadre>
  );
}

export function Connexion() {
  const [id, setId] = useState(''); const [m, setM] = useState(''); const e = useEnvoi();
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!id.trim() || !m) return e.setE('Indiquez votre identifiant et votre mot de passe');
    e.envoyer(async () => { await auth.connexion(id, m); naviguer('/tableau'); });
  };
  return (
    <Cadre retour="/" titre="Connexion" sous="Accédez à votre espace">
      <form className="acc-form" noValidate onSubmit={envoyer}>
        <Champ i={PiEnvelopeSimpleDuotone} label="E-mail ou téléphone" placeholder="620 12 34 56" autoComplete="username" autoCapitalize="none" spellCheck={false} value={id} onChange={(x: any) => setId(x.target.value)} />
        <Champ i={PiLockKeyDuotone} label="Mot de passe" mdp placeholder="Votre mot de passe" autoComplete="current-password" value={m} onChange={(x: any) => setM(x.target.value)} />
        <Lien className="acc-oub" to="/mot-de-passe-oublie">Mot de passe oublié ?</Lien>
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>{e.occupe ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <div className="acc-ou"><span>ou</span></div>
      <button type="button" className="btn contour acc-g" disabled={e.occupe} onClick={() => e.envoyer(() => auth.google())}><FcGoogle aria-hidden="true" />Se connecter avec Google</button>
      <p className="acc-bas">Pas encore de compte ? <Lien to="/inscription">Créer un compte</Lien></p>
    </Cadre>
  );
}

export function ConnexionAdmin() {
  const [id, setId] = useState(''); const [m, setM] = useState(''); const e = useEnvoi();
  const envoyer = (x: any) => { x.preventDefault(); if (!id.trim() || !m) return e.setE('Indiquez votre identifiant et votre mot de passe'); e.envoyer(() => auth.connexion(id, m)); };
  return (
    <Cadre simple titre="Administration" sous="Accès réservé à Scolaris">
      <form className="acc-form" noValidate onSubmit={envoyer}>
        <Champ i={PiEnvelopeSimpleDuotone} label="E-mail ou téléphone" placeholder="620 12 34 56" autoComplete="username" autoCapitalize="none" spellCheck={false} value={id} onChange={(x: any) => setId(x.target.value)} />
        <Champ i={PiLockKeyDuotone} label="Mot de passe" mdp placeholder="Votre mot de passe" autoComplete="current-password" value={m} onChange={(x: any) => setM(x.target.value)} />
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>{e.occupe ? 'Connexion…' : 'Se connecter'}</button>
      </form>
    </Cadre>
  );
}

const NIVEAUX = ['Maternelle', 'Primaire', 'Collège', 'Lycée'];
const CAD = 30; // nombre de pas de progression
function Etapes({ n }: { n: number }) {
  return <ol className="ins-sp">{['École', 'Élèves', 'Compte'].map((t, i) => <li key={t} className={i + 1 < n ? 'd' : i + 1 === n ? 'a' : ''} aria-current={i + 1 === n ? 'step' : undefined}><i>{i + 1 < n ? <PiCheckBold aria-hidden="true" /> : i + 1}</i>{t}</li>)}</ol>;
}
function ChampI({ i: I, label, requis = true, aide, tel: estTel, mdp, ...p }: any) {
  const [voir, setV] = useState(false);
  return <div className="ins-f"><label htmlFor={p.id}>{label}{requis && <em> *</em>}</label><div className="ins-in">{estTel ? <span className="ins-pf"><span className="ins-fg" aria-hidden="true"><s /><s /><s /></span>+224</span> : <I aria-hidden="true" />}<input type={mdp ? (voir ? 'text' : 'password') : p.type || 'text'} {...p} />{mdp && <button type="button" onClick={() => setV(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}</button>}</div>{aide && <p>{aide}</p>}</div>;
}

export function Inscription() {
  const [f, setF] = useState({ ecole: '', ville: '', quartier: '', telE: '', eleves: '', classes: '', prenom: '', nom: '', tel: '', email: '', m: '', ok: false });
  const [niv, setNiv] = useState<string[]>([]); const [et, setEt] = useState(1); const [fin, setFin] = useState(false); const [tarifs, setTarifs] = useState<any[]>([]); const e = useEnvoi();
  useEffect(() => { db.rpc('tarifs_liste', {}).then(setTarifs).catch(() => setTarifs([])); }, []);
  const c = (k: string) => ({ id: `ins-${k}`, value: (f as any)[k], onChange: (x: any) => { setF({ ...f, [k]: x.target.value }); e.setE(''); } });
  const nb_ = Number(f.eleves.replace(/\D/g, '')) || 0; const tr = nb_ ? trancheDe(nb_) : ''; const t = tarifs.find((x) => x.tranche === tr);
  const suite = (x: any) => {
    x.preventDefault(); e.setE('');
    if (et === 1) {
      if (!f.ecole.trim() || !f.ville.trim() || !f.quartier.trim()) return e.setE('Remplissez tous les champs marqués d’une étoile');
      if (tel(f.telE).length !== 9) return e.setE('Le téléphone de l’école doit avoir 9 chiffres');
      setEt(2); window.scrollTo(0, 0); return;
    }
    if (et === 2) {
      if (!nb_) return e.setE('Indiquez le nombre d’élèves');
      if (!Number(f.classes)) return e.setE('Indiquez le nombre de classes');
      if (!niv.length) return e.setE('Choisissez au moins un niveau');
      setEt(3); window.scrollTo(0, 0); return;
    }
    if (!f.prenom.trim() || !f.nom.trim() || !f.email.trim() || !f.m) return e.setE('Remplissez tous les champs marqués d’une étoile');
    const tr2 = tel(f.tel); if (tr2.length !== 9) return e.setE('Votre téléphone doit avoir 9 chiffres');
    if (f.m.length < 8 || !/[A-Z]/.test(f.m) || !/[a-z]/.test(f.m) || !/\d/.test(f.m)) return e.setE('Le mot de passe doit avoir 8 caractères, une majuscule, une minuscule et un chiffre');
    if (!f.ok) return e.setE('Acceptez les conditions d’utilisation pour continuer');
    e.envoyer(async () => {
      try { sessionStorage.setItem('scolaris_nouvelle', '1'); } catch { /* ignoré */ }
      let ouvert = false;
      try { ouvert = await auth.inscription(f.email, f.m, { prenom: f.prenom.trim(), nom: f.nom.trim(), telephone: tr2, etablissement: f.ecole.trim(), ville: f.ville.trim(), quartier: f.quartier.trim(), tel_ecole: tel(f.telE), eleves: nb_, classes: Number(f.classes), niveaux: niv }); } catch (err) { try { sessionStorage.removeItem('scolaris_nouvelle'); } catch { /* ignoré */ } throw err; }
      if (ouvert) naviguer('/tableau'); else { try { sessionStorage.removeItem('scolaris_nouvelle'); } catch { /* ignoré */ } setFin(true); }
    });
  };
  if (fin) return <Message t="Vérifiez vos e-mails" st={`Un lien de confirmation a été envoyé à ${f.email}.`} />;
  return (
    <main className="ins"><form className="ins-c" noValidate onSubmit={suite}>
      <header className="ins-h">{et === 1 ? <Lien className="ins-r" to="/" aria-label="Retour"><PiCaretLeftBold /></Lien> : <button type="button" className="ins-r" onClick={() => { e.setE(''); setEt(et - 1); }} aria-label="Retour"><PiCaretLeftBold /></button>}<img src="/img/icone.png" alt="" /><small>Espace École</small></header>
      <Etapes n={et} />
      <div className="ins-b">
        {et === 1 && <><h1>Parlons de <span>votre école</span></h1><p className="ins-s">Ces informations servent à créer l’espace de votre école.</p>
          <ChampI i={PiBuildingsDuotone} label="Nom de l’école" placeholder="Ex. : Groupe scolaire La Réussite" autoComplete="organization" {...c('ecole')} />
          <ChampI i={PiMapPinDuotone} label="Ville" placeholder="Ex. : Conakry" {...c('ville')} />
          <ChampI i={PiMapPinDuotone} label="Quartier" placeholder="Ex. : Kipé" {...c('quartier')} />
          <ChampI tel label="Téléphone de l’école" inputMode="tel" placeholder="620 11 22 33" aide="Les parents verront ce numéro sur les reçus." {...c('telE')} /></>}
        {et === 2 && <><h1>Combien <span>d’élèves ?</span></h1><p className="ins-s">Votre tarif dépend de cette réponse.</p>
          <div className="ins-2"><ChampI i={PiStudentDuotone} label="Nombre d’élèves" inputMode="numeric" placeholder="150" {...c('eleves')} /><ChampI i={PiChalkboardTeacherDuotone} label="Classes" inputMode="numeric" placeholder="8" {...c('classes')} /></div>
          <div className="ins-f"><span className="ins-lb">Niveaux enseignés<em> *</em></span><div className="ins-ch">{NIVEAUX.map((n) => <button type="button" key={n} aria-pressed={niv.includes(n)} className={niv.includes(n) ? 'on' : ''} onClick={() => { setNiv(niv.includes(n) ? niv.filter((x) => x !== n) : [...niv, n]); e.setE(''); }}>{n}</button>)}</div></div>
          {tr && <div className="ins-tf" aria-live="polite"><small>Votre tarif, {TRANCHES.find(([k]) => k === tr)?.[1].toLowerCase()}</small>{t?.prix_mois ? <><div>{gnf(t.prix_mois)} <em>par mois</em></div><small>ou {gnf(t.prix_an)} par an, 4 mois offerts</small></> : <div className="pt">Tarif à voir avec Scolaris</div>}<ul><li><PiCheckCircleFill aria-hidden="true" />Toutes les fonctions de Scolaris</li><li><PiCheckCircleFill aria-hidden="true" />Paiement direct, sans frais cachés</li></ul></div>}</>}
        {et === 3 && <><h1>Parlons de <span>vous</span></h1><p className="ins-s">Vous serez le responsable de ce compte.</p>
          <div className="ins-2"><ChampI i={PiUserDuotone} label="Prénom" placeholder="Mohamed" autoComplete="given-name" {...c('prenom')} /><ChampI i={PiUserDuotone} label="Nom" placeholder="Diallo" autoComplete="family-name" {...c('nom')} /></div>
          <ChampI tel label="Numéro de téléphone" inputMode="tel" placeholder="620 11 22 33" autoComplete="tel-national" {...c('tel')} />
          <ChampI i={PiEnvelopeSimpleDuotone} label="Adresse e-mail" type="email" placeholder="vous@exemple.com" autoComplete="email" autoCapitalize="none" spellCheck={false} {...c('email')} />
          <ChampI i={PiLockKeyDuotone} label="Mot de passe" mdp placeholder="8 caractères minimum" autoComplete="new-password" aide="Avec une majuscule, une minuscule et un chiffre." {...c('m')} />
          <label className="ins-cg"><input type="checkbox" checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /><span>J’accepte les <Lien to="/conditions">conditions d’utilisation</Lien></span></label></>}
        <Erreur t={e.erreur} />
      </div>
      <footer className="ins-ft"><button className="ins-bt" disabled={e.occupe}>{e.occupe ? 'Envoi…' : et === 3 ? 'Créer mon école' : 'Continuer'}<PiArrowRightBold aria-hidden="true" /></button><p><PiLockKeyDuotone aria-hidden="true" />Vos informations restent confidentielles.</p></footer>
    </form></main>
  );
}

export function Finalisation({ pret, erreur, abo, ecole, fini }: any) {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((x) => Math.min(pret ? CAD : CAD - 3, x + 1)), 100); return () => clearInterval(t); }, [pret]);
  const pct = Math.round((p / CAD) * 100); const C = 2 * Math.PI * 84;
  if (erreur && !pret) return <main className="fin1"><div className="fin-c"><img className="fin-l" src="/img/icone.png" alt="" /><h1>La création a échoué</h1><Erreur t={erreur} /><button className="ins-bt" onClick={() => location.reload()}>Réessayer</button></div></main>;
  if (pct < 100 || !pret) {
    const R: [string, number, number][] = [['Création de votre école', 0, 36], ['Préparation de l’année scolaire', 36, 70], ['Calcul de votre tarif', 70, 100]];
    return <main className="fin1" aria-live="polite"><div className="fin-c"><div className="fin-r" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Finalisation"><svg viewBox="0 0 188 188"><defs><linearGradient id="fin-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#8DBBFF" /></linearGradient></defs><circle cx="94" cy="94" r="84" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="9" /><g className="fin-t"><circle cx="94" cy="94" r="84" fill="none" stroke="url(#fin-g)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * Math.max(0.08, pct / 100)} ${C}`} /></g></svg><img src="/img/icone.png" alt="" /></div><h1>Nous préparons votre école</h1><p>Cela ne prend que quelques secondes.</p><ul className="fin-l2">{R.map(([t, a, b]) => <li key={t} className={pct >= b ? 'd' : pct >= a ? 'c' : ''}><u>{pct >= b && <PiCheckBold aria-hidden="true" />}</u>{t}</li>)}</ul></div><div className="fin-pb"><div><span>Finalisation</span><span>{pct} %</span></div><s><i style={{ width: `${pct}%` }} /></s></div></main>;
  }
  return <main className="fin2"><div className="fin-c2"><div className="fin-ok"><span><PiCheckBold aria-hidden="true" /></span></div><h1>Inscription reçue !</h1><p>Payez votre abonnement pour activer votre école.</p><div className="fin-rc"><div><span>École</span><b>{ecole?.nom}</b></div>{ecole?.eleves_annonces != null && <div><span>Élèves annoncés</span><b>{ecole.eleves_annonces}</b></div>}{abo?.prix_mois != null && <div><span>Tarif</span><b>{gnf(abo.prix_mois)} / mois</b></div>}<div><span>État</span><em>En attente de paiement</em></div></div></div><div className="ins-ft"><button className="ins-bt" onClick={fini}>Payer mon abonnement<PiArrowRightBold aria-hidden="true" /></button></div></main>;
}

export function Oublie() {
  const [id, setId] = useState(''); const [fin, setFin] = useState(false); const e = useEnvoi();
  if (fin) return <Message t="Lien envoyé" st="Si ce compte a une adresse e-mail, un lien lui a été envoyé. Sinon, demandez un nouveau mot de passe à votre fondateur." />;
  return (
    <Cadre retour="/connexion" titre="Mot de passe oublié" sous="Recevez un lien pour le réinitialiser">
      <form className="acc-form" noValidate onSubmit={(x) => { x.preventDefault(); if (!id.trim()) return e.setE('Indiquez votre e-mail ou votre téléphone'); e.envoyer(async () => { await auth.recuperation(id); setFin(true); }); }}>
        <Champ i={PiEnvelopeSimpleDuotone} label="E-mail ou téléphone" placeholder="620 12 34 56" autoComplete="username" autoCapitalize="none" spellCheck={false} value={id} onChange={(x: any) => setId(x.target.value)} />
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>Envoyer le lien</button>
      </form>
    </Cadre>
  );
}

export function NouveauMdp({ fini }: any) {
  const [m, setM] = useState(''); const e = useEnvoi();
  return (
    <Cadre titre="Nouveau mot de passe" sous="Choisissez votre nouveau mot de passe">
      <form className="acc-form" noValidate onSubmit={(x) => { x.preventDefault(); if (m.length < 8) return e.setE('Le mot de passe doit contenir au moins 8 caractères'); e.envoyer(async () => { await auth.nouveauMotDePasse(m); fini(); }); }}>
        <Champ i={PiLockKeyDuotone} label="Nouveau mot de passe" mdp placeholder="8 caractères minimum" autoComplete="new-password" value={m} onChange={(x: any) => setM(x.target.value)} />
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>Enregistrer</button>
      </form>
    </Cadre>
  );
}

export function PremierEtablissement({ fini }: any) {
  const [n, setN] = useState(''); const [el, setEl] = useState(''); const e = useEnvoi();
  return (
    <Cadre titre="Votre établissement" sous="Indiquez le nom de votre école pour commencer">
      <form className="acc-form" noValidate onSubmit={(x) => { x.preventDefault(); if (!n.trim()) return e.setE('Indiquez le nom de votre établissement'); const eleves = Number(el.replace(/\D/g, '')); if (!eleves) return e.setE('Indiquez le nombre d’élèves de votre école'); e.envoyer(async () => { await db.rpc('creer_etablissement', { p_nom: n.trim(), p_details: { eleves } }); fini(); }); }}>
        <Champ i={PiBuildingsDuotone} label="Nom de l’établissement" placeholder="École Sainte-Marie" autoComplete="organization" value={n} onChange={(x: any) => setN(x.target.value)} />
        <Champ i={PiStudentDuotone} label="Nombre d’élèves" inputMode="numeric" placeholder="150" value={el} onChange={(x: any) => setEl(x.target.value)} />
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>Continuer</button>
        <button type="button" className="btn contour" onClick={auth.deconnexion}>Se déconnecter</button>
      </form>
    </Cadre>
  );
}
