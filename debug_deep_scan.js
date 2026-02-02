
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

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepScan() {
    console.log("Starting Deep Scan for 'UNIDADES DE APOIO'...");

    let page = 0;
    const pageSize = 1000;
    let found = false;

    // Iterate through pages
    while (true) {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error:", error);
            break;
        }

        if (!data || data.length === 0) break;
        console.log(`Scanning rows ${page * pageSize} to ${(page + 1) * pageSize}...`);

        for (const item of data) {
            const meta = item.metadata || {};

            // Check Metadata
            Object.entries(meta).forEach(([k, v]) => {
                if (typeof v === 'string' && v.toUpperCase().includes("UNIDADES DE APOIO")) {
                    console.log(`\n========= FOUND IN METADATA =========`);
                    console.log(`ID: ${item.id}`);
                    console.log(`Key: "${k}"`);
                    console.log(`Title/Desc: ${item.description || item.content || 'N/A'}`);
                    console.log(`Full Metadata Value: "${v}"`);
                    found = true;
                }
            });

            // Check specific columns
            if (item.area && item.area.toUpperCase().includes("UNIDADES DE APOIO")) {
                console.log(`\n========= FOUND IN 'AREA' COLUMN =========`);
                console.log(`ID: ${item.id}`);
                console.log(`Value: "${item.area}"`);
                found = true;
            }
        }

        if (found) break; // Stop after finding one example to keep output clean
        page++;
        if (page > 10) break; // Safety limit (10k rows)
    }

    if (!found) {
        console.log("\n[FAILURE] distinct string 'UNIDADES DE APOIO' NOT found in first 10k rows.");
        console.log("Maybe it's written differently?");
    }
}

deepScan();
