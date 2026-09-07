-- ============================================
-- NOUIE Store: Legal Pages Content & Markdown Storage
-- Migration: 20260907000008_pages_content.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read pages" ON public.pages;
CREATE POLICY "Public can read pages"
ON public.pages FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage pages" ON public.pages;
CREATE POLICY "Admins manage pages"
ON public.pages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  )
);

-- Seed 4 paj legal yo an Markdown pwòp
INSERT INTO public.pages (slug, title, body) VALUES
('shipping', 'SHIPPING POLICY', '# ORDER PROCESSING
All orders are processed within 2-4 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.

Please note that during high-volume periods or new releases, processing times may be slightly extended.

# DOMESTIC SHIPPING (USA)
We offer standard and express shipping options across the United States.

- **STANDARD (5-7 business days)**: Calculated according to store settings. Free shipping on qualifying orders over threshold.
- **EXPRESS (2-3 business days)**: Priority express handling.

# INTERNATIONAL SHIPPING
We ship worldwide. Shipping charges for your order will be calculated and displayed at checkout.

- **CANADA**: 7-14 business days
- **EUROPE / ASIA**: 10-21 business days

**Customs, Duties, and Taxes:** NOUIE is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer.

# TRACKING YOUR ORDER
When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available.'),

('returns', 'RETURNS & EXCHANGES', '# RETURN POLICY
All sales are subject to strict quality control. If you are not completely satisfied with your purchase, you may request a return or exchange within 14 days of delivery.

Items must be unworn, unwashed, with all original tags attached and in original packaging.

# RETURN PROCESS
1. Contact our support desk with your order reference number and reason for return.
2. Securely package the unit with all documentation included.
3. Drop off package at the designated carrier location.

# REFUNDS
Once your return is received and inspected, we will notify you of the approval or rejection of your refund. Approved refunds will be processed to the original payment method within 5-10 business days.'),

('privacy', 'PRIVACY POLICY', '# PRIVACY POLICY
NOUIE values and respects the privacy of our customers. This privacy notice outlines how your personal information is collected, used, and shared when you visit or make a purchase from our store.

# INFORMATION WE COLLECT
When you place an order, we collect certain details including your name, billing address, shipping address, email address, and phone number to fulfill and deliver your transaction.

# USE OF INFORMATION
We use your information strictly to:
- Process and ship orders.
- Communicate with you regarding order status or customer care inquiries.
- Screen orders for potential risk or fraudulent activity.

# SECURITY
We employ industry-standard encryption and security protocols to safeguard your personal data. We do not store full payment card numbers on our local systems.'),

('terms', 'TERMS OF SERVICE', '# TERMS OF SERVICE
By visiting our site and/or purchasing from NOUIE, you engage in our service and agree to be bound by the following terms and conditions.

# GENERAL CONDITIONS
We reserve the right to refuse service to anyone for any reason at any time. Prices for our products are subject to change without notice.

# ACCURACY OF BILLING & ACCOUNT INFO
You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.

# INTELLECTUAL PROPERTY
All graphics, designs, logos, product names, and content appearing on this site are the exclusive property of NOUIE.')

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  updated_at = NOW();

-- Verifikasyon
SELECT slug, title, length(body) as body_length FROM public.pages;
