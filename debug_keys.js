
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};

envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        envConfig[key] = value;
    }
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function inspectKeys() {
    console.log("Fetching 200 rows...");
    const { data } = await supabase.from('activities').select('metadata').limit(200);

    const keys = {};
    let foundUnit = false;

    data.forEach((item, idx) => {
        const meta = item.metadata || {};

        Object.keys(meta).forEach(k => {
            keys[k] = (keys[k] || 0) + 1;
            const val = meta[k];

            if (typeof val === 'string' && val.toUpperCase().includes('UNIDADES')) {
                console.log(`\n[FOUND IT!] Row ${idx}`);
                console.log(`KEY: "${k}" (Length: ${k.length})`);
                console.log(`VALUE: "${val}"`);
                // Check char codes of key
                const codes = [];
                for (let i = 0; i < k.length; i++) codes.push(k.charCodeAt(i));
                console.log(`Key CharCodes: ${codes.join(',')}`);
                foundUnit = true;
            }
        });
    });

    console.log("\n--- Metadata Keys Frequency ---");
    console.log(keys);
}

inspectKeys();
