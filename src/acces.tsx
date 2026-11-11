import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

// Connexion Google : à activer une fois le fournisseur Google configuré dans Supabase.
const GOOGLE_ACTIF = false;
import { PiArrowLeftBold, PiArrowRightBold, PiBellRingingDuotone, PiBuildingsDuotone, PiBabyFill, PiBackpackFill, PiBookOpenFill, PiBuildingsFill, PiCameraFill, PiCaretDownBold, PiCaretLeftBold, PiChalkboardTeacherFill, PiCrownSimpleFill, PiEnvelopeSimpleFill, PiGraduationCapFill, PiImageFill, PiLockKeyFill, PiMagnifyingGlassBold, PiMapPinFill, PiMinusBold, PiPencilSimpleFill, PiPhoneFill, PiPlusBold, PiShieldCheckFill, PiUserFill, PiXBold, PiChartLineUpDuotone, PiCheckBold, PiCheckCircleFill, PiEnvelopeSimpleDuotone, PiEyeDuotone, PiEyeSlashDuotone, PiLockKeyDuotone, PiSealCheckFill, PiStudentDuotone, PiTargetDuotone, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, db } from './api';
import { TRANCHES, erreurTel, gnf, tel, trancheDe } from './lib';
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
      {GOOGLE_ACTIF && <><div className="acc-ou"><span>ou</span></div>
      <button type="button" className="btn contour acc-g" disabled={e.occupe} onClick={() => e.envoyer(() => auth.google())}><FcGoogle aria-hidden="true" />Se connecter avec Google</button></>}
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

function Message({ t, st }: any) {
  return (
    <Cadre titre={t} sous={st}>
      <div className="acc-bt"><Lien className="btn plein" to="/connexion">Retour à la connexion</Lien></div>
    </Cadre>
  );
}

const BROUILLON = 'scolaris_brouillon_ins';
const lireBrouillon = () => { try { return JSON.parse(sessionStorage.getItem(BROUILLON) || 'null'); } catch { return null; } };
const NIVEAUX: [string, any][] = [['Maternelle', PiBabyFill], ['Primaire', PiBackpackFill], ['Collège', PiBookOpenFill], ['Lycée', PiGraduationCapFill]];
const VILLES = ['Beyla', 'Boffa', 'Boké', 'Coyah', 'Dabola', 'Dalaba', 'Dinguiraye', 'Dubréka', 'Faranah', 'Forécariah', 'Fria', 'Gaoual', 'Guéckédou', 'Kankan', 'Kérouané', 'Kindia', 'Kissidougou', 'Koubia', 'Koundara', 'Kouroussa', 'Labé', 'Lélouma', 'Lola', 'Macenta', 'Mali', 'Mamou', 'Mandiana', 'Nzérékoré', 'Pita', 'Siguiri', 'Télimélé', 'Tougué', 'Yomou'];
const sansAccent = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let logoEnAttente: File | null = null;
export const prendreLogo = () => { const f = logoEnAttente; logoEnAttente = null; return f; };
const CAD = 30; // nombre de pas de progression

