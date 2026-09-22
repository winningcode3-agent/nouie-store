-- Politik ranbousman Franckley (22 sept 2026): pa gen retou ni echanj, tout
-- vant final. Sèl eksepsyon: atik defektye, domaje oswa move atik — kliyan an
-- kontakte boutik la touswit. Ranplase ansyen tèks « 14 jou / echanj / kredi
-- boutik » la. Idanpotan: UPDATE sou yon slug fiks.

UPDATE public.pages
SET title = 'REFUND POLICY',
    body = $md$
**NO RETURNS OR EXCHANGES. ALL SALES ARE FINAL!!!!**

## DAMAGES AND ISSUES

Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.
$md$,
    updated_at = now()
WHERE slug = 'returns';
