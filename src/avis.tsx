// Avis des écoles : demandé au fondateur ou au directeur après 2 jours d'utilisation.
// L'avis n'apparaît sur le site vitrine qu'avec l'accord de l'école et après validation par Scolaris.
import { useState } from 'react';
import { PiStarFill, PiHeartFill, PiCheckCircleFill, PiEyeSlashDuotone, PiGlobeHemisphereWestDuotone } from 'react-icons/pi';
import { db, getSession } from './api';
import { dateFr } from './lib';
import { Champ, Erreur, Etat, Lien, Modale, Titre, Vide, useApp, useEnvoi, useQ } from './ui';

const JOURS_MIN = 2;
const PLUS_TARD = 3 * 864e5;
const LIB = ['', 'Pas satisfait', 'Peut mieux faire', 'Bien', 'Très bien', 'Excellent !'];
const cle = (eid: string) => `scolaris_avis_plus_tard_${eid}`;
const Etoiles = ({ n, taille }: { n: number; taille?: number }) => <span className="etoiles" style={taille ? { fontSize: taille } : undefined} aria-label={`${n} sur 5`}>{[1, 2, 3, 4, 5].map((i) => <PiStarFill key={i} className={i <= n ? 'on' : ''} aria-hidden="true" />)}</span>;

export function DemandeAvis() {
  const { eid, role, etab } = useApp();
  const ok = role === 'fondateur' || role === 'directeur';
  const q = useQ(() => (ok ? db.rpc('avis_mon_ecole', { p_etab: eid }) : Promise.resolve(null)), [eid, ok]);
  const [ouvert, setO] = useState(false);
  const [merci, setM] = useState<null | boolean>(null);
  const [cache, setC] = useState(() => { try { return Number(localStorage.getItem(cle(eid)) || 0) > Date.now(); } catch { return false; } });
  const d: any = q.data;
  if (merci !== null) return <section className="carte avis-dem merci"><span className="avis-ic vert"><PiHeartFill aria-hidden="true" /></span>
    <div className="avis-tx"><h2>Merci pour votre avis !</h2><p>{merci ? 'Il sera affiché sur le site de Scolaris après une rapide vérification.' : 'Il nous aide à améliorer Scolaris pour votre école.'}</p></div>
    <button className="btn lien" onClick={() => setM(null)}>Fermer</button></section>;
  if (!ok || !d || d.avis || d.jours < JOURS_MIN || cache) return null;
  const plusTard = () => { try { localStorage.setItem(cle(eid), String(Date.now() + PLUS_TARD)); } catch { /* ignoré */ } setC(true); };
  return <>
    <section className="carte avis-dem">
      <span className="avis-ic"><PiStarFill aria-hidden="true" /></span>
      <div className="avis-tx"><h2>Votre avis compte</h2><p>Vous utilisez Scolaris depuis {d.jours} jours. Qu'est-ce que ça change pour {etab?.nom || 'votre école'} ? Votre avis aidera d'autres écoles à se décider.</p></div>
      <div className="avis-ac"><button className="btn plein mini" onClick={() => setO(true)}>Donner mon avis</button><button className="btn lien" onClick={plusTard}>Plus tard</button></div>
    </section>
    {ouvert && <FormAvis fermer={() => setO(false)} fini={(aut: boolean) => { setO(false); setM(aut); q.reload(); }} />}
  </>;
}

function FormAvis({ fermer, fini }: { fermer: () => void; fini: (aut: boolean) => void }) {
  const { eid, role, etab } = useApp();
  const md = getSession()?.user?.user_metadata || {};
  const [note, setN] = useState(5);
  const [texte, setT] = useState('');
  const [nom, setNom] = useState(`${md.prenom || ''} ${md.nom || ''}`.trim());
  const [fonction, setF] = useState(role === 'fondateur' ? 'Fondateur' : 'Directeur');
  const [aut, setA] = useState(false);
  const e = useEnvoi();
  const envoyer = (v: any) => {
    v.preventDefault();
    if (texte.trim().length < 15) return e.setE('Écrivez au moins une phrase sur ce que Scolaris change pour votre école.');
    if (nom.trim().length < 2) return e.setE('Indiquez votre nom.');
    e.envoyer(async () => { await db.rpc('avis_envoyer', { p_etab: eid, p_nom: nom, p_fonction: fonction, p_note: note, p_texte: texte, p_autorise: aut }); fini(aut); });
  };
  return <Modale titre="Votre avis sur Scolaris" fermer={fermer}>
    <form className="avis-f" onSubmit={envoyer} noValidate>
      <div className="avis-note" role="radiogroup" aria-label="Votre note">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={n === note} aria-label={`${n} sur 5`} className={n <= note ? 'on' : ''} onClick={() => setN(n)}><PiStarFill aria-hidden="true" /></button>)}</div>
      <p className="avis-lib">{LIB[note]}</p>
      <Champ label="Votre avis"><textarea rows={4} maxLength={600} value={texte} onChange={(x) => setT(x.target.value)} placeholder="Ex. : Avant, on cherchait les reçus dans le cahier. Maintenant, chaque paiement est retrouvé en une seconde." /></Champ>
      <div className="avis-2"><Champ label="Votre nom"><input value={nom} onChange={(x) => setNom(x.target.value)} autoComplete="name" /></Champ><Champ label="Votre fonction"><input value={fonction} onChange={(x) => setF(x.target.value)} /></Champ></div>
      <label className="avis-ok"><input type="checkbox" checked={aut} onChange={(x) => setA(x.target.checked)} /><span>J'accepte que mon avis soit affiché sur le site de Scolaris, avec mon nom, ma fonction et le nom de l'école ({etab?.nom}).</span></label>
      <Erreur t={e.erreur} />
      <button className="btn plein" disabled={e.occupe}>{e.occupe ? 'Envoi…' : 'Envoyer mon avis'}</button>
    </form>
  </Modale>;
}

