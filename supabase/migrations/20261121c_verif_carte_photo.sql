-- Page publique du QR : on affiche la carte de la personne (avec sa photo), sans connexion.
create or replace function public.photo_verifiable(p_nom text) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.eleves e where e.photo_chemin = p_nom) or exists (select 1 from public.enseignants p where p.photo_chemin = p_nom and p.actif);
$$;
revoke all on function public.photo_verifiable(text) from public;
grant execute on function public.photo_verifiable(text) to anon, authenticated;
-- Le chemin d'une photo (aléatoire) n'est donné que par verifier_carte, donc à qui a scanné la carte.
create policy "photos verification" on storage.objects for select to anon
  using (bucket_id = 'photos' and public.photo_verifiable(name));

create or replace function public.verifier_carte(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select json_build_object('type','eleve','prenom',e.prenom,'nom',e.nom,'matricule',e.matricule,'date_naissance',e.date_naissance,'photo',e.photo_chemin,
        'classe',c.nom,'annee',a.libelle,'fin',a.date_fin,'ecole',t.nom,'ville',t.ville,'quartier',t.quartier,'adresse',t.adresse,'telephone',t.telephone,'logo',t.logo_chemin,
        'inscrit_le',(select min(x.date_inscription) from inscriptions x where x.eleve_id = e.id),
        'valide', i.id is not null and e.statut <> 'archive')
       from eleves e join etablissements t on t.id = e.etablissement_id
       left join lateral (select * from annees_scolaires x where x.etablissement_id = t.id order by x.date_debut desc limit 1) a on true
       left join inscriptions i on i.eleve_id = e.id and i.annee_scolaire_id = a.id and i.statut = 'inscrit'
       left join classes c on c.id = i.classe_id
      where e.code_carte = p_code limit 1),
    (select json_build_object('type','personnel','prenom',p.prenom,'nom',p.nom,'categorie',p.categorie,'photo',case when p.actif then p.photo_chemin end,
        'fonction',coalesce(p.fonction, case p.categorie when 'enseignant' then 'Enseignant' when 'direction' then 'Direction' else 'Personnel' end),
        'classe',p.classe_matiere,'depuis',p.date_entree,'annee',a.libelle,'fin',a.date_fin,'ecole',t.nom,'ville',t.ville,'quartier',t.quartier,'adresse',t.adresse,'telephone',t.telephone,'logo',t.logo_chemin,'valide',p.actif,
        'travaux', case when cl.id is null then null else json_build_object('classe', cl.nom, 'eleves', (select count(*) from inscriptions x where x.classe_id = cl.id and x.statut = 'inscrit'),
          'mois', r.mois, 'sur', r.sur, 'moyenne', r.moy, 'reussite', r.reussite, 'mois_notes', r.nb_mois) end)
       from enseignants p join etablissements t on t.id = p.etablissement_id
       left join lateral (select * from annees_scolaires x where x.etablissement_id = t.id order by x.date_debut desc limit 1) a on true
       left join lateral (select c.* from classes c where c.etablissement_id = t.id and c.annee_scolaire_id = a.id and p.categorie = 'enseignant' and lower(trim(c.nom)) = lower(trim(p.classe_matiere)) limit 1) cl on true
       left join lateral (
         select max(m.mois) as mois, max(m.sur) as sur, round(avg(m.moy), 2) as moy,
                round(100.0 * avg(case when m.moy >= m.sur / 2.0 then 1 else 0 end)) as reussite,
                (select count(distinct n2.mois) from notes n2 join matieres m2 on m2.id = n2.matiere_id where m2.classe_id = cl.id) as nb_mois
         from (select n.eleve_id, n.mois, max(mt.sur) as sur, sum(n.note * mt.coef) / sum(mt.coef) as moy
               from notes n join matieres mt on mt.id = n.matiere_id
               where mt.classe_id = cl.id and n.mois = (select max(n3.mois) from notes n3 join matieres m3 on m3.id = n3.matiere_id where m3.classe_id = cl.id)
               group by n.eleve_id, n.mois) m
       ) r on true
      where p.code_carte = p_code limit 1));
$$;
