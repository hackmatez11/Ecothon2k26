-- Add phone_number column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update handle_new_user function to include phone_number from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, city, latitude, longitude, phone_number)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'city',
    (new.raw_user_meta_data->>'latitude')::float8,
    (new.raw_user_meta_data->>'longitude')::float8,
    new.raw_user_meta_data->>'phone_number'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