// Administration Scolaris : les avis reçus, à publier ou masquer sur le site.
export function AdminAvis() {
  const q = useQ(() => db.rpc('admin_avis'), []);
  const e = useEnvoi();
  const statut = (id: string, s: string) => e.envoyer(async () => { await db.rpc('admin_avis_statut', { p_id: id, p_statut: s }); q.reload(); });
  const ST: any = { attente: ['À vérifier', 'p-orange'], publie: ['Sur le site', 'p-vert'], masque: ['Masqué', 'p-gris'] };
  return <>
    <Titre t="Avis des écoles" />
    <Erreur t={e.erreur} />
    <Etat q={q}>{(l: any[]) => l.length === 0 ? <section className="carte"><Vide t="Aucun avis pour le moment. Les écoles sont invitées à donner leur avis après 2 jours d'utilisation." /></section>
      : <div className="avis-adm">{l.map((a) => <section key={a.id} className="carte avis-c">
        <div className="tete-carte"><Etoiles n={a.note} /><span className={`puce ${ST[a.statut][1]}`}>{ST[a.statut][0]}</span></div>
        <p className="avis-q">« {a.texte} »</p>
        <div className="avis-qui"><b>{a.nom} · {a.fonction}</b><small>{a.ecole}{a.ville ? `, ${a.ville}` : ''} · {dateFr(String(a.cree_le).slice(0, 10))}</small></div>
        {!a.autorise_site && <p className="note avis-priv"><PiEyeSlashDuotone aria-hidden="true" /> L'école n'a pas autorisé l'affichage sur le site.</p>}
        <div className="avis-act">
          {a.statut !== 'publie' && a.autorise_site && <button className="btn plein mini" disabled={e.occupe} onClick={() => statut(a.id, 'publie')}><PiGlobeHemisphereWestDuotone aria-hidden="true" />Publier sur le site</button>}
          {a.statut === 'publie' && <span className="avis-ok-s"><PiCheckCircleFill aria-hidden="true" />Visible sur la page d'accueil</span>}
          {a.statut !== 'masque' && <button className="btn contour mini" disabled={e.occupe} onClick={() => statut(a.id, 'masque')}>Masquer</button>}
        </div>
      </section>)}</div>}</Etat>
  </>;
}

// Vue d'ensemble de l'administration : rappel des avis à vérifier.
export function ResumeAvis() {
  const q = useQ(() => db.rpc('admin_avis').catch(() => []), []);
  const l: any[] = (q.data as any[]) || [];
  const att = l.filter((a) => a.statut === 'attente').length, pub = l.filter((a) => a.statut === 'publie').length;
  const moy = l.length ? (l.reduce((s, a) => s + Number(a.note), 0) / l.length).toFixed(1).replace('.', ',') : null;
  return <section className="carte avis-res"><div className="tete-carte"><h2><PiStarFill aria-hidden="true" className="c-or" />Avis des écoles</h2><Lien to="/admin/avis" className="voir">Voir les avis</Lien></div>
    <p className="note">{l.length === 0 ? "Aucun avis pour l'instant. Les écoles sont invitées à donner leur avis après 2 jours d'utilisation." : `${l.length} avis reçu${l.length > 1 ? 's' : ''}${moy ? ` · note moyenne ${moy}/5` : ''} · ${pub} sur le site${att ? ` · ${att} à vérifier` : ''}`}</p></section>;
}
