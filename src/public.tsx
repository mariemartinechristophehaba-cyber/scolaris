import { FaArrowLeft, FaPrint, FaWhatsapp } from 'react-icons/fa6';
import { db } from './api';
import { dateFr, gnf } from './lib';
import { Chargement, Lien, Logo, useQ } from './ui';

export function Conditions() {
  return <main className="pub"><section className="carte-pub texte"><Lien to="/inscription" className="retour" aria-label="Retour"><FaArrowLeft /></Lien><Logo /><h1>Conditions d'utilisation</h1>
    <p>Scolaris aide les établissements scolaires à suivre leurs élèves, leurs frais, leurs paiements et leurs dépenses.</p>
    <p>L'établissement reste responsable de l'exactitude des informations saisies et de l'accès accordé à son équipe. Chaque utilisateur protège son mot de passe.</p>
    <p>Les données d'un établissement ne sont jamais accessibles aux autres établissements.</p></section></main>;
}

export function RecuPublic({ jeton }: { jeton: string }) {
  const q = useQ(() => db.rpc('recu_public', { p_jeton: jeton }), [jeton]);
  if (q.charge && !q.data) return <main className="pub"><Chargement /></main>;
  const r: any = q.data;
  if (!r) return <main className="pub"><section className="carte-pub"><Logo /><h1>Reçu introuvable</h1></section></main>;
  const lien = location.href;
  return (
    <main className="pub"><section className="carte-pub recu">
      <Logo petit /><h1>Reçu n° {r.numero}</h1>
      {r.statut === 'annule' && <div className="alerte err">Ce reçu a été annulé.</div>}
      <p className="intro">{r.ecole}{r.ville ? ` · ${r.ville}` : ''}</p>
      <div className="grand">{gnf(r.montant)}</div>
      <dl>
        <dt>Élève</dt><dd>{r.prenom} {r.nom}</dd><dt>Matricule</dt><dd>{r.matricule}</dd><dt>Classe</dt><dd>{r.classe}</dd>
        <dt>Année</dt><dd>{r.annee}</dd><dt>Date</dt><dd>{dateFr(r.date)}</dd><dt>Moyen</dt><dd>{r.moyen}</dd>
        {r.reference && <><dt>Référence</dt><dd>{r.reference}</dd></>}
      </dl>
      <div className="noprint actions-recu">
        <button className="btn plein" onClick={() => print()}><FaPrint /> Imprimer</button>
        <a className="btn contour" href={`https://wa.me/?text=${encodeURIComponent(`Reçu Scolaris n° ${r.numero} : ${lien}`)}`} target="_blank" rel="noreferrer"><FaWhatsapp /> Partager</a>
        <button className="btn lien" onClick={() => history.back()}>Retour</button>
      </div>
    </section></main>
  );
}

export function FamillePublic({ jeton }: { jeton: string }) {
  const q = useQ(() => db.rpc('famille_public', { p_jeton: jeton }), [jeton]);
  if (q.charge && !q.data) return <main className="pub"><Chargement /></main>;
  const r: any = q.data;
  if (!r) return <main className="pub"><section className="carte-pub"><Logo /><h1>Lien introuvable</h1></section></main>;
  return (
    <main className="pub"><section className="carte-pub recu"><Logo petit /><h1>{r.ecole}</h1><p className="intro">Situation de la famille de {r.parent}</p>
      {r.enfants.map((e: any, i: number) => <div className="enfant" key={i}><b>{e.prenom} {e.nom}</b><span>{e.classe}</span>
        <dl><dt>Frais dus</dt><dd>{gnf(e.net)}</dd><dt>Payé</dt><dd>{gnf(e.regle)}</dd><dt>Reste</dt><dd>{gnf(e.reste)}</dd>{e.echu > 0 && <><dt>En retard</dt><dd className="rouge">{gnf(e.echu)}</dd></>}</dl></div>)}
    </section></main>
  );
}
