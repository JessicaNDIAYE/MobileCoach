-- Modules choisis par chaque utilisateur : chacun compose son app.
-- NULL = pas encore choisi (l'app affiche l'écran de choix après l'inscription).
-- Le suivi du poids n'est jamais activé sans choix explicite (prévention des TCA, données de santé).
alter table public.profiles add column if not exists modules text[];

alter table public.profiles add constraint profiles_modules_check check (
  modules is null
  or (cardinality(modules) >= 1 and modules <@ array['recipes', 'budget', 'weight', 'challenges']::text[])
);
