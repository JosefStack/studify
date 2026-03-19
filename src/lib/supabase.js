import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
    console.error(
        '⚠️ VITE_SUPABASE_URL is missing or not configured.\n' +
        'Create a .env file in the project root with your Supabase project URL.\n' +
        'Get it from: https://supabase.com/dashboard → Project Settings → API'
    );
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key') {
    console.error(
        '⚠️ VITE_SUPABASE_ANON_KEY is missing or not configured.\n' +
        'Create a .env file in the project root with your Supabase anon key.\n' +
        'Get it from: https://supabase.com/dashboard → Project Settings → API'
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
);

// API URL for our Node.js backend
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
