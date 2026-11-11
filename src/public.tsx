import { FaArrowLeft } from 'react-icons/fa6';
import { PiArrowLeftBold, PiCheckBold, PiPrinterDuotone, PiWhatsappLogoFill, PiXBold } from 'react-icons/pi';
import { useState } from 'react';
import { db, getSession } from './api';
import { dateFr, gnf, nb } from './lib';
import { Chargement, Lien, Logo, naviguer, useQ } from './ui';

const retourTexte = () => { if (history.length > 1) history.back(); else naviguer('/'); };
function PageTexte({ titre, autre, children }: any) {
  return <main className="pub"><section className="carte-pub texte legal"><button type="button" onClick={retourTexte} className="retour" aria-label="Retour"><FaArrowLeft /></button><Logo /><h1>{titre}</h1>
    <p className="maj">Mise à jour : 11 novembre 2026</p>{children}
    <p className="legal-pied"><Lien to={autre[0]}>{autre[1]}</Lien></p></section></main>;
}

export function Conditions() {
  return <PageTexte titre="Conditions d'utilisation" autre={['/confidentialite', 'Voir la politique de confidentialité']}>
    <h2>1. Le service</h2>
    <p>Scolaris est un logiciel en ligne qui aide les écoles privées de Guinée à gérer leurs élèves, leurs frais scolaires, les paiements des parents, les reçus, les relances et les dépenses. Scolaris n'encaisse jamais l'argent des parents : chaque école reçoit ses paiements elle-même et les enregistre dans l'application.</p>
    <h2>2. Votre compte</h2>
    <p>La personne qui inscrit l'école en devient le fondateur. Elle donne des informations exactes : nom de l'école, ville, numéros de téléphone guinéens valides et adresse e-mail. Chaque utilisateur garde son mot de passe secret et reste responsable de ce qui est fait avec son compte.</p>
    <h2>3. L'équipe de l'école</h2>
    <p>Le fondateur ajoute les membres de son équipe et choisit leur rôle : directeur, comptable, secrétaire, caissier ou enseignant. Chaque rôle ne voit que ce dont il a besoin. Le fondateur retire l'accès d'une personne qui quitte l'école.</p>
    <h2>4. Essai et abonnement</h2>
    <p>Le prix de l'abonnement dépend du nombre d'élèves et est affiché sur la page Abonnement, au mois ou à l'année. Le paiement se fait par Orange Money, MTN Mobile Money ou un autre moyen indiqué, puis il est vérifié par l'équipe Scolaris avant d'activer l'abonnement.</p>
    <p>Quand l'abonnement se termine, l'école garde un délai de 7 jours. Ensuite, elle peut toujours consulter ses données, mais ne peut plus rien enregistrer tant qu'elle n'a pas renouvelé. Aucune donnée n'est supprimée à cause d'un retard de paiement.</p>
    <h2>5. Les données de l'école</h2>
    <p>Les informations saisies (élèves, parents, frais, paiements, dépenses) appartiennent à l'école. Elles ne sont jamais visibles par une autre école. L'école reste responsable de leur exactitude et de l'information des parents.</p>
    <h2>6. Bon usage</h2>
    <p>Il est interdit de saisir de fausses informations, d'utiliser Scolaris pour tromper des parents, d'essayer d'entrer dans le compte d'une autre école ou de gêner le fonctionnement du service. En cas d'abus, Scolaris peut suspendre le compte après avoir prévenu le fondateur.</p>
    <h2>7. Disponibilité</h2>
    <p>Scolaris fait le maximum pour que le service soit disponible tous les jours et que les données soient sauvegardées. Une coupure peut arriver pour une maintenance ou un problème technique ; elle est réparée le plus vite possible. Scolaris ne peut pas être tenu responsable d'une perte due à une mauvaise saisie de l'école ou à un mot de passe partagé.</p>
    <h2>8. Arrêt du service</h2>
    <p>L'école peut arrêter d'utiliser Scolaris quand elle le souhaite. Sur demande du fondateur, ses données lui sont remises ou supprimées.</p>
    <h2>9. Changements</h2>
    <p>Ces conditions peuvent évoluer. Les écoles sont prévenues dans l'application avant tout changement important.</p>
    <h2>10. Droit applicable et contact</h2>
    <p>Ces conditions sont soumises au droit guinéen. Pour toute question, contactez l'équipe Scolaris sur WhatsApp, au numéro indiqué sur la page Abonnement.</p>
  </PageTexte>;
}

export function Confidentialite() {
  return <PageTexte titre="Politique de confidentialité" autre={['/conditions', "Voir les conditions d'utilisation"]}>
    <h2>1. Les informations enregistrées</h2>
    <ul>
      <li><b>L'école :</b> nom, ville, quartier, téléphone, logo, numéros Orange Money et MTN.</li>
      <li><b>L'équipe :</b> prénom, nom, téléphone, e-mail et rôle de chaque membre.</li>
      <li><b>Les élèves :</b> nom, prénom, matricule, classe, date de naissance, sexe.</li>
      <li><b>Les parents :</b> nom et numéro de téléphone.</li>
      <li><b>L'argent :</b> frais, paiements, reçus, relances et dépenses de l'école.</li>
    </ul>
    <h2>2. Pourquoi</h2>
    <p>Uniquement pour faire fonctionner Scolaris : suivre la scolarité payée, produire les reçus, relancer les parents, préparer les rapports de l'école et gérer son abonnement. Scolaris ne vend et ne loue aucune donnée, et ne fait pas de publicité avec.</p>
    <h2>3. Qui peut les voir</h2>
    <p>Les membres de l'école, chacun selon son rôle : par exemple, la secrétaire ne voit pas la trésorerie et le caissier ne voit que ses encaissements. Un parent voit seulement son reçu ou la situation de son enfant, grâce au lien privé que l'école lui envoie. L'équipe Scolaris voit les informations nécessaires à l'abonnement et à l'assistance, et n'utilise jamais les données d'une école pour autre chose.</p>
    <h2>4. Séparation des écoles</h2>
    <p>Chaque école a son propre espace. La base de données refuse qu'une école lise ou modifie les données d'une autre.</p>
    <h2>5. Hébergement et sécurité</h2>
    <p>Les données sont hébergées chez des prestataires techniques reconnus (Supabase et Vercel), dont les serveurs peuvent se trouver hors de Guinée. Les échanges sont chiffrés, les mots de passe ne sont jamais stockés en clair et chaque action importante est inscrite dans l'historique de l'école (« Qui a fait quoi »).</p>
    <h2>6. Durée de conservation</h2>
    <p>Les données sont gardées tant que l'école utilise Scolaris. Quand le fondateur demande la fermeture du compte, elles sont supprimées, sauf ce que la loi oblige à garder.</p>
    <h2>7. Vos droits</h2>
    <p>Chaque personne peut demander à voir, corriger ou supprimer les informations qui la concernent. Un parent s'adresse d'abord à l'école de son enfant ; l'école ou toute personne concernée peut aussi contacter l'équipe Scolaris sur WhatsApp, au numéro indiqué sur la page Abonnement.</p>
    <h2>8. Sur votre téléphone</h2>
    <p>Scolaris garde seulement votre connexion et quelques choix d'affichage dans la mémoire de votre navigateur. Il n'y a pas de traceur publicitaire.</p>
  </PageTexte>;
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
