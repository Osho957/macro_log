alter table public.log_entries
  add column if not exists food_name text,
  add column if not exists food_brand text;

update public.log_entries le
set food_name = f.name,
    food_brand = f.brand
from public.foods f
where le.food_id = f.id
  and le.food_name is null;
