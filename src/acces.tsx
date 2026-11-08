import { useState } from 'react';
import { auth, db } from './api';
import { tel } from './lib';
import { Lien, naviguer, useEnvoi } from './ui';

// Écrans d'accès : maquette de 550 x 1146 reproduite à l'échelle (voir app.css, classes ac-*).
const s = (o: any) => o as React.CSSProperties;

const Oeil = () => <svg viewBox="0 0 35 22" aria-hidden="true"><path d="M17.5 2C9.6 2 4 7.5 2 11c2 3.5 7.6 9 15.5 9S31 14.5 33 11c-2-3.5-7.6-9-15.5-9Z" fill="none" stroke="#4A5284" strokeWidth="3" /><circle cx="17.5" cy="11" r="5" fill="#4A5284" /></svg>;
const Enveloppe = ({ x, w, h }: any) => <svg className="ac-ico" style={s({ '--ix': x, '--iw': w, '--ih': h })} viewBox="0 0 33 26" aria-hidden="true"><rect width="33" height="26" rx="3.5" /><path d="M2.5 3.5 16.5 14.5 30.5 3.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" /></svg>;
const Cadenas = ({ x, w, h }: any) => <svg className="ac-ico" style={s({ '--ix': x, '--iw': w, '--ih': h })} viewBox="0 0 29 32" aria-hidden="true"><path d="M7 13V9.5a7.5 7.5 0 0 1 15 0V13" fill="none" stroke="#0136B7" strokeWidth="3.6" /><rect y="12.5" width="29" height="19.5" rx="3.5" /><circle cx="14.5" cy="20.5" r="2.6" fill="#fff" /><rect x="13.3" y="21" width="2.4" height="5" rx="1.2" fill="#fff" /></svg>;
const Personne = ({ l, h }: any) => <svg style={{ width: `calc(${l} * var(--p))`, height: `calc(${h} * var(--p))` }} viewBox="0 0 33 36" aria-hidden="true"><circle cx="16.5" cy="9" r="9" fill="#fff" /><path d="M0 33c0-8.6 7.4-14.2 16.5-14.2S33 24.4 33 33c0 1.7-1.3 3-3 3H3c-1.7 0-3-1.3-3-3Z" fill="#fff" /></svg>;
const Plus = ({ t }: any) => <svg style={{ width: `calc(${t} * var(--p))`, height: `calc(${t} * var(--p))` }} viewBox="0 0 39 39" aria-hidden="true"><defs><linearGradient id="ac-gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1F5BF5" /><stop offset="1" stopColor="#0230C2" /></linearGradient></defs><circle cx="19.5" cy="19.5" r="19.5" fill="url(#ac-gp)" /><path d="M19.5 10.5v18M10.5 19.5h18" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>;
const Casque = () => <svg style={{ width: 'calc(33 * var(--p))', height: 'calc(33 * var(--p))', flex: 'none' }} viewBox="0 0 32 32" aria-hidden="true" fill="#0A35C4"><path d="M5.200 18v-3.500a10.800 10.800 0 0 1 21.600 0V18" fill="none" stroke="#0A35C4" strokeWidth="3" /><rect x="2.500" y="15.500" width="7" height="10.500" rx="3.200" /><rect x="22.500" y="15.500" width="7" height="10.500" rx="3.200" /><path d="M26.500 25.500c0 2.700-2.300 3.700-5 3.700h-3" fill="none" stroke="#0A35C4" strokeWidth="2.200" strokeLinecap="round" /><circle cx="17" cy="29.200" r="2.300" /></svg>;

