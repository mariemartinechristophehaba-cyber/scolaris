-- Étape 1 des nouveautés : fiche du personnel, photos d'identité, cartes avec QR.
alter table public.enseignants
  add column if not exists fonction text,
  add column if not exists categorie text not null default 'enseignant' check (categorie in ('direction','enseignant','autre')),
  add column if not exists classe_matiere text,
  add column if not exists date_naissance date,
  add column if not exists lieu_naissance text,
  add column if not exists sexe text check (sexe in ('F','M')),
  add column if not exists profession text,
  add column if not exists adresse text,
  add column if not exists contact_nom text,
  add column if not exists contact_lien text,
  add column if not exists contact_telephone text,
  add column if not exists date_entree date,
  add column if not exists photo_chemin text,
  add column if not exists ordre int not null default 100,
  add column if not exists code_carte text not null unique default encode(extensions.gen_random_bytes(6),'hex'),
  add column if not exists cree_le timestamptz not null default now();

alter table public.eleves
  add column if not exists photo_chemin text,
  add column if not exists code_carte text not null unique default encode(extensions.gen_random_bytes(6),'hex');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos','photos', false, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "photos lecture" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and app.a_role(app.dossier_etab(name), '{directeur,secretaire,comptable,caissier,enseignant}'::role_membre[]));
create policy "photos ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and app.a_role(app.dossier_etab(name), '{directeur,secretaire}'::role_membre[]));
create policy "photos modif" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and app.a_role(app.dossier_etab(name), '{directeur,secretaire}'::role_membre[]));
create policy "photos retrait" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and app.a_role(app.dossier_etab(name), '{directeur,secretaire}'::role_membre[]));

-- Vérification publique d'une carte (QR) : ne renvoie ni photo ni téléphone.
create or replace function public.verifier_carte(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select json_build_object('type','eleve','prenom',e.prenom,'nom',e.nom,'matricule',e.matricule,
        'classe',c.nom,'annee',a.libelle,'ecole',t.nom,'ville',t.ville,'logo',t.logo_chemin,
        'valide', i.id is not null and e.statut <> 'archive')
       from eleves e join etablissements t on t.id = e.etablissement_id
       left join lateral (select * from annees_scolaires x where x.etablissement_id = t.id order by x.date_debut desc limit 1) a on true
       left join inscriptions i on i.eleve_id = e.id and i.annee_scolaire_id = a.id and i.statut = 'inscrit'
       left join classes c on c.id = i.classe_id
      where e.code_carte = p_code limit 1),
    (select json_build_object('type','personnel','prenom',p.prenom,'nom',p.nom,
        'fonction',coalesce(p.fonction, case p.categorie when 'enseignant' then 'Enseignant' when 'direction' then 'Direction' else 'Personnel' end),
        'classe',p.classe_matiere,'ecole',t.nom,'ville',t.ville,'logo',t.logo_chemin,'valide',p.actif)
       from enseignants p join etablissements t on t.id = p.etablissement_id
      where p.code_carte = p_code limit 1));
$$;
revoke all on function public.verifier_carte(text) from public;
grant execute on function public.verifier_carte(text) to anon, authenticated;
