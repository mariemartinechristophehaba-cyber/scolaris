import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiArrowLeftBold, PiCaretDownBold, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiXBold, PiXCircleFill } from 'react-icons/pi';
import { message } from './api';
import { nb } from './lib';

export const Ctx = createContext<any>(null);
export const useApp = () => useContext(Ctx);

export const naviguer = (to: string) => { history.pushState(null, '', to); dispatchEvent(new PopStateEvent('popstate')); scrollTo(0, 0); };
export function Lien({ to, children, className, ...p }: any) {
  return <a href={to} className={className} onClick={(e) => { if (e.ctrlKey || e.metaKey) return; e.preventDefault(); naviguer(to); }} {...p}>{children}</a>;
}

export function useQ<T = any>(f: () => Promise<T>, deps: any[]) {
  const [data, set] = useState<T | null>(null);
  const [erreur, setE] = useState('');
  const [charge, setC] = useState(true);
  const n = useRef(0);
  const reload = useCallback(async () => {
    const id = ++n.current; setC(true);
    try { const d = await f(); if (id === n.current) { set(d); setE(''); } }
    catch (e) { if (id === n.current) setE(message(e)); }
    finally { if (id === n.current) setC(false); }
  }, deps); // eslint-disable-line
  useEffect(() => { reload(); }, [reload]);
  return { data, erreur, charge, reload };
}

export const Logo = ({ petit }: { petit?: boolean }) => (
  <div className={petit ? 'logo petit' : 'logo'}>
    <img src="/img/accueil/icone.webp" alt="" />
    <img className="mot" src="/img/accueil/mot.webp" alt="Scolaris" />
  </div>
);

// Nom de marque en texte net, avec le point vert sur le i
export const Mot = ({ taille }: { taille: number }) => <span className="mot-s" role="img" aria-label="Scolaris" style={{ fontSize: taille }}>Scolar<span className="mot-i">ı<i /></span>s</span>;

export const Chargement = () => <div className="vide"><div className="spin" aria-label="Chargement" /></div>;
export const Erreur = ({ t }: { t: string }) => (t ? <div className="alerte err" role="alert">{t}</div> : null);
export const Vide = ({ t, children }: any) => <div className="vide"><p>{t}</p>{children}</div>;

export function Etat({ q, children }: { q: any; children: (d: any) => any }) {
  if (q.erreur && !q.data) return <Erreur t={q.erreur} />;
  if (!q.data) return <Chargement />;
  return children(q.data);
}

export function Modale({ titre, fermer, children }: any) {
  // Rendu à la racine de la page : sinon la barre du bas passe au-dessus sur téléphone.
  return createPortal(
    <div className="fond" onMouseDown={(e) => e.target === e.currentTarget && fermer()}>
      <div className="modale" role="dialog" aria-modal="true" aria-label={titre}>
        <div className="mod-t"><h2>{titre}</h2><button className="ico" onClick={fermer} aria-label="Fermer"><PiXBold /></button></div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export const Champ = ({ label, children, aide }: any) => <label className="champ"><span>{label}</span>{children}{aide && <small>{aide}</small>}</label>;

export function Montant({ value, onChange, placeholder }: any) {
  return <div className="montant"><input inputMode="numeric" value={value ? nb(value) : ''} placeholder={placeholder || '0'} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} /><b>GNF</b></div>;
}

// Formulaire avec envoi, erreur et bouton occupé
export function useEnvoi() {
  const [occupe, setO] = useState(false);
  const [erreur, setE] = useState('');
  const envoyer = async (f: () => Promise<any>) => {
    if (occupe) return; setO(true); setE('');
    try { await f(); } catch (e) { setE(message(e)); } finally { setO(false); }
  };
  return { occupe, erreur, envoyer, setE };
}

// Choix de l'année scolaire, sur fond bleu nuit
export function Verre({ value, onChange, label, children, className }: any) {
  return <label className={`verre ${className || ''}`}><select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>{children}</select><PiCaretDownBold aria-hidden="true" /></label>;
}

export function SelAnnee({ className }: any) {
  const { annee, annees, setAnnee } = useApp();
  if (!annees.length) return null;
  return <Verre value={annee?.id} onChange={setAnnee} label="Année scolaire" className={className}>{annees.map((a: any) => <option key={a.id} value={a.id}>{a.libelle}</option>)}</Verre>;
}

// Ce qui s'affiche sur le bandeau bleu nuit, au-dessus de la feuille
export function Bandeau({ children }: any) {
  const { zoneBandeau } = useApp();
  return zoneBandeau ? createPortal(children, zoneBandeau) : null;
}

export function Titre({ t, children, retour }: any) {
  return <Bandeau><div className="tete-page">{retour && <Lien to={retour} className="retour-v" aria-label="Retour"><PiArrowLeftBold /></Lien>}<h1>{t}</h1><div className="esp" />{children}</div></Bandeau>;
}

const TEINTES = ['bleu', 'vert', 'orange', 'violet', 'cyan', 'rose'];
export function Avatar({ nom, grand }: { nom: string; grand?: boolean }) {
  const p = nom.trim().split(/\s+/);
  const k = [...nom].reduce((a, c) => a + c.charCodeAt(0), 0) % TEINTES.length;
  return <span aria-hidden="true" className={`avatar ${TEINTES[k]}${grand ? ' grand' : ''}`}>{((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()}</span>;
}

export const Tuile = ({ i: I, ton, t }: any) => <span className={`tuile ${ton}${t ? ' t' + t : ''}`}><I aria-hidden="true" /></span>;
export const Gnf = ({ n }: { n: any }) => <span className="gnf"><b>{nb(n)}</b><small>GNF</small></span>;

const ST: any = {
  a_jour: ['vert', PiCheckCircleFill, 'À jour'],
  partiel: ['bleu', PiCircleHalfFill, 'Partiel'],
  retard: ['orange', PiClockCountdownFill, 'Retard'],
  rien: ['rouge', PiXCircleFill, 'Non payé'],
  sans: ['gris', PiCircleHalfFill, 'Sans frais'],
};
export function Pastille({ k, t }: { k: string; t?: string }) {
  const [c, I, l] = ST[k];
  return <span className={`pastille ${c}`}><I aria-hidden="true" />{t || l}</span>;
}
