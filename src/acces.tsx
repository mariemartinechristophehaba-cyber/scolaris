import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { PiArrowLeftBold, PiBellRingingDuotone, PiBuildingsDuotone, PiChartLineUpDuotone, PiEnvelopeSimpleDuotone, PiEyeDuotone, PiEyeSlashDuotone, PiLockKeyDuotone, PiPhoneDuotone, PiSealCheckFill, PiStudentDuotone, PiTargetDuotone, PiUserDuotone, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, db } from './api';
import { TRANCHES, tel } from './lib';
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

function ChoixTranche({ v, set }: any) {
  return <div className="acc-tr" role="group" aria-label="Nombre d’élèves"><span>Nombre d’élèves dans l’école</span><div>{TRANCHES.map(([k, t]) => <button type="button" key={k} aria-pressed={v === k} className={v === k ? 'on' : ''} onClick={() => set(k)}>{t}</button>)}</div></div>;
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

export function Inscription() {
  const [f, setF] = useState({ ecole: '', resp: '', tel: '', email: '', m: '', m2: '', tranche: '', ok: false });
  const [fin, setFin] = useState(false); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => setF({ ...f, [k]: x.target.value }) });
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!f.ecole.trim() || !f.resp.trim() || !f.tel.trim() || !f.email.trim() || !f.m) return e.setE('Tous les champs sont obligatoires');
    if (!f.tranche) return e.setE('Indiquez le nombre d’élèves de votre école');
    const t = tel(f.tel); if (t.length < 8) return e.setE('Numéro de téléphone invalide');
    if (f.m.length < 8) return e.setE('Le mot de passe doit contenir au moins 8 caractères');
    if (f.m !== f.m2) return e.setE('Les deux mots de passe sont différents');
    if (!f.ok) return e.setE('Acceptez les conditions d’utilisation pour continuer');
    const [prenom, ...reste] = f.resp.trim().split(/\s+/);
    e.envoyer(async () => {
      const ouvert = await auth.inscription(f.email, f.m, { prenom, nom: reste.join(' '), telephone: t, etablissement: f.ecole.trim(), tranche_eleves: f.tranche });
      if (ouvert) naviguer('/tableau'); else setFin(true);
    });
  };
  if (fin) return <Message t="Vérifiez vos e-mails" st={`Un lien de confirmation a été envoyé à ${f.email}.`} />;
  return (
    <Cadre v="compte" retour="/" titre="Créer un compte" sous="Inscrivez votre établissement">
      <form className="acc-form" noValidate onSubmit={envoyer}>
        <Champ i={PiBuildingsDuotone} label="Nom de l’établissement" placeholder="École Sainte-Marie" autoComplete="organization" {...c('ecole')} />
        <ChoixTranche v={f.tranche} set={(tranche: string) => setF({ ...f, tranche })} />
        <Champ i={PiUserDuotone} label="Nom du responsable" placeholder="Prénom et nom" autoComplete="name" {...c('resp')} />
        <Champ i={PiPhoneDuotone} label="Téléphone" type="tel" inputMode="tel" placeholder="620 12 34 56" autoComplete="tel" {...c('tel')} />
        <Champ i={PiEnvelopeSimpleDuotone} label="Adresse e-mail" type="email" placeholder="direction@ecole.gn" autoComplete="email" autoCapitalize="none" spellCheck={false} {...c('email')} />
        <Champ i={PiLockKeyDuotone} label="Mot de passe" mdp placeholder="8 caractères minimum" autoComplete="new-password" {...c('m')} />
        <Champ i={PiLockKeyDuotone} label="Confirmer le mot de passe" mdp placeholder="Répétez le mot de passe" autoComplete="new-password" {...c('m2')} />
        <label className="acc-cgu"><input type="checkbox" checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /><span>J’accepte les <Lien to="/conditions">conditions d’utilisation</Lien></span></label>
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>{e.occupe ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="acc-bas">Déjà inscrit ? <Lien to="/connexion">Se connecter</Lien></p>
    </Cadre>
  );
}

function Message({ t, st }: any) {
  return (
    <Cadre titre={t} sous={st}>
      <div className="acc-bt"><Lien className="btn plein" to="/connexion">Retour à la connexion</Lien></div>
    </Cadre>
  );
}

export function Oublie() {
  const [id, setId] = useState(''); const [fin, setFin] = useState(false); const e = useEnvoi();
  if (fin) return <Message t="Lien envoyé" st="Si ce compte existe, un lien lui a été envoyé par e-mail." />;
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
  const [n, setN] = useState(''); const [tr, setTr] = useState(''); const e = useEnvoi();
  return (
    <Cadre titre="Votre établissement" sous="Indiquez le nom de votre école pour commencer">
      <form className="acc-form" noValidate onSubmit={(x) => { x.preventDefault(); if (!n.trim()) return e.setE('Indiquez le nom de votre établissement'); if (!tr) return e.setE('Indiquez le nombre d’élèves de votre école'); e.envoyer(async () => { const id = await db.rpc('creer_etablissement', { p_nom: n.trim() }); await db.upd(`etablissements?id=eq.${id}`, { tranche_eleves: tr }); fini(); }); }}>
        <Champ i={PiBuildingsDuotone} label="Nom de l’établissement" placeholder="École Sainte-Marie" autoComplete="organization" value={n} onChange={(x: any) => setN(x.target.value)} />
        <ChoixTranche v={tr} set={setTr} />
        <Erreur t={e.erreur} />
        <button className="btn plein" disabled={e.occupe}>Continuer</button>
        <button type="button" className="btn contour" onClick={auth.deconnexion}>Se déconnecter</button>
      </form>
    </Cadre>
  );
}