function Haut3({ n, retour }: { n: number; retour: () => void }) {
  return <><div className="ric-to"><button type="button" className="ric-bk" onClick={retour} aria-label="Retour"><PiCaretLeftBold /></button><img src="/img/icone.png" alt="" /><span><b>Scolaris</b><small>Inscription de votre école</small></span></div>
    <ol className="ric-sp">{['École', 'Élèves', 'Compte'].map((t, i) => <li key={t} className={i + 1 < n ? 'd' : i + 1 === n ? 'a' : ''} aria-current={i + 1 === n ? 'step' : undefined}><i>{i + 1 < n ? <PiCheckBold aria-hidden="true" /> : i + 1}</i>{t}</li>)}</ol></>;
}
function Carte({ ton = 'bl', i: I, label, estTel, mdp, ...p }: any) {
  const [voir, setV] = useState(false);
  return <label className="ric-cd"><span className={`ric-tu ${ton}`}><I aria-hidden="true" /></span><span className="ric-t"><small>{label}</small><span className="ric-v">{estTel && <span className="ric-pf"><span className="ins-fg" aria-hidden="true"><s /><s /><s /></span>+224</span>}<input type={mdp ? (voir ? 'text' : 'password') : p.type || 'text'} {...p} /></span></span>{mdp && <button type="button" className="ric-oe" onClick={(x) => { x.preventDefault(); setV(!voir); }} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>{voir ? <PiEyeSlashDuotone /> : <PiEyeDuotone />}</button>}</label>;
}
function ChoixVille({ v, choisir, autre, fermer }: any) {
  const [q, setQ] = useState(''); const q2 = sansAccent(q.trim());
  const L = VILLES.filter((x) => sansAccent(x).includes(q2)); const voirC = sansAccent('Conakry').includes(q2);
  const R = ({ t }: any) => <button type="button" role="radio" aria-checked={v === t} className={v === t ? 'on' : ''} onClick={() => choisir(t)}><span>{t}</span><i aria-hidden="true" /></button>;
  return <main className="vil"><header className="vil-h"><div><button type="button" className="ric-bk" onClick={fermer} aria-label="Fermer"><PiXBold /></button><h1>Choisissez votre ville</h1></div><label className="vil-s"><PiMagnifyingGlassBold aria-hidden="true" /><input autoFocus value={q} onChange={(x) => setQ(x.target.value)} placeholder="Rechercher une ville" aria-label="Rechercher une ville" /></label></header>
    <div className="vil-l" role="radiogroup" aria-label="Ville">{voirC && <><h2>Le plus choisi</h2><div className="vil-b"><R t="Conakry" /></div></>}{L.length > 0 && <><h2>Toutes les villes</h2><div className="vil-b">{L.map((t) => <R key={t} t={t} />)}</div></>}{!voirC && !L.length && <p className="vil-v">Aucune ville trouvée.</p>}<button type="button" className="vil-a" onClick={autre}><PiPencilSimpleFill aria-hidden="true" />Autre ville, je l’écris moi-même</button></div></main>;
}

