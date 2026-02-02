
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

async function inspectData() {
    console.log('--- Inspecting Activities ---');

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .limit(5);

    if (error) {
        console.error('Fetch error:', error);
        return;
    }

    console.log(`Found ${data.length} activities.`);
    if (data.length > 0) {
        console.log('Sample Activity keys:', Object.keys(data[0]));
        console.log('Sample Activity Data:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('No data found.');
    }
}

inspectData();
