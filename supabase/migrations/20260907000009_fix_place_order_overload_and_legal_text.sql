-- ============================================
-- NOUIE Store: Repare de pwoblèm apre odit Faz 2
-- Migration: 20260907000009_fix_place_order_overload_and_legal_text.sql
-- ============================================

-- --------------------------------------------
-- 1. TWOU SEKIRITE — ansyen place_order toujou vivan
-- --------------------------------------------
-- Migrasyon 0006 te sèvi `CREATE OR REPLACE FUNCTION` ak yon siyati ki gen
-- 8 agiman. Men ansyen fonksyon an gen 7. Yon siyati diferan pa ranplase
-- anyen nan PostgreSQL — li kreye yon DEZYÈM fonksyon (overload).
--
-- Rezilta: de fonksyon vivan, tou de ak GRANT sou `anon`:
--   v1 (7 agiman) → tarif kode an di $10/$25/$250 · ZEWO taks · ZEWO rabè
--   v2 (8 agiman) → li store_settings · taks · rabè
--
-- PostgREST chwazi selon non paramèt yo. Nenpòt moun ki rele san
-- `p_discount_code` frape v1 epi pa peye taks ditou.

DROP FUNCTION IF EXISTS public.place_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);


-- --------------------------------------------
-- 2. TÈKS LEGAL — retabli kloz ki te disparèt yo
-- --------------------------------------------
-- Migrasyon 0008 te REKRI 4 paj yo olye li TRANSPOZE tèks ki te deplwaye a.
-- Kloz sa yo te disparèt san pèsonn deside:
--   · kredi magazen te vin ranbousman kach sou kat la
--   · « initial shipping costs are non-refundable » — disparèt
--   · « customers are responsible for return shipping costs » — disparèt
--   · eksklizyon FINAL SALE / archive releases — disparèt
--   · tarif livrezon yo te retire nan politik la
--   · kloz cookies / IP / aparèy nan Privacy — disparèt
--
-- Tèks anba a se transpozisyon fidèl vèsyon ki nan commit a9c6393 ak a2e05a6.
-- Seksyon yo sèvi `##` paske tit la deja rann kòm <h1> apa.

UPDATE public.pages SET title = 'SHIPPING POLICY', updated_at = NOW(), body = $md$
## ORDER PROCESSING

All orders are processed within 2-4 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.

Please note that during high-volume periods or new releases, processing times may be slightly extended.

## DOMESTIC SHIPPING (USA)

- **STANDARD** — 5-7 business days — $10.00
- **EXPRESS** — 2-3 business days — $25.00

Free standard shipping on domestic orders over $250.00.

## INTERNATIONAL SHIPPING

We ship worldwide. Shipping charges for your order will be calculated and displayed at checkout.

- **CANADA** — 7-14 business days — calculated at checkout
- **EUROPE / ASIA** — 10-21 business days — calculated at checkout

**Customs, duties, and taxes:** NOUIE is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer.

## TRACKING YOUR ORDER

When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 48 hours for the tracking information to become available.

If you have not received your order within 14 days of receiving your shipping confirmation email, please contact our support desk with your name and order number, and we will look into it for you.
$md$ WHERE slug = 'shipping';


UPDATE public.pages SET title = 'RETURNS & EXCHANGES', updated_at = NOW(), body = $md$
## RETURN POLICY

We want you to be completely satisfied with your purchase. If you are not satisfied, you may return your item(s) within 14 days of delivery for an **exchange or store credit**.

All returns must be in their original condition — unworn, unwashed, and with all tags attached. Items that do not meet these criteria will be denied.

## EXCHANGES

We only offer exchanges for different sizes of the same item, subject to availability. If the desired size is out of stock, **a store credit will be issued**.

## RETURN PROCESS

To initiate a return, please follow these steps:

- Contact our support desk with your order reference number and reason for return.
- Once approved, you will receive a return authorization number and the return shipping address.
- Pack your item(s) securely and include the return authorization number inside the package.
- Ship the package using a trackable shipping method.