export function Inscription() {
  const [br] = useState(lireBrouillon);
  const [f, setF] = useState({ ecole: '', ville: '', vl: false, quartier: '', telE: '', eleves: '', classes: '', prenom: '', nom: '', tel: '', email: '', ok: false, ...(br?.f || {}), m: '' });
  const [niv, setNiv] = useState<string[]>(br?.niv || []); const [et, setEt] = useState<number>(br?.et || 1);
  useEffect(() => { try { const { m: _m, ...sansMdp } = f; sessionStorage.setItem(BROUILLON, JSON.stringify({ f: sansMdp, niv, et })); } catch { /* ignoré */ } }, [f, niv, et]);
  const [fin, setFin] = useState(false); const [tarifs, setTarifs] = useState<any[]>([]); const [pv, setPv] = useState(false); const [apercu, setAp] = useState(''); const e = useEnvoi();
  useEffect(() => { db.rpc('tarifs_liste', {}).then(setTarifs).catch(() => setTarifs([])); }, []);
  const c = (k: string) => ({ value: (f as any)[k], onChange: (x: any) => { setF({ ...f, [k]: x.target.value }); e.setE(''); } });
  const nb_ = Number(f.eleves.replace(/\D/g, '')) || 0; const tr = nb_ ? trancheDe(nb_) : ''; const t = tarifs.find((x) => x.tranche === tr);
  const ajout = (d: number) => { setF({ ...f, eleves: String(Math.max(1, Math.min(50000, nb_ + d))) }); e.setE(''); };
  const force = [f.m.length >= 8, /[A-Z]/.test(f.m), /[a-z]/.test(f.m), /\d/.test(f.m)].filter(Boolean).length;
  const retour = () => { e.setE(''); if (et === 1) naviguer('/'); else { setEt(et - 1); window.scrollTo(0, 0); } };
  const suite = (x: any) => {
    x.preventDefault(); e.setE('');
    if (et === 1) {
      if (!f.ecole.trim() || !f.ville.trim() || !f.quartier.trim()) return e.setE('Remplissez le nom, la ville et le quartier');
      { const er = erreurTel(f.telE, true); if (!tel(f.telE)) return e.setE('Indiquez le téléphone de l’école'); if (er) return e.setE(`Téléphone de l’école : ${er}`); }
      setEt(2); window.scrollTo(0, 0); return;
    }
    if (et === 2) {
      if (!nb_) return e.setE('Indiquez le nombre d’élèves');
      if (!Number(f.classes)) return e.setE('Indiquez le nombre de classes');
      if (!niv.length) return e.setE('Choisissez au moins un niveau');
      setEt(3); window.scrollTo(0, 0); return;
    }
    if (!f.prenom.trim() || !f.nom.trim() || !f.email.trim() || !f.m) return e.setE('Remplissez tous les champs');
    const tr2 = tel(f.tel); if (!tr2) return e.setE('Indiquez votre téléphone'); { const er = erreurTel(f.tel); if (er) return e.setE(`Votre téléphone : ${er}`); }
    if (force < 4) return e.setE('Le mot de passe doit avoir 8 caractères, une majuscule, une minuscule et un chiffre');
    if (!f.ok) return e.setE('Acceptez les conditions d’utilisation pour continuer');
    e.envoyer(async () => {
      try { sessionStorage.setItem('scolaris_nouvelle', '1'); } catch { /* ignoré */ }
      let ouvert = false;
      try { ouvert = await auth.inscription(f.email, f.m, { prenom: f.prenom.trim(), nom: f.nom.trim(), telephone: tr2, etablissement: f.ecole.trim(), ville: f.ville.trim(), quartier: f.quartier.trim(), tel_ecole: tel(f.telE), eleves: nb_, classes: Number(f.classes), niveaux: niv }); } catch (err) { try { sessionStorage.removeItem('scolaris_nouvelle'); } catch { /* ignoré */ } throw err; }
      try { sessionStorage.removeItem(BROUILLON); } catch { /* ignoré */ }
      if (ouvert) naviguer('/tableau'); else { try { sessionStorage.removeItem('scolaris_nouvelle'); } catch { /* ignoré */ } setFin(true); }
    });
  };
  if (fin) return <Message t="Vérifiez vos e-mails" st={`Un lien de confirmation a été envoyé à ${f.email}.`} />;
  if (pv) return <ChoixVille v={f.ville} fermer={() => setPv(false)} choisir={(v: string) => { setF({ ...f, ville: v, vl: false }); setPv(false); e.setE(''); }} autre={() => { setF({ ...f, ville: '', vl: true }); setPv(false); }} />;
  const TITRES = [['Parlons de votre école', 'Elle aura son propre espace.'], ['Combien d’élèves ?', 'Votre tarif s’affiche tout seul.'], ['Parlons de vous', 'Le responsable du compte.']][et - 1];
  return (
    <main className="ric"><form className="ric-c" noValidate onSubmit={suite}>
      <header className="ric-he"><Haut3 n={et} retour={retour} /><div className="ric-ti"><h1>{TITRES[0]}</h1><p>{TITRES[1]}</p></div></header>
      <div className="ric-b">
        {et === 1 && <>
          <label className="ric-lg">{apercu ? <img src={apercu} alt="" /> : <span className="ric-tu bl"><PiImageFill aria-hidden="true" /></span>}<span><b>Logo de l’école</b><small>Facultatif</small></span><span className="ric-ca"><PiCameraFill aria-hidden="true" /></span><input type="file" accept="image/png,image/jpeg,image/webp" hidden aria-label="Ajouter le logo de l’école" onChange={(x) => { const fi = x.target.files?.[0] || null; logoEnAttente = fi; setAp(fi ? URL.createObjectURL(fi) : ''); }} /></label>
          <Carte i={PiBuildingsFill} label="Nom de l’école" placeholder="Groupe scolaire La Réussite" autoComplete="organization" {...c('ecole')} />
          {f.vl ? <Carte ton="ve" i={PiMapPinFill} label="Ville" placeholder="Écrivez votre ville" {...c('ville')} /> : <button type="button" className="ric-cd ric-btn" onClick={() => setPv(true)}><span className="ric-tu ve"><PiMapPinFill aria-hidden="true" /></span><span className="ric-t"><small>Ville</small><span className={f.ville ? 'ric-val' : 'ric-ph'}>{f.ville || 'Touchez pour choisir'}</span></span><PiCaretDownBold className="ric-ch" aria-hidden="true" /></button>}
          <Carte ton="or" i={PiMapPinFill} label="Quartier" placeholder="Ex. : Kipé" {...c('quartier')} />
          <Carte ton="vi" i={PiPhoneFill} label="Téléphone de l’école" estTel inputMode="tel" placeholder="620 11 22 33" {...c('telE')} /></>}
        {et === 2 && <>
          <div className="ric-co"><label><small>Nombre d’élèves</small><span><input inputMode="numeric" placeholder="0" aria-label="Nombre d’élèves" {...c('eleves')} /><em>élèves</em></span></label><div><button type="button" onClick={() => ajout(-10)} aria-label="Enlever 10 élèves"><PiMinusBold /></button><button type="button" onClick={() => ajout(10)} aria-label="Ajouter 10 élèves"><PiPlusBold /></button></div></div>
          <div className="ric-ni" role="group" aria-label="Niveaux enseignés">{NIVEAUX.map(([n, I]) => <button type="button" key={n} aria-pressed={niv.includes(n)} className={niv.includes(n) ? 'on' : ''} onClick={() => { setNiv(niv.includes(n) ? niv.filter((x) => x !== n) : [...niv, n]); e.setE(''); }}><I aria-hidden="true" />{n}</button>)}</div>
          <Carte i={PiChalkboardTeacherFill} label="Nombre de classes" inputMode="numeric" placeholder="Ex. : 8" {...c('classes')} />
          {tr && <div className="ric-tf" aria-live="polite"><span className="ric-bd">{TRANCHES.find(([k]) => k === tr)?.[1]}</span><div className="h"><PiCrownSimpleFill aria-hidden="true" />Votre tarif</div>{t?.prix_mois ? <><div className="pr">{gnf(t.prix_mois)} <em>/ mois</em></div><small>ou {gnf(t.prix_an)} par an, 4 mois offerts</small></> : <div className="pr p2">À voir avec Scolaris</div>}<ul><li><PiCheckCircleFill aria-hidden="true" />Toutes les fonctions de Scolaris</li><li><PiCheckCircleFill aria-hidden="true" />Reçus, relances, caisse et rapports</li></ul></div>}</>}
        {et === 3 && <>
          <div className="ric-2"><Carte i={PiUserFill} label="Prénom" placeholder="Mohamed" autoComplete="given-name" {...c('prenom')} /><Carte i={PiUserFill} label="Nom" placeholder="Diallo" autoComplete="family-name" {...c('nom')} /></div>
          <Carte ton="vi" i={PiPhoneFill} label="Votre téléphone" estTel inputMode="tel" placeholder="620 11 22 33" autoComplete="tel-national" {...c('tel')} />
          <Carte ton="ve" i={PiEnvelopeSimpleFill} label="Adresse e-mail" type="email" placeholder="vous@exemple.com" autoComplete="email" autoCapitalize="none" spellCheck={false} {...c('email')} />
          <Carte ton="or" i={PiLockKeyFill} label="Mot de passe" mdp placeholder="8 caractères minimum" autoComplete="new-password" {...c('m')} />
          {f.m && <><div className="ric-pw" aria-hidden="true">{[1, 2, 3, 4].map((k) => <i key={k} className={k <= force ? 'y' : ''} />)}</div><p className={`ric-pwt${force < 4 ? ' f' : ''}`}>{force < 4 ? 'Ajoutez une majuscule, une minuscule, un chiffre, 8 caractères' : 'Mot de passe solide'}</p></>}
          <label className="ric-cg"><input type="checkbox" checked={f.ok} onChange={(x) => setF({ ...f, ok: x.target.checked })} /><span>J’accepte les <Lien to="/conditions">conditions d’utilisation</Lien></span></label></>}
        <Erreur t={e.erreur} />
      </div>
      <footer className="ric-ft"><button className="ric-bt" disabled={e.occupe}>{e.occupe ? 'Envoi…' : et === 3 ? 'Créer mon école' : 'Continuer'}<PiArrowRightBold aria-hidden="true" /></button><p><PiShieldCheckFill aria-hidden="true" />Vos informations restent confidentielles.</p></footer>
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
  return <main className="ric"><div className="ric-c"><header className="fin-he"><div className="fin-ok2"><span><PiCheckBold aria-hidden="true" /></span></div><h1>Inscription reçue !</h1><p>Plus qu’une étape pour activer votre école.</p></header><section className="fin-tk"><div className="a"><span className="ric-tu bl"><PiBuildingsFill aria-hidden="true" /></span><div><b>{ecole?.nom}</b>{(ecole?.ville || ecole?.quartier) && <small>{[ecole.ville, ecole.quartier].filter(Boolean).join(', ')}</small>}</div></div><div className="pe" aria-hidden="true"><i /><i /></div>{ecole?.eleves_annonces != null && <div className="r"><span>Élèves annoncés</span><b>{ecole.eleves_annonces}</b></div>}<div className="r"><span>État</span><em>En attente de paiement</em></div>{abo?.prix_mois != null && <div className="px"><span>Votre tarif</span><b>{gnf(abo.prix_mois)} <em>/ mois</em></b></div>}</section><div className="ric-sp2" /><footer className="ric-ft"><button className="ric-bt" onClick={() => fini('/abonnement')}>Payer mon abonnement<PiArrowRightBold aria-hidden="true" /></button><button type="button" className="ric-plus" onClick={() => fini('/tableau')}>Accéder au tableau de bord</button></footer></div></main>;
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
