import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';


const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);

    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@deepvision.com';

    useEffect(() => {
        // Initial session fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user || null);
            
            // Fetch user profile to get role
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            
            // Fetch user profile when auth state changes
            if (session?.user) {
                fetchUserProfile(session.user.id);
            } else {
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) {
                console.error('Error fetching user profile:', error);
                // Create a minimal profile from user data if DB fetch fails
                setUserProfile({
                    id: userId,
                    role: 'user',
                    created_at: new Date().toISOString()
                });
            } else {
                setUserProfile(data);
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
            // Create a minimal profile from user data if DB fetch fails
            setUserProfile({
                id: userId,
                role: 'user',
                created_at: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    // Auth functions
    const signUp = async (email, password, fullName) => {
        // Always convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        return await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/user-dashboard`
            }
        });
    };

    const signIn = async (email, password) => {
        // Always convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        return await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });
    };

    const signInWithGoogle = async () => {
        // Store pending redirect before OAuth redirects away
        const pending = sessionStorage.getItem('pendingRedirect');
        const redirectUrl = pending
            ? `${window.location.origin}/pricing`
            : `${window.location.origin}/user-dashboard`;
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
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
        // Always convert email to lowercase
        const normalizedEmail = email.toLowerCase().trim();
        return await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
    };

    const updatePassword = async (newPassword) => {
        return await supabase.auth.updateUser({ password: newPassword });
    };

    // Check if user is admin based on role in database profile
    // Fallback to email check if profile not loaded yet
    const isAdmin = !!(
        (userProfile && userProfile.role === 'admin') ||
        (user && ADMIN_EMAIL && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim())
    );

    const value = {
        session,
        user,
        userProfile,
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
