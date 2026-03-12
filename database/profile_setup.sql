-- Create profiles table to store citizen location metadata
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamptz default now(),
  email text,
  city text,
  latitude float8,
  longitude float8
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Profiles are viewable by owner" on profiles 
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles 
  for update using (auth.uid() = id);

-- Function to handle new user creation from auth.users metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, city, latitude, longitude)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->>'latitude')::float8,
    (new.raw_user_meta_data->>'longitude')::float8
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run the function after a new user is created in auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