**Customers are responsible for return shipping costs** unless the item received was damaged or incorrect.

## REFUNDS & STORE CREDIT

Once your return is received and inspected, we will notify you of the approval or rejection of your return.

If approved, **a store credit will be issued in the form of a digital gift card within 5-7 business days**. Please note that **initial shipping costs are non-refundable**.

## FINAL SALE ITEMS

Items marked as **"FINAL SALE"** or purchased during archive releases are **not eligible for return or exchange**. Please review product descriptions carefully before purchasing.
$md$ WHERE slug = 'returns';


UPDATE public.pages SET title = 'PRIVACY POLICY', updated_at = NOW(), body = $md$
## OVERVIEW

This privacy policy describes how your personal information is collected, used, and shared when you visit or make a purchase from NOUIE. We are committed to protecting your privacy and ensuring a secure shopping experience.

## INFORMATION WE COLLECT

When you visit the site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.

Additionally, when you make a purchase or attempt to make a purchase through the site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number.

## HOW DO WE USE YOUR PERSONAL INFORMATION?

We use the order information that we collect generally to fulfill any orders placed through the site — including processing your payment information, arranging for shipping, and providing you with invoices and order confirmations.

Additionally, we use this order information to:

- Communicate with you;
- Screen our orders for potential risk or fraud; and
- Provide you with information or advertising relating to our products or services.

## SECURITY

We employ industry-standard encryption and security protocols to safeguard your personal data. We do not store full payment card numbers on our systems.

## DATA RETENTION

When you place an order through the site, we will maintain your order information for our records unless and until you ask us to delete this information.

## CHANGES

We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.

## CONTACT US

For more information about our privacy practices, or if you would like to make a request, please contact our support desk.
$md$ WHERE slug = 'privacy';


UPDATE public.pages SET title = 'TERMS OF SERVICE', updated_at = NOW(), body = $md$
## OVERVIEW

This website is operated by NOUIE. Throughout the site, the terms "we", "us" and "our" refer to NOUIE. NOUIE offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.

## ONLINE STORE TERMS

By agreeing to these terms of service, you represent that you are at least the age of majority in your jurisdiction. You may not use our products for any illegal or unauthorized purpose, nor may you, in the use of the service, violate any laws in your jurisdiction.

## MODIFICATIONS TO SERVICE AND PRICES

Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the service, or any part or content thereof, without notice.

## PRODUCTS AND INVENTORY

Certain products may be available exclusively online in limited quantities and are subject to return or exchange only according to our return policy. We reserve the right to limit the quantities of any products or services that we offer.

## ACCURACY OF BILLING AND ORDERS

We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we will attempt to notify you by contacting the email and/or billing address and phone number provided at the time the order was made.

## INTELLECTUAL PROPERTY

All content, graphics, industrial designs, logos, and product imagery are the exclusive property of NOUIE and protected by copyright and trademark laws.

## GOVERNING LAW

These terms of service and any separate agreements whereby we provide you products shall be governed by and construed in accordance with applicable laws.
$md$ WHERE slug = 'terms';


-- --------------------------------------------
-- 3. VERIFIKASYON — pwouve eta final la, pa sipoze l
-- --------------------------------------------
-- (a) Yon sèl place_order dwe rete, ak 8 agiman
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS agiman
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'place_order';

-- (b) Kloz ki te disparèt yo dwe tounen
SELECT slug,
       length(body) AS longè,
       body ILIKE '%store credit%'                   AS gen_kredi_magazen,
       body ILIKE '%non-refundable%'                 AS gen_livrezon_pa_ranbousab,
       body ILIKE '%responsible for return shipping%' AS gen_kiyes_ki_peye_retou,
       body ILIKE '%FINAL SALE%'                     AS gen_eksklizyon_final_sale
FROM public.pages WHERE slug = 'returns';
