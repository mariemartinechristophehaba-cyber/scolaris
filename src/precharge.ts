import { db, horsLigne } from './api';
import { auj } from './lib';

// Prépare le mode sans internet : dès que l'application est ouverte avec du réseau, elle charge en silence
// les données de toutes les pages principales. Elles restent ensuite lisibles même sans réseau.
// Les adresses doivent être exactement celles des pages (même filtre, même ordre) : c'est la clé de la copie.
export async function prechargerTout(annee: any, eid: string, uid: string) {
  if (!annee || !navigator.onLine) return;
  const cle = `scolaris_precharge_${annee.id}`;
  try { if (Date.now() - Number(localStorage.getItem(cle) || 0) < 30 * 60000) return; } catch { /* ignoré */ }
  const a = annee.id; const mois = `${auj().slice(0, 7)}-01`;
  const L: [('get' | 'tout'), string][] = [
    // Accueil
    ['get', `v_tableau_bord?annee_scolaire_id=eq.${a}`], ['get', `v_objectifs_resultats?annee_scolaire_id=eq.${a}&periode=eq.annuel`],
    ['tout', `v_paiements_detail?annee_scolaire_id=eq.${a}&statut=eq.valide&select=id,montant,date_paiement,classe_id&order=id`],
    ['tout', `v_situation_eleves?annee_scolaire_id=eq.${a}&order=inscription_id`],
    ['get', `v_stats_classes?annee_scolaire_id=eq.${a}&facture_net=gt.0&order=taux_recouvrement.desc&limit=5`],
    ['get', `classes?annee_scolaire_id=eq.${a}&select=id,nom,niveaux(nom)&order=ordre,nom`],
    ['get', `paiements?annee_scolaire_id=eq.${a}&select=id,montant,cree_le,statut,eleves(prenom,nom)&order=cree_le.desc&limit=4`],
    ['get', `inscriptions?annee_scolaire_id=eq.${a}&select=id,cree_le,classes(nom),eleves(prenom,nom)&order=cree_le.desc&limit=3`],
    ['get', `depenses?annee_scolaire_id=eq.${a}&select=id,libelle,montant,cree_le&order=cree_le.desc&limit=3`],
    ['get', `depenses?annee_scolaire_id=eq.${a}&statut=eq.payee&date_depense=gte.${mois}&select=montant`],
    ['tout', `eleve_responsables?etablissement_id=eq.${eid}&select=eleve_id,responsables(telephone)&order=eleve_id,responsable_id`],
    ['tout', `eleves?etablissement_id=eq.${eid}&date_naissance=not.is.null&select=id,date_naissance&order=id`],
    ['get', `paiements?annee_scolaire_id=eq.${a}&statut=eq.en_attente&select=montant`], ['get', `depenses?annee_scolaire_id=eq.${a}&statut=eq.soumise&select=montant`],
    // Élèves, Classes, Frais
    ['tout', `v_situation_eleves?annee_scolaire_id=eq.${a}&order=nom,prenom,inscription_id`], ['get', `classes?annee_scolaire_id=eq.${a}&select=*,niveaux(nom)&order=ordre,nom`],
    ['get', `v_stats_classes?annee_scolaire_id=eq.${a}&order=ordre,nom`], ['get', `classes?annee_scolaire_id=eq.${a}&select=id,niveaux(nom)`], ['get', `niveaux?etablissement_id=eq.${eid}&order=ordre,nom`],
    ['get', `types_frais?etablissement_id=eq.${eid}&actif=is.true&order=ordre`], ['get', `tarifs?annee_scolaire_id=eq.${a}&select=*,tarif_tranches(*)`], ['get', `v_stats_classes?annee_scolaire_id=eq.${a}`],
    // Paiements, nouveau paiement
    ['get', `moyens_paiement?etablissement_id=eq.${eid}&actif=is.true`],
    ['tout', `v_paiements_detail?annee_scolaire_id=eq.${a}&order=date_paiement.desc,id`], ['tout', `paiements?annee_scolaire_id=eq.${a}&select=id,jeton_public,justificatif_chemin&order=id`],
    ['get', `classes?annee_scolaire_id=eq.${a}&select=id,nom,niveaux(nom)`],
    // Dépenses
    ['tout', `depenses?annee_scolaire_id=eq.${a}&select=*,categories_depense(libelle)&order=date_depense.desc,cree_le.desc,id`],
    ['get', `categories_depense?etablissement_id=eq.${eid}&order=libelle`], ['get', `v_tresorerie_caisses?etablissement_id=eq.${eid}&order=nom`],
    // Relances
    ['tout', `v_situation_eleves?annee_scolaire_id=eq.${a}&en_retard=is.true&order=impaye_echu.desc,inscription_id`],
    ['get', `v_paiements_detail?annee_scolaire_id=eq.${a}&statut=eq.en_attente&order=date_paiement.desc&limit=30`],
    ['get', `inscriptions?annee_scolaire_id=eq.${a}&select=id,cree_le,classes(nom),eleves(prenom,nom)&order=cree_le.desc&limit=10`],
    ['tout', `eleve_responsables?etablissement_id=eq.${eid}&select=eleve_id,principal,responsables(id,nom,telephone,jeton_public)&order=principal.desc,eleve_id,responsable_id`],
    ['tout', `rappels?etablissement_id=eq.${eid}&select=eleve_id,cree_le&order=cree_le.desc,id`], ['tout', `promesses?etablissement_id=eq.${eid}&select=eleve_id,date_promise&order=date_promise.desc,id`],
    ['get', `parametres_relance?etablissement_id=eq.${eid}&select=*`], ['get', `classes?annee_scolaire_id=eq.${a}&select=nom,niveaux(nom)`],
    // Rapports
    ['tout', `v_paiements_detail?annee_scolaire_id=eq.${a}&statut=eq.valide&order=date_paiement,id`],
    ['tout', `depenses?annee_scolaire_id=eq.${a}&statut=eq.payee&select=*,categories_depense(libelle)&order=date_depense,id`],
    // Espaces caissier et secrétaire
    ['get', `paiements?annee_scolaire_id=eq.${a}&saisi_par=eq.${uid}&date_paiement=eq.${auj()}&select=id&order=cree_le.desc`],
    ['get', `v_paiements_detail?annee_scolaire_id=eq.${a}&date_paiement=eq.${auj()}&order=id.desc`],
    ['get', `v_paiements_detail?annee_scolaire_id=eq.${a}&statut=eq.en_attente&order=date_paiement.desc,id&limit=50`],
    // Paramètres
    ['get', `objectifs_financiers?annee_scolaire_id=eq.${a}&periode=eq.annuel&classe_id=is.null`], ['get', `v_tableau_bord?annee_scolaire_id=eq.${a}&select=eleves`],
  ];
  for (const [f, u] of L) {
    if (horsLigne() || !navigator.onLine) return; // réseau perdu : on reprendra plus tard
    try { await (f === 'tout' ? db.tout(u) : db.get(u)); } catch { /* page non autorisée pour ce rôle : ignorée */ }
    await new Promise((ok) => setTimeout(ok, 150));
  }
  try { localStorage.setItem(cle, String(Date.now())); } catch { /* ignoré */ }
}
