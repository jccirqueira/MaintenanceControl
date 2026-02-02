
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

async function findSpecific() {
    const target = "GERAÇÃO DISTR. VAPOR";
    console.log(`Searching for '${target}'...`);

    // Fetch a large chunk
    const { data } = await supabase.from('activities').select('*').limit(3000);

    let found = false;
    data.forEach(item => {
        const meta = item.metadata || {};
        Object.entries(meta).forEach(([k, v]) => {
            if (String(v).toUpperCase().includes("GERAÇÃO DISTR. VAPOR") || String(v).toUpperCase().includes("GERACAO DISTR. VAPOR")) {
                console.log(`\n[FOUND] ID: ${item.id}`);
                console.log(`KEY: "${k}"`);
                console.log(`VALUE: "${v}"`);
                found = true;
            }
        });

        // Also check top level
        Object.entries(item).forEach(([k, v]) => {
            if (String(v).toUpperCase().includes("GERAÇÃO DISTR. VAPOR") && k !== 'metadata') {
                console.log(`\n[FOUND_TOP] ID: ${item.id}`);
                console.log(`KEY: "${k}"`);
                console.log(`VALUE: "${v}"`);
                found = true;
            }
        });
    });

    if (!found) console.log("Not found in 3000 rows.");
}
findSpecific();
