import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect empty or default placeholder values
if (
  !supabaseUrl || 
  supabaseUrl.includes('[PROJECT-REF]') || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('your-supabase')
) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is a placeholder or undefined. Using build-time fallback values.');
  supabaseUrl = 'https://placeholder-project.supabase.co';
  supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE1OTg4NTAwMDAsImV4cCI6MTkwMDAwMDAwMH0.placeholder';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
