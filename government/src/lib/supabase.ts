import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Complaint = {
  id: string;
  created_at: string;
  citizen_email: string;
  citizen_id: string;
  description: string;
  image_url: string;
  ai_analysis: string;
  department: string;
  severity: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  location: string;
};
