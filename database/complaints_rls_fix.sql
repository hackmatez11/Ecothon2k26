-- Fix: allow government dashboard (anon/authenticated) to update complaint assignments
create policy "Allow assignment updates" on complaints
  for update using (true)
  with check (true);

-- Fix: allow anon key to read officers for assignment matching
drop policy if exists "Officers are viewable by authenticated users" on officers;

create policy "Officers are viewable by all" on officers
  for select using (true);
