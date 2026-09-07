# NOUIE — Plan Final Faz 3 : Peman Stripe + Lansman `no-uie.com`
> Genie · 7 septanm 2026 · Sòti nan deba Ekip #1 (Claude, odit) × Ekip #2 (Antigravity, egzekisyon)
> Tout fè ki site la yo verifye dirèkteman sou kòd la, DNS la, Vercel ak CLI Supabase — pa depi memwa.
> **Ekip #2 egzekite. Ekip #1 verifye chak etap ak prèv (SELECT, curl, screenshot).**

---

## 0. Objektif ak kondisyon

**Objektif**: Franckley resevwa yon boutik ki aksepte kòmand + peman kat ak menm nivo sekirite ak yon boutik Shopify — sèvè a kontwole montan yo, peman konfime sèlman pa Stripe, estòk pa janm bloke pou tout tan, okenn kòmand pa livre san peye.

**Sa ki dwe nan men Ekip #2 anvan kòmanse** (san sa, pa kòmanse):
| Bagay | Ki moun | Nòt |
|---|---|---|
| Aksè Supabase pwojè `inlldqstsfuvjglfrdhk` (access token) | Franckley oswa Jackpot | Kont Jackpot aktyèl la **pa gen privilèj** sou pwojè sa a (verifye 7 sept: `supabase link` → *"does not have the necessary privileges"*) |
| Kont Stripe **nan non Franckley** (kle test `sk_test_` + kle live `sk_live_`) | Franckley | Payout yo ale nan kont bank Franckley — pa kont Winning Code |
| Aksè panèl Hostinger (DNS Zone Editor `no-uie.com`) | Franckley / Jackpot | Registrar = Hostinger (WHOIS), NS = `*.dns-parking.com` |
| Aksè Vercel team `winning-codes-projects` | Jackpot | Pwojè `nouie-store`, `no-uie.com` **poko ajoute** (0/6 domèn team nan) |

**Règ ki pa negosyab**
- Peman = **Stripe sèlman**. MonCash rezève Zoetwal.
- `git push origin main` = aksyon piblik → **Jackpot bay OK eksplisit anvan**.
- `.env`, kle Stripe, service_role: **jamè nan repo a**. Kle yo viv sèlman nan Supabase Secrets.
- Chak migrasyon SQL fini ak yon SELECT ki pwouve l (leson Faz 2).

---

## 1. Desizyon ki fèmen nan deba a (pa relouvri)

| # | Desizyon | Rezon |
|---|---|---|
| D1 | **Stripe Checkout Hosted** (redireksyon sou paj Stripe) | Zewo PCI/SCA sou nou, 3DS otomatik, zewo Stripe.js nan bundle kliyan an |
| D2 | `place_order()` **kenbe dediksyon estòk imedyat** | Drops limite → evite overselling (2 moun peye dènye M lan) |
| D3 | Sesyon Stripe **`expires_at = +30 min`** (minimòm Stripe) | Estòk abandone libere vit |
| D4 | `pending` → `paid` **sèlman via webhook** `checkout.session.completed` | Front-end pa janm deside yon kòmand peye |
| D5 | `checkout.session.expired` → remèt estòk (`cancelled`) | + yon filè sekirite pg_cron (seksyon 2) |
| D6 | DNS **dirèk nan Hostinger** (`@` A → `76.76.21.21`, `www` CNAME → `cname.vercel-dns.com`) | Pa bezwen migre NS sou Cloudflare jodi a |
| D7 | Migrasyon `0001`→`0011` = sèl sous verite ; `nouie_supabase_setup.sql` + `nouie_fix_rls_policies.sql` efase anvan push | Repo pwòp |
| D8 | **Yon sèl apèl depi front-end** : `create-checkout-session` fè `place_order` **li menm** bò sèvè | Si kreyasyon sesyon Stripe la echwe apre `place_order`, sèvè a libere estòk la tousuit — okenn kòmand òfelen ak estòk bloke (twou ki te nan flow 2-apèl la) |

> D8 se sèl rafineman apre deba a. Li pa chanje achitekti a (menm 2 fonksyon, menm estati), li deplase sèlman kote `place_order` rele.

---

## 2. Baz done — migrasyon `20260907000012_stripe_payment.sql`

**2.1 Verifye anvan ekri** (rezilta antre nan PR/rapò a):
```sql
SELECT DISTINCT status FROM public.orders;                              -- pou CHECK la pa kase ansyen ranje
SELECT p.proname, pg_get_function_identity_arguments(p.oid)
FROM pg_proc p WHERE proname = 'place_order';                             -- dwe: 1 liy, 8 agiman
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public';   -- tout dwe = true
```

