create table complaints (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  citizen_email text,
  citizen_id uuid references auth.users(id),
  description text,
  image_url text,
  ai_analysis text,
  department text,
  severity text default 'medium',
  status text default 'pending',
  location text,
  assigned_officer_id uuid references officers(id),
  assigned_officer_name text,
  assignment_reason text
);

-- Enable row level security
alter table complaints enable row level security;

-- Citizens can insert their own complaints
create policy "Citizens can insert" on complaints for insert 
  with check (auth.uid() = citizen_id);

-- Citizens can view their own complaints  
create policy "Citizens can view own" on complaints for select 
  using (auth.uid() = citizen_id);

-- Government can view all (using service role or a bypass policy for demo)
create policy "Public read for government" on complaints for select 
  using (true);

-- STORAGE BUCKET SETUP
-- Create the bucket
insert into storage.buckets (id, name, public) 
  values ('complaint-images', 'complaint-images', true);

-- Allow public access to images
create policy "Public Access" on storage.objects for select 
  using (bucket_id = 'complaint-images');

-- Allow authenticated users to upload images
create policy "Citizen Uploads" on storage.objects for insert 
  with check (bucket_id = 'complaint-images' AND auth.role() = 'authenticated');

-- Allow users to update/delete their own uploads (optional)
create policy "Citizen Management" on storage.objects for all
  using (bucket_id = 'complaint-images' AND auth.uid() = owner);
