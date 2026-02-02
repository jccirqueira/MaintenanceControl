import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    console.log('--- Inspecting DB ---');

    // Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'daniel.nunes@drivetech.com', // Trying a likely email based on previous context or just generic
        password: '123'
    });

    // If email login fails, maybe username? Supabase uses email usually.
    // Let's try to just read public schema if auth fails, or print auth error.
    if (authError) console.log('Auth attempt failed (expected if email wrong):', authError.message);
    else console.log('Auth success as:', authData.user.email);

    // 1. Fetch one row to see columns
    const { data: oneRow, error: oneError } = await supabase
        .from('activities')
        .select('*')
        .limit(1);

    if (oneError) {
        console.error('Error fetching 1 row:', JSON.stringify(oneError, null, 2));
    } else if (oneRow && oneRow.length > 0) {
        console.log('--- Row Structure (Columns) ---');
        console.log(Object.keys(oneRow[0]));
    } else {
        console.log('Table seems empty or access denied.');
    }
}

inspect();
