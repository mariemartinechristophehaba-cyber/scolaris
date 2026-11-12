import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiArrowLeftBold, PiCalendarBlankDuotone, PiCaretDownBold, PiCheckCircleFill, PiCircleHalfFill, PiClockCountdownFill, PiXBold, PiXCircleFill } from 'react-icons/pi';
import { message } from './api';
import { grouperClasses, nb } from './lib';

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

let modalesOuvertes = 0;
export function Modale({ titre, fermer, children }: any) {
  // La page derrière ne bouge plus tant que la fenêtre est ouverte : seul son contenu défile.
  useEffect(() => {
    const h = document.documentElement, y = window.scrollY;
    if (modalesOuvertes++ === 0) { h.classList.add('modale-ouverte'); document.body.style.top = `-${y}px`; }
    return () => { if (--modalesOuvertes === 0) { h.classList.remove('modale-ouverte'); document.body.style.top = ''; window.scrollTo(0, y); } };
  }, []);
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

export function Montant({ value, onChange, placeholder, label }: any) {
  return <div className="montant"><input inputMode="numeric" aria-label={label} value={value ? nb(value) : ''} placeholder={placeholder || '0'} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)} /><b>GNF</b></div>;
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

export function Vague() {
  return <svg className="vague" viewBox="0 0 390 72" preserveAspectRatio="none" aria-hidden="true"><path fill="rgba(255,255,255,.2)" d="M0 72V44C110 70 245 62 390 6v66z" /><path fill="#F4F7FC" d="M0 72V58C120 76 262 62 390 26v46z" /></svg>;
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

// Options d'un menu de classes, regroupées par niveau.
export const OptClasses = ({ l }: { l: any[] }) => <>{grouperClasses(l).map(([n, cs]) => <optgroup key={n} label={n}>{cs.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}</optgroup>)}</>;

// Sélecteur de date à molettes (jour, mois, année) : on fait glisser au lieu d'un calendrier.
const MOIS_C = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const H_ROUE = 44;
function Roue({ items, val, set, label }: { items: [number, string][]; val: number; set: (v: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null); const t = useRef<any>(null);
  const idx = Math.max(0, items.findIndex(([v]) => v === val));
  useEffect(() => { const el = ref.current; if (el && Math.abs(el.scrollTop - idx * H_ROUE) > 2) el.scrollTop = idx * H_ROUE; }, [idx]);
  const fin = () => { const el = ref.current; if (!el) return; const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / H_ROUE))); if (items[i] && items[i][0] !== val) set(items[i][0]); };
  return <div className="roue" ref={ref} role="listbox" aria-label={label} tabIndex={0} onScroll={() => { clearTimeout(t.current); t.current = setTimeout(fin, 90); }}
    onKeyDown={(e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = items[Math.min(items.length - 1, Math.max(0, idx + (e.key === 'ArrowDown' ? 1 : -1)))]; if (n) set(n[0]); } }}>
    <div className="roue-pad" />{items.map(([v, l]) => <div key={v} role="option" aria-selected={v === val} className={v === val ? 'on' : ''} onClick={() => set(v)}>{l}</div>)}<div className="roue-pad" />
  </div>;
}
export function DateRoue({ value, onChange, debut = 1950, fin = new Date().getFullYear(), defaut }: { value: string; onChange: (v: string) => void; debut?: number; fin?: number; defaut?: number }) {
  const [ouvert, setO] = useState(false);
  const p = /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').map(Number) : null;
  const [a, setA] = useState(p ? p[0] : (defaut || fin - 10)); const [m, setM] = useState(p ? p[1] : 1); const [j, setJ] = useState(p ? p[2] : 1);
  const nbJ = new Date(a, m, 0).getDate(); const jj = Math.min(j, nbJ);
  const annees: [number, string][] = []; for (let y = fin; y >= debut; y--) annees.push([y, String(y)]);
  const jours: [number, string][] = Array.from({ length: nbJ }, (_, i) => [i + 1, String(i + 1)]);
  const mois: [number, string][] = MOIS_C.map((l, i) => [i + 1, l]);
  const ouvrir = () => { if (p) { setA(p[0]); setM(p[1]); setJ(p[2]); } setO(true); };
  const valider = () => { onChange(`${a}-${String(m).padStart(2, '0')}-${String(jj).padStart(2, '0')}`); setO(false); };
  return <>
    <button type="button" className={`date-roue${p ? '' : ' vide'}`} onClick={ouvrir}>{p ? `${p[2]} ${MOIS_C[p[1] - 1]} ${p[0]}` : 'Choisir'}<PiCalendarBlankDuotone aria-hidden="true" /></button>
    {ouvert && createPortal(<div className="roue-fond" onClick={() => setO(false)}><div className="roue-feuille" role="dialog" aria-label="Choisir une date" onClick={(e) => e.stopPropagation()}>
      <div className="roue-t"><button type="button" onClick={() => setO(false)}>Annuler</button><b>{jj} {MOIS_C[m - 1]} {a}</b><button type="button" className="ok" onClick={valider}>OK</button></div>
      <div className="roues"><div className="roue-barre" aria-hidden="true" /><Roue items={jours} val={jj} set={setJ} label="Jour" /><Roue items={mois} val={m} set={setM} label="Mois" /><Roue items={annees} val={a} set={setA} label="Année" /></div>
      {value && <button type="button" className="roue-eff" onClick={() => { onChange(''); setO(false); }}>Effacer la date</button>}
    </div></div>, document.body)}
  </>;
}
