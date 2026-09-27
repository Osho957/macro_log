alter table public.foods
  add column if not exists last_logged_at timestamptz not null default now();

create index if not exists foods_user_recency_idx
  on public.foods (user_id, last_logged_at desc);
