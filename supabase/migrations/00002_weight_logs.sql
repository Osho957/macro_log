create table if not exists public.weight_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  logged_date   date not null,
  weight        numeric not null,
  unit          text not null default 'kg',
  created_at    timestamptz not null default now(),
  unique (user_id, logged_date)
);

create index if not exists weight_logs_user_date_idx
  on public.weight_logs (user_id, logged_date desc);

alter table public.weight_logs enable row level security;

create policy "weight_logs_owner" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
