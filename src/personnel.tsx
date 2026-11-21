import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiBuildingsFill, PiCameraDuotone, PiCheckBold, PiIdentificationCardDuotone, PiMagnifyingGlassBold, PiPencilSimpleDuotone, PiPlusBold, PiPrinterDuotone, PiSealCheckFill, PiWarningCircleFill, PiXCircleFill } from 'react-icons/pi';
import { SUPA, db } from './api';
import { dateFr, erreurTel, grouperClasses, nb, tel, telAff } from './lib';
import { qrChemin } from './qr';
import { Champ, Chargement, DateRoue, Erreur, Etat, Logo, Modale, Titre, Vide, useApp, useEnvoi, usePc, useQ } from './ui';

// ---------------------------------------------------------------- petits éléments communs
export const nomP = (p: any) => `${p?.prenom || ''} ${p?.nom || ''}`.trim();
const initiales = (n: string) => n.split(/\s+/).slice(0, 2).map((x) => x[0] || '').join('').toUpperCase();
export const logoUrl = (etab: any) => (etab?.logo_chemin ? `${SUPA}/storage/v1/object/public/logos/${etab.logo_chemin}` : '');

export function LogoEcole({ etab, taille = 44 }: any) {
  const u = logoUrl(etab);
  return u ? <img className="logo-ec" src={u} alt="" style={{ width: taille, height: taille }} /> : <span className="logo-ec sans" style={{ width: taille, height: taille }} aria-hidden="true"><PiBuildingsFill /></span>;
}

export function Qr({ texte, taille = 64, couleur = '#071A52' }: { texte: string; taille?: number; couleur?: string }) {
  const q = useMemo(() => qrChemin(texte), [texte]);
  return <svg className="qr" width={taille} height={taille} viewBox={`-2 -2 ${q.taille + 4} ${q.taille + 4}`} shapeRendering="crispEdges" role="img" aria-label="QR code de vérification"><rect x="-2" y="-2" width={q.taille + 4} height={q.taille + 4} fill="#fff" /><path d={q.d} fill={couleur} /></svg>;
}

export function Photo({ url, nom, className }: { url?: string; nom: string; className?: string }) {
  return <span className={`photo-id ${className || ''}${url ? '' : ' sans-ph'}`}>{url ? <img src={url} alt={`Photo de ${nom}`} /> : <span aria-hidden="true">{initiales(nom)}</span>}</span>;
}

// Adresses des photos (privées), rechargées quand la liste change.
export function usePhotos(chemins: string[]) {
  const cle = chemins.filter(Boolean).sort().join('|');
  const [urls, set] = useState<Record<string, string>>({});
  useEffect(() => { let ok = true; db.photos(cle ? cle.split('|') : []).then((r) => { if (ok) set(r); }).catch(() => {}); return () => { ok = false; }; }, [cle]);
  return urls;
}

const lienVerif = (code: string) => `${location.origin}/v/${code}`;

// ---------------------------------------------------------------- Enseignants & personnel
const CATS: [string, string][] = [['enseignant', 'Enseignant'], ['direction', 'Direction'], ['autre', 'Autre personnel']];
const FONCTIONS = ['Fondateur', 'Fondatrice', 'Directeur', 'Directrice', 'Directeur des études', 'Censeur', 'Comptable', 'Secrétaire', 'Surveillant', 'Enseignant', 'Enseignante', 'Gardien', 'Agent d\'entretien', 'Chauffeur'];
const CHAMPS_FICHE = ['prenom', 'nom', 'sexe', 'fonction', 'date_naissance', 'lieu_naissance', 'telephone', 'adresse', 'contact_nom', 'contact_telephone', 'photo_chemin'];
const completude = (p: any) => Math.round(100 * CHAMPS_FICHE.filter((k) => p[k]).length / CHAMPS_FICHE.length);
const fonctionDe = (p: any) => p.fonction || (p.categorie === 'enseignant' ? (p.sexe === 'F' ? 'Enseignante' : 'Enseignant') : p.categorie === 'direction' ? 'Direction' : 'Personnel');

