-- Shared, curated reference dataset of common Indian foods, so search
-- results don't depend entirely on flaky/US-only external APIs. Readable
-- by every authenticated user; not user-owned (no user_id column).

alter table public.foods
  drop constraint if exists foods_source_check;

alter table public.foods
  add constraint foods_source_check
  check (source in ('custom', 'usda', 'off', 'common'));

create table if not exists public.common_foods (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  serving_size  numeric not null,
  serving_unit  text not null,
  calories      numeric not null,
  protein_g     numeric,
  carbs_g       numeric,
  fat_g         numeric,
  fiber_g       numeric,
  sugar_g       numeric,
  sodium_mg     numeric
);

alter table public.common_foods enable row level security;

create policy "common_foods_readable" on public.common_foods
  for select
  to authenticated
  using (true);

insert into public.common_foods
  (name, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g)
values
  ('Roti / Chapati, whole wheat (~35g)', 1, 'piece', 104, 3.1, 18, 2.5, 2.7),
  ('White Rice, cooked (~1 cup)', 150, 'g', 200, 4.2, 45, 0.4, 0.6),
  ('Brown Rice, cooked (~1 cup)', 150, 'g', 215, 5, 45, 1.8, 3.5),
  ('Chicken Breast, cooked (skinless)', 100, 'g', 165, 31, 0, 3.6, 0),
  ('Egg, whole, boiled (large)', 1, 'piece', 78, 6.3, 0.6, 5.3, 0),
  ('Paneer', 100, 'g', 265, 18, 1.2, 20, 0),
  ('Soya Chunks, dry', 100, 'g', 345, 52, 33, 0.5, 13),
  ('Milk, whole (~1 cup)', 240, 'ml', 150, 8, 12, 8, 0),
  ('Milk, toned / low fat (~1 cup)', 240, 'ml', 100, 8, 12, 3, 0),
  ('Oats, dry rolled', 100, 'g', 389, 16.9, 66.3, 6.9, 10.6),
  ('Dal / Lentils, cooked (~1 cup)', 200, 'g', 230, 18, 40, 1, 15),
  ('Curd / Yogurt, plain whole milk', 100, 'g', 60, 3.5, 4.7, 3.3, 0),
  ('Ghee (1 tbsp)', 1, 'tbsp', 126, 0, 0, 14, 0),
  ('Whole Wheat Flour (Atta), raw', 100, 'g', 341, 12, 69, 2, 11),
  ('Banana, medium', 1, 'piece', 105, 1.3, 27, 0.4, 3.1),
  ('Almonds (10 pieces)', 10, 'piece', 70, 2.6, 2.6, 6, 1.5),
  ('Peanuts, roasted', 100, 'g', 567, 26, 16, 49, 8),
  ('Idli', 1, 'piece', 58, 2, 12, 0.2, 0.5),
  ('Dosa, plain', 1, 'piece', 133, 2.7, 24, 3, 0.9),
  ('Poha, cooked (~1 cup)', 150, 'g', 250, 4, 45, 5, 1.5);
