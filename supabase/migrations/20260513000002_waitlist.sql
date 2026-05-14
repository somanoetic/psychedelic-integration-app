-- 20260513000002_waitlist.sql
-- Waitlist for the Multitudes landing page (multitudesapp.io).
--
-- Captures email signups during the pre-launch window. Anyone (anonymous) can
-- insert; only admins can read. Source/metadata columns let us segment by
-- traffic origin later (landing, instagram_bio, referral, etc.).
--
-- Bot protection lives client-side (honeypot field on the form). If we start
-- seeing junk, add a unique-per-IP check via a small edge function or migrate
-- the form to a service with built-in captcha.

CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'landing',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS waitlist_created_at_idx
    ON public.waitlist (created_at DESC);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can join the waitlist (anonymous + authenticated).
-- The UNIQUE constraint on email handles duplicate signups (returns 409 to client).
CREATE POLICY "anyone can join waitlist"
    ON public.waitlist
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

-- Only admins can read the list (uses unified is_admin() from migration 20260508000001).
CREATE POLICY "admins can read waitlist"
    ON public.waitlist
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

COMMENT ON TABLE public.waitlist IS 'Email signups from the Multitudes landing page (pre-launch waitlist).';
COMMENT ON COLUMN public.waitlist.source IS 'Where the signup came from: landing, instagram_bio, twitter_bio, referral, etc.';
COMMENT ON COLUMN public.waitlist.metadata IS 'Referrer, UTM tags, and other contextual info captured at signup.';