function FormPersonne({ p, fermer, fini }: any) {
  const { eid } = useApp(); const e = useEnvoi();
  const [f, setF] = useState<any>(() => ({ prenom: '', nom: '', sexe: '', categorie: 'enseignant', fonction: '', classe_matiere: '', date_naissance: '', lieu_naissance: '', profession: '', telephone: '', adresse: '', contact_nom: '', contact_lien: '', contact_telephone: '', date_entree: '', ...(p || {}) }));
  const [photo, setPh] = useState<File | null>(null);
  const c = (k: string) => ({ value: f[k] || '', onChange: (x: any) => setF({ ...f, [k]: x.target.value }) });
  const envoyer = (x: any) => {
    x.preventDefault();
    if (!f.prenom.trim() || !f.nom.trim()) return e.setE('Indiquez le prénom et le nom');
    for (const k of ['telephone', 'contact_telephone']) if (f[k] && tel(f[k])) { const er = erreurTel(f[k]); if (er) return e.setE(er); }
    e.envoyer(async () => {
      const d: any = { etablissement_id: eid };
      for (const k of ['prenom', 'nom', 'sexe', 'categorie', 'fonction', 'classe_matiere', 'date_naissance', 'lieu_naissance', 'profession', 'adresse', 'contact_nom', 'contact_lien', 'date_entree']) d[k] = String(f[k] || '').trim() || null;
      d.telephone = f.telephone ? tel(f.telephone) : null; d.contact_telephone = f.contact_telephone ? tel(f.contact_telephone) : null;
      if (photo) d.photo_chemin = await db.poserPhoto(eid, photo);
      if (p?.id) await db.upd(`enseignants?id=eq.${p.id}`, d); else await db.ins('enseignants', d);
      fini();
    });
  };
  const titre = p?.id ? `Fiche de ${nomP(p)}` : 'Ajouter une personne';
  return <Modale titre={titre} fermer={fermer}><form onSubmit={envoyer} noValidate className="form-pers">
    <div className="choix-ph">
      <label className="ph-choisir">{photo ? <img src={URL.createObjectURL(photo)} alt="" /> : <PiCameraDuotone aria-hidden="true" />}<span>{photo || p?.photo_chemin ? 'Changer la photo' : 'Ajouter une photo'}</span><input type="file" accept="image/*" capture="user" hidden onChange={(x) => setPh(x.target.files?.[0] || null)} /></label>
      <div className="seg-cat" role="radiogroup" aria-label="Catégorie">{CATS.map(([k, t]) => <button type="button" key={k} role="radio" aria-checked={f.categorie === k} className={f.categorie === k ? 'on' : ''} onClick={() => setF({ ...f, categorie: k })}>{t}</button>)}</div>
    </div>
    <h3 className="form-g">Identité</h3>
    <div className="deux"><Champ label="Prénom *"><input {...c('prenom')} autoFocus={!p} /></Champ><Champ label="Nom *"><input {...c('nom')} /></Champ></div>
    <div className="deux"><Champ label="Sexe"><select {...c('sexe')}><option value="">—</option><option value="F">Femme</option><option value="M">Homme</option></select></Champ><Champ label="Profession"><input placeholder="Institutrice, professeur…" {...c('profession')} /></Champ></div>
    <div className="deux"><div className="champ"><span>Date de naissance</span><DateRoue value={f.date_naissance || ''} onChange={(v) => setF({ ...f, date_naissance: v })} defaut={1990} /></div><Champ label="Lieu de naissance"><input {...c('lieu_naissance')} /></Champ></div>
    <h3 className="form-g">Poste</h3>
    <div className="deux"><Champ label="Fonction"><input list="fonctions" placeholder="Enseignant, Directrice…" {...c('fonction')} /><datalist id="fonctions">{FONCTIONS.map((x) => <option key={x} value={x} />)}</datalist></Champ><Champ label="Classe ou matière"><input placeholder="CM2 A, Mathématiques…" {...c('classe_matiere')} /></Champ></div>
    <div className="champ"><span>Dans l'école depuis</span><DateRoue value={f.date_entree || ''} onChange={(v) => setF({ ...f, date_entree: v })} debut={1980} defaut={new Date().getFullYear()} /></div>
    <h3 className="form-g">Contact</h3>
    <div className="deux"><Champ label="Téléphone"><input inputMode="tel" placeholder="620 12 34 56" {...c('telephone')} /></Champ><Champ label="Adresse"><input placeholder="Quartier, ville" {...c('adresse')} /></Champ></div>
    <h3 className="form-g">Personne à contacter en cas de besoin</h3>
    <div className="deux"><Champ label="Nom"><input {...c('contact_nom')} /></Champ><Champ label="Lien"><input placeholder="Frère, épouse…" {...c('contact_lien')} /></Champ></div>
    <Champ label="Son téléphone"><input inputMode="tel" placeholder="620 12 34 56" {...c('contact_telephone')} /></Champ>
    <Erreur t={e.erreur} /><button className="btn plein" disabled={e.occupe}><PiCheckBold />{e.occupe ? 'Enregistrement…' : 'Enregistrer'}</button>
  </form></Modale>;
}

