
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

async function checkMetadata() {
    console.log('--- Checking Metadata Storage ---');

    const testActivity = {
        code: 'META-TEST',
        description: 'Metadata Test',
        responsible: 'Tester',
        status: 'pendente',
        // Standard fields
        startDate: new Date().toISOString(),

        // Extra fields (Should go to metadata)
        'ÁREA': 'Area 51',
        'SUBÁREA': 'Hangar 18',
        'ORDEM': '66',
        'extra_field': 'custom_value'
    };

    // Simulate what addActivities does (client-side logic simulation)
    const validColumns = ['code', 'description', 'responsible', 'status', 'startDate', 'endDate'];
    const metadata = {};
    const standardData = {};

    Object.keys(testActivity).forEach(key => {
        if (validColumns.includes(key)) {
            standardData[key] = testActivity[key];
        } else {
            metadata[key] = testActivity[key];
        }
    });

    const payload = { ...standardData, metadata };

    console.log('Inserting payload with metadata:', JSON.stringify(payload, null, 2));

    const { data, error } = await supabase
        .from('activities')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('INSERT FAILED:', error.message);
        return;
    }

    console.log('Insert Success! ID:', data.id);
    console.log('Stored Metadata:', data.metadata);

    if (data.metadata && data.metadata['ÁREA'] === 'Area 51') {
        console.log('SUCCESS: Metadata stored correctly!');
    } else {
        console.error('FAILURE: Metadata missing or incorrect.');
    }

    // Cleanup
    await supabase.from('activities').delete().eq('id', data.id);
}

checkMetadata();
