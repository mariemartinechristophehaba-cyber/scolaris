-- Étape 2 et 3 : notes mensuelles, bulletins, satisfecits ; bulletins de paie liés aux avances.
create table if not exists public.matieres (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  classe_id uuid not null references public.classes(id) on delete cascade,
  nom text not null check (trim(nom) <> ''),
  coef numeric(4,1) not null default 1 check (coef > 0 and coef <= 20),
  sur smallint not null default 10 check (sur in (10, 20)),
  ordre int not null default 0,
  cree_le timestamptz not null default now(),
  unique (classe_id, nom)
);
create index if not exists matieres_classe on public.matieres(classe_id);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  eleve_id uuid not null references public.eleves(id) on delete cascade,
  matiere_id uuid not null references public.matieres(id) on delete cascade,
  mois date not null check (extract(day from mois) = 1),
  note numeric(4,2) not null check (note >= 0 and note <= 20),
  saisi_par uuid default auth.uid(),
  modifie_le timestamptz not null default now(),
  unique (eleve_id, matiere_id, mois)
);
create index if not exists notes_matiere_mois on public.notes(matiere_id, mois);

-- Une note ne dépasse jamais le barème de sa matière, et reste dans la même école.
create or replace function app.verifier_note() returns trigger language plpgsql security definer set search_path = '' as $$
declare m public.matieres;
begin
  select * into m from public.matieres where id = new.matiere_id;
  if m.etablissement_id is distinct from new.etablissement_id then raise exception 'Matière d''une autre école'; end if;
  if not exists (select 1 from public.eleves e where e.id = new.eleve_id and e.etablissement_id = new.etablissement_id) then raise exception 'Élève d''une autre école'; end if;
  if new.note > m.sur then raise exception 'La note dépasse le barème (sur %)', m.sur; end if;
  new.modifie_le := now();
  return new;
end $$;
drop trigger if exists verifier_note on public.notes;
create trigger verifier_note before insert or update on public.notes for each row execute function app.verifier_note();

create or replace function app.verifier_matiere() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.classes c where c.id = new.classe_id and c.etablissement_id = new.etablissement_id) then raise exception 'Classe d''une autre école'; end if;
  return new;
end $$;
drop trigger if exists verifier_matiere on public.matieres;
create trigger verifier_matiere before insert or update on public.matieres for each row execute function app.verifier_matiere();

-- Salaires : visibles seulement par la direction et la comptabilité.
create table if not exists public.salaires (
  enseignant_id uuid primary key references public.enseignants(id) on delete cascade,
  etablissement_id uuid not null references public.etablissements(id) on delete cascade,
  salaire_base bigint not null default 0 check (salaire_base >= 0),
  prime bigint not null default 0 check (prime >= 0),
  prime_libelle text,
  modifie_le timestamptz not null default now()
);
create or replace function app.verifier_salaire() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.enseignants p where p.id = new.enseignant_id and p.etablissement_id = new.etablissement_id) then raise exception 'Personne d''une autre école'; end if;
  new.modifie_le := now(); return new;
end $$;
drop trigger if exists verifier_salaire on public.salaires;
create trigger verifier_salaire before insert or update on public.salaires for each row execute function app.verifier_salaire();

-- Avance sur salaire = dépense au nom d'une personne du personnel.
alter table public.depenses add column if not exists enseignant_id uuid references public.enseignants(id) on delete set null;
create index if not exists depenses_enseignant on public.depenses(enseignant_id) where enseignant_id is not null;

alter table public.matieres enable row level security;
alter table public.notes enable row level security;
alter table public.salaires enable row level security;

create policy lecture on public.matieres for select using (etablissement_id in (select app.mes_etabs('{directeur,comptable,caissier,secretaire,enseignant}'::role_membre[])));
create policy ajout on public.matieres for insert with check (app.a_role(etablissement_id, '{directeur,secretaire}'::role_membre[]));
create policy modification on public.matieres for update using (app.a_role(etablissement_id, '{directeur,secretaire}'::role_membre[])) with check (app.a_role(etablissement_id, '{directeur,secretaire}'::role_membre[]));
create policy suppression on public.matieres for delete using (app.a_role(etablissement_id, '{directeur,secretaire}'::role_membre[]));

create policy lecture on public.notes for select using (etablissement_id in (select app.mes_etabs('{directeur,secretaire,enseignant}'::role_membre[])));
create policy ajout on public.notes for insert with check (app.a_role(etablissement_id, '{directeur,secretaire,enseignant}'::role_membre[]));
create policy modification on public.notes for update using (app.a_role(etablissement_id, '{directeur,secretaire,enseignant}'::role_membre[])) with check (app.a_role(etablissement_id, '{directeur,secretaire,enseignant}'::role_membre[]));
create policy suppression on public.notes for delete using (app.a_role(etablissement_id, '{directeur,secretaire,enseignant}'::role_membre[]));

create policy lecture on public.salaires for select using (etablissement_id in (select app.mes_etabs('{directeur,comptable}'::role_membre[])));
create policy ajout on public.salaires for insert with check (app.a_role(etablissement_id, '{directeur,comptable}'::role_membre[]));
create policy modification on public.salaires for update using (app.a_role(etablissement_id, '{directeur,comptable}'::role_membre[])) with check (app.a_role(etablissement_id, '{directeur,comptable}'::role_membre[]));

grant select, insert, update, delete on public.matieres, public.notes to authenticated;
grant select, insert, update on public.salaires to authenticated;
