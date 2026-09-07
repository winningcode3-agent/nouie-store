-- ============================================
-- NOUIE Store: Repare rekirsyon RLS (42P17)
-- Migration: 20260907000010_fix_rls_recursion.sql
-- ============================================
--
-- PWOBLÈM: règ "Admins can view admins" sou tab `admins` te fè
--   USING (EXISTS (SELECT 1 FROM public.admins a WHERE a.email = ...))
-- Li tab la pou deside si w gen dwa li tab la → rekirsyon enfini.
--
-- Paske CHAK lòt tab gen yon règ ki fè EXISTS(SELECT 1 FROM admins),
-- rekirsyon an te gaye sou tout baz done a. Rezilta: 42P17 sou tout
-- rekèt, menm sou lekti piblik `products`. Boutik la te desann nèt.
--
-- SOLISYON: yon fonksyon SECURITY DEFINER. Li kouri kòm mèt tab la,
-- donk li kontounen RLS lè li li `admins` — pa gen rekirsyon.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;


-- --------------------------------------------
-- Reekri tout règ ki te fè referans dirèk sou admins
-- --------------------------------------------

-- ADMINS
DROP POLICY IF EXISTS "Admins can view admins"   ON public.admins;
CREATE POLICY "Admins can view admins"   ON public.admins FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
CREATE POLICY "Admins can insert admins" ON public.admins FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
CREATE POLICY "Admins can delete admins" ON public.admins FOR DELETE USING (public.is_admin());

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ORDERS
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT
  USING (customer_email = auth.jwt()->>'email' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders" ON public.orders FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE USING (public.is_admin());

-- NEWSLETTER
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers" ON public.newsletter_subscribers
  FOR SELECT USING (public.is_admin());

-- CONTACT
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages" ON public.contact_messages
  FOR SELECT USING (public.is_admin());

-- STORE SETTINGS
DROP POLICY IF EXISTS "Admins manage settings" ON public.store_settings;
CREATE POLICY "Admins manage settings" ON public.store_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DISCOUNTS
DROP POLICY IF EXISTS "Admins manage discounts" ON public.discounts;
CREATE POLICY "Admins manage discounts" ON public.discounts FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- COLLECTIONS
DROP POLICY IF EXISTS "Admins manage collections" ON public.collections;
CREATE POLICY "Admins manage collections" ON public.collections FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage product collections" ON public.product_collections;
CREATE POLICY "Admins manage product collections" ON public.product_collections FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- PAGES
DROP POLICY IF EXISTS "Admins manage pages" ON public.pages;
CREATE POLICY "Admins manage pages" ON public.pages FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- --------------------------------------------
-- VERIFIKASYON — pwouve eta final la
-- --------------------------------------------

-- (a) Okenn règ pa dwe fè referans dirèk sou tab admins ankò.
--     Rezilta ki atann: ZEWO liy.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (coalesce(qual,'') ILIKE '%from public.admins%'
    OR coalesce(qual,'') ILIKE '%from admins%'
    OR coalesce(with_check,'') ILIKE '%from public.admins%'
    OR coalesce(with_check,'') ILIKE '%from admins%')
ORDER BY tablename, policyname;

-- (b) Lekti piblik yo dwe mache ankò (zewo erè 42P17)
SELECT
  (SELECT count(*) FROM public.products)       AS pwodwi,
  (SELECT count(*) FROM public.collections)    AS koleksyon,
  (SELECT count(*) FROM public.pages)          AS paj,
  (SELECT count(*) FROM public.store_settings) AS settings;
