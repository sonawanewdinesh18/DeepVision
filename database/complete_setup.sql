-- =============================================================================
-- DeepVision — Complete Database Setup Script
-- =============================================================================
-- Run this entire script in Supabase SQL Editor (one shot).
-- It creates all tables, indexes, RLS policies, triggers, and seed data.
--
-- Order of operations:
--   1. Extensions
--   2. Tables
--   3. Indexes
--   4. Row Level Security (RLS) policies
--   5. Triggers & functions
--   6. Seed data (default AI models)
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles
-- One row per authenticated user. Auto-created by the handle_new_user trigger.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT,
    full_name       TEXT,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Public user profiles — one row per auth.users row.';


-- -----------------------------------------------------------------------------
-- detections
-- Every deepfake analysis result is stored here.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.detections (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name           TEXT NOT NULL,
    file_url            TEXT NOT NULL DEFAULT '',
    file_type           TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    file_size           BIGINT,
    verdict             TEXT NOT NULL CHECK (verdict IN ('REAL', 'FAKE', 'UNCERTAIN')),
    confidence          FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    model_version       TEXT NOT NULL DEFAULT 'DeepVision-Improved-Hybrid-v2.0',
    model_id            UUID,                          -- optional FK to ai_models
    processing_time_ms  INTEGER,
    metadata            JSONB DEFAULT '{}'::JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.detections IS 'All deepfake detection results.';


-- -----------------------------------------------------------------------------
-- detection_analytics
-- Detailed per-detection analytics (faces, artifacts, frame analysis).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.detection_analytics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id    UUID NOT NULL REFERENCES public.detections(id) ON DELETE CASCADE,
    faces_detected  INTEGER DEFAULT 0,
    artifacts_found JSONB DEFAULT '[]'::JSONB,
    frame_analysis  JSONB DEFAULT '{}'::JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.detection_analytics IS 'Detailed analytics for each detection.';


-- -----------------------------------------------------------------------------
-- user_statistics
-- Aggregated per-user stats. Updated automatically by trigger after each detection.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_statistics (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_detections    INTEGER NOT NULL DEFAULT 0,
    authentic_count     INTEGER NOT NULL DEFAULT 0,
    deepfake_count      INTEGER NOT NULL DEFAULT 0,
    last_detection_at   TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_statistics IS 'Aggregated detection statistics per user.';


-- -----------------------------------------------------------------------------
-- user_settings
-- User preferences: theme, notifications, timezone, etc.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_notifications     BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_report           BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    theme                   TEXT NOT NULL DEFAULT 'dark',
    language                TEXT NOT NULL DEFAULT 'en',
    timezone                TEXT NOT NULL DEFAULT 'UTC',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_settings IS 'User preferences and settings.';


-- -----------------------------------------------------------------------------
-- feedback
-- User feedback submissions (can be linked to a specific detection).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    detection_id        UUID REFERENCES public.detections(id) ON DELETE SET NULL,
    subject             TEXT NOT NULL,
    message             TEXT NOT NULL,
    feedback_type       TEXT NOT NULL DEFAULT 'general'
                            CHECK (feedback_type IN ('general', 'correct_result', 'incorrect_result', 'bug', 'feature_request')),
    is_correct          BOOLEAN,                        -- user's assessment of detection accuracy
    rating              INTEGER CHECK (rating >= 1 AND rating <= 5),
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'reviewed', 'resolved')),
    -- Admin fields
    admin_verified      BOOLEAN NOT NULL DEFAULT FALSE,
    admin_verified_at   TIMESTAMPTZ,
    admin_verified_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    admin_notes         TEXT,
    admin_response      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.feedback IS 'User feedback, optionally linked to a detection.';


-- -----------------------------------------------------------------------------
-- notifications
-- In-app notifications for users.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'success', 'warning', 'error', 'detection')),
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    action_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS 'In-app notifications for users.';


-- -----------------------------------------------------------------------------
-- ai_models
-- Registry of AI models available in the system (managed via admin dashboard).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_models (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    version     TEXT NOT NULL,
    description TEXT,
    accuracy    FLOAT DEFAULT 0.0 CHECK (accuracy >= 0 AND accuracy <= 100),
    status      TEXT NOT NULL DEFAULT 'inactive'
                    CHECK (status IN ('active', 'inactive', 'deprecated', 'testing')),
    model_type  TEXT DEFAULT 'hybrid'
                    CHECK (model_type IN ('image', 'video', 'hybrid')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_models IS 'Registry of AI detection models.';


-- =============================================================================
-- 3. INDEXES
-- =============================================================================

-- detections
CREATE INDEX IF NOT EXISTS idx_detections_user_id     ON public.detections(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_created_at  ON public.detections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_detections_verdict     ON public.detections(verdict);
CREATE INDEX IF NOT EXISTS idx_detections_user_date   ON public.detections(user_id, created_at DESC);

-- detection_analytics
CREATE INDEX IF NOT EXISTS idx_detection_analytics_detection_id ON public.detection_analytics(detection_id);

-- user_statistics
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);

-- feedback
CREATE INDEX IF NOT EXISTS idx_feedback_user_id      ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status       ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at   ON public.feedback(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications(user_id, is_read);


-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detection_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models           ENABLE ROW LEVEL SECURITY;


-- ── profiles ─────────────────────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role (backend) can do everything
CREATE POLICY "profiles_service_role_all"
    ON public.profiles FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── detections ───────────────────────────────────────────────────────────────

-- Users can read their own detections
CREATE POLICY "detections_select_own"
    ON public.detections FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own detections
CREATE POLICY "detections_insert_own"
    ON public.detections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own detections
CREATE POLICY "detections_delete_own"
    ON public.detections FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "detections_service_role_all"
    ON public.detections FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── detection_analytics ──────────────────────────────────────────────────────

-- Users can read analytics for their own detections
CREATE POLICY "detection_analytics_select_own"
    ON public.detection_analytics FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.detections d
            WHERE d.id = detection_id AND d.user_id = auth.uid()
        )
    );

-- Service role can do everything
CREATE POLICY "detection_analytics_service_role_all"
    ON public.detection_analytics FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── user_statistics ──────────────────────────────────────────────────────────

-- Users can read their own statistics
CREATE POLICY "user_statistics_select_own"
    ON public.user_statistics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "user_statistics_service_role_all"
    ON public.user_statistics FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── user_settings ────────────────────────────────────────────────────────────

-- Users can read their own settings
CREATE POLICY "user_settings_select_own"
    ON public.user_settings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "user_settings_insert_own"
    ON public.user_settings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "user_settings_update_own"
    ON public.user_settings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "user_settings_service_role_all"
    ON public.user_settings FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── feedback ─────────────────────────────────────────────────────────────────

-- Users can read their own feedback
CREATE POLICY "feedback_select_own"
    ON public.feedback FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "feedback_insert_own"
    ON public.feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (admin operations)
CREATE POLICY "feedback_service_role_all"
    ON public.feedback FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── notifications ────────────────────────────────────────────────────────────

-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "notifications_service_role_all"
    ON public.notifications FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- ── ai_models ────────────────────────────────────────────────────────────────

-- All authenticated users can read models
CREATE POLICY "ai_models_select_authenticated"
    ON public.ai_models FOR SELECT
    TO authenticated
    USING (TRUE);

-- Service role can do everything (admin operations)
CREATE POLICY "ai_models_service_role_all"
    ON public.ai_models FOR ALL
    TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);


