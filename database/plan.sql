create table if not exists control_plans (
  id          uuid primary key default gen_random_uuid(),
  city        text not null,
  aqi_at_generation integer,
  plan_data   jsonb not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Index for fast city lookups
create index if not exists control_plans_city_idx on control_plans (city);

-- Optional: one plan per city (upsert pattern)
create unique index if not exists control_plans_city_unique on control_plans (city);
