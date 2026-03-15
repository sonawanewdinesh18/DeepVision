import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@deepvision.com';

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auth functions
    const signUp = async (email, password, fullName) => {
        return await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                }
            }
        });
    };

    const signIn = async (email, password) => {
        return await supabase.auth.signInWithPassword({
            email,
            password,
        });
    };

    const signInWithGoogle = async () => {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/user-dashboard`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    const resetPasswordForEmail = async (email) => {
        return await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    };

    const updatePassword = async (newPassword) => {
        return await supabase.auth.updateUser({ password: newPassword });
    };

    const isAdmin = user && user.email === ADMIN_EMAIL;

    const value = {
        session,
        user,
        isAdmin,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPasswordForEmail,
        updatePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
