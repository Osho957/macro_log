alter table public.user_settings
  add column if not exists age int,
  add column if not exists height_cm numeric,
  add column if not exists sex text check (sex in ('male', 'female')),
  add column if not exists activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  add column if not exists goal_type text check (
    goal_type in ('lose', 'maintain', 'gain')
  );
