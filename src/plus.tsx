import { useState } from 'react';
import { PiCaretRightBold, PiCrownSimpleFill, PiGearSixFill, PiHeadsetFill, PiInfoFill, PiSignOutBold, PiUserFill, PiWhatsappLogoFill } from 'react-icons/pi';
import { auth, getSession } from './api';
import { ChangerMdp } from './outils';
import { waUrl } from './abonnement';
import { Avatar, Bandeau, Lien, Titre, Vague, useApp } from './ui';

const ROLES: any = { fondateur: 'Fondateur', directeur: 'Directeur', comptable: 'Comptable', caissier: 'Caissier', secretaire: 'Secrétaire', enseignant: 'Enseignant' };
const Ligne = ({ to, I, t, n }: any) => <Lien to={to} className="px-l"><span className="px-i"><I aria-hidden="true" /></span><span className="px-t">{t}</span>{n > 0 && <em>{n > 999 ? '999+' : n}</em>}<PiCaretRightBold className="px-c" aria-hidden="true" /></Lien>;
const nomCompte = () => { const md = getSession()?.user?.user_metadata || {}; return `${md.prenom || ''} ${md.nom || ''}`.trim(); };

export function Plus({ gestion, notif }: { gestion: any[]; notif: any }) {
  const { role } = useApp();
  return (
    <>
      <Bandeau><section className="hero-plus"><h1>Plus</h1><Vague /></section></Bandeau>
      <div className="px">
        <nav className="px-c-l" aria-label="Mon compte">
          <Ligne to="/profil" I={PiUserFill} t="Mon profil" />
          {role === 'fondateur' && <Ligne to="/abonnement" I={PiCrownSimpleFill} t="Mes abonnements" />}
          <Ligne to="/parametres" I={PiGearSixFill} t="Paramètres" />
          <Ligne to="/aide" I={PiHeadsetFill} t="Aide et assistance" />
          <Ligne to="/apropos" I={PiInfoFill} t="À propos de Scolaris" />
        </nav>
        <button type="button" className="px-sortie" onClick={auth.deconnexion}><PiSignOutBold aria-hidden="true" />Se déconnecter</button>
        {gestion.length > 0 && <><h2 className="px-g">Gestion de l'école</h2><nav className="px-c-l" aria-label="Gestion de l'école">{gestion.map(([to, t, I, , cle]) => <Ligne key={to} to={to} I={I} t={t} n={cle ? notif[cle] : 0} />)}</nav></>}
      </div>
    </>
  );
}

export function Profil() {
  const { role, etab } = useApp(); const [mdp, setMdp] = useState(false); const [ok, setOk] = useState('');
  const email = getSession()?.user?.email || ''; const nom = nomCompte() || email || etab.nom;
  return (
    <>
      <Titre t="Mon profil" retour="/plus" />
      <section className="carte px-p"><Avatar nom={nom} grand /><div><h2>{nom}</h2><p className="note">{ROLES[role]}, {etab.nom}</p>{email && !email.endsWith('scolaris.app') && <p className="note">{email}</p>}</div></section>
      <button type="button" className="btn contour" onClick={() => setMdp(true)}>Changer le mot de passe</button>
      {ok && <p className="note ctr">{ok}</p>}
      {mdp && <ChangerMdp fermer={() => setMdp(false)} fini={() => { setMdp(false); setOk('Mot de passe changé'); }} />}
    </>
  );
}

export function Aide() {
  const { abo } = useApp();
  return (
    <>
      <Titre t="Aide et assistance" retour="/plus" />
      <section className="carte px-a"><span className="px-i"><PiHeadsetFill aria-hidden="true" /></span><h2>Une question sur Scolaris ?</h2>
        {abo?.whatsapp ? <><p className="note">Écrivez-nous sur WhatsApp, nous vous répondons directement.</p><a className="btn wa" href={waUrl(abo.whatsapp, 'Bonjour Scolaris, j\'ai besoin d\'aide.')} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Écrire à Scolaris</a></> : <p className="note">Le contact WhatsApp de Scolaris sera affiché ici très bientôt.</p>}
      </section>
    </>
  );
}

export function APropos() {
  return (
    <>
      <Titre t="À propos de Scolaris" retour="/plus" />
      <section className="carte px-a"><img src="/img/icone.png" alt="" /><h2>Scolaris</h2><p className="note">La scolarité, sans impayés.</p><p className="note">Scolaris aide les écoles à suivre leurs élèves, leurs frais et leurs paiements. Scolaris n'encaisse jamais l'argent des parents.</p><Lien to="/conditions" className="btn contour">Conditions d'utilisation</Lien></section>
    </>
  );
}
