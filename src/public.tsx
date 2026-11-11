import { FaArrowLeft } from 'react-icons/fa6';
import { PiArrowLeftBold, PiCheckBold, PiPrinterDuotone, PiWhatsappLogoFill, PiXBold } from 'react-icons/pi';
import { useState } from 'react';
import { db, getSession } from './api';
import { dateFr, gnf, nb } from './lib';
import { Chargement, Lien, Logo, useQ } from './ui';

export function Conditions() {
  return <main className="pub"><section className="carte-pub texte"><Lien to="/inscription" className="retour" aria-label="Retour"><FaArrowLeft /></Lien><Logo /><h1>Conditions d'utilisation</h1>
    <p>Scolaris aide les établissements scolaires à suivre leurs élèves, leurs frais, leurs paiements et leurs dépenses.</p>
    <p>L'établissement reste responsable de l'exactitude des informations saisies et de l'accès accordé à son équipe. Chaque utilisateur protège son mot de passe.</p>
    <p>Les données d'un établissement ne sont jamais accessibles aux autres établissements.</p></section></main>;
}

// Dessine le reçu en image (PNG) : le parent reçoit une photo du reçu, sans lien vers l'application.
async function imageRecu(r: any): Promise<Blob> {
  await document.fonts.ready;
  const W = 1080, H = 1680, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#0D49D8'); g.addColorStop(1, '#061F6E'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  const rr = (X: number, Y: number, w: number, h: number, ra: number) => { x.beginPath(); x.moveTo(X + ra, Y); x.arcTo(X + w, Y, X + w, Y + h, ra); x.arcTo(X + w, Y + h, X, Y + h, ra); x.arcTo(X, Y + h, X, Y, ra); x.arcTo(X, Y, X + w, Y, ra); x.closePath(); };
  x.fillStyle = '#fff'; x.font = '700 46px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText('Reçu de paiement', W / 2, 110);
  rr(70, 160, W - 140, 1360, 48); x.fillStyle = '#fff'; x.fill();
  const annule = r.statut === 'annule'; const vert = annule ? '#D92D20' : '#12A863';
  x.beginPath(); x.arc(W / 2, 270, 62, 0, 7); x.fillStyle = vert; x.fill();
  x.strokeStyle = '#fff'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath();
  if (annule) { x.moveTo(W / 2 - 24, 246); x.lineTo(W / 2 + 24, 294); x.moveTo(W / 2 + 24, 246); x.lineTo(W / 2 - 24, 294); } else { x.moveTo(W / 2 - 28, 272); x.lineTo(W / 2 - 6, 294); x.lineTo(W / 2 + 30, 248); } x.stroke();
  x.fillStyle = vert; x.font = '700 36px Poppins, sans-serif'; x.fillText(annule ? 'Reçu annulé' : 'Paiement validé', W / 2, 390);
  x.fillStyle = '#0B1F5C'; x.font = '800 110px Poppins, sans-serif'; const m = nb(r.montant); const mw = x.measureText(m).width; x.font = '600 44px Poppins, sans-serif'; const gw = x.measureText(' GNF').width;
  x.textAlign = 'left'; x.font = '800 110px Poppins, sans-serif'; x.fillText(m, (W - mw - gw) / 2, 520); x.font = '600 44px Poppins, sans-serif'; x.fillStyle = '#55617A'; x.fillText(' GNF', (W - mw - gw) / 2 + mw, 520);
  x.textAlign = 'center'; x.font = '600 34px Poppins, sans-serif'; x.fillText(`${r.ecole}${r.ville ? `, ${r.ville}` : ''}`, W / 2, 585);
  x.setLineDash([16, 12]); x.strokeStyle = '#D6E2F7'; x.lineWidth = 4; x.beginPath(); x.moveTo(120, 650); x.lineTo(W - 120, 650); x.stroke(); x.setLineDash([]);
  const lignes: [string, string][] = [['Reçu n°', String(r.numero)], ['Élève', `${r.prenom} ${r.nom}`], ['Matricule', r.matricule || ''], ['Classe', r.classe || ''], ['Année scolaire', r.annee || ''], ['Date', dateFr(r.date)], ['Moyen', r.moyen || '']];
  if (r.reference) lignes.push(['Référence', r.reference]);
  lignes.forEach(([k, v], i) => { const y = 730 + i * 78; x.textAlign = 'left'; x.fillStyle = '#55617A'; x.font = '500 36px Poppins, sans-serif'; x.fillText(k, 130, y); x.textAlign = 'right'; x.fillStyle = '#0B1F5C'; x.font = '700 36px Poppins, sans-serif'; x.fillText(v, W - 130, y); });
  x.save(); x.translate(W / 2, 730 + lignes.length * 78 + 66); x.rotate(-0.17); x.strokeStyle = vert; x.lineWidth = 8; rr(-190, -62, 380, 124, 22); x.stroke(); x.fillStyle = vert; x.font = '800 78px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText(annule ? 'ANNULÉ' : 'PAYÉ', 0, 28); x.restore();
  x.fillStyle = 'rgba(255,255,255,.8)'; x.font = '500 28px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText('Reçu émis avec Scolaris', W / 2, 1610);
  return await new Promise((ok) => c.toBlob((b) => ok(b!), 'image/png'));
}

