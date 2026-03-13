-- Create officers table to store government department officers
create table if not exists public.officers (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  email text not null unique,
  designation text not null,
  work_domain text not null,
  department text not null,
  phone text,
  is_active boolean default true
);

-- Enable RLS
alter table officers enable row level security;

-- Policies for officers table
create policy "Officers are viewable by authenticated users" on officers 
  for select using (auth.role() = 'authenticated');

create policy "Officers can be inserted by authenticated users" on officers 
  for insert with check (auth.role() = 'authenticated');

create policy "Officers can be updated by authenticated users" on officers 
  for update using (auth.role() = 'authenticated');

create policy "Officers can be deleted by authenticated users" on officers 
  for delete using (auth.role() = 'authenticated');

-- Create index for faster queries
create index if not exists officers_department_idx on officers(department);
create index if not exists officers_email_idx on officers(email);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
drop trigger if exists update_officers_updated_at on officers;
create trigger update_officers_updated_at
  before update on officers
  for each row
  execute function update_updated_at_column();
