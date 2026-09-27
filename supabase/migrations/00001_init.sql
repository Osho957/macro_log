-- Personal calorie tracker schema
-- All tables are per-user, gated behind Supabase Auth + Row Level Security.

create table if not exists public.foods (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  source        text not null check (source in ('custom', 'usda', 'off')),
  external_id   text,
  name          text not null,
  brand         text,
  serving_size  numeric not null default 100,
  serving_unit  text not null default 'g',
  calories      numeric not null,
  protein_g     numeric,
  carbs_g       numeric,
  fat_g         numeric,
  fiber_g       numeric,
  sugar_g       numeric,
  sodium_mg     numeric,
  barcode       text,
  created_at    timestamptz not null default now(),
  unique (user_id, source, external_id)
);

create table if not exists public.meals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.log_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  food_id       uuid references public.foods(id) on delete set null,
  meal_id       uuid references public.meals(id) on delete set null,
  logged_date   date not null,
  quantity      numeric not null default 1,
  unit          text,
  calories      numeric not null,
  protein_g     numeric,
  carbs_g       numeric,
  fat_g         numeric,
  created_at    timestamptz not null default now()
);

create index if not exists log_entries_user_date_idx
  on public.log_entries (user_id, logged_date);

create table if not exists public.daily_goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  effective_date  date not null,
  calorie_goal    numeric not null,
  protein_goal_g  numeric,
  carbs_goal_g    numeric,
  fat_goal_g      numeric,
  created_at      timestamptz not null default now(),
  unique (user_id, effective_date)
);

create table if not exists public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  weight_unit   text not null default 'kg',
  timezone      text not null default 'UTC'
);

-- Row Level Security: every table is scoped to auth.uid()

alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.log_entries enable row level security;
alter table public.daily_goals enable row level security;
alter table public.user_settings enable row level security;

create policy "foods_owner" on public.foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meals_owner" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "log_entries_owner" on public.log_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_goals_owner" on public.daily_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings_owner" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed default meals + settings for a new user on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_settings (user_id) values (new.id);

  insert into public.meals (user_id, name, sort_order) values
    (new.id, 'Breakfast', 0),
    (new.id, 'Lunch', 1),
    (new.id, 'Dinner', 2),
    (new.id, 'Snacks', 3);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
