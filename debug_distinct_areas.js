
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

async function listDistinctAreas() {
    console.log("Listing distinct values for Area keys...");

    const { data, error } = await supabase
        .from('activities')
        .select('metadata')
        .limit(2000); // Sample 2000 rows

    if (error) {
        console.error("Error:", error);
        return;
    }

    const valueCounts = {};

    data.forEach(item => {
        const meta = item.metadata || {};

        Object.entries(meta).forEach(([k, v]) => {
            const kLower = k.toLowerCase();
            // Check broadly for anything that looks like an area key
            if (kLower.includes('area') || kLower.includes('área') || kLower === 'setor') {
                const keyName = k; // preserve case
                const valStr = String(v).trim().toUpperCase(); // Normalize value for counting

                if (!valueCounts[keyName]) valueCounts[keyName] = new Set();
                valueCounts[keyName].add(valStr);
            }
        });
    });

    console.log("\n--- Distinct Values Found ---");
    Object.entries(valueCounts).forEach(([key, values]) => {
        console.log(`\nKey: "${key}" (${values.size} distinct values)`);
        console.log([...values].slice(0, 50).join(', '));
    });
}

listDistinctAreas();
