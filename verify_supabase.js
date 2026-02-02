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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log('Testing Supabase connection...');

    // Check if we can SELECT (usually allowed if RLS is off or public)
    const { data, error } = await supabase.from('activities').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error connecting or table "activities" missing:', error.message);
        console.log('Error Code:', error.code);
    } else {
        console.log('Connection successful! "activities" table exists and is readable.');

        // Authenticate first
        console.log('Authenticating for Insert Check...');
        const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
            email: 'daniel.nunes@drivetech.com',
            password: '123456'
        });

        if (authErr) {
            console.error('Auth Failed:', authErr.message);
            return;
        }
        console.log('Authenticated as:', auth.user.id);

        // Check if we can INSERT (often blocked by RLS)
        const { error: insertError } = await supabase.from('activities').insert({
            description: 'Probe',
            code: 'PROBE-001'
            // Intentionally missing user_id/team_id to see RLS error
        }).select();

        if (insertError) {
            console.error('Insert failed:', insertError.message);
            console.log('Insert Error Code:', insertError.code);
            if (insertError.code === '42501') {
                console.log('--> RLS VIOLATION CONFIRMED: You must disable RLS for INSERT in Supabase Dashboard.');
            }
        } else {
            console.log('Insert successful! RLS is not blocking this user.');
        }
    }
}

checkConnection();