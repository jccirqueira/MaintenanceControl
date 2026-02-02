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

async function createUser() {
    console.log('Creating user: daniel.nunes@drivetech.com');
    const { data, error } = await supabase.auth.signUp({
        email: 'daniel.nunes@drivetech.com',
        password: '123456',
        options: {
            data: {
                name: 'Daniel Nunes',
                role: 'admin'
            }
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created:', data.user?.email);
        if (data.session) {
            console.log('Session active. Login should work immediately.');
        } else if (data.user && !data.session) {
            console.log('User created but requires email confirmation.');
            console.log('IMPORTANT: Go to Supabase > Authentication > Providers > Email and disable "Confirm email" or check your inbox.');
        }
    }
}

createUser();
