-- MobileCoach : schéma initial
-- Poids, budget/courses, tickets, promos, photos de plats et défis entre amis.

-- =========================================================
-- Profils (1 ligne par utilisateur, créée automatiquement)
-- =========================================================
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  username       text unique check (char_length(username) between 2 and 30),
  monthly_budget numeric(10,2) not null default 0 check (monthly_budget >= 0),
  weight_mode    text not null default 'lose' check (weight_mode in ('lose', 'gain', 'keep')),
  weight_goal_kg numeric(5,1) check (weight_goal_kg between 20 and 400),
  created_at     timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- Poids
-- =========================================================
create table public.weight_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg   numeric(5,1) not null check (weight_kg between 20 and 400),
  created_at  timestamptz not null default now(),
  unique (user_id, measured_on)
);

-- =========================================================
-- Courses : tickets de caisse (OCR Gemini) et articles achetés
-- =========================================================
create table public.receipts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  store        text,
  total        numeric(10,2),
  purchased_on date not null default current_date,
  image_path   text,               -- chemin dans le bucket "receipts"
  ocr_raw      jsonb,              -- réponse brute de Gemini, pour debug
  created_at   timestamptz not null default now()
);

create table public.purchases (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  receipt_id   uuid references public.receipts (id) on delete set null,
  name         text not null check (char_length(name) between 1 and 120),
  price        numeric(10,2) not null check (price >= 0),
  quantity     numeric(8,2) not null default 1 check (quantity > 0),
  category     text not null default 'Autre',
  store        text,
  purchased_on date not null default current_date,
  expires_on   date,
  in_stock     boolean not null default true,   -- sert au générateur de recettes
  created_at   timestamptz not null default now()
);
create index purchases_user_date_idx on public.purchases (user_id, purchased_on desc);

-- =========================================================
-- Promos repérées (prospectus, magasin…)
-- =========================================================
create table public.promos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product       text not null,
  store         text not null,
  regular_price numeric(10,2) check (regular_price >= 0),
  promo_price   numeric(10,2) not null check (promo_price >= 0),
  ends_on       date,
  created_at    timestamptz not null default now()
);

-- =========================================================
-- Photos de plats
-- =========================================================
create table public.meal_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  image_path   text not null,       -- chemin dans le bucket "meals"
  caption      text,
  challenge_id uuid,                -- défi concerné (validation IA possible plus tard)
  ai_verdict   jsonb,               -- ex : {"no_sugar": true, "fiber_g": 9}
  created_at   timestamptz not null default now()
);

-- =========================================================
-- Défis entre amis : no sugar, no carbs, fibres max
-- =========================================================
create table public.challenges (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        text not null check (type in ('no_sugar', 'no_carbs', 'fiber_max')),
  title       text not null,
  fiber_goal_g numeric(5,1) not null default 30,
  starts_on   date not null default current_date,
  ends_on     date not null,
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at  timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table public.user_challenges (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  joined_at    timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create table public.challenge_checkins (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day          date not null default current_date,
  success      boolean not null,
  fiber_g      numeric(5,1) not null default 0 check (fiber_g >= 0),
  created_at   timestamptz not null default now(),
  unique (challenge_id, user_id, day)
);

-- Le créateur rejoint automatiquement son défi
create function public.handle_new_challenge()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_challenges (challenge_id, user_id) values (new.id, new.created_by);
  return new;
end;
$$;

create trigger on_challenge_created
  after insert on public.challenges
  for each row execute function public.handle_new_challenge();

-- Helpers RLS (security definer pour éviter la récursion des policies)
create function public.is_challenge_member(cid uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_challenges
    where challenge_id = cid and user_id = (select auth.uid())
  );
$$;

create function public.shares_challenge_with(other uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_challenges a
    join public.user_challenges b on b.challenge_id = a.challenge_id
    where a.user_id = (select auth.uid()) and b.user_id = other
  );
$$;

-- Rejoindre un défi avec le code partagé par un·e ami·e
create function public.join_challenge(code text)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  cid uuid;
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  select id into cid from public.challenges where invite_code = upper(trim(code));
  if cid is null then
    raise exception 'Code de défi invalide';
  end if;
  insert into public.user_challenges (challenge_id, user_id)
  values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end;
$$;

revoke execute on function public.join_challenge(text) from anon;

-- Classement : nombre de jours réussis par participant
create view public.challenge_leaderboard
with (security_invoker = true) as
select
  uc.challenge_id,
  uc.user_id,
  p.username,
  count(cc.id) filter (where cc.success) as days_success,
  coalesce(sum(cc.fiber_g), 0)           as total_fiber_g
from public.user_challenges uc
left join public.profiles p on p.id = uc.user_id
left join public.challenge_checkins cc
  on cc.challenge_id = uc.challenge_id and cc.user_id = uc.user_id
group by uc.challenge_id, uc.user_id, p.username;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles           enable row level security;
alter table public.weight_entries     enable row level security;
alter table public.receipts           enable row level security;
alter table public.purchases          enable row level security;
alter table public.promos             enable row level security;
alter table public.meal_photos        enable row level security;
alter table public.challenges         enable row level security;
alter table public.user_challenges    enable row level security;
alter table public.challenge_checkins enable row level security;

-- Profils : je vois le mien et ceux de mes partenaires de défi
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_challenge_with(id));
create policy "profiles_update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Données personnelles : uniquement les miennes
do $$
declare t text;
begin
  foreach t in array array['weight_entries', 'receipts', 'purchases', 'promos', 'meal_photos'] loop
    execute format(
      'create policy "%1$s_own" on public.%1$I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Défis : visibles par les membres, modifiables par le créateur
create policy "challenges_select" on public.challenges for select to authenticated
  using (created_by = (select auth.uid()) or public.is_challenge_member(id));
create policy "challenges_insert" on public.challenges for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "challenges_update" on public.challenges for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "challenges_delete" on public.challenges for delete to authenticated
  using (created_by = (select auth.uid()));

-- Participants : visibles entre membres ; on rejoint via join_challenge(), on peut quitter
create policy "user_challenges_select" on public.user_challenges for select to authenticated
  using (public.is_challenge_member(challenge_id));
create policy "user_challenges_delete" on public.user_challenges for delete to authenticated
  using (user_id = (select auth.uid()));

-- Check-ins : visibles entre membres, chacun écrit les siens
create policy "checkins_select" on public.challenge_checkins for select to authenticated
  using (public.is_challenge_member(challenge_id));
create policy "checkins_insert" on public.challenge_checkins for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_challenge_member(challenge_id));
create policy "checkins_update" on public.challenge_checkins for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "checkins_delete" on public.challenge_checkins for delete to authenticated
  using (user_id = (select auth.uid()));

-- =========================================================
-- Storage : photos de plats et tickets (privés, 1 dossier par utilisateur)
-- Chemin attendu : <user_id>/<fichier>.jpg
-- =========================================================
insert into storage.buckets (id, name, public)
values ('meals', 'meals', false), ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "storage_own_select" on storage.objects for select to authenticated
  using (bucket_id in ('meals', 'receipts') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('meals', 'receipts') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage_own_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('meals', 'receipts') and (storage.foldername(name))[1] = (select auth.uid())::text);