function Fiche({ p, url, modifier, retirer }: any) {
  const { can } = useApp(); const pc = completude(p);
  const L = (k: string, v: any) => v ? <><dt>{k}</dt><dd>{v}</dd></> : null;
  return <div className="fiche-p">
    <div className="fiche-h"><Photo url={url} nom={nomP(p)} className="g" /><div><h2>{nomP(p)}</h2><span>{fonctionDe(p)}{p.classe_matiere ? ` · ${p.classe_matiere}` : ''}</span>{p.date_entree && <em>Dans l'école depuis {new Date(p.date_entree).getFullYear()}</em>}</div></div>
    <div className="fiche-c"><div className="jauge-l"><i style={{ width: `${pc}%` }} /></div><span className={pc === 100 ? 'vert' : ''}>Fiche complète à {pc} %</span></div>
    <h3>Identité</h3><dl className="fiche-d">{L('Nom', p.nom)}{L('Prénom', p.prenom)}{L('Sexe', p.sexe === 'F' ? 'Femme' : p.sexe === 'M' ? 'Homme' : '')}{L('Date de naissance', p.date_naissance ? dateFr(p.date_naissance) : '')}{L('Lieu de naissance', p.lieu_naissance)}{L('Profession', p.profession)}</dl>
    <h3>Contact</h3><dl className="fiche-d">{L('Téléphone', p.telephone ? telAff(p.telephone) : '—')}{L('Adresse', p.adresse)}</dl>
    {(p.contact_nom || p.contact_telephone) && <><h3>Personne à contacter</h3><dl className="fiche-d">{L('Nom', `${p.contact_nom || ''}${p.contact_lien ? ` (${p.contact_lien})` : ''}`)}{L('Téléphone', p.contact_telephone ? telAff(p.contact_telephone) : '')}</dl></>}
    {can('directeur', 'secretaire') && <div className="fiche-a"><button className="btn contour mini" onClick={modifier}><PiPencilSimpleDuotone aria-hidden="true" />Modifier</button><button className="btn contour mini rouge" onClick={retirer}>{p.actif ? 'Retirer' : 'Réactiver'}</button></div>}
  </div>;
}

export function Personnel() {
  const { eid, can } = useApp(); const pc = usePc(); const e = useEnvoi();
  const [filtre, setFiltre] = useState('tous'); const [cherche, setCh] = useState(''); const [sel, setSel] = useState<string>(''); const [form, setForm] = useState<any>(null);
  const q = useQ(() => db.get(`enseignants?etablissement_id=eq.${eid}&select=*&order=ordre,nom,prenom`), [eid]);
  const l: any[] = (q.data as any) || [];
  const urls = usePhotos(l.map((p) => p.photo_chemin));
  const actifs = l.filter((p) => p.actif);
  const n = { tous: actifs.length, enseignant: actifs.filter((p) => p.categorie === 'enseignant').length, direction: actifs.filter((p) => p.categorie === 'direction').length, autre: actifs.filter((p) => p.categorie === 'autre').length, photo: actifs.filter((p) => !p.photo_chemin).length };
  const vis = l.filter((p) => (filtre === 'anciens' ? !p.actif : p.actif) && (filtre === 'tous' || filtre === 'anciens' || (filtre === 'photo' ? !p.photo_chemin : p.categorie === filtre)) && (!cherche || `${nomP(p)} ${p.fonction || ''} ${p.classe_matiere || ''}`.toLowerCase().includes(cherche.toLowerCase())));
  const choisi = l.find((p) => p.id === sel) || (pc ? vis[0] : null);
  const retirer = (p: any) => e.envoyer(async () => { await db.upd(`enseignants?id=eq.${p.id}`, { actif: !p.actif }); await q.reload(); });
  const F: [string, string, number][] = [['tous', 'Tous', n.tous], ['enseignant', 'Enseignants', n.enseignant], ['direction', 'Direction', n.direction], ['autre', 'Autres', n.autre], ['photo', 'Sans photo', n.photo]];
  if (l.some((p) => !p.actif)) F.push(['anciens', 'Anciens', l.length - actifs.length]);
  return <>
    <Titre t="Enseignants & personnel">{can('directeur', 'secretaire') && <button className="btn plein mini" onClick={() => setForm({})}><PiPlusBold /><span>Ajouter<span className="bureau-seul-t"> une personne</span></span></button>}</Titre>
    <Erreur t={e.erreur} />
    <Etat q={q}>{() => l.length === 0 ? <section className="carte"><Vide t="Ajoutez vos enseignants, la direction et le reste du personnel : leur fiche servira pour les cartes, l'organigramme et la paie.">{can('directeur', 'secretaire') && <button className="btn plein mini" onClick={() => setForm({})}><PiPlusBold />Ajouter une personne</button>}</Vide></section> : <>
      <div className="barre-f">
        <div className="segment" role="tablist">{F.map(([k, t, c]) => <button key={k} role="tab" aria-selected={filtre === k} className={filtre === k ? 'on' : ''} onClick={() => setFiltre(k)}>{t}<em>{nb(c)}</em></button>)}</div>
        <label className="cherche"><PiMagnifyingGlassBold aria-hidden="true" /><input placeholder="Rechercher un nom, une classe…" value={cherche} onChange={(x) => setCh(x.target.value)} aria-label="Rechercher" /></label>
      </div>
      <div className="pers-zone">
        <div className="grille-pers">{vis.length === 0 ? <Vide t="Personne dans cette liste." /> : vis.map((p) => <button key={p.id} className={`carte-pers${choisi?.id === p.id && pc ? ' on' : ''}`} onClick={() => setSel(p.id)}>
          <Photo url={urls[p.photo_chemin]} nom={nomP(p)} /><b>{nomP(p)}</b><small>{fonctionDe(p)}</small>{p.classe_matiere && <span className={`puce ${p.categorie === 'enseignant' ? 'p-vert' : 'p-bleu'}`}>{p.classe_matiere}</span>}
        </button>)}</div>
        {pc && choisi && <aside className="carte panneau-p"><Fiche p={choisi} url={urls[choisi.photo_chemin]} modifier={() => setForm(choisi)} retirer={() => retirer(choisi)} /></aside>}
      </div>
    </>}</Etat>
    {!pc && sel && choisi && <Modale titre={nomP(choisi)} fermer={() => setSel('')}><Fiche p={choisi} url={urls[choisi.photo_chemin]} modifier={() => { setSel(''); setForm(choisi); }} retirer={() => { retirer(choisi); setSel(''); }} /></Modale>}
    {form && <FormPersonne p={form.id ? form : null} fermer={() => setForm(null)} fini={() => { setForm(null); q.reload(); }} />}
  </>;
}

// ---------------------------------------------------------------- élèves de l'année, par classe
function useEleves() {
  const { annee } = useApp();
  return useQ(async () => {
    const [cl, ins] = await Promise.all([
      db.get(`classes?annee_scolaire_id=eq.${annee.id}&select=id,nom,ordre,niveaux(nom)&order=ordre,nom`),
      db.tout(`inscriptions?annee_scolaire_id=eq.${annee.id}&statut=eq.inscrit&select=id,classe_id,eleves(id,prenom,nom,matricule,date_naissance,sexe,photo_chemin,code_carte,statut,eleve_responsables(principal,lien,responsables(prenom,nom,telephone)))&order=id`),
    ]);
    const classes = grouperClasses(cl.map((c: any) => ({ ...c, niveau: c.niveaux?.nom || '' })), (c: any) => c.niveau).flatMap(([, cs]) => cs);
    const par: Record<string, any[]> = {};
    for (const i of ins) if (i.eleves && i.eleves.statut !== 'archive') (par[i.classe_id] ||= []).push(i.eleves);
    for (const k in par) par[k].sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));
    return { classes, par };
  }, [annee.id]);
}

