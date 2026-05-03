-- ============================================================
-- DEEPVISION COMPLETE DATABASE SETUP (NO PAYMENTS)
-- This migration creates all tables, policies, triggers, and functions
-- WITHOUT any payment or subscription functionality
-- Run this once in Supabase SQL Editor to set up the entire database
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- STEP 1: DROP EVERYTHING (Clean slate)
-- ============================================================

DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.detection_analytics CASCADE;
DROP TABLE IF EXISTS public.detections CASCADE;
DROP TABLE IF EXISTS public.user_statistics CASCADE;
DROP TABLE IF EXISTS public.system_analytics CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.ai_models CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_statistics() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- ============================================================
-- STEP 2: CREATE TABLES
-- ============================================================

-- Profiles table (NO subscription fields)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User statistics
CREATE TABLE public.user_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_detections INTEGER DEFAULT 0,
    authentic_count INTEGER DEFAULT 0,
    deepfake_count INTEGER DEFAULT 0,
    last_detection_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detections
CREATE TABLE public.detections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    verdict TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    model_version TEXT DEFAULT 'v1.0',
    processing_time_ms INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detection analytics
CREATE TABLE public.detection_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    detection_id UUID REFERENCES public.detections(id) ON DELETE CASCADE NOT NULL,
    faces_detected INTEGER DEFAULT 0,
    artifacts_found JSONB DEFAULT '[]'::jsonb,
    frame_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE public.feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System analytics
CREATE TABLE public.system_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_detections INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    avg_confidence FLOAT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Models table
CREATE TABLE public.ai_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    accuracy FLOAT DEFAULT 0.0,
    status TEXT DEFAULT 'inactive',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: CREATE HELPER FUNCTION (NO RECURSION)
-- ============================================================

-- This function checks if current user is admin WITHOUT causing recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
SECURITY DEFINER
STABLE
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
    RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- ============================================================
-- STEP 4: CREATE TRIGGER FUNCTIONS
-- ============================================================

-- Auto-create profiles for new users with admin role detection
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

    -- Create profile for new user (NO subscription fields)
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

-- Update user statistics when detection is created
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_statistics (user_id, total_detections, authentic_count, deepfake_count, last_detection_at)
    VALUES (
        NEW.user_id,
        1,
        CASE WHEN NEW.verdict = 'REAL' THEN 1 ELSE 0 END,
        CASE WHEN NEW.verdict = 'FAKE' THEN 1 ELSE 0 END,
        NEW.created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_detections = user_statistics.total_detections + 1,
        authentic_count = user_statistics.authentic_count + CASE WHEN NEW.verdict = 'REAL' THEN 1 ELSE 0 END,
        deepfake_count = user_statistics.deepfake_count + CASE WHEN NEW.verdict = 'FAKE' THEN 1 ELSE 0 END,
        last_detection_at = NEW.created_at,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_detection_created ON public.detections;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_detection_created
    AFTER INSERT ON public.detections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_statistics();

-- ============================================================
-- STEP 6: CREATE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_detections_user_id ON public.detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON public.detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);

-- ============================================================
-- STEP 7: ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 8: CREATE RLS POLICIES (USING is_admin() FUNCTION)
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "detections_policy" ON public.detections;
DROP POLICY IF EXISTS "detection_analytics_policy" ON public.detection_analytics;
DROP POLICY IF EXISTS "user_statistics_policy" ON public.user_statistics;
DROP POLICY IF EXISTS "feedback_policy" ON public.feedback;
DROP POLICY IF EXISTS "system_analytics_policy" ON public.system_analytics;
DROP POLICY IF EXISTS "ai_models_read" ON public.ai_models;
DROP POLICY IF EXISTS "ai_models_write" ON public.ai_models;

-- Profiles
CREATE POLICY "profiles_policy" ON public.profiles
    FOR ALL USING (auth.uid() = id OR public.is_admin());

-- Detections
CREATE POLICY "detections_policy" ON public.detections
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Detection analytics
CREATE POLICY "detection_analytics_policy" ON public.detection_analytics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.detections WHERE id = detection_analytics.detection_id AND user_id = auth.uid()) 
        OR public.is_admin()
    );

-- User statistics
CREATE POLICY "user_statistics_policy" ON public.user_statistics
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Feedback
CREATE POLICY "feedback_policy" ON public.feedback
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- System analytics (admin only)
CREATE POLICY "system_analytics_policy" ON public.system_analytics
    FOR ALL USING (public.is_admin());

-- AI Models (everyone reads, admin writes)
CREATE POLICY "ai_models_read" ON public.ai_models
    FOR SELECT USING (true);

CREATE POLICY "ai_models_write" ON public.ai_models
    FOR ALL USING (public.is_admin());

-- ============================================================
-- STEP 9: INSERT DEFAULT DATA
-- ============================================================

-- Insert default AI model
INSERT INTO public.ai_models (name, version, accuracy, status)
VALUES ('DeepVision Model', 'v1.0', 95.5, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 10: CREATE PROFILES FOR EXISTING USERS
-- ============================================================

-- Create profiles for existing users (NO subscription fields)
INSERT INTO public.profiles (id, email, full_name, role, is_active)
SELECT 
    u.id,
    LOWER(u.email),
    COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
    'user',
    true
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
    email = LOWER(EXCLUDED.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    is_active = COALESCE(EXCLUDED.is_active, profiles.is_active);

-- Create user statistics for existing users
INSERT INTO public.user_statistics (user_id)
SELECT u.id
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- STEP 11: ADD COMMENTS
-- ============================================================

COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active and can login';
COMMENT ON COLUMN public.profiles.role IS 'User role: user or admin';
COMMENT ON TABLE public.detections IS 'Stores all deepfake detection results';
COMMENT ON TABLE public.user_statistics IS 'Aggregated statistics per user';

-- ============================================================
-- DONE! COMPLETE DATABASE SETUP (NO PAYMENTS)
-- ============================================================

SELECT 'DeepVision database setup complete (without payments)! All tables, policies, and triggers created successfully.' as message;