-- =============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user
-- Automatically creates a profiles row when a new user signs up via Supabase Auth.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
        'user'
    )
    ON CONFLICT (id) DO UPDATE
        SET email      = EXCLUDED.email,
            full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
            avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
            updated_at = NOW();

    -- Also create default user_statistics row
    INSERT INTO public.user_statistics (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Also create default user_settings row
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------------------------
-- update_user_statistics
-- Keeps user_statistics in sync after every INSERT or DELETE on detections.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Determine which user_id to update
    IF TG_OP = 'DELETE' THEN
        v_user_id := OLD.user_id;
    ELSE
        v_user_id := NEW.user_id;
    END IF;

    -- Recalculate stats from scratch for this user
    INSERT INTO public.user_statistics (
        user_id,
        total_detections,
        authentic_count,
        deepfake_count,
        last_detection_at,
        updated_at
    )
    SELECT
        v_user_id,
        COUNT(*)                                                    AS total_detections,
        COUNT(*) FILTER (WHERE verdict = 'REAL')                    AS authentic_count,
        COUNT(*) FILTER (WHERE verdict = 'FAKE')                    AS deepfake_count,
        MAX(created_at)                                             AS last_detection_at,
        NOW()                                                       AS updated_at
    FROM public.detections
    WHERE user_id = v_user_id
    ON CONFLICT (user_id) DO UPDATE
        SET total_detections  = EXCLUDED.total_detections,
            authentic_count   = EXCLUDED.authentic_count,
            deepfake_count    = EXCLUDED.deepfake_count,
            last_detection_at = EXCLUDED.last_detection_at,
            updated_at        = NOW();

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to detections
DROP TRIGGER IF EXISTS on_detection_change ON public.detections;
CREATE TRIGGER on_detection_change
    AFTER INSERT OR DELETE ON public.detections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_statistics();


-- -----------------------------------------------------------------------------
-- update_updated_at
-- Generic trigger function to keep updated_at columns current.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Attach to tables that have updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_feedback_updated_at ON public.feedback;
CREATE TRIGGER set_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_ai_models_updated_at ON public.ai_models;
CREATE TRIGGER set_ai_models_updated_at
    BEFORE UPDATE ON public.ai_models
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================================
-- 6. SEED DATA
-- =============================================================================

-- Default AI models shown in the admin Model Management panel
INSERT INTO public.ai_models (name, version, description, accuracy, status, model_type)
VALUES
    (
        'DeepVision Hybrid v2',
        '2.0.0',
        'Primary production model. Combines CLIP AI-generated detection (40%), face-swap deepfake detection (40%), and manipulation artifact detection (20%).',
        92.5,
        'active',
        'hybrid'
    ),
    (
        'CLIP Image Detector',
        '1.0.0',
        'OpenAI CLIP-based detector for AI-generated images. Uses openai/clip-vit-base-patch32.',
        88.0,
        'active',
        'image'
    ),
    (
        'MTCNN Face Analyzer',
        '1.0.0',
        'Face-swap deepfake detector using MTCNN face detection and landmark analysis.',
        85.0,
        'active',
        'image'
    ),
    (
        'Video Frame Analyzer',
        '1.0.0',
        'Analyzes video files frame-by-frame for temporal inconsistencies and deepfake artifacts.',
        80.0,
        'active',
        'video'
    )
ON CONFLICT DO NOTHING;


-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after the script to confirm everything was created correctly.
-- =============================================================================

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
      'profiles', 'detections', 'detection_analytics',
      'user_statistics', 'user_settings', 'feedback',
      'notifications', 'ai_models'
  )
ORDER BY table_name;

-- Check triggers exist
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
   OR trigger_schema = 'auth'
ORDER BY trigger_name;

-- Check seed data
SELECT name, version, status FROM public.ai_models ORDER BY name;

-- =============================================================================
-- END OF SCRIPT
-- =============================================================================
