
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

async function debugInsert() {
    console.log('--- Debugging Insert ---');

    const testActivity = {
        code: 'TEST-001',
        description: 'Test Insert Activity',
        responsible: 'Tester',
        status: 'pendente',
        // Deliberately using valid dates
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString()
    };

    console.log('Attempting to insert:', testActivity);

    const { data, error } = await supabase
        .from('activities')
        .insert([testActivity])
        .select();

    if (error) {
        console.error('INSERT FAILED!');
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
        console.error('Code:', error.code);
    } else {
        console.log('Insert SUCCESS:', data);
        // Clean up
        await supabase.from('activities').delete().eq('id', data[0].id);
    }
}

debugInsert();
