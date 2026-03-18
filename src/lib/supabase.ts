import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only attempt to create the client if keys are present, or use placeholders to satisfy the constructor
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