function PucesClasses({ classes, par, v, set }: any) {
  return <div className="puces-cl" role="tablist" aria-label="Classe">{classes.map((c: any) => <button key={c.id} role="tab" aria-selected={v === c.id} className={v === c.id ? 'on' : ''} onClick={() => set(c.id)}>{c.nom}<em>{(par[c.id] || []).length}</em></button>)}</div>;
}

// ---------------------------------------------------------------- Photos d'identité
export function Photos() {
  const { eid, can } = useApp(); const e = useEnvoi(); const [vue, setVue] = useState('eleves'); const [cl, setCl] = useState(''); const [enCours, setEC] = useState('');
  const q = useEleves(); const qp = useQ(() => db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&select=id,prenom,nom,fonction,categorie,sexe,photo_chemin&order=ordre,nom`), [eid]);
  const d: any = q.data; const classe = cl || d?.classes?.[0]?.id || '';
  const liste: any[] = vue === 'eleves' ? (d?.par?.[classe] || []) : ((qp.data as any) || []);
  const urls = usePhotos(liste.map((x) => x.photo_chemin));
  const peut = can('directeur', 'secretaire'); const sans = liste.filter((x) => !x.photo_chemin).length;
  const poser = (x: any, f?: File | null) => { if (!f) return; setEC(x.id); e.envoyer(async () => { try { const ch = await db.poserPhoto(eid, f); await db.upd(`${vue === 'eleves' ? 'eleves' : 'enseignants'}?id=eq.${x.id}`, { photo_chemin: ch }); vue === 'eleves' ? await q.reload() : await qp.reload(); } finally { setEC(''); } }); };
  return <>
    <Titre t="Photos d'identité" />
    <Erreur t={e.erreur} />
    <div className="segment" role="tablist"><button role="tab" aria-selected={vue === 'eleves'} className={vue === 'eleves' ? 'on' : ''} onClick={() => setVue('eleves')}>Élèves</button><button role="tab" aria-selected={vue === 'pers'} className={vue === 'pers' ? 'on' : ''} onClick={() => setVue('pers')}>Enseignants & direction<em>{nb(((qp.data as any) || []).length)}</em></button></div>
    {vue === 'eleves' && d?.classes?.length > 0 && <section className="carte filtres-c"><span className="filtre-l">Classe</span><PucesClasses classes={d.classes} par={d.par} v={classe} set={setCl} /></section>}
    <Etat q={vue === 'eleves' ? q : qp}>{() => liste.length === 0 ? <section className="carte"><Vide t={vue === 'eleves' ? 'Aucun élève inscrit dans cette classe.' : 'Ajoutez d\'abord le personnel dans « Enseignants & personnel ».'} /></section> : <>
      {sans > 0 && <div className="alerte-ph"><PiWarningCircleFill aria-hidden="true" /><span><b>{nb(sans)} {vue === 'eleves' ? `élève${sans > 1 ? 's' : ''}` : `personne${sans > 1 ? 's' : ''}`} sans photo.</b> {peut ? 'Touchez une case pour prendre la photo avec le téléphone ou choisir une image.' : ''}</span></div>}
      <div className="grille-ph">{liste.map((x) => <label key={x.id} className={`case-ph${x.photo_chemin ? '' : ' manque'}${peut ? '' : ' lecture'}`}>
        <span className="cadre-ph">{enCours === x.id ? <Chargement /> : x.photo_chemin && urls[x.photo_chemin] ? <img src={urls[x.photo_chemin]} alt={`Photo de ${nomP(x)}`} /> : <span className="ph-aj"><PiCameraDuotone aria-hidden="true" />{peut ? 'Ajouter' : 'Sans photo'}</span>}</span>
        <b>{nomP(x)}</b><small>{vue === 'eleves' ? (x.matricule || ' ') : fonctionDe(x)}</small>
        {peut && <input type="file" accept="image/*" capture="user" hidden disabled={!!enCours} onChange={(ev) => { poser(x, ev.target.files?.[0]); ev.target.value = ''; }} />}
      </label>)}</div>
      <p className="note">La photo est recadrée automatiquement au format carte (3,5 × 4,5 cm). Conseil : de face, sur un fond clair.</p>
    </>}</Etat>
  </>;
}

// ---------------------------------------------------------------- Organigramme
const estFondateur = (p: any) => /fondat/i.test(p.fonction || '');
const estDirecteur = (p: any) => /directeur(?! des)|directrice|promoteur/i.test(p.fonction || '') && !estFondateur(p);
function cycle(p: any) {
  const t = `${p.classe_matiere || ''}`.toLowerCase();
  if (/section|maternelle|crèche|creche/.test(t)) return 'Maternelle';
  if (/\b(cp|ce|cm)\s*\d|\bcp\b|\bce\b|\bcm\b|primaire/.test(t)) return 'Primaire';
  if (/\b(7|8|9|10)\s*e\b|coll[eè]ge/.test(t)) return 'Collège';
  if (/\b(11|12)\s*e\b|terminale|lyc[eé]e/.test(t)) return 'Lycée';
  return 'Enseignants';
}
export function Organigramme() {
  const { eid, etab } = useApp();
  const q = useQ(() => db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&select=id,prenom,nom,sexe,fonction,categorie,classe_matiere,photo_chemin&order=ordre,nom`), [eid]);
  const l: any[] = (q.data as any) || []; const urls = usePhotos(l.map((p) => p.photo_chemin));
  const B = ({ p, g }: any) => <div className={`org-b${g ? ' g' : ''}`}><Photo url={urls[p.photo_chemin]} nom={nomP(p)} /><span><b>{nomP(p)}</b><small>{fonctionDe(p)}</small></span></div>;
  const fond = l.filter(estFondateur), dir = l.filter(estDirecteur);
  const bureau = l.filter((p) => !estFondateur(p) && !estDirecteur(p) && p.categorie !== 'enseignant');
  const ens = l.filter((p) => p.categorie === 'enseignant');
  const ORD = ['Maternelle', 'Primaire', 'Collège', 'Lycée', 'Enseignants'];
  const cycles = ORD.map((c) => [c, ens.filter((p) => cycle(p) === c)] as [string, any[]]).filter(([, x]) => x.length);
  return <>
    <Titre t="Organigramme"><button className="btn contour mini" onClick={() => print()}><PiPrinterDuotone aria-hidden="true" /><span>Imprimer</span></button></Titre>
    <Etat q={q}>{() => l.length === 0 ? <section className="carte"><Vide t="L'organigramme se construit tout seul à partir du personnel enregistré dans « Enseignants & personnel »." /></section> :
      <section className="carte org zone-imp">
        <div className="org-t"><LogoEcole etab={etab} taille={40} /><b>{etab.nom}</b></div>
        <div className="org">
          {fond.length > 0 && <div className="org-n">{fond.map((p) => <B key={p.id} p={p} g />)}</div>}
          {dir.length > 0 && <><i className="org-v" /><div className="org-n">{dir.map((p) => <B key={p.id} p={p} g />)}</div></>}
          {bureau.length > 0 && <><i className="org-v" /><div className="org-n org-r">{bureau.map((p) => <B key={p.id} p={p} />)}</div></>}
          {cycles.length > 0 && <><i className="org-v" /><div className="org-cy">{cycles.map(([c, ps]) => <div key={c} className="org-c"><b>{c}</b>{ps.map((p) => <div key={p.id} className="org-p"><Photo url={urls[p.photo_chemin]} nom={nomP(p)} /><span><b>{nomP(p)}</b><small>{p.classe_matiere || fonctionDe(p)}</small></span></div>)}</div>)}</div></>}
        </div>
      </section>}</Etat>
  </>;
}

