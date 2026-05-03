-- ============================================================
-- REMOVE ALL PAYMENT AND SUBSCRIPTION FUNCTIONALITY
-- This migration removes all payment and subscription related tables and columns
-- Run this ONLY if you have already run 001_complete_database_setup.sql
-- If starting fresh, use 001_complete_database_setup_no_payments.sql instead
-- ============================================================

-- Drop RLS policies first (if they exist)
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_history;
DROP POLICY IF EXISTS "subscription_plans_read" ON public.subscription_plans;
DROP POLICY IF EXISTS "subscription_plans_write" ON public.subscription_plans;

-- Drop indexes (if they exist)
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_payment_history_user_id;

-- Drop payment and subscription tables (if they exist)
DROP TABLE IF EXISTS public.payment_history CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Remove subscription columns from profiles table (if they exist)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN subscription_plan CASCADE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles DROP COLUMN subscription_status CASCADE;
    END IF;
END $$;



-- Update handle_new_user function to remove subscription_plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    admin_email TEXT := 'admin@deepvision.com'; -- ⚠️ CHANGE THIS TO YOUR ADMIN EMAIL!
    user_role TEXT := 'user';
BEGIN
    -- Check if email matches admin email (case-insensitive comparison)
    IF LOWER(NEW.email) = LOWER(admin_email) THEN
        user_role := 'admin';
    END IF;

    -- Create profile for new user (without subscription fields)
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        LOWER(NEW.email), -- Always store email in lowercase
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        user_role,
        true
    );
    
    -- Create user statistics entry
    INSERT INTO public.user_statistics (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth.users insert
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

SELECT 'Payment and subscription functionality removed successfully!' as message;
