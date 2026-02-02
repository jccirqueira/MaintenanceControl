
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

async function inspectLatest() {
    console.log('--- Inspecting Latest Activity ---');

    // Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'daniel.nunes@drivetech.com',
        password: '123'
    });

    if (authError) console.log('Auth failed:', authError.message);
    else console.log('Auth success:', authData.user.email);

    // Get the most recently created activity
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    if (data.length === 0) {
        console.log('No activities found.');
        return;
    }

    const item = data[0];
    console.log('ID:', item.id);
    console.log('Created At:', item.createdAt);
    console.log('Std Code:', item.code);
    console.log('Metadata:', JSON.stringify(item.metadata, null, 2));

    // Check specific columns we expect
    const keys = item.metadata ? Object.keys(item.metadata) : [];
    console.log('Metadata Keys found:', keys.join(', '));
}

inspectLatest();
