
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

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAreas() {
    console.log("Fetching first 50 activities...");
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .limit(50);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} activities.`);

    const foundAreas = new Set();
    const metadataSample = [];

    data.forEach((item, index) => {
        // Check metadata
        const meta = item.metadata || {};

        if (index < 5) metadataSample.push(Object.keys(meta));

        // Check ALL metadata values for something that looks like an area
        Object.entries(meta).forEach(([k, v]) => {
            // Heuristic: check for keys containing 'area' or 'setor', or values that look like 'UNIDADES DE APOIO'
            if (typeof v === 'string') {
                const kLower = k.toLowerCase();
                if (kLower.includes('area') || kLower.includes('área') || kLower.includes('setor')) {
                    foundAreas.add(`Key: "${k}" -> Value: "${v}"`);
                }
            }
        });
    });

    console.log("\n--- Unique Areas Candidates Found ---");
    console.log(Array.from(foundAreas).join('\n'));

    // console.log(JSON.stringify(data[0].metadata, null, 2));
}

inspectAreas();
