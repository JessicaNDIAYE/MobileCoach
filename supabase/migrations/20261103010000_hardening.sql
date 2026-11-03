-- Durcissement suite aux alertes du linter Supabase.

-- 1. Les helpers RLS passent dans un schéma "private", non exposé par l'API REST.
--    Les policies référencent les fonctions par OID : elles suivent le déplacement.
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_challenge_member(uuid) set schema private;
alter function public.shares_challenge_with(uuid) set schema private;

revoke execute on function private.is_challenge_member(uuid) from public, anon;
revoke execute on function private.shares_challenge_with(uuid) from public, anon;
grant execute on function private.is_challenge_member(uuid) to authenticated;
grant execute on function private.shares_challenge_with(uuid) to authenticated;

-- 2. Les fonctions de trigger ne doivent jamais être appelées via /rpc
--    (les triggers continuent de fonctionner sans ce droit).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_challenge() from public, anon, authenticated;

-- 3. join_challenge : réservé aux utilisateurs connectés.
--    (Le revoke de la migration initiale ne suffisait pas : PUBLIC garde le droit par défaut.)
revoke execute on function public.join_challenge(text) from public, anon;
grant execute on function public.join_challenge(text) to authenticated;

-- 4. Index sur les clés étrangères (jointures RLS et suppressions en cascade).
create index if not exists challenge_checkins_user_idx on public.challenge_checkins (user_id);
create index if not exists challenges_created_by_idx  on public.challenges (created_by);
create index if not exists meal_photos_user_idx       on public.meal_photos (user_id);
create index if not exists promos_user_idx            on public.promos (user_id);
create index if not exists purchases_receipt_idx      on public.purchases (receipt_id);
create index if not exists receipts_user_idx          on public.receipts (user_id);
create index if not exists user_challenges_user_idx   on public.user_challenges (user_id);

-- 5. Un pseudo invalide ou déjà pris ne doit pas faire échouer l'inscription :
--    on crée le profil sans pseudo (modifiable ensuite dans l'app).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  wanted text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
begin
  if wanted is not null and char_length(wanted) not between 2 and 30 then
    wanted := null;
  end if;
  begin
    insert into public.profiles (id, username) values (new.id, wanted);
  exception when unique_violation then
    insert into public.profiles (id, username) values (new.id, null);
  end;
  return new;
end;
$$;
