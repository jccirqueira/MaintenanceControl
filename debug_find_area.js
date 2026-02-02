
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env parser
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

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findValue() {
    console.log("Searching for 'UNIDADES DE APOIO' in activities...");

    // We can't easily ILIKE on a whole JSONB column for values without keys, 
    // so we'll fetch a batch and search in JS.

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .limit(200);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Scanning ${data.length} rows...`);

    let found = false;

    data.forEach((item, index) => {
        const meta = item.metadata || {};

        // Search in metadata values
        Object.entries(meta).forEach(([k, v]) => {
            if (typeof v === 'string' && v.toUpperCase().includes("APOIO")) {
                console.log(`\n[FOUND] Row ${index} (ID: ${item.id})`);
                console.log(`Key: "${k}"`);
                console.log(`Value: "${v}"`);
                found = true;
            }
        });

        // Search in top level columns
        Object.entries(item).forEach(([k, v]) => {
            if (typeof v === 'string' && v.toUpperCase().includes("APOIO") && k !== 'metadata') {
                console.log(`\n[FOUND_TOP_LEVEL] Row ${index}`);
                console.log(`Key: "${k}"`);
                console.log(`Value: "${v}"`);
                found = true;
            }
        });
    });

    if (!found) {
        console.log("Not found in first 200 rows.");
    }
}

findValue();
