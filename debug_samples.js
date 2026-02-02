
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const p = line.split('=');
    if (p.length >= 2) envConfig[p[0].trim()] = p.slice(1).join('=').trim();
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function dumpSamples() {
    console.log("Fetching 200 rows...");
    const { data } = await supabase.from('activities').select('metadata').limit(200);

    const keySamples = {};

    data.forEach(item => {
        const meta = item.metadata || {};
        Object.entries(meta).forEach(([k, v]) => {
            if (!keySamples[k]) keySamples[k] = new Set();
            if (keySamples[k].size < 5) keySamples[k].add(v);
        });
    });

    console.log("\n--- Sample Values by Key ---");
    Object.entries(keySamples).forEach(([k, vals]) => {
        console.log(`\nKEY: "${k}"`);
        console.log(`SAMPLES: ${[...vals].join(', ')}`);
    });
}
dumpSamples();
