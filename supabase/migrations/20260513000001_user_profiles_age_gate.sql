-- 20260513000001_user_profiles_age_gate.sql
-- Created: 2026-05-13
-- Purpose: Capture date-of-birth and ToS acceptance at signup so the app can
--          enforce the 18+ eligibility clause in Terms of Service Section 4
--          (strengthened on 2026-05-12 per legal review) and so we have a
--          defensible record of which ToS version each user accepted.
--
-- Used by: screens/AuthScreen.js (signUpWithEmail), legal/terms-of-service.md
--
-- Scope:
--   - New signups only. Existing accounts (pre-launch test users) are
--     grandfathered with no user_profiles row.
--   - One row per user. Re-acceptance of a new ToS version overwrites
--     tos_version + tos_accepted_at in place. If a full version-history
--     audit is later required, add a separate append-only
--     tos_acceptance_events table — do not widen this one.
--
-- Age enforcement:
--   - Primary gate is client-side in AuthScreen (refuse signup if computed
--     age < 18).
--   - Defense-in-depth: CHECK constraint requires date_of_birth to be at
--     least 18 years before the current date at INSERT/UPDATE time. This
--     blocks API-direct attempts to bypass the UI.
--
-- RLS: users can SELECT/INSERT/UPDATE only their own row. No DELETE policy —
-- account deletion cascades via the auth.users FK.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before
-- CREATE POLICY, etc.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    date_of_birth DATE NOT NULL,
    tos_version TEXT NOT NULL,
    tos_accepted_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT user_profiles_user_unique UNIQUE (user_id),
    CONSTRAINT user_profiles_age_18_plus
        CHECK (date_of_birth <= (current_date - INTERVAL '18 years'))
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id
    ON public.user_profiles(user_id);

-- updated_at maintenance trigger
CREATE OR REPLACE FUNCTION public.user_profiles_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.user_profiles_set_updated_at();

-- Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
CREATE POLICY user_profiles_insert ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
CREATE POLICY user_profiles_update ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_profiles IS
    'Per-user signup-time data: date_of_birth (18+ enforced), tos_version, tos_accepted_at. Added 2026-05-13 alongside the strengthened ToS Section 4 eligibility clause.';

COMMENT ON COLUMN public.user_profiles.date_of_birth IS
    '18+ enforcement: see user_profiles_age_18_plus CHECK constraint.';

COMMENT ON COLUMN public.user_profiles.tos_version IS
    'Most recently accepted ToS version. Source of truth: lib/legal/tosVersion.js.';

-- ============================================================================
-- Auto-populate user_profiles from auth.signUp metadata
-- ============================================================================
-- AuthScreen passes DOB/ToS via supabase.auth.signUp({ options: { data: ... } })
-- which lands in auth.users.raw_user_meta_data. This trigger lifts those
-- fields into the typed user_profiles row at insert time.
--
-- Why a trigger instead of a client-side INSERT after signUp:
--   When email confirmation is required, the JWT session is not active until
--   the user clicks the confirm link, so a client-side INSERT would fail the
--   user_profiles_insert RLS check (auth.uid() is null in that window).
--   Running this trigger under SECURITY DEFINER bypasses RLS and lets us
--   capture DOB + ToS acceptance atomically at signup time.
--
-- The WHEN clause keeps the trigger inert for any auth.users insert that
-- did NOT come from our signup flow (e.g. admin invites), so this is
-- safe to ship even if other code paths create auth users.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        user_id,
        date_of_birth,
        tos_version,
        tos_accepted_at
    )
    VALUES (
        NEW.id,
        (NEW.raw_user_meta_data ->> 'date_of_birth')::date,
        NEW.raw_user_meta_data ->> 'tos_version',
        COALESCE(
            (NEW.raw_user_meta_data ->> 'tos_accepted_at')::timestamptz,
            now()
        )
    )
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_user_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    WHEN (
        NEW.raw_user_meta_data ? 'date_of_birth'
        AND NEW.raw_user_meta_data ? 'tos_version'
    )
    EXECUTE FUNCTION public.handle_new_user_profile();

COMMIT;
