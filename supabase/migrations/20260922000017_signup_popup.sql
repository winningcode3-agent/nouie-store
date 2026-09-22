-- Fenèt « GET 10% OFF » (22 sept 2026).
-- 1. newsletter_subscribers resevwa non + dat fèt + sous (footer / popup).
-- 2. Nenpòt vizitè ka ekri nan tab sa a (politik INSERT anon), donk baz la
--    li menm refize done ki pa sanble yon imèl, non ki twò long, elatriye.
-- 3. Reglaj `popup` la + kòd WELCOME10 (10%) — Franckley ka chanje tout
--    nan admin (STORE_CONFIGURATION + DISCOUNTS).
-- Idanpotan: IF NOT EXISTS / ON CONFLICT DO NOTHING.

ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS birthday text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'footer';

ALTER TABLE public.newsletter_subscribers
  DROP CONSTRAINT IF EXISTS newsletter_email_valid,
  DROP CONSTRAINT IF EXISTS newsletter_first_name_len,
  DROP CONSTRAINT IF EXISTS newsletter_birthday_fmt,
  DROP CONSTRAINT IF EXISTS newsletter_source_valid;

ALTER TABLE public.newsletter_subscribers
  ADD CONSTRAINT newsletter_email_valid CHECK (
    length(email) <= 254
    AND email ~ '^[^[:space:]@<>"]+@[^[:space:]@<>"]+\.[^[:space:]@<>"]+$'
  ),
  ADD CONSTRAINT newsletter_first_name_len CHECK (
    first_name IS NULL OR length(first_name) <= 60
  ),
  ADD CONSTRAINT newsletter_birthday_fmt CHECK (
    birthday IS NULL
    OR birthday ~ '^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])$'
  ),
  ADD CONSTRAINT newsletter_source_valid CHECK (
    source IN ('footer', 'popup')
  );

INSERT INTO public.store_settings (key, value)
VALUES ('popup', jsonb_build_object(
  'enabled', true,
  'title', 'GET 10% OFF',
  'text', 'Save on your first order and get email-only offers when you join.',
  'button', 'CONTINUE',
  'success_title', 'WELCOME TO NOUIE',
  'success_text', 'Use this code at checkout:',
  'code', 'WELCOME10',
  'delay_seconds', 6
))
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.discounts (code, type, value, active)
SELECT 'WELCOME10', 'percentage', 10, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.discounts WHERE upper(code) = 'WELCOME10'
);