**2.2 Kontni migrasyon an**
1. **Estati otorize** :
   `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending','paid','payment_review','processing','shipped','delivered','cancelled'));`
   (`payment_review` = webhook resevwa yon peman ki pa matche montan an — admin dwe gade.)
2. **Fonksyon entèn `_restock_order(p_order_id bigint) RETURNS boolean`** — SECURITY DEFINER, `REVOKE ALL ... FROM PUBLIC, anon, authenticated`. Li pran lojik restock ki nan `cancel_order` jodi a (lock `FOR UPDATE`, si `cancelled` → `false`, remèt `stock_by_size` + `stock_qty`, mete `cancelled`, → `true`).
3. **`cancel_order(bigint)` re-ekri** : gad la vin
   `IF auth.role() <> 'service_role' AND NOT EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt()->>'email') THEN RAISE 'AKSE_REFIZE'`
   epi kò a = `PERFORM _restock_order(p_order_id)`. `GRANT EXECUTE ... TO authenticated, service_role`.
4. **`release_stale_orders() RETURNS int`** — SECURITY DEFINER : bouk sou `orders WHERE status='pending' AND paid_at IS NULL AND created_at < now() - interval '45 minutes'` → `_restock_order(id)`. Retounen konbyen libere. Pa gen GRANT pou anon/authenticated.
5. **pg_cron** (aktive ekstansyon an nan Dashboard → Database → Extensions si `CREATE EXTENSION` refize) :
   `SELECT cron.schedule('nouie-release-stale-orders', '*/10 * * * *', $$SELECT public.release_stale_orders()$$);`
6. **Verifikasyon final nan pye migrasyon an** :
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('_restock_order','cancel_order','release_stale_orders'); -- 3 liy
   SELECT jobname, schedule FROM cron.job WHERE jobname='nouie-release-stale-orders';                   -- 1 liy
   SELECT conname FROM pg_constraint WHERE conname='orders_status_check';                                -- 1 liy
   ```

**Poukisa 3 fonksyon**: pg_cron pa gen JWT (`auth.role()` = NULL) → li pa ka pase gad `cancel_order`. Lojik restock la dwe viv yon sèl kote, san gad, e pa aksesib depi API a.

---

## 3. Edge Functions (`supabase/functions/`)

Toude : `import Stripe from "npm:stripe@17"`, `createClient` ak `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Supabase enjekte yo otomatikman nan Edge Functions). Sekrè nou mete : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`.

### 3.1 `create-checkout-session` (rele pa front-end ak kle anon — `verify_jwt` rete ON)
Antre `POST` : menm payload `place_order` la jodi a (`p_customer_name … p_discount_code`) + `previous_order_id?: number`.
```
OPTIONS → 200 ak CORS (Access-Control-Allow-Origin = SITE_URL sèlman)
1. si previous_order_id : li kòmand lan ; si status='pending' → cancel_order(id) ;
   si li gen stripe_session_id → stripe.checkout.sessions.expire(sid) (inyore erè "already expired")
2. rpc place_order(payload) → order_id        (erè PL/pgSQL yo pase jan yo ye : PANYEN_VID, ESTOK_ENSIFIZAN…)
3. SELECT id,total,items,customer_email FROM orders WHERE id=order_id   ← MONTAN SOTI NAN DB, JAMÈ NAN KLIYAN
4. stripe.checkout.sessions.create({
     mode:'payment', payment_method_types:['card'],
     customer_email, client_reference_id:String(order_id), metadata:{order_id},
     line_items:[{ quantity:1, price_data:{ currency:'usd',
        unit_amount: Math.round(Number(total)*100),
        product_data:{ name:`NOUIE — Order #${order_id}`, description: rezime atik yo (non × kantite × gwosè) } } }],
     expires_at: Math.floor(Date.now()/1000) + 30*60,
     success_url:`${SITE_URL}/#order/success`, cancel_url:`${SITE_URL}/#order/cancel` })
5. UPDATE orders SET stripe_session_id=session.id WHERE id=order_id
   si 4 oswa 5 echwe → cancel_order(order_id) + retounen 502 { error }
6. → 200 { url: session.url, order_id }
```

### 3.2 `stripe-webhook` (rele pa Stripe — deplwaye ak `--no-verify-jwt`)
```
raw = await req.text()   ← kò brit, PA req.json()
event = await stripe.webhooks.constructEventAsync(raw, req.headers.get('stripe-signature'),
          STRIPE_WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider())
  → echèk siyati = 400, fini.
checkout.session.completed :
  order = SELECT … WHERE id = client_reference_id
  si order.status <> 'pending' → 200 (deja trete / idempotan)
  si payment_status <> 'paid' OR currency <> 'usd' OR amount_total <> round(total*100)
     → UPDATE status='payment_review', stripe_session_id ; console.error ; 200
  sinon → UPDATE status='paid', paid_at=now(), stripe_session_id WHERE id AND status='pending'
