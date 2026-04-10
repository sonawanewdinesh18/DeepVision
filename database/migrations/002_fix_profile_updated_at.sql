-- ============================================================
-- FIX PROFILE UPDATED_AT TIMESTAMP
-- This migration adds triggers to update the profiles.updated_at field
-- when users sign in or when profile data changes
-- ============================================================

-- ============================================================
-- STEP 1: Create function to update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 2: Add trigger to profiles table for any updates
-- ============================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 3: Create function to update profile on sign in
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_profile_on_signin()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update the profile's updated_at timestamp when user signs in
    UPDATE public.profiles 
    SET updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 4: Add trigger to auth.users for sign in updates
-- ============================================================

-- Note: This trigger will fire when last_sign_in_at is updated in auth.users
DROP TRIGGER IF EXISTS update_profile_on_signin_trigger ON auth.users;

CREATE TRIGGER update_profile_on_signin_trigger
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_profile_on_signin();

-- ============================================================
-- STEP 5: Update existing profiles to current timestamp (optional)
-- ============================================================

-- Uncomment the line below if you want to update all existing profiles to current time
-- UPDATE public.profiles SET updated_at = NOW();

-- ============================================================
-- STEP 6: Create function to manually update last active time
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_last_active(user_id UUID)
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.profiles 
    SET updated_at = NOW()
    WHERE id = user_id;
END;
$$;

-- ============================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================

-- Check if triggers were created successfully
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public' 
-- AND event_object_table = 'profiles';

-- Check current profile timestamps
-- SELECT id, email, created_at, updated_at 
-- FROM public.profiles 
-- ORDER BY updated_at DESC 
-- LIMIT 5;