// ---------------------------------------------------------------- Cartes scolaires
function Carte({ x, eleve, etab, annee, url, verso }: any) {
  const nom = nomP(x); const fin = annee?.date_fin ? dateFr(annee.date_fin) : '';
  const resp = eleve ? ((x.eleve_responsables || []).find((r: any) => r.principal) || (x.eleve_responsables || [])[0])?.responsables : null;
  const contact = eleve ? (resp ? `${nomP(resp)}${resp.telephone ? ' · ' + telAff(resp.telephone) : ''}` : '') : (x.contact_nom ? `${x.contact_nom}${x.contact_telephone ? ' · ' + telAff(x.contact_telephone) : ''}` : '');
  const champs: [string, string][] = eleve
    ? [['Nom', (x.nom || '').toUpperCase()], ['Prénom', x.prenom], ['Classe', x.classe], ['Né(e) le', x.date_naissance ? dateFr(x.date_naissance) : ''], ['Matricule', x.matricule || '']]
    : [['Nom', (x.nom || '').toUpperCase()], ['Prénom', x.prenom], ['Fonction', fonctionDe(x)], [x.categorie === 'enseignant' ? 'Classe' : 'Service', x.classe_matiere || ''], ['Téléphone', x.telephone ? telAff(x.telephone) : '']];
  if (verso) return <div className={`carte-sc verso${eleve ? '' : ' pers'}`}>
    <div className="cs-v"><div className="cs-qr"><Qr texte={lienVerif(x.code_carte)} taille={112} /><small>Scannez pour vérifier que la carte est valide</small></div>
      <div className="cs-vi"><div className="cs-ec"><LogoEcole etab={etab} taille={24} /><b>{etab.nom}</b></div><small>{[etab.adresse || etab.quartier, etab.ville].filter(Boolean).join(', ')}{etab.telephone ? ` · ${telAff(etab.telephone)}` : ''}</small>
        {contact && <span><small>{eleve ? 'Parent / tuteur' : 'Personne à contacter'} :</small> <b>{contact}</b></span>}
        <small>Cette carte est personnelle. En cas de perte, merci de la rapporter à l'école.</small>
        <div className="cs-sig"><span>Le Directeur<i /></span><em>CACHET</em></div></div></div>
    <i className="cs-dr" /></div>;
  return <div className={`carte-sc${eleve ? '' : ' pers'}`}>
    <div className="cs-h"><LogoEcole etab={etab} taille={40} /><div><b>{etab.nom}</b><small>{eleve ? "CARTE D'IDENTITÉ SCOLAIRE" : 'CARTE PROFESSIONNELLE'}</small></div><em>{annee?.libelle}</em></div>
    <div className="cs-c"><Photo url={url} nom={nom} className="cs-ph" /><dl>{champs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || '—'}</dd></div>)}</dl></div>
    <span className="cs-val">{fin && <>Valable jusqu'au <b>{fin}</b></>}</span><span className="cs-q"><Qr texte={lienVerif(x.code_carte)} taille={50} /></span>
    <i className="cs-dr" /></div>;
}

export function Cartes() {
  const { eid, etab, annee } = useApp(); const [vue, setVue] = useState('eleves'); const [cl, setCl] = useState(''); const [imp, setImp] = useState(false);
  const q = useEleves(); const qp = useQ(() => db.get(`enseignants?etablissement_id=eq.${eid}&actif=is.true&select=*&order=ordre,nom`), [eid]);
  const d: any = q.data; const classe = cl || d?.classes?.[0]?.id || '';
  const nomCl = d?.classes?.find((c: any) => c.id === classe)?.nom || '';
  const pers: any[] = (qp.data as any) || [];
  const liste: any[] = vue === 'eleves' ? (d?.par?.[classe] || []).map((x: any) => ({ ...x, classe: nomCl })) : pers.filter((p) => vue === 'pers' ? p.categorie === 'enseignant' : p.categorie !== 'enseignant');
  const urls = usePhotos(liste.map((x) => x.photo_chemin)); const sans = liste.filter((x) => !x.photo_chemin).length;
  const eleve = vue === 'eleves';
  useEffect(() => { if (!imp) return; document.body.classList.add('imp-cartes'); const t = setTimeout(() => { print(); setImp(false); }, 600); return () => { clearTimeout(t); document.body.classList.remove('imp-cartes'); }; }, [imp]);
  const AUTO = ["Nom de l'école", etab.logo_chemin ? 'Logo' : null, 'Adresse et téléphone', 'Année scolaire', 'Photos', 'QR unique par carte'].filter(Boolean);
  return <>
    <Titre t="Cartes scolaires">{liste.length > 0 && <button className="btn plein mini" onClick={() => setImp(true)}><PiPrinterDuotone aria-hidden="true" /><span>Imprimer {nb(liste.length)}<span className="bureau-seul-t"> carte{liste.length > 1 ? 's' : ''}</span></span></button>}</Titre>
    <div className="segment" role="tablist">{[['eleves', 'Élèves'], ['pers', 'Enseignants'], ['dir', 'Direction & personnel']].map(([k, t]) => <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'on' : ''} onClick={() => setVue(k)}>{t}</button>)}</div>
    {eleve && d?.classes?.length > 0 && <section className="carte filtres-c"><span className="filtre-l">Classe</span><PucesClasses classes={d.classes} par={d.par} v={classe} set={setCl} /></section>}
    <div className="auto-r"><b>Rempli automatiquement :</b>{AUTO.map((t) => <span key={t as string}><PiCheckBold aria-hidden="true" />{t}</span>)}</div>
    {!etab.logo_chemin && <div className="alerte-ph bleu"><PiIdentificationCardDuotone aria-hidden="true" /><span>Ajoutez le logo de l'école dans <b>Paramètres</b> : il apparaîtra tout seul sur les cartes.</span></div>}
    {sans > 0 && <div className="alerte-ph"><PiWarningCircleFill aria-hidden="true" /><span><b>{nb(sans)} sans photo</b> : leur carte sortira avec les initiales. Ajoutez les photos dans « Photos d'identité ».</span></div>}
    <Etat q={eleve ? q : qp}>{() => liste.length === 0 ? <section className="carte"><Vide t={eleve ? 'Aucun élève dans cette classe.' : 'Ajoutez d\'abord le personnel dans « Enseignants & personnel ».'} /></section> :
      <div className="grille-cs">{liste.slice(0, 2).map((x) => <div key={x.id} className="paire-cs"><Carte x={x} eleve={eleve} etab={etab} annee={annee} url={urls[x.photo_chemin]} /><Carte x={x} eleve={eleve} etab={etab} annee={annee} verso /></div>)}
        {liste.length > 2 && <p className="note">… et {nb(liste.length - 2)} autre{liste.length > 3 ? 's' : ''}. Format carte bancaire (8,5 × 5,4 cm), 10 par feuille A4, recto puis verso.</p>}</div>}</Etat>
    {imp && createPortal(<div className="zone-impression">{Array.from({ length: Math.ceil(liste.length / 10) }, (_, k) => liste.slice(k * 10, k * 10 + 10)).flatMap((page, k) => [
      <div key={`r${k}`} className="feuille-cs">{page.map((x) => <Carte key={x.id} x={x} eleve={eleve} etab={etab} annee={annee} url={urls[x.photo_chemin]} />)}</div>,
      <div key={`v${k}`} className="feuille-cs dos">{page.map((x) => <Carte key={x.id} x={x} eleve={eleve} etab={etab} annee={annee} verso />)}</div>])}</div>, document.body)}
  </>;
}

// ---------------------------------------------------------------- page publique : vérification d'une carte (QR)
export function VerifCarte({ code }: { code: string }) {
  const q = useQ(async () => ({ d: await db.rpc('verifier_carte', { p_code: code }) }), [code]);
  return <main className="pub"><section className="carte-pub verif">
    <Etat q={q}>{({ d }: any) => !d ? <><span className="verif-i rouge"><PiXCircleFill aria-hidden="true" /></span><h1>Carte inconnue</h1><p className="intro">Ce code ne correspond à aucune carte délivrée avec Scolaris. Elle peut être fausse.</p></> : <>
      <div className="verif-ec">{d.logo ? <img src={`${SUPA}/storage/v1/object/public/logos/${d.logo}`} alt="" /> : <PiBuildingsFill aria-hidden="true" />}<b>{d.ecole}</b>{d.ville && <small>{d.ville}</small>}</div>
      {d.valide ? <PiSealCheckFill className="verif-i vert" aria-hidden="true" /> : <span className="verif-i rouge"><PiXCircleFill aria-hidden="true" /></span>}
      <h1>{d.valide ? 'Carte valide' : 'Carte non valide'}</h1>
      <dl className="verif-d"><div><dt>Nom</dt><dd>{`${d.prenom} ${String(d.nom || '').toUpperCase()}`}</dd></div>
        {d.type === 'eleve' ? <><div><dt>Classe</dt><dd>{d.classe || '—'}</dd></div>{d.annee && <div><dt>Année scolaire</dt><dd>{d.annee}</dd></div>}{d.matricule && <div><dt>Matricule</dt><dd>{d.matricule}</dd></div>}</> : <><div><dt>Fonction</dt><dd>{d.fonction}</dd></div>{d.classe && <div><dt>Classe / service</dt><dd>{d.classe}</dd></div>}</>}</dl>
      {!d.valide && <p className="intro">{d.type === 'eleve' ? "Cet élève n'est plus inscrit dans cette école." : "Cette personne ne fait plus partie du personnel de l'école."}</p>}
    </>}</Etat>
    <div className="verif-p"><Logo petit /><small>Vérification sécurisée par Scolaris</small></div>
  </section></main>;
}

