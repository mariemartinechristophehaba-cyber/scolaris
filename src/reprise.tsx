import { useMemo, useRef, useState } from 'react';
import { PiCheckBold, PiCheckCircleFill, PiCloudArrowUpDuotone, PiDownloadSimpleBold, PiFileArrowUpDuotone, PiInfoFill, PiMagicWandDuotone, PiWarningDuotone, PiXCircleDuotone } from 'react-icons/pi';
import { db, message } from './api';
import { auj, gnf, grouperClasses, lireTableau, nb, telechargerExcel } from './lib';
import { Avatar, Champ, Erreur, Etat, Lien, Titre, Tuile, useApp, useEnvoi, useQ } from './ui';
import { COLS_R, Col, Deja, Eleve, Groupe, analyser, deviner } from './reprise-logique';

const ETATS: Record<Groupe['etat'], [string, string]> = { pret: ['Prêts', 'p-vert'], verifier: ['À vérifier', 'p-orange'], ecarte: ['Écartés', 'p-rouge'] };

// Reprise des paiements reçus avant Scolaris : l'école envoie le total payé par chaque élève,
// Scolaris reconnaît l'élève, n'ajoute que la différence et la répartit sur ses tranches.
export function ReprisePaiements() {
  const { annee, eid, can, majNotif } = useApp();
  const [tab, setTab] = useState<string[][] | null>(null); const [nomF, setNF] = useState(''); const [map, setMap] = useState<Partial<Record<Col, number>>>({}); const [mts, setMts] = useState<number[]>([]);
  const [date, setDate] = useState(auj()); const [coche, setCoche] = useState<Record<string, boolean>>({}); const [vue, setVue] = useState<Groupe['etat']>('pret'); const [cl, setCl] = useState('');
  const [rap, setRap] = useState<any>(null); const [av, setAv] = useState(0); const [sur, setSur] = useState(false);
  const e = useEnvoi(); const inp = useRef<HTMLInputElement>(null);
  const q = useQ(async () => {
    const [el, pay, mo] = await Promise.all([
      db.tout(`v_situation_eleves?annee_scolaire_id=eq.${annee.id}&select=eleve_id,matricule,prenom,nom,classe,facture_net,reste&order=inscription_id`),
      db.tout(`paiements?annee_scolaire_id=eq.${annee.id}&statut=in.(valide,en_attente)&select=eleve_id,montant,statut&order=id`),
      db.get(`moyens_paiement?etablissement_id=eq.${eid}&type=eq.especes&actif=is.true&select=id,libelle`),
    ]);
    const deja: Record<string, Deja> = {};
    pay.forEach((p: any) => { const d = (deja[p.eleve_id] ||= { valide: 0, attente: 0 }); if (p.statut === 'valide') d.valide += Number(p.montant); else d.attente += Number(p.montant); });
    const eleves: Eleve[] = el.map((x: any) => ({ ...x, facture_net: Number(x.facture_net) || 0, reste: Number(x.reste) || 0 }));
    return { eleves, deja, especes: mo[0] || null };
  }, [annee.id, rap]);

  const ouvrir = (f?: File | null) => { if (!f) return; setRap(null); e.envoyer(async () => {
    const t = (await lireTableau(f)).map((l) => l.map((c) => String(c ?? '')));
    // L'en-tête n'est pas toujours sur la première ligne (titre de l'école au-dessus) : on prend la première ligne qui ressemble à un en-tête.
    const i = t.findIndex((l) => { const g = deviner(l); return g.montants.length > 0 && (g.m.matricule !== undefined || g.m.nom !== undefined || g.m.complet !== undefined); });
    const tt = i > 0 ? t.slice(i) : t; if (tt.length < 2) throw new Error('Le fichier ne contient aucune ligne');
    const g = deviner(tt[0]); setTab(tt); setNF(f.name); setMap(g.m); setMts(g.montants); setCoche({}); setVue('pret'); setCl('');
  }); };

  const groupes = useMemo(() => (tab && q.data ? analyser(tab, map, mts, q.data.eleves, q.data.deja) : []), [tab, map, mts, q.data]);
  const retenus = groupes.filter((g) => g.ajouter > 0 && (g.etat === 'pret' || (g.etat === 'verifier' && coche[g.cle])));
  const total = retenus.reduce((s, g) => s + g.ajouter, 0);

  const lancer = () => {
    if (!q.data?.especes) return e.setE('Aucun moyen de paiement « Espèces » actif : ajoutez-le dans les frais scolaires.');
    if (!retenus.length) return;
    if (!confirm(`Ajouter ${nb(retenus.length)} paiement(s) pour un total de ${gnf(total)} ? Ils seront validés, répartis sur les tranches des élèves et comptés dans la caisse espèces.`)) return;
    e.envoyer(async () => {
      const [imp] = await db.ins('imports', { etablissement_id: eid, type: 'paiements', fichier: nomF, statut: 'controle', total: groupes.length, correspondance: { colonnes: map, montants: mts } });
      let ok = 0, somme = 0, sautes = 0; const err: string[] = []; let fait = 0; setAv(0);
      const un = async (g: Groupe) => {
        const el = g.eleve!;
        try {
          // On relit ce qui est déjà payé juste avant d'écrire : si quelqu'un a saisi un paiement entre-temps, il n'est pas compté deux fois.
          const l = await db.get(`paiements?eleve_id=eq.${el.eleve_id}&annee_scolaire_id=eq.${annee.id}&statut=in.(valide,en_attente)&select=montant`);
          const deja = l.reduce((s: number, p: any) => s + Number(p.montant), 0); const m = g.fichier - deja;
          if (m <= 0) { sautes++; return; }
          const [p] = await db.ins('paiements', { id: crypto.randomUUID(), etablissement_id: eid, eleve_id: el.eleve_id, annee_scolaire_id: annee.id, montant: m, date_paiement: date, moyen_id: q.data!.especes.id, reference: null, note: `Reprise : ${nb(g.fichier)} payés avant Scolaris selon « ${nomF} »`, origine: 'import', import_id: imp.id, import_cle: `reprise:${annee.id}:${el.eleve_id}:${deja}`, impacte_tresorerie: true });
          await db.upd(`paiements?id=eq.${p.id}`, { statut: 'valide' });
          ok++; somme += m;
        } catch (x) { const t = message(x); err.push(`${el.nom} ${el.prenom} : ${/duplicate|import_cle|unique/i.test(t) ? 'déjà repris' : t}`); }
        finally { fait++; setAv(fait); }
      };
      const file = [...retenus]; await Promise.all(Array.from({ length: 4 }, async () => { while (file.length) await un(file.shift()!); }));
      await db.upd(`imports?id=eq.${imp.id}`, { statut: err.length && !ok ? 'echec' : 'termine', importees: ok, doublons: sautes + groupes.filter((g) => g.etat === 'ecarte' && /à jour|déjà plus/.test(g.motif)).length, erreurs: err.length, rapport: { erreurs: err, montant: somme } });
      majNotif(); setRap({ ok, somme, err, sautes, ecartes: groupes.length - retenus.length }); setTab(null);
    });
  };

  const modele = () => telechargerExcel('modele-reprise-paiements', [['Matricule', 'Nom', 'Prénom', 'Classe', 'Montant payé'], ['CCS0001', 'DIALLO', 'Alpha', 'CP1', 750000], ['CCS0002', 'CAMARA', 'Fatoumata', 'CE2', 1200000]]);
  if (!can('directeur', 'comptable')) return <><Titre t="Paiements déjà reçus" retour="/paiements" /><p className="note centre">Seuls le directeur et le comptable peuvent reprendre les anciens paiements.</p></>;

  return (
    <>
      <Titre t="Paiements déjà reçus" retour="/paiements" />
      <div className="imp">
        <ol className="etapes">{['Fichier', 'Contrôle', 'Résultat'].map((t, i) => { const n = tab ? 1 : rap ? 2 : 0; return <li key={t} className={i < n || (rap && i === 2) ? 'fait' : i === n ? 'on' : ''}><i>{i < n || (rap && i === 2) ? <PiCheckBold aria-hidden="true" /> : i + 1}</i><span>{t}</span></li>; })}</ol>
        <Erreur t={e.erreur || q.erreur} />
        {rap && <section className="carte res-imp"><Tuile i={PiCheckCircleFill} ton="vert" t={44} /><div><h2>Reprise terminée</h2>
          <p>{nb(rap.ok)} paiement(s) ajouté(s) pour {gnf(rap.somme)}, répartis sur les tranches des élèves. {rap.sautes ? `${nb(rap.sautes)} élève(s) déjà à jour au moment de l'écriture. ` : ''}{nb(rap.ecartes)} ligne(s) laissée(s) de côté.</p>
          {rap.err.slice(0, 8).map((x: string) => <small key={x} className="bloc rouge">{x}</small>)}
          <div className="ligne-btn"><Lien to="/paiements" className="btn contour mini">Voir les paiements</Lien><Lien to="/relances" className="btn contour mini">Voir les retards</Lien></div></div></section>}
        <Etat q={q}>{(d) => !tab ? <>
          <section className={sur ? 'carte depot sur' : 'carte depot'} onDragOver={(x) => { x.preventDefault(); setSur(true); }} onDragLeave={() => setSur(false)} onDrop={(x) => { x.preventDefault(); setSur(false); ouvrir(x.dataTransfer.files[0]); }}>
            <PiCloudArrowUpDuotone aria-hidden="true" /><h2>Importez ce que les élèves ont déjà payé</h2><p>Fichier Excel (.xlsx) ou CSV : une ligne par élève avec le total payé depuis la rentrée.</p>
            <button className="btn plein mini" onClick={() => inp.current?.click()} disabled={e.occupe}><PiFileArrowUpDuotone />Choisir un fichier</button>
            <input ref={inp} type="file" hidden accept=".xlsx,.csv" onChange={(x) => { ouvrir(x.target.files?.[0]); x.target.value = ''; }} />
          </section>
          <section className="carte modele-i"><div><h2>Comment ça marche</h2>
            <p className="note"><PiMagicWandDuotone aria-hidden="true" /> Scolaris reconnaît chaque élève par son matricule (CCS042 = CCS0042), ou par son nom si le matricule manque, et vérifie la classe.</p>
            <p className="note">Le montant est le <b>total payé à ce jour</b>. Scolaris retire ce qui est déjà enregistré ({gnf((Object.values(d.deja) as Deja[]).reduce((s, x) => s + x.valide + x.attente, 0))} pour l'instant) et n'ajoute que la différence : rien n'est compté deux fois, même si vous importez le fichier deux fois.</p>
            <div className="puces g">{['Matricule', 'Nom', 'Prénom', 'Classe', 'Montant payé'].map((t) => <span className="puce" key={t}>{t}</span>)}</div></div>
            <button className="btn contour mini" onClick={modele}><PiDownloadSimpleBold />Télécharger le modèle</button></section>
        </> : Controle({ d })}</Etat>
      </div>
    </>
  );

  function Controle({ d }: { d: any }) {
    const parEtat = (k: Groupe['etat']) => groupes.filter((g) => g.etat === k);
    const classes = grouperClasses([...new Set(retenus.map((g) => g.eleve!.classe))].map((nom) => ({ nom })));
    const l = parEtat(vue).filter((g) => !cl || (g.eleve?.classe || g.classeFichier) === cl);
    const lesCl = [...new Set(parEtat(vue).map((g) => g.eleve?.classe || g.classeFichier).filter(Boolean))].sort();
    const ent = tab![0];
    return <>
      <div className="minis">
        <div className="carte mini-c"><Tuile i={PiCheckCircleFill} ton="vert" t={44} /><div><span>Prêts</span><span className="gnf"><b>{nb(parEtat('pret').length)}</b></span></div></div>
        <div className="carte mini-c"><Tuile i={PiWarningDuotone} ton="orange" t={44} /><div><span>À vérifier</span><span className="gnf"><b>{nb(parEtat('verifier').length)}</b></span></div></div>
        <div className="carte mini-c"><Tuile i={PiXCircleDuotone} ton="rouge" t={44} /><div><span>Écartés</span><span className="gnf"><b>{nb(parEtat('ecarte').length)}</b></span></div></div>
      </div>
      {!mts.length && <div className="alerte err">Aucune colonne de montant reconnue : choisissez-la ci-dessous.</div>}
      {!d.especes && <div className="alerte err">Aucun moyen de paiement « Espèces » actif dans l'école.</div>}
      <section className="carte"><h2>Colonnes du fichier « {nomF} »</h2>
        <div className="corresp">{COLS_R.map(([k, t]) => <Champ key={k} label={t}><select value={map[k] ?? ''} onChange={(x) => { const m = { ...map }; if (x.target.value === '') delete m[k]; else m[k] = Number(x.target.value); setMap(m); }}><option value="">Aucune</option>{ent.map((h, i) => <option key={i} value={i}>{h || `Colonne ${i + 1}`}</option>)}</select></Champ>)}
          <Champ label="Date des paiements"><input type="date" value={date} max={auj()} onChange={(x) => setDate(x.target.value || auj())} /></Champ></div>
        <small className="g-lab">Montant payé (les colonnes cochées sont additionnées) :</small>
        <div className="puces g">{ent.map((h, i) => Object.values(map).includes(i) ? null : <button type="button" key={i} className={mts.includes(i) ? 'puce p-vert' : 'puce'} aria-pressed={mts.includes(i)} onClick={() => setMts(mts.includes(i) ? mts.filter((x) => x !== i) : [...mts, i].sort((a, b) => a - b))}>{mts.includes(i) && <PiCheckBold aria-hidden="true" />}{h || `Colonne ${i + 1}`}</button>)}</div>
      </section>
      {retenus.length > 0 && <section className="carte c-table"><div className="tete-carte"><h2>Répartition par classe</h2><span className="puce p-vert">{gnf(total)}</span></div>
        <div className="table court"><table><thead><tr><th>Classe</th><th className="dr">Élèves</th><th className="dr">À ajouter</th></tr></thead><tbody>{classes.flatMap(([, cs]) => cs).map((c: any) => { const g = retenus.filter((x) => x.eleve!.classe === c.nom); return <tr key={c.nom}><td><b>{c.nom}</b></td><td className="dr">{nb(g.length)}</td><td className="dr fort">{nb(g.reduce((s, x) => s + x.ajouter, 0))}</td></tr>; })}</tbody></table></div></section>}
      <div className="segment" role="tablist">{(Object.keys(ETATS) as Groupe['etat'][]).map((k) => <button key={k} role="tab" aria-selected={vue === k} className={vue === k ? 'on' : ''} onClick={() => { setVue(k); setCl(''); }}>{ETATS[k][0]}<em>{nb(parEtat(k).length)}</em></button>)}</div>
      {vue === 'verifier' && l.length > 0 && <p className="sms-b"><PiInfoFill aria-hidden="true" />Cochez les élèves à garder après vérification. Les autres ne seront pas ajoutés.<button type="button" className="btn lien" onClick={() => { const c = { ...coche }; l.forEach((g) => { if (g.ajouter > 0) c[g.cle] = true; }); setCoche(c); }}>Tout cocher</button></p>}
      <section className="carte c-table">
        {lesCl.length > 1 && <div className="barre-outils"><select value={cl} onChange={(x) => setCl(x.target.value)} aria-label="Classe"><option value="">Toutes les classes</option>{lesCl.map((c) => <option key={c}>{c}</option>)}</select></div>}
        {l.length === 0 ? <p className="note centre">Aucune ligne ici.</p> : <ul className="liste-p">{l.slice(0, 300).map((g) => { const el = g.eleve; const nom = el ? `${el.nom} ${el.prenom}` : g.nomFichier || g.matFichier;
          return <li key={g.cle}><label className="lp-h">
            {vue === 'verifier' && <input type="checkbox" checked={!!coche[g.cle]} disabled={!g.ajouter} onChange={(x) => setCoche({ ...coche, [g.cle]: x.target.checked })} />}
            <Avatar nom={nom} /><div><b>{nom}</b><small>{[el?.matricule || g.matFichier, el?.classe || g.classeFichier, `ligne ${g.lignes.join(', ')}`].filter(Boolean).join(' · ')}</small>{g.motif && <small className={vue === 'ecarte' ? 'bloc rouge' : 'bloc orange'}>{g.motif}</small>}</div>
            <div className="fin">{g.ajouter > 0 ? <span className="gnf vert"><b>+{nb(g.ajouter)}</b></span> : <span className="gnf"><b>0</b></span>}<small>Fichier {nb(g.fichier)}{g.deja ? ` · déjà ${nb(g.deja)}` : ''}</small></div></label></li>; })}</ul>}
        {l.length > 300 && <p className="note centre">… et {nb(l.length - 300)} autre(s).</p>}
      </section>
      <div className="ligne-btn fin-imp"><button className="btn contour mini" onClick={() => setTab(null)} disabled={e.occupe}>Annuler</button><button className="btn plein mini" onClick={lancer} disabled={e.occupe || !retenus.length || !d.especes}>{e.occupe ? `Enregistrement… ${nb(av)}/${nb(retenus.length)}` : `Ajouter ${nb(retenus.length)} paiement(s) · ${gnf(total)}`}</button></div>
    </>;
  }
}
