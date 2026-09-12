-- ============================================
-- NOUIE Store: repare 2 politik ki te rete sou yon imèl kode an di
-- Migration: 20260912000013_fix_admin_policies.sql
-- ============================================
--
-- Migrasyon 0001 te bay aksè admin ak yon imèl kode an di
-- ('admin@nouie.com'). Migrasyon 0003 kreye tab `admins` la epi 0010
-- entwodwi `is_admin()` pou tout politik yo — men de politik te rete
-- dèyè:
--
--   contact_messages        ALL  contact_access
--   newsletter_subscribers  ALL  newsletter_access
--
-- Konsekans: nenpòt administratè Franckley envite (CEO a ladan) ta
-- konekte, wè tout dashboard la, epi jwenn seksyon MESSAGES ak
-- SUBSCRIBERS **vid** — san okenn erè. EXPORT_CSV ta eksporte zewo liy.
--
-- Politik INSERT piblik yo (yon vizitè ki voye yon mesaj oswa ki abòne)
-- rete entak: nou pa touche yo.

-- 1. contact_messages
DROP POLICY IF EXISTS "contact_access" ON public.contact_messages;

CREATE POLICY "Admins manage contact messages"
ON public.contact_messages FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. newsletter_subscribers
DROP POLICY IF EXISTS "newsletter_access" ON public.newsletter_subscribers;

CREATE POLICY "Admins manage newsletter subscribers"
ON public.newsletter_subscribers FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------
-- VERIFIKASYON
-- --------------------------------------------
-- Dwe bay ZEWO liy: okenn politik ekriti ki pa pase pa is_admin() oswa
-- ki pa yon règ piblik eksplisit (`true`).
SELECT tablename, cmd, policyname,
       coalesce(qual::text, with_check::text) AS kondisyon_ki_rete_move
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  AND coalesce(qual::text, with_check::text, '') NOT LIKE '%is_admin%'
  AND coalesce(qual::text, with_check::text, '') <> 'true'
ORDER BY tablename;

-- Dwe bay 2 liy, toude ak is_admin().
SELECT tablename, policyname, coalesce(qual::text, with_check::text) AS kondisyon
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('contact_messages', 'newsletter_subscribers')
  AND cmd = 'ALL'
ORDER BY tablename;
