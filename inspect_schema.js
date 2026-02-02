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

async function inspectSchema() {
    console.log('--- Authenticating ---');
    // Using hardcoded verified credentials
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'daniel.nunes@drivetech.com',
        password: '123456'
    });

    if (authError) {
        console.error('Auth Failed:', authError.message);
        return;
    }
    console.log('Logged in as:', authData.user.id);

    console.log('--- Inspecting Activities Table ---');
    // Try to get one row to capture structure
    // We already know select works, so this should return keys
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Select Error:', error);
    }

    if (data && data.length > 0) {
        console.log('Visible Columns on Select:', Object.keys(data[0]));
    } else {
        console.log('No rows found. Cannot deduce columns from data.');

        // Try to insert a dummy row with NO ownership to see detailed error or if we can infer anything
        console.log('--- Attempting Probe Insert ---');
        const { error: insertError } = await supabase
            .from('activities')
            .insert({
                description: 'Schema Probe',
                code: 'PROBE-999',
                // We'll try to guess 'team_id' or 'user_id' in subsequent runs if this fails
            })
            .select();

        if (insertError) {
            console.error('Insert Failed:', insertError.message);
            console.error('Details:', insertError.details);
            console.error('Hint:', insertError.hint);
        } else {
            console.log('Insert Probe Success! (Columns possibly optional or defaults worked)');
        }
    }
}

inspectSchema();
