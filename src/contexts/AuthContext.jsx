import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Map Supabase user to App user structure
                // We'll use metadata if available, or default to parsed email
                const role = session.user.user_metadata?.role || (session.user.email.includes('daniel') ? 'admin' : 'user');
                const name = session.user.user_metadata?.name || session.user.email.split('@')[0].replace('.', ' ');

                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: name,
                    role: role,
                    // team: ... 
                });
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                const role = session.user.user_metadata?.role || (session.user.email.includes('daniel') ? 'admin' : 'user');
                const name = session.user.user_metadata?.name || session.user.email.split('@')[0].replace('.', ' ');
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: name,
                    role: role
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (username, password) => {
        // Normalize username to email if needed
        let email = username.trim();
        if (!email.includes('@')) {
            email = `${email}@drivetech.com`;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: password.trim()
        });

        if (error) {
            console.error("Login failed:", error);
            // Translate common errors
            let msg = error.message;
            if (msg.includes('Invalid login credentials')) msg = 'User not found or password incorrect.';
            return { success: false, error: msg };
        }
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
