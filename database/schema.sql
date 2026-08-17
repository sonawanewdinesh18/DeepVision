-- =============================================================================
-- DeepVision Database Schema & Security Policies (Supabase / PostgreSQL)
-- Run this script in the Supabase SQL Editor to set up all tables and policies.
-- =============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ───────────────────────────────────────────────────────────────────

-- 2. Profiles Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Detections Table
CREATE TABLE IF NOT EXISTS public.detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT DEFAULT '',
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    file_size BIGINT DEFAULT 0,
    verdict TEXT NOT NULL CHECK (verdict IN ('REAL', 'FAKE', 'UNCERTAIN')),
    confidence DOUBLE PRECISION NOT NULL,
    model_version TEXT DEFAULT 'HybridViTCNN-v1.0',
    processing_time_ms INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detections_user_id ON public.detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON public.detections(created_at DESC);

-- 4. Detection Analytics (Forensic breakdowns)
CREATE TABLE IF NOT EXISTS public.detection_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES public.detections(id) ON DELETE CASCADE,
    faces_detected INTEGER DEFAULT 0,
    artifacts_found JSONB DEFAULT '[]'::jsonb,
    frame_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_detection_id ON public.detection_analytics(detection_id);

-- 5. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    weekly_report BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    detection_id UUID REFERENCES public.detections(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    admin_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ── Triggers ─────────────────────────────────────────────────────────────────

-- Auto-provision user profile when signed up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and edit their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Detections: Users can view and manage their own detections
CREATE POLICY "Users can read own detections" ON public.detections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections" ON public.detections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own detections" ON public.detections
    FOR DELETE USING (auth.uid() = user_id);

-- User Settings: Users can manage own settings
CREATE POLICY "Users can read own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Users can read and update own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ── Storage Buckets ──────────────────────────────────────────────────────────

-- Create Storage buckets if not present
INSERT INTO storage.buckets (id, name, public)
VALUES ('detection-media', 'detection-media', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;