function Ecran({ flash, ok, children }: any) {
  return (
    <main className="ac-ecran">
      {flash && <div className={ok ? 'ac-flash ac-ok' : 'ac-flash'} role="alert">{flash}</div>}
      <div className="ac-tete" aria-hidden="true" />
      <div className="ac-pied" aria-hidden="true" />
      <Lien className="ac-t ac-retour" to="/" style={s({ '--x': 27, '--y': 62, '--w': 61 })} aria-label="Retour à l'accueil"><svg viewBox="0 0 24 24" fill="none" stroke="#0044ED" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12H5M11 5l-7 7 7 7" /></svg></Lien>
      <img className="ac-t ac-img" src="/img/accueil/icone.webp" style={s({ '--x': 183.3, '--y': 67.4, '--w': 185.1, '--h': 167.3 })} alt="" />
      <img className="ac-t ac-img" src="/img/accueil/mot.webp" style={s({ '--x': 129.6, '--y': 233.8, '--w': 303.3, '--h': 65.8 })} alt="Scolaris" />
      <p className="ac-t ac-txt ac-c ac-slogan" style={s({ '--x': 6, '--y': 308.2 })}>La scolarité, sans impayés</p>
      <svg className="ac-t ac-img" style={s({ '--x': 192, '--y': 337, '--w': 181, '--h': 24 })} viewBox="0 0 181 24" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="ac-gs" x1="0" x2="1"><stop offset="0" stopColor="#2DD35E" /><stop offset=".6" stopColor="#11B83C" /><stop offset="1" stopColor="#27C653" /></linearGradient></defs><path d="M2 23C44 5 110 -2 179 9 124 9 64 13 2 23Z" fill="url(#ac-gs)" /></svg>
      {children}
    </main>
  );
}

const Titre = ({ t, f, st, sf, sy = 432 }: any) => <>
  <h1 className="ac-t ac-txt ac-c" style={s({ '--y': 380, '--f': f })}>{t}</h1>
  <p className="ac-t ac-txt ac-c ac-sous" style={s({ '--y': sy, '--f': sf })}>{st}</p>
</>;

function Champ({ y, ico, label, tx, ...p }: any) {
  return <label className="ac-t ac-champ" style={s({ '--x': 27, '--y': y, '--w': 495, '--h': 70, '--f': 20.3, borderRadius: 'calc(22 * var(--p))' })}><span className="ac-cache">{label}</span>{ico}<input placeholder={label} style={s({ '--tx': tx })} {...p} /></label>;
}