checkout.session.expired :
  si order.status='pending' → rpc cancel_order(order_id)   (DEJA_ANILE = OK)
lòt evènman → 200 inyore
erè DB → 500 (Stripe ap reeseye)
```

---

## 4. Front-end (`src/`)

| Fichye | Chanjman |
|---|---|
| `components/Pages.ts` (≈976-1011) | Ranplase `supabase.rpc('place_order', payload)` ak `supabase.functions.invoke('create-checkout-session', { body: {...payload, previous_order_id} })`. Mapping erè yo (`PANYEN_VID`, `ESTOK_ENSIFIZAN`…) rete jan l ye. Siksè → `sessionStorage.setItem('nouie_pending_order', order_id)` → `window.location.href = data.url`. **PA vide panyen an anvan redireksyon.** |
| `main.ts` + `Pages.ts` router | 2 nouvo `case` : `order/success` (vide panyen, li `nouie_pending_order`, rele `showOrderSuccess(id)`, efase kle a) · `order/cancel` (mesaj « peman anile — panyen ou toujou la », bouton → `#checkout` ; kenbe `nouie_pending_order` pou pwochen tantativ pase `previous_order_id`). Router a jodi a pa gen okenn nan 2 wout sa yo. |
| `components/AdminDashboard.ts` (≈196) | Ajoute `PAID` + `PAYMENT REVIEW` nan `<select>` estati a. Badj koulè : `pending` gri · `paid` vèt · `payment_review` wouj. **Bloke** chanjman → `processing/shipped/delivered` si estati aktyèl la se `pending` (mesaj : « PA LIVRE — KÒMAND SA A PA PEYE »). Filtè defo = tout, men `paid` an premye. |
| `lib/types.ts` | `status` vin inyon literal 7 valè yo. |
| `vercel.json` (nouvo) | Antèt sekirite (seksyon 5). |

---

## 5. Sekirite nivo Shopify — checklist

- [ ] **Montan** : sèl sous = `orders.total` nan DB ; webhook re-verifye `amount_total` + `currency`.
- [ ] **Siyati webhook** obligatwa ; kò brit ; 400 si envalid.
- [ ] **Idempotans** : `stripe_session_id UNIQUE` (deja) + `WHERE status='pending'` sou chak tranzisyon.
- [ ] **Estòk** : 3 chemen liberasyon (echèk sesyon → imedyat · `expired` → webhook · 45 min → pg_cron).
- [ ] **CORS** `create-checkout-session` = `SITE_URL` sèlman.
- [ ] **RLS** : `pg_tables.rowsecurity = true` pou tout tab ; `curl "$SUPABASE_URL/rest/v1/orders?select=id" -H "apikey: $ANON"` → `[]`.
- [ ] **`_restock_order`** pa ka rele depi API a (REVOKE) ; `release_stale_orders` non plis.
- [ ] **Antèt** `vercel.json` sou `/(.*)` : `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` · `X-Content-Type-Options: nosniff` · `X-Frame-Options: DENY` · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: camera=(), microphone=(), geolocation=()`. (CSP strik = Faz 4, li mande odit inline script Vite yo.)
- [ ] **Stripe Dashboard** : Radar (defo) ON · Settings → Emails → « Successful payments » ON (resi otomatik, zewo kòd) · Statement descriptor `NOUIE` · Business name + support email Franckley.
- [ ] **Sekrè** : `supabase secrets list` montre 3 kle ; `git grep -i "sk_live\|sk_test\|whsec_"` → vid.
- [ ] **Admin** : pa gen wout pou livre yon kòmand `pending`.

---

## 6. Sekans egzekisyon (òdone, ak komand)

**Faz A — Mòd TEST (kle `sk_test_`)**
1. `supabase login` (kont ki gen aksè) → `supabase link --project-ref inlldqstsfuvjglfrdhk`.
2. Aplike migrasyon `0012` nan SQL Editor (kanal ki etabli a) → kole rezilta 3 SELECT verifikasyon yo nan rapò a.
3. `supabase secrets set STRIPE_SECRET_KEY=sk_test_… SITE_URL=http://localhost:5173`
4. Ekri + deplwaye : `supabase functions deploy create-checkout-session` · `supabase functions deploy stripe-webhook --no-verify-jwt`
5. Front-end (seksyon 4) + `vercel.json`. `npm run build` dwe pase (`tsc && vite build`, 0 erè).
6. Stripe Dashboard (**mòd test**) → Developers → Webhooks → endpoint `https://inlldqstsfuvjglfrdhk.supabase.co/functions/v1/stripe-webhook`, evènman `checkout.session.completed` + `checkout.session.expired` → kopye `whsec_…`
7. `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_test…` (pa bezwen redeplwaye — verifye ak yon tès).
8. Kouri tès seksyon 7 lokalman (`npm run dev`, lejè sou Mac la).

