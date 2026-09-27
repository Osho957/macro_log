alter table public.user_settings
  add column if not exists water_goal_ml int not null default 3000;

create table if not exists public.water_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  logged_date   date not null,
  amount_ml     int not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, logged_date)
);

alter table public.water_logs enable row level security;

create policy "water_logs_owner" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