function ChampMdp({ y, h, f, label, value, onChange, auto, i, tx, er, r }: any) {
  const [voir, setV] = useState(false);
  return <label className="ac-t ac-champ" style={s({ '--x': 27, '--y': y, '--w': 495, '--h': h, '--f': f, borderRadius: `calc(${r} * var(--p))` })}><span className="ac-cache">{label}</span>{i}<input type={voir ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={auto} placeholder={label} style={s({ '--tx': tx, '--tr': 75 })} /><button type="button" className="ac-oeil" style={s({ '--er': er })} onClick={() => setV(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}><Oeil /></button></label>;
}

export function Accueil() {
  return (
    <main className="ad-ecran">
      <div className="ad-haut">
        <div className="ad-deco ad-g" aria-hidden="true" /><div className="ad-deco ad-d" aria-hidden="true" />
        <div className="ad-illu" role="img" aria-label="Livres, toque de diplômé, crayons et école" />
        <img className="ad-icone" src="/img/accueil/icone.webp" width="323" height="292" alt="" />
        <img className="ad-mot" src="/img/accueil/mot.webp" width="562" height="122" alt="Scolaris" />
        <p className="ad-cache">La scolarité, sans impayés</p>
      </div>
      <div className="ad-bas">
        <div className="ad-vague" aria-hidden="true" />
        <h1>Bienvenue sur Scolaris !</h1>
        <p className="ad-sous">Gérez facilement les paiements scolaires<br />de votre établissement.</p>
        <Lien className="ad-btn ad-plein" to="/connexion"><svg viewBox="0 0 46 51" aria-hidden="true"><circle cx="23" cy="12.5" r="12.5" fill="#fff" /><path d="M0 47c0-12.2 9.6-20.5 23-20.5S46 34.8 46 47c0 2.2-1.8 4-4 4H4c-2.2 0-4-1.8-4-4z" fill="#fff" /></svg>Se connecter</Lien>
        <Lien className="ad-btn ad-vide" to="/inscription"><svg viewBox="0 0 51 51" aria-hidden="true"><defs><linearGradient id="ad-gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1F5BF5" /><stop offset="1" stopColor="#0230C2" /></linearGradient></defs><circle cx="25.5" cy="25.5" r="25.5" fill="url(#ad-gp)" /><path d="M25.5 14v23M14 25.5h23" stroke="#fff" strokeWidth="5" strokeLinecap="round" /></svg>Créer un compte</Lien>
        <div className="ad-sep ad-s1" aria-hidden="true" /><div className="ad-sep ad-s2" aria-hidden="true" />
        <div className="ad-atout ad-a1"><img src="/img/accueil/atout-1.webp" alt="" />Paiements<br />sécurisés</div>
        <div className="ad-atout ad-a2"><img src="/img/accueil/atout-2.webp" alt="" />Rappels<br />automatiques</div>
        <div className="ad-atout ad-a3"><img src="/img/accueil/atout-3.webp" alt="" />Suivi en<br />temps réel</div>
        <p className="ad-devise">Scolaris, une école connectée<br />pour une éducation sereine.</p>
      </div>
    </main>
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
    <Ecran flash={e.erreur}>
      <Titre t="Connexion" f={43.8} st="Connectez-vous à votre espace" sf={22.3} sy={441} />
      <form noValidate onSubmit={envoyer}>
        <Champ y={506} tx={88} label="Adresse e-mail ou téléphone" ico={<Enveloppe x={22} w={33} h={26} />} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={id} onChange={(x: any) => setId(x.target.value)} />
        <ChampMdp y={600} h={70} f={20.3} r={22} label="Mot de passe" value={m} onChange={setM} auto="current-password" i={<Cadenas x={23} w={29} h={32} />} tx={88} er={11} />
        <p className="ac-t ac-txt" style={s({ '--x': 223, '--w': 300, '--y': 689.7, '--f': 19, textAlign: 'right' })}><Lien className="ac-lien" to="/mot-de-passe-oublie">Mot de passe oublié ?</Lien></p>
        <button className="ac-t ac-btn ac-plein" disabled={e.occupe} style={s({ '--x': 26, '--y': 746, '--w': 500, '--h': 77, '--f': 23.6, gap: 'calc(27 * var(--p))' })}><Personne l={33} h={36} />{e.occupe ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <div className="ac-t" style={s({ '--x': 49, '--w': 195, '--y': 861, height: 'max(1px, calc(1.5 * var(--p)))', background: '#8E99CF' })} aria-hidden="true" />
      <p className="ac-t ac-txt ac-c" style={s({ '--y': 848, '--f': 21, fontWeight: 600, color: '#000666' })}>ou</p>
      <div className="ac-t" style={s({ '--x': 308, '--w': 195, '--y': 861, height: 'max(1px, calc(1.5 * var(--p)))', background: '#8E99CF' })} aria-hidden="true" />
      <Lien className="ac-t ac-btn ac-vide" to="/inscription" style={s({ '--x': 26, '--y': 894, '--w': 500, '--h': 69, '--f': 23, gap: 'calc(27 * var(--p))' })}><Plus t={39} />Créer un compte</Lien>
      <p className="ac-t ac-txt ac-c" style={s({ '--y': 985, '--f': 22, fontWeight: 700, color: '#0A35C4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(20 * var(--p))' })}><Casque />Besoin d’aide ?</p>
      <p className="ac-t ac-txt ac-c" style={s({ '--y': 1025, '--f': 20.2, fontWeight: 500, color: '#4D5092' })}>Contactez votre établissement.</p>
    </Ecran>
  );
}

function ChampI({ y, h = 56, ico, label, tx, ...p }: any) {
  return <label className="ac-t ac-champ ac-i" style={s({ '--x': 27, '--y': y, '--w': 495, '--h': h, '--f': 18.2 })}><span className="ac-cache">{label}</span>{ico}<input placeholder={label} style={s({ '--tx': tx })} {...p} /></label>;
}

export function Inscription() {
  const [f, setF] = useState({ ecole: '', resp: '', tel: '', email: '', m: '', m2: '', ok: false });
  const [fin, setFin] = useState(false); const e = useEnvoi();
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => setF({ ...f, [k]: x.target.value }) });
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!f.ecole.trim() || !f.resp.trim() || !f.tel.trim() || !f.email.trim() || !f.m) return e.setE('Tous les champs sont obligatoires');
    const t = tel(f.tel); if (t.length < 8) return e.setE('Numéro de téléphone invalide');
    if (f.m.length < 8) return e.setE('Le mot de passe doit contenir au moins 8 caractères');
    if (f.m !== f.m2) return e.setE('Les deux mots de passe sont différents');
    if (!f.ok) return e.setE('Acceptez les conditions d’utilisation pour continuer');
    const [prenom, ...reste] = f.resp.trim().split(/\s+/);
    e.envoyer(async () => {
      const ouvert = await auth.inscription(f.email, f.m, { prenom, nom: reste.join(' '), telephone: t, etablissement: f.ecole.trim() });
      if (ouvert) naviguer('/tableau'); else setFin(true);
    });
  };
  if (fin) return <Message t="Vérifiez vos e-mails" st={`Un lien de confirmation a été envoyé à ${f.email}.`} />;
  const cad = <Cadenas x={28} w={26} h={29} />;
  return (
    <Ecran flash={e.erreur}>
      <Titre t="Créer un compte" f={39.8} st="Inscrivez votre établissement sur Scolaris" sf={20.5} />
      <form noValidate onSubmit={envoyer}>
        <ChampI y={484} h={56} tx={87} label="Nom de l’établissement" autoComplete="organization" {...c('ecole')} ico={<svg className="ac-ico" style={s({ '--ix': 26, '--iw': 30, '--ih': 30 })} viewBox="0 0 30 30" aria-hidden="true"><path d="M15 1 1 8v3.500h28V8Z" /><rect x="4" y="13" width="3.600" height="11" /><rect x="10.500" y="13" width="3.600" height="11" /><rect x="16" y="13" width="3.600" height="11" /><rect x="22.400" y="13" width="3.600" height="11" /><rect x="1" y="25.500" width="28" height="3.500" rx="1" /></svg>} />
        <ChampI y={550} h={56} tx={87} label="Nom et prénom du responsable" autoComplete="name" {...c('resp')} ico={<svg className="ac-ico" style={s({ '--ix': 28, '--iw': 27, '--ih': 29 })} viewBox="0 0 27 29" aria-hidden="true"><circle cx="13.500" cy="7.500" r="7.500" /><path d="M0 27c0-7.200 6-11.600 13.500-11.600S27 19.800 27 27c0 1.100-.9 2-2 2H2c-1.100 0-2-.9-2-2Z" /></svg>} />
        <ChampI y={615} h={54} tx={88} label="Téléphone" type="tel" inputMode="tel" autoComplete="tel" {...c('tel')} ico={<svg className="ac-ico" style={s({ '--ix': 29, '--iw': 28, '--ih': 28 })} viewBox="3 3 18 18" aria-hidden="true"><path d="M6.600 10.800a15.200 15.200 0 0 0 6.600 6.600l2.200-2.200c.3-.3.7-.4 1-.2 1.100.4 2.300.6 3.600.6.600 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.500c.6 0 1 .4 1 1 0 1.300.2 2.500.6 3.600.1.300 0 .7-.2 1Z" /></svg>} />
        <ChampI y={679} h={54} tx={90} label="Adresse e-mail" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} {...c('email')} ico={<Enveloppe x={29} w={30} h={23} />} />
        <ChampMdp y={741} h={52} f={18.2} r={24} label="Mot de passe" value={f.m} onChange={(v: string) => setF({ ...f, m: v })} auto="new-password" i={cad} tx={91} er={12} />
        <ChampMdp y={803} h={52} f={18.2} r={24} label="Confirmer le mot de passe" value={f.m2} onChange={(v: string) => setF({ ...f, m2: v })} auto="new-password" i={cad} tx={91} er={12} />
        <label className="ac-t ac-txt ac-cgu" style={s({ '--x': 40, '--w': 480, '--y': 876, '--f': 19.1 })}><input type="checkbox" checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /><span>J’accepte les <Lien to="/conditions" className="ac-lien">conditions d’utilisation</Lien></span></label>
        <button className="ac-t ac-btn ac-plein" disabled={e.occupe} style={s({ '--x': 25, '--y': 923, '--w': 501, '--h': 68, '--f': 20.3, gap: 'calc(25 * var(--p))' })}><svg style={{ width: 'calc(22 * var(--p))', height: 'calc(18 * var(--p))' }} viewBox="0 0 22 18" aria-hidden="true"><path d="M2 9.500l6 6L20 2.500" fill="none" stroke="#fff" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" /></svg>{e.occupe ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="ac-t ac-txt ac-c" style={s({ '--y': 1020, '--f': 19.5, fontWeight: 600, color: '#0B166B' })}>Déjà inscrit ? <Lien to="/connexion" style={{ color: '#0026BE', textDecoration: 'none' }}>Se connecter</Lien></p>
    </Ecran>
  );
}

