import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('FATAL: Missing Supabase credentials in environment variables');
    process.exit(1);
}

// Use service role key for server operations (bypasses RLS), fall back to anon key
export const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