**Faz B — DNS (an paralèl, kòmanse depi jou 1)**
9. Vercel : `vercel domains add no-uie.com nouie-store` + `www.no-uie.com` → kopye valè egzat Vercel afiche a (konfime `76.76.21.21` / `cname.vercel-dns.com`).
10. Hostinger DNS Zone Editor : efase A parking (`2.57.91.91`), mete `@` A → IP Vercel, `www` CNAME → `cname.vercel-dns.com`. Verifye : `dig +short no-uie.com A` → IP Vercel ; sètifika « Valid » nan Vercel.

**Faz C — LIVE**
11. `git rm supabase/nouie_supabase_setup.sql supabase/nouie_fix_rls_policies.sql` ; deside `supabase/seed/` (kenbe si se katalòg inisyal, sinon efase). Commit.
12. **Jackpot bay OK** → `git push origin main` → swiv build Vercel jiska « Ready » (pa sipoze siksè depi push la).
13. Kle live : `supabase secrets set STRIPE_SECRET_KEY=sk_live_… SITE_URL=https://no-uie.com` ; endpoint webhook **mòd live** (nouvo `whsec_`) → `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live…`
14. Smoke test live : Franckley achte yon atik reyèl → `paid` nan admin → ranbouse nan Stripe.
15. Franckley : pwodwi, `store_settings`, paj legal, bank nan Stripe.

---

## 7. Tès akseptasyon (tout dwe vèt anvan Faz C)

| # | Senaryo | Prèv atann |
|---|---|---|
| T1 | Kat `4242 4242 4242 4242` | `status='paid'`, `paid_at` ranpli, `stripe_session_id` ranpli, estòk desann **yon sèl fwa**, panyen vid sou `#order/success` |
| T2 | Kat refize `4000 0000 0000 9995` | kòmand rete `pending` ; kliyan ka reeseye sou menm sesyon |
| T3 | Klike « Back » sou Stripe → `#order/cancel` → rekòmanse checkout | ansyen kòmand `cancelled` + estòk remèt, nouvo kòmand `pending` → `paid` ; **dènye inite** yon atik pase (pa `ESTOK_ENSIFIZAN`) |
| T4 | Abandone 31 min (oswa `stripe.checkout.sessions.expire` nan Dashboard) | `cancelled`, estòk remèt |
| T5 | Kòmand `pending` 46 min san sesyon (simile : `UPDATE created_at`) → `SELECT release_stale_orders()` | retounen 1, kòmand `cancelled` |
| T6 | Dashboard Stripe → « Resend » evènman `completed` | zewo dezyèm efè (status deja `paid`, estòk pa bouje) |
| T7 | `curl -X POST …/stripe-webhook -d '{}'` san siyati | `400` |
| T8 | Modifye `orders.total` apre kreyasyon sesyon, konplete peman | `payment_review`, PA `paid`, admin wè badj wouj |
| T9 | `curl -I https://no-uie.com` | 5 antèt sekirite prezan, `HTTP/2 200`, sètifika valid |
| T10 | Anon `GET /rest/v1/orders` | `[]` |
| T11 | Admin eseye `pending` → `shipped` | bloke ak mesaj |

---

## 8. Remiz bay Franckley ak fwontyè responsablite

**Franckley resevwa** : boutik anliy sou `no-uie.com`, panèl admin otonòm (pwodwi · estòk · pri · rabè · taks · livrezon · paj legal), peman kat via Stripe nan pwòp kont li, resi otomatik pou kliyan, kòmand ki make `PAID` sèlman lè lajan an rantre.

**Winning Code rete responsab** : disponiblite sit la, sekirite, pèfòmans, bug. **Pa** kontni, pri, konfigirasyon, ni sipò kliyan final.

**Dokiman pou Franckley (1 paj, Ekip #2 ekri l apre T1-T11 vèt)** : kijan li wè kòmand yo, ki sa `PAID` / `PAYMENT REVIEW` / `PENDING` vle di, kijan li anile + ranbouse (anile nan admin **epi** ranbouse nan Stripe), kijan li chanje livrezon/taks.

---

## 9. Estimasyon
Ekip #2 : migrasyon 1h · 2 Edge Functions 2h · front-end + admin 1.5h · tès T1-T11 1.5h → **~6h**. DNS pwopagasyon an paralèl. Ekip #1 verifye ak prèv apre chak faz.
