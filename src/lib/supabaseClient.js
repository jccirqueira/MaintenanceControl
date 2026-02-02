
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[Supabase Client Debug]');
console.log('URL:', supabaseUrl);
console.log('Key (Start):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'UNDEFINED');

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