function Message({ t, st }: any) {
  return (
    <Ecran>
      <Titre t={t} f={39.8} st={st} sf={19} />
      <Lien className="ac-t ac-btn ac-plein" to="/connexion" style={s({ '--x': 26, '--y': 520, '--w': 500, '--h': 73, '--f': 23.6 })}>Retour à la connexion</Lien>
    </Ecran>
  );
}

export function Oublie() {
  const [id, setId] = useState(''); const [fin, setFin] = useState(false); const e = useEnvoi();
  if (fin) return <Message t="Lien envoyé" st="Si ce compte existe, un lien lui a été envoyé par e-mail." />;
  return (
    <Ecran flash={e.erreur}>
      <Titre t="Mot de passe oublié" f={39.8} st="Recevez un lien pour le réinitialiser" sf={22.3} />
      <form noValidate onSubmit={(x) => { x.preventDefault(); if (!id.trim()) return e.setE('Indiquez votre e-mail ou votre téléphone'); e.envoyer(async () => { await auth.recuperation(id); setFin(true); }); }}>
        <Champ y={506} tx={88} label="Adresse e-mail ou téléphone" ico={<Enveloppe x={22} w={33} h={26} />} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={id} onChange={(x: any) => setId(x.target.value)} />
        <button className="ac-t ac-btn ac-plein" disabled={e.occupe} style={s({ '--x': 26, '--y': 606, '--w': 500, '--h': 73, '--f': 23.6 })}>Envoyer le lien</button>
      </form>
    </Ecran>
  );
}

