
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

async function debugUpdate() {
    console.log('--- Debugging Update ---');

    // 1. Create temporary activity
    const { data: insertData, error: insertError } = await supabase
        .from('activities')
        .insert([{ code: 'TEMP-UPD', description: 'Temp for Update', status: 'pendente' }])
        .select()
        .single();

    if (insertError) {
        console.error('Setup failed (Insert blocked?):', insertError.message);
        return;
    }

    const id = insertData.id;
    console.log('Created temporary activity:', id);

    // 2. Try to update it
    const { error: updateError } = await supabase
        .from('activities')
        .update({ status: 'em_execucao' })
        .eq('id', id);

    if (updateError) {
        console.error('UPDATE FAILED!');
        console.error('Message:', updateError.message);
        console.error('Code:', updateError.code);
        if (updateError.code === '42501') {
            console.log('--> RLS permission denied for UPDATE.');
        }
    } else {
        console.log('Update SUCCESS.');
    }

    // 3. Cleanup
    await supabase.from('activities').delete().eq('id', id);
}

debugUpdate();
