-- Avis des écoles : demandés dans l'application après 2 jours d'utilisation,
-- publiés sur le site vitrine seulement après validation par l'administrateur Scolaris.
create table if not exists public.avis_ecoles (
  id uuid primary key default gen_random_uuid(),
  etablissement_id uuid not null unique references public.etablissements(id) on delete cascade,
  auteur_id uuid default auth.uid(),
  nom text not null check (char_length(btrim(nom)) between 2 and 80),
  fonction text not null check (char_length(btrim(fonction)) between 2 and 60),
  note smallint not null check (note between 1 and 5),
  texte text not null check (char_length(btrim(texte)) between 15 and 600),
  autorise_site boolean not null default false,
  statut text not null default 'attente' check (statut in ('attente', 'publie', 'masque')),
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
alter table public.avis_ecoles enable row level security;
-- Aucun accès direct : tout passe par les fonctions ci-dessous.
revoke all on public.avis_ecoles from anon, authenticated;

-- L'avis de mon école (fondateur ou directeur) et l'âge de l'école en jours.
create or replace function public.avis_mon_ecole(p_etab uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_ok boolean; v jsonb; v_jours int;
begin
  select exists (select 1 from public.membres m where m.etablissement_id = p_etab and m.profil_id = (select auth.uid())
                 and m.actif and m.role in ('fondateur', 'directeur')) into v_ok;
  if not v_ok then return null; end if;
  select floor(extract(epoch from now() - e.cree_le) / 86400)::int into v_jours from public.etablissements e where e.id = p_etab;
  select to_jsonb(a) - 'auteur_id' into v from public.avis_ecoles a where a.etablissement_id = p_etab;
  return jsonb_build_object('jours', coalesce(v_jours, 0), 'avis', v);
end $$;

-- Envoyer (ou corriger) l'avis de mon école. Un avis modifié repasse en attente de validation.
create or replace function public.avis_envoyer(p_etab uuid, p_nom text, p_fonction text, p_note int, p_texte text, p_autorise boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  if not exists (select 1 from public.membres m where m.etablissement_id = p_etab and m.profil_id = (select auth.uid())
                 and m.actif and m.role in ('fondateur', 'directeur')) then
    raise exception 'Seuls le fondateur et le directeur peuvent donner l''avis de l''école.';
  end if;
  insert into public.avis_ecoles as a (etablissement_id, auteur_id, nom, fonction, note, texte, autorise_site)
  values (p_etab, (select auth.uid()), btrim(p_nom), btrim(p_fonction), p_note, btrim(p_texte), coalesce(p_autorise, false))
  on conflict (etablissement_id) do update set nom = excluded.nom, fonction = excluded.fonction, note = excluded.note,
    texte = excluded.texte, autorise_site = excluded.autorise_site, statut = 'attente', modifie_le = now(), auteur_id = excluded.auteur_id
  returning to_jsonb(a) - 'auteur_id' into v;
  return v;
end $$;

-- Avis affichés sur le site vitrine : validés et autorisés par l'école.
create or replace function public.avis_publics()
returns table (nom text, fonction text, note smallint, texte text, ecole text, ville text, pays text, cree_le timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.nom, a.fonction, a.note, a.texte, e.nom, e.ville, e.pays, a.cree_le
  from public.avis_ecoles a join public.etablissements e on e.id = a.etablissement_id
  where a.statut = 'publie' and a.autorise_site
  order by a.note desc, a.cree_le desc limit 30;
$$;

-- Administration Scolaris : liste et validation.
create or replace function public.admin_avis()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.suis_je_admin() then raise exception 'Accès réservé'; end if;
  return coalesce((select jsonb_agg((to_jsonb(a) - 'auteur_id') || jsonb_build_object('ecole', e.nom, 'ville', e.ville) order by a.cree_le desc)
    from public.avis_ecoles a join public.etablissements e on e.id = a.etablissement_id), '[]'::jsonb);
end $$;

create or replace function public.admin_avis_statut(p_id uuid, p_statut text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.suis_je_admin() then raise exception 'Accès réservé'; end if;
  if p_statut not in ('attente', 'publie', 'masque') then raise exception 'Statut inconnu'; end if;
  if p_statut = 'publie' and not exists (select 1 from public.avis_ecoles where id = p_id and autorise_site) then
    raise exception 'Cette école n''a pas autorisé l''affichage de son avis sur le site.';
  end if;
  update public.avis_ecoles set statut = p_statut, modifie_le = now() where id = p_id;
end $$;

revoke all on function public.avis_mon_ecole(uuid), public.avis_envoyer(uuid, text, text, int, text, boolean), public.admin_avis(), public.admin_avis_statut(uuid, text) from public, anon;
grant execute on function public.avis_mon_ecole(uuid), public.avis_envoyer(uuid, text, text, int, text, boolean), public.admin_avis(), public.admin_avis_statut(uuid, text) to authenticated;
grant execute on function public.avis_publics() to anon, authenticated;
