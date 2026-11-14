# Pilotage

Tableau de bord admin de FixPro et Scolaris (lecture seule).

- Site statique (dossier `pilotage/`), connexion avec le compte admin Scolaris.
- Données : fonction `public.pilotage()` de Supabase Scolaris (réservée aux administrateurs).
- FixPro : copie horaire via `fixpro_snapshot.sql` -> `app.pilotage_maj_fixpro()`.
