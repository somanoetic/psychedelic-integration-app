/* Multitudes landing page — waitlist form handler
 *
 * Posts directly to Supabase via PostgREST. The anon key is safe in the client
 * (that's its purpose) — RLS on public.waitlist (migration 20260513000002)
 * controls what anon can do (insert only, no select).
 *
 * Before deploying:
 *   1. Set SUPABASE_URL and SUPABASE_ANON_KEY below (or inject via build step).
 *   2. Apply migration: supabase/migrations/20260513000002_waitlist.sql
 *   3. Verify by submitting a test email and querying as admin.
 */

// ===== CONFIG =====
// TODO: replace with your actual Supabase project URL + anon key before deploy.
// On Vercel, set these as environment variables and inject at build time, or
// just hard-code them — the anon key is public by design.
const SUPABASE_URL = 'https://hxpyeudklnqtwspmdsuz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cHlldWRrbG5xdHdzcG1kc3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNTkyMjEsImV4cCI6MjA3MDkzNTIyMX0.ZnWT3SJFHxhAIXv0PjngUYgVP1nHy3XF2NNCJRYc0N0';

// ===== FORM HANDLING =====
async function submitWaitlist(form) {
    const formData = new FormData(form);
    const email = (formData.get('email') || '').trim();
    const honeypot = formData.get('website');
    const statusEl = form.parentElement.querySelector('.waitlist-status');
    const button = form.querySelector('button[type="submit"]');
    const formId = form.dataset.form || 'unknown';

    // ===== HONEYPOT =====
    // If the hidden 'website' field is filled, silently pretend success.
    // Bots check for visible success indicators, so this fools most.
    if (honeypot) {
        showStatus(statusEl, "Thanks — you're on the list.", 'success');
        form.reset();
        return;
    }

    // ===== BASIC EMAIL VALIDATION =====
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showStatus(statusEl, 'That email looks off — try again?', 'error');
        return;
    }

    // ===== UI: in-flight =====
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Joining…';

    try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                email,
                source: `landing:${formId}`,
                metadata: {
                    referrer: document.referrer || null,
                    utm: window.location.search || null,
                    ua: navigator.userAgent || null,
                    ts: new Date().toISOString(),
                },
            }),
        });

        if (resp.ok) {
            // Inserted.
            showStatus(statusEl, "Thanks — you're on the list. We'll be in touch.", 'success');
            form.reset();
        } else if (resp.status === 409 || resp.status === 23505) {
            // Duplicate email — treat as success from user POV.
            showStatus(statusEl, "You're already on the list — we'll be in touch.", 'success');
            form.reset();
        } else {
            // Check Postgres unique-violation in the body (Supabase returns it as 409 usually,
            // but some setups return 400 with code 23505).
            const body = await resp.text();
            if (body && body.includes('23505')) {
                showStatus(statusEl, "You're already on the list — we'll be in touch.", 'success');
                form.reset();
            } else {
                throw new Error(`HTTP ${resp.status}: ${body}`);
            }
        }
    } catch (err) {
        console.error('[waitlist]', err);
        showStatus(statusEl, 'Something went wrong. Try again in a moment?', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
}

function showStatus(el, message, type) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('success', 'error');
    el.classList.add(type);
}

// ===== WIRE UP =====
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.waitlist-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitWaitlist(form);
        });
    });
});
