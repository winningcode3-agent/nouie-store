-- ============================================
-- NOUIE Store: Admins Management & Dynamic RLS
-- Migration: 20260907000003_admins_table.sql
-- ============================================

-- 1. Kreye tab admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Gad pou anpeche efase dènye admin nan
CREATE OR REPLACE FUNCTION public.prevent_delete_last_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT count(*) FROM public.admins) <= 1 THEN
    RAISE EXCEPTION 'ENPOSIB_EFASE_DENYE_ADMIN: Omwen yon admin dwe rete nan sistèm nan.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_delete_last_admin ON public.admins;
CREATE TRIGGER trg_prevent_delete_last_admin
BEFORE DELETE ON public.admins
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_last_admin();

-- 3. Inisyalize admin@nouie.com
INSERT INTO public.admins (email)
VALUES ('admin@nouie.com')
ON CONFLICT (email) DO NOTHING;

-- 4. RLS sou tab admins (Piblik pa ka li, sèl admin ki ka li ak jere)
DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
CREATE POLICY "Admins can view admins"
ON public.admins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.email = auth.jwt()->>'email'
  )
);

DROP POLICY IF EXISTS "Admins can insert admins" ON public.admins;
CREATE POLICY "Admins can insert admins"
ON public.admins FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.email = auth.jwt()->>'email'
  )
);

DROP POLICY IF EXISTS "Admins can delete admins" ON public.admins;
CREATE POLICY "Admins can delete admins"
ON public.admins FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.email = auth.jwt()->>'email'
  )
);

-- 5. Mete ajou RLS sou lòt tab yo pou itilize tab admins olye imèl fiks
-- A. PRODUCTS
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email'
  )
);

-- B. ORDERS
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
ON public.orders FOR SELECT
USING (
  customer_email = auth.jwt()->>'email'
  OR EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
);

DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
CREATE POLICY "Admins can manage orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
);

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
);

-- C. NEWSLETTER SUBSCRIBERS
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
);

-- D. CONTACT MESSAGES
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email')
);

-- 6. Verifikasyon eta final la
SELECT id, email, added_at FROM public.admins;