export function RecuPublic({ jeton }: { jeton: string }) {
  const q = useQ(() => db.rpc('recu_public', { p_jeton: jeton }), [jeton]); const [occ, setOcc] = useState(false);
  if (q.charge && !q.data) return <main className="recu-p"><Chargement /></main>;
  const r: any = q.data;
  if (!r) return <main className="pub"><section className="carte-pub"><Logo /><h1>Reçu introuvable</h1></section></main>;
  const annule = r.statut === 'annule';
  const membre = !!getSession();
  const nomFichier = `Recu-${r.numero}-${(r.prenom || '')}-${(r.nom || '')}.png`.replace(/\s+/g, '-');
  const partager = async () => {
    setOcc(true);
    try {
      const b = await imageRecu(r); const f = new File([b], nomFichier, { type: 'image/png' });
      const n: any = navigator;
      if (n.canShare && n.canShare({ files: [f] })) { await n.share({ files: [f], title: `Reçu n° ${r.numero}`, text: `Reçu de paiement n° ${r.numero}, ${r.ecole}` }); }
      else { const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = nomFichier; a.click(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
    } catch { /* partage annulé */ } finally { setOcc(false); }
  };
  return (
    <main className="recu-p">
      <div className="lignes" aria-hidden="true" />
      <div className="recu-c">
        <header>{membre && <button className="retour-v noprint" onClick={() => history.back()} aria-label="Retour"><PiArrowLeftBold /></button>}<h1>Reçu de paiement</h1></header>
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
          <button className="btn wa-b" disabled={occ} onClick={partager}><PiWhatsappLogoFill aria-hidden="true" />{occ ? 'Préparation…' : 'Envoyer le reçu en image'}</button>
          <button className="btn verre-b" onClick={() => print()}><PiPrinterDuotone aria-hidden="true" />Imprimer</button>
          {!membre && <p className="recu-pied">Reçu émis avec Scolaris</p>}
        </div>
      </div>
    </main>
  );
}

export function FamillePublic({ jeton }: { jeton: string }) {
  const q = useQ(() => db.rpc('famille_public', { p_jeton: jeton }), [jeton]);
  if (q.charge && !q.data) return <main className="pub"><Chargement /></main>;
  const r: any = q.data;
  if (!r || !Array.isArray(r.enfants)) return <main className="pub"><section className="carte-pub"><Logo /><h1>Lien introuvable</h1></section></main>;
  return (
    <main className="pub"><section className="carte-pub recu"><Logo petit /><h1>{r.ecole}</h1><p className="intro">Situation de la famille de {r.parent}</p>
      {r.enfants.map((e: any, i: number) => <div className="enfant" key={i}><b>{e.prenom} {e.nom}</b><span>{e.classe}</span>
        <dl><dt>Frais dus</dt><dd>{gnf(e.net)}</dd><dt>Payé</dt><dd>{gnf(e.regle)}</dd><dt>Reste</dt><dd>{gnf(e.reste)}</dd>{e.echu > 0 && <><dt>En retard</dt><dd className="rouge">{gnf(e.echu)}</dd></>}</dl></div>)}
    </section></main>
  );
}
