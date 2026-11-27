// Parrainage des écoles : une école invite une autre école avec son lien.
// Au premier abonnement payé de l'école invitée, les deux écoles reçoivent 1 mois offert (géré en base).
import { useEffect, useState } from 'react';
import { PiGiftFill, PiWhatsappLogoFill, PiCopyBold, PiCheckBold } from 'react-icons/pi';
import { db } from './api';
import { useApp, useQ } from './ui';

const CLE = 'scolaris_parrain';
const SITE = 'https://scolarisafrique.com';

// Garde le code reçu dans le lien (?p=CODE) jusqu'à la création de l'école.
export function capterParrain() {
  try {
    const p = (new URLSearchParams(location.search).get('p') || '').toUpperCase().trim();
    if (/^SC[A-Z0-9]{5}$/.test(p)) localStorage.setItem(CLE, p);
  } catch { /* ignoré */ }
}

// Une fois l'école créée, rattache-la à l'école qui l'a invitée (une seule fois).
export function RattacherParrain() {
  const { eid, role } = useApp();
  useEffect(() => {
    if (role !== 'fondateur' || !eid) return;
    let code = ''; try { code = localStorage.getItem(CLE) || ''; } catch { /* ignoré */ }
    if (!code) return;
    db.rpc('parrainage_rattacher', { p_etab: eid, p_code: code })
      .then(() => { try { localStorage.removeItem(CLE); } catch { /* ignoré */ } })
      .catch(() => { /* réessayé à la prochaine visite */ });
  }, [eid, role]);
  return null;
}

export function CarteParrainage() {
  const { eid, role, etab } = useApp();
  const ok = role === 'fondateur' || role === 'directeur';
  const q = useQ(() => (ok ? db.rpc('parrainage_mon_ecole', { p_etab: eid }) : Promise.resolve(null)), [eid, ok]);
  const [copie, setCopie] = useState(false);
  const d: any = q.data;
  if (!ok || !d?.code) return null;
  const lien = `${SITE}/?p=${d.code}&src=whatsapp`;
  const msg = `Bonjour ! Mon école ${etab?.nom ? `(${etab.nom}) ` : ''}gère ses paiements avec Scolaris : reçus, relances et suivi des élèves depuis le téléphone. Inscris ton école avec mon lien, on gagne chacun 1 mois offert 🎁\n${lien}`;
  const copier = async () => { try { await navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2000); } catch { /* ignoré */ } };
  return (
    <section className="carte avis-dem parr">
      <span className="avis-ic"><PiGiftFill aria-hidden="true" /></span>
      <div className="avis-tx">
        <h2>Invitez une école, gagnez 1 mois</h2>
        <p>Dès que l'école invitée paie son premier abonnement, <b>vous recevez chacune 1 mois gratuit</b>.
          {d.filleuls > 0 && <> {d.filleuls} école{d.filleuls > 1 ? 's' : ''} invitée{d.filleuls > 1 ? 's' : ''}{d.mois > 0 && <>, <b>{d.mois} mois gagné{d.mois > 1 ? 's' : ''}</b></>}.</>}</p>
        <button type="button" className="parr-code" onClick={copier} aria-label="Copier le lien">Code <b>{d.code}</b>{copie ? <PiCheckBold aria-hidden="true" /> : <PiCopyBold aria-hidden="true" />}</button>
      </div>
      <div className="avis-ac">
        <a className="btn plein wa-b" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener"><PiWhatsappLogoFill aria-hidden="true" />Inviter sur WhatsApp</a>
      </div>
    </section>
  );
}