export function NouveauMdp({ fini }: any) {
  const [m, setM] = useState(''); const e = useEnvoi();
  return (
    <Ecran flash={e.erreur}>
      <Titre t="Nouveau mot de passe" f={39.8} st="Choisissez votre nouveau mot de passe" sf={22.3} />
      <form noValidate onSubmit={(x) => { x.preventDefault(); if (m.length < 8) return e.setE('Le mot de passe doit contenir au moins 8 caractères'); e.envoyer(async () => { await auth.nouveauMotDePasse(m); fini(); }); }}>
        <ChampMdp y={506} h={70} f={20.3} r={22} label="Nouveau mot de passe" value={m} onChange={setM} auto="new-password" i={<Cadenas x={23} w={29} h={32} />} tx={88} er={11} />
        <button className="ac-t ac-btn ac-plein" disabled={e.occupe} style={s({ '--x': 26, '--y': 606, '--w': 500, '--h': 73, '--f': 23.6 })}>Enregistrer</button>
      </form>
    </Ecran>
  );
}

export function PremierEtablissement({ fini }: any) {
  const [n, setN] = useState(''); const e = useEnvoi();
  return (
    <Ecran flash={e.erreur}>
      <Titre t="Votre établissement" f={39.8} st="Indiquez le nom de votre école pour commencer" sf={21} />
      <form noValidate onSubmit={(x) => { x.preventDefault(); if (!n.trim()) return e.setE('Indiquez le nom de votre établissement'); e.envoyer(async () => { await db.rpc('creer_etablissement', { p_nom: n.trim() }); fini(); }); }}>
        <Champ y={506} tx={88} label="Nom de l’établissement" ico={<Enveloppe x={22} w={33} h={26} />} type="text" autoComplete="organization" value={n} onChange={(x: any) => setN(x.target.value)} />
        <button className="ac-t ac-btn ac-plein" disabled={e.occupe} style={s({ '--x': 26, '--y': 606, '--w': 500, '--h': 73, '--f': 23.6 })}>Continuer</button>
      </form>
      <button className="ac-t ac-btn ac-vide" onClick={auth.deconnexion} style={s({ '--x': 26, '--y': 700, '--w': 500, '--h': 66, '--f': 21 })}>Se déconnecter</button>
    </Ecran>
  );
}
