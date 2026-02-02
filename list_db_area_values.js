
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

async function listAreas() {
    console.log("Scanning activities for Area values...");

    // Fetch all rows (batched)
    let allRows = [];
    let page = 0;
    while (true) {
        const { data, error } = await supabase.from('activities').select('metadata').range(page * 1000, (page + 1) * 1000 - 1);
        if (error || !data || data.length === 0) break;
        allRows = [...allRows, ...data];
        page++;
        if (page > 20) break; // Limit to 20k rows for safety
    }

    const valuesByKey = {};

    allRows.forEach(item => {
        const meta = item.metadata || {};
        Object.entries(meta).forEach(([k, v]) => {
            const kLower = k.toLowerCase();
            // Check relevant keys
            if (k === 'ÁREA' || k === 'area' || k === 'Area' || k === 'area4' || k === 'area5' || k === 'setor') {
                if (!valuesByKey[k]) valuesByKey[k] = new Set();
                if (v && String(v).trim() !== '') valuesByKey[k].add(String(v).trim());
            }
        });
    });

    let output = "--- CONTEÚDO ENCONTRADO NO BANCO (Valores Únicos por Coluna/Chave) ---\n";
    Object.keys(valuesByKey).forEach(k => {
        output += `\n=== Coluna/Chave: "${k}" ===\n`;
        const sorted = Array.from(valuesByKey[k]).sort();
        sorted.forEach(val => output += `- ${val}\n`);
    });
    fs.writeFileSync('areas_dump.txt', output);
    console.log("Done writing to areas_dump.txt");
}

listAreas();
