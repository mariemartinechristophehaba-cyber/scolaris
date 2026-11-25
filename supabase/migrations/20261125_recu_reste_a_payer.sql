-- Reçu public : total de l'année et reste à payer au moment de ce paiement
-- (reste actuel + ce que les paiements suivants ont réglé, pour qu'un ancien reçu garde son reste du jour)
create or replace function public.recu_public(p_jeton uuid)
 returns json
 language sql
 stable security definer
 set search_path to ''
as $function$
  select json_build_object('ecole', et.nom, 'pays', et.pays, 'ville', et.ville, 'telephone', et.telephone, 'numero', p.numero_recu, 'montant', p.montant, 'date', p.date_paiement,
    'moyen', m.libelle, 'reference', p.reference, 'prenom', e.prenom, 'nom', e.nom, 'matricule', e.matricule, 'classe', c.nom, 'annee', a.libelle, 'statut', p.statut,
    'total', s.facture_net,
    'reste', case when s.inscription_id is null then null else
      s.reste + coalesce((select sum(af.montant) from public.affectations af join public.paiements p2 on p2.id = af.paiement_id
        where p2.eleve_id = p.eleve_id and p2.annee_scolaire_id = p.annee_scolaire_id and p2.statut = 'valide' and p2.numero_recu > p.numero_recu), 0) end)
  from public.paiements p
  join public.etablissements et on et.id = p.etablissement_id
  join public.moyens_paiement m on m.id = p.moyen_id
  join public.eleves e on e.id = p.eleve_id
  join public.annees_scolaires a on a.id = p.annee_scolaire_id
  left join public.inscriptions i on i.eleve_id = p.eleve_id and i.annee_scolaire_id = p.annee_scolaire_id
  left join public.classes c on c.id = i.classe_id
  left join public.v_situation_eleves s on s.eleve_id = p.eleve_id and s.annee_scolaire_id = p.annee_scolaire_id
  where p.jeton_public = p_jeton and p.statut in ('valide','annule');
$function$;
