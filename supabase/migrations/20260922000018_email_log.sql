-- Jounal imèl boutik la voye (Hostinger SMTP, support@no-uie.com).
-- 1. Pwouve sa ki pati: Franckley wè nan panèl la si kliyan an resevwa
--    konfimasyon/tracking/repons lan, oswa poukisa li echwe.
-- 2. Anpeche doub: Stripe ka voye menm webhook la plizyè fwa — yon sèl
--    konfimasyon otomatik pa kòmand (endèks inik pi ba). Yon echèk pa bloke
--    yon dezyèm esè.
-- Ekriti: sèlman Edge Functions yo (service role). Admin li sèlman.

CREATE TABLE IF NOT EXISTS public.email_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('order_confirmation', 'shipped', 'reply')),
  auto boolean NOT NULL DEFAULT false,
  order_id bigint REFERENCES public.orders(id) ON DELETE SET NULL,
  message_id bigint REFERENCES public.contact_messages(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  body text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS email_log_one_auto_confirmation
  ON public.email_log (order_id)
  WHERE kind = 'order_confirmation' AND auto AND status <> 'failed';

CREATE INDEX IF NOT EXISTS email_log_order_idx ON public.email_log (order_id);
CREATE INDEX IF NOT EXISTS email_log_message_idx ON public.email_log (message_id);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read email log" ON public.email_log;
CREATE POLICY "Admins read email log" ON public.email_log
  FOR SELECT USING (public.is_admin());
