import { FaArrowLeft } from 'react-icons/fa6';
import { PiArrowLeftBold, PiCheckBold, PiPrinterDuotone, PiWhatsappLogoFill, PiXBold } from 'react-icons/pi';
import { db } from './api';
import { dateFr, gnf, nb } from './lib';
import { Chargement, Lien, Logo, useQ } from './ui';

export function Conditions() {
  return <main className="pub"><section className="carte-pub texte"><Lien to="/inscription" className="retour" aria-label="Retour"><FaArrowLeft /></Lien><Logo /><h1>Conditions d'utilisation</h1>
    <p>Scolaris aide les établissements scolaires à suivre leurs élèves, leurs frais, leurs paiements et leurs dépenses.</p>
    <p>L'établissement reste responsable de l'exactitude des informations saisies et de l'accès accordé à son équipe. Chaque utilisateur protège son mot de passe.</p>
    <p>Les données d'un établissement ne sont jamais accessibles aux autres établissements.</p></section></main>;
}

export function RecuPublic({ jeton }: { jeton: string }) {
  const q = useQ(() => db.rpc('recu_public', { p_jeton: jeton }), [jeton]);
  if (q.charge && !q.data) return <main className="recu-p"><Chargement /></main>;
  const r: any = q.data;
  if (!r) return <main className="pub"><section className="carte-pub"><Logo /><h1>Reçu introuvable</h1></section></main>;
  const annule = r.statut === 'annule';
  const texte = `Reçu Scolaris n° ${r.numero} : ${location.href}`;
  return (
    <main className="recu-p">
      <div className="lignes" aria-hidden="true" />
      <div className="recu-c">
        <header><button className="retour-v noprint" onClick={() => history.back()} aria-label="Retour"><PiArrowLeftBold /></button><h1>Reçu de paiement</h1></header>
        <div className="ticket-o"><section className="ticket">
          <span className={annule ? 'sceau annule' : 'sceau'}>{annule ? <PiXBold aria-hidden="true" /> : <PiCheckBold aria-hidden="true" />}</span>
          <p className="t-etat">{annule ? 'Reçu annulé' : 'Paiement validé'}</p>
          <div className="t-mt"><b>{nb(r.montant)}</b><small>GNF</small></div>
          <p className="t-ec">{r.ecole}{r.ville ? `, ${r.ville}` : ''}</p>
          <div className="pointilles" aria-hidden="true" />
          <dl>
            <div><dt>Reçu n°</dt><dd>{r.numero}</dd></div>
            <div><dt>Élève</dt><dd>{r.prenom} {r.nom}</dd></div>
            <div><dt>Matricule</dt><dd>{r.matricule}</dd></div>
            <div><dt>Classe</dt><dd>{r.classe}</dd></div>
            <div><dt>Année scolaire</dt><dd>{r.annee}</dd></div>
            <div><dt>Date</dt><dd>{dateFr(r.date)}</dd></div>
            <div><dt>Moyen</dt><dd>{r.moyen}</dd></div>
            {r.reference && <div><dt>Référence</dt><dd>{r.reference}</dd></div>}
          </dl>
          <span className={annule ? 'tampon annule' : 'tampon'} aria-hidden="true">{annule ? 'ANNULÉ' : 'PAYÉ'}</span>
        </section></div>
        <div className="noprint recu-a">
          <a className="btn wa-b" href={`https://wa.me/?text=${encodeURIComponent(texte)}`} target="_blank" rel="noreferrer"><PiWhatsappLogoFill aria-hidden="true" />Partager sur WhatsApp</a>
          <button className="btn verre-b" onClick={() => print()}><PiPrinterDuotone aria-hidden="true" />Imprimer</button>
        </div>
      </div>
    </main>
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
