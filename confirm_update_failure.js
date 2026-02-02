
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

async function checkUpdate() {
    console.log('--- Checking Update Permissions ---');

    // 1. Get ANY existing activity
    const { data: activities, error: selectError } = await supabase
        .from('activities')
        .select('id')
        .limit(1);

    if (selectError) {
        console.error('Select blocked:', selectError.message);
        return;
    }

    if (!activities || activities.length === 0) {
        console.log('No activities found to test update. Creating one...');
        const { data: newAct, error: insertError } = await supabase
            .from('activities')
            .insert([{ code: 'TEST-UPD', description: 'Update Test', status: 'pendente' }])
            .select()
            .single();

        if (insertError) {
            console.error('Insert blocked:', insertError.message);
            return;
        }
        testUpdate(newAct.id);
    } else {
        testUpdate(activities[0].id);
    }
}

async function testUpdate(id) {
    console.log(`Attempting to update activity ${id}...`);
    const { error } = await supabase
        .from('activities')
        .update({ status: 'em_execucao' })
        .eq('id', id);

    if (error) {
        console.error('UPDATE FAILED:', error.message);
        console.log('Error Code:', error.code);
        if (error.code === '42501') {
            console.log('CONCLUSION: RLS Policy prevents UPDATE.');
        }
    } else {
        console.log('UPDATE SUCCESSFUL!');
    }
}

checkUpdate();
