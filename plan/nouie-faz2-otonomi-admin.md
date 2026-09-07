# NOUIE — Faz 2 : Otonomi Admin
> Spèk pou ekip dev #2 · 7 septanm 2026 · Swit `nouie-spek-ekip-dev.md` (Faz 1)

**Objektif**: apre livrezon, Winning Code responsab **sante sit la** — disponibilite, sekirite, pèfòmans, bug. **Pa** kontni ni konfigirasyon. Chak desizyon biznis (pri, livrezon, taks, koleksyon, tèks legal, foto) chanjab nan panèl admin, san dev, san deplwaman.

**Eta jodi a**: tarif livrezon kode an di nan **4 kote**, 211 liy tèks legal nan `Pages.ts`, epi «koleksyon» pa egziste kòm antite — se yon chan tèks lib `season` sou pwodwi a.

---

## §1 · Prensip achitekti

> ⚠️ **Règ ki gouvène tout dokiman an**: lè admin ka chanje yon chif ki touche lajan, **sèvè a dwe li menm chif la**. Si admin mete livrezon sou $15 epi `place_order()` toujou kalkile $10, boutik la montre yon pri epi chaje yon lòt.

- **Yon sèl sous verite pou lajan.** Tarif, taks, rabè viv nan baz done a. `place_order()` li yo. Frontend **afiche** sèlman.
- **Sèvè a rekalkile tout bagay.** Okenn montan navigatè a voye pa antre nan yon kòmand. Prensip Faz 1 rete entak.
- **Chak bagay editab = 4 moso**: tab + RLS + migrasyon komite + ekran admin.
- **`SECURITY DEFINER` kontounen RLS.** Chak fonksyon ki modifye done dwe verifye admin **andedan** li. Yon `cancel_order()` ki bay `anon` dwa = bouton «gonfle estòk» pou tout entènèt la.
- **Kontni admin ekri se done, pa HTML.** Echape anvan DOM. Kòd la sèvi `innerHTML` ak entèpolasyon dirèk — sa vin XSS depi kontni vin editab.
- **Chanjman pran efè tousuit.** Si li mande yon deplwaman, li pa reyèlman editab.

---

## §2 · Nouvo modèl done

| Tab | Sa li kenbe | Piblik ka li | Tikè |
|---|---|---|---|
| `store_settings` | Idantite biznis, livrezon, taks, mòd antretyen (kle/valè JSONB) | wi | B1 |
| `discounts` | Kòd rabè: tip, valè, dat, limit | **non** | B4 |
| `collections` | Non, slug, deskripsyon, kouvèti, lòd, aktif | wi | C1 |
| `product_collections` | Lyen pwodwi ↔ koleksyon + lòd | wi | C1 |
| `pages` | Tèks paj legal pa slug | wi | D1 |
| `admins` | Moun ki gen dwa admin | **non** | E1 |

SELECT piblik sou sa boutik la bezwen afiche · ekriti admin sèlman sou tout. `discounts` ak `admins` pa piblik — validasyon rabè fèt sou sèvè.

---

# A · BUG (P0)

## A1 · Anile yon kòmand pa remèt estòk — ~1 h

**Kote**: `AdminDashboard.ts` · `saveOrderStatus()` — senp `update({status})`.

**Konsekans**: inite yo rete dedwi pou tout tan. Nan de semèn, boutik la make SOLD OUT sou machandiz ki chita nan studyo a. Menm fanmi ak T2 Faz 1.

```sql
create or replace function public.cancel_order(p_order_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_order orders%rowtype; v_item jsonb;
begin
  -- GAD OBLIGATWA: fonksyon an kontounen RLS
  if not exists (select 1 from admins where email = auth.jwt()->>'email') then
    raise exception 'AKSE_REFIZE';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then raise exception 'KOMAND_PA_JWENN'; end if;
  -- idempotans: de klik pa dwe double estòk la
  if v_order.status = 'cancelled' then raise exception 'DEJA_ANILE'; end if;

  for v_item in select * from jsonb_array_elements(v_order.items) loop
    update products set
      stock_by_size = jsonb_set(coalesce(stock_by_size,'{}'::jsonb),
        array[v_item->>'size'],
        to_jsonb(coalesce((stock_by_size->>(v_item->>'size'))::int,0)
                 + (v_item->>'qty')::int)),
      stock_qty = coalesce(stock_qty,0) + (v_item->>'qty')::int
    where id = v_item->>'id';
  end loop;

  update orders set status = 'cancelled' where id = p_order_id;
end $$;

grant execute on function public.cancel_order(bigint) to authenticated;
```

Nan admin: estati `cancelled` → `supabase.rpc('cancel_order')` ak yon konfimasyon anvan.

**Kritè**: anile 2× M → estòk monte 2 · anile de fwa → `DEJA_ANILE`, estòk pa double · kle anon → `AKSE_REFIZE`.

## A2 · Chan `material` manke nan fòm nan — ~15 min

`material` afiche (`Pages.ts:490,525`) men pa editab. Ajoute l, epi **odite tout `Product`**: nenpòt chan ki afiche dwe editab. Se règ jeneral la.

**Kritè**: pwodwi nèf ak tout chan ranpli → zewo `undefined`/`null` sou paj la.

---

# B · LAJAN (P0)

## B1 · Tab `store_settings` + ekran Konfigirasyon — ~4 h

```sql
create table if not exists store_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

create policy "Public can read settings" on store_settings for select using (true);
create policy "Admins manage settings" on store_settings for all
  using (exists (select 1 from admins where email = auth.jwt()->>'email'));

insert into store_settings (key, value) values
 ('business', '{"name":"NOUIE","address_line1":"","address_line2":"","city":"","state":"","zip":"","country":"USA","phone":"","email_support":"","email_studio":""}'::jsonb),
 ('shipping', '{"standard":10.00,"express":25.00,"free_threshold":250.00,"standard_days":"5-7","express_days":"2-3"}'::jsonb),
 ('tax',      '{"enabled":false,"rate":0.00,"label":"SALES TAX"}'::jsonb),
 ('store',    '{"maintenance":false,"announcement":""}'::jsonb)
on conflict (key) do nothing;
```

Ekran `#admin/settings`: idantite biznis · livrezon · taks · boutik.

> **Sa fèmen T5 Faz 1 pou tout tan.** Adrès envante a (`104 INDUSTRIAL_ZONE_04`) ak imèl `@nouie.com` ki pa egziste yo pa mande yon dev ankò. `renderInvoice()` ak paj kontak li `store_settings`.

**Kritè**: chanje adrès → fakti ajou san deplwaman · chanje imèl sipò → CONTACT/SHIPPING/RETURNS tout ajou · anon ka li men pa ekri (401 sou PATCH).

## B2 · Tarif livrezon editab — ~3 h

Kat kopi kode an di jodi a:

| Kote | Sa ki ladan |
|---|---|
| `place_order()` | `CASE WHEN express THEN 25.00 … >= 250 THEN 0 ELSE 10.00` — sèl la ki chaje kliyan an |
| `Pages.ts:735` | `calcShipping()` — sa checkout montre |
| `Pages.ts:783` | Etikèt radio: «$10.00 (FREE OVER $250)» / «$25.00» |
| `Pages.ts:53` | Tablo paj SHIPPING POLICY |

- `place_order()` li tarif yo nan `store_settings`.
- Frontend chaje `store_settings.shipping` yon fwa pou **tou 3** kote afichaj yo.
- Delè yo («5-7 BUSINESS DAYS») soti nan settings tou.
- Si settings pa disponib, checkout **refize** pito pase devine yon pri.

**Kritè**: estanda → 15.00 nan admin = checkout $15.00 **epi** kòmand anrejistre 15.00, zewo deplwaman · sèy gratis → 100 = panyen $120 montre FREE · paj politik ajou otomatikman · `grep -n "25.00\|10.00\|250" src/` zewo tarif kode an di.

## B3 · Taks — ~3 h

Pa egziste jodi a. Boutik baze Ozetazini — obligasyon legal.

- Kolòn sou `orders`: `tax_rate`, `tax_amount`.
- `place_order()`: `tax = subtotal × rate` lè `tax.enabled` · `total = subtotal + shipping + tax`.
- Liy TAX separe nan checkout ak sou fakti.
- Admin limen/etenn + to nan `#admin/settings`.

Pa bati taks pa eta (nexus) kounye a — yon to global ase pou lansman. Si volim monte, Stripe Tax fè l pi byen.

**Kritè**: 8.5% sou $100 + $10 → TAX $8.50 · TOTAL $118.50, menm chif nan `orders` · taks etenn → okenn liy TAX.

## B4 · Kòd rabè — ~4 h (P1)

Tab `discounts`: `code`, `type` (pousantaj | fiks), `value`, `min_subtotal`, `starts_at`, `ends_at`, `max_uses`, `uses`, `active`.

> **Validasyon nan `place_order()`, jamè nan navigatè a.** Tab la pa piblik. Frontend voye kòd la kòm tèks; sèvè a verifye dat/limit/minimòm, kalkile rabè a, enkremante `uses` nan menm tranzaksyon an. Si tab la te piblik, nenpòt moun ta li tout kòd yo.

- Ekran `#admin/discounts`: kreye, etenn, wè itilizasyon.
- Chan kòd nan checkout ak mesaj klè: envalid · ekspire · minimòm pa rive · limit atenn.
- Kolòn sou `orders`: `discount_code`, `discount_amount`.

**Kritè**: 20% sou $100 → rabè $20 rekalkile sou sèvè · kòd ekspire refize · `max_uses=1` ak de kòmand similtane → yon sèl reyisi.

---

# C · KATALÒG (P1)

## C1 · Koleksyon kòm vrè antite — ~6 h

**Eta aktyèl**: pwodwi gen yon chan tèks lib `season`; `#collection` montre **tout** pwodwi aktif san gwoupman; `#archive` li yon lis kode an di nan `data.ts`. Franckley pa ka ajoute ni retire yon koleksyon.

- Tab `collections`: `id`, `slug`, `title`, `description`, `cover_image`, `sort_order`, `is_active`, `is_archived`.
- Tab `product_collections`: anpil-a-anpil ak `sort_order` — yon pwodwi ka nan plizyè koleksyon.
- Ekran `#admin/collections`: kreye · modifye · reòdone · aktive · asiyen pwodwi.
- `#collection` ak `#archive` tou de li baz done a.
- Meni navigasyon jenere ak koleksyon aktif yo, pa yon lis fiks nan `UI.ts`.

**Migrasyon done**: 3 pwodwi yo gen `season = 'SS26'`. Kreye koleksyon «SS26» epi asiyen yo otomatikman — pa kite Franckley refè travay la alamen.

**Kritè**: kreye «FW26» → parèt nan meni ak sou sit san deplwaman · deplase yon pwodwi → de paj yo ajou · dezaktive yon koleksyon → li disparèt, pwodwi yo rete · efase yon koleksyon → pwodwi yo **pa** efase.

## C2 · Fòm pwodwi konplè + jesyon foto — ~3 h

- `material` (A2) + tout lòt chan ki afiche men pa editab.
- **Jere foto ki deja la**: upload ranplase lis la nèt kounye a. Bezwen: wè miniyati, retire youn, chanje lòd, chwazi prensipal la.
- `SIZE_OPTIONS` fiks sou `['S','M','L','XL','XXL']`. Pou rad sa ase — men soulye/chapo bloke. Fè lis la editab nan settings.
- Duplike yon pwodwi (varyant koulè).

---

# D · KONTNI (P2)

## D1 · Paj legal editab — ~4 h
**211 liy** kode an di nan `Pages.ts`: SHIPPING (69) · PRIVACY (49) · TERMS (47) · RETURNS (46).
- Tab `pages`: `slug`, `title`, `body`, `updated_at`.
- Ekran `#admin/pages`. **Markdown, pa HTML lib** — pi sikirize epi Franckley pa bezwen konnen HTML.
- Rann markdown ak echapman. Pa mete `body` dirèk nan `innerHTML`.
- Migrasyon pote 4 paj ki egziste yo antre — pa pèdi tèks ki ekri deja.

**Kritè**: modifye politik retou → paj piblik chanje tousuit · kole `<script>alert(1)</script>` → afiche kòm tèks.

## D2 · Vitrin, archive, lookbook — ~5 h
Tout kontni editoryal nan `data.ts`: `archiveSeasons`, `collectionImages`, `technicalMetadata`, videyo SPOTTED, imaj akèy.
- Seksyon akèy vin done: kèl imaj, ki tèks, ki lòd, limen/etenn.
- Sezon archive soti nan `collections` ak `is_archived = true` — pa yon dezyèm sistèm.
- Videyo SPOTTED chanjab nan admin. **Gade T10 Faz 1** — `ddg_streamer_review.mp4`, dwa poko verifye.

## D3 · Bibliyotèk medya — ~3 h
- Ekran `#admin/media`: upload, wè, efase, kopye lyen.
- 12 foto nan `public/assets/` dwe parèt ladan l — sinon de sistèm foto ki pa konnen youn lòt.
- Konpresyon otomatik nan upload. Videyo 3.9 Mo a se yon avètisman.

---

# E · AKSÈ AK OPERASYON (P3)

## E1 · Jesyon admin — ~3 h
Se T9 Faz 1, men kounye a **obligatwa**: A1, B1 ak B4 tout depann de gad tab `admins` la bay.
Imèl `admin@nouie.com` kode an di nan **de** kote ki dwe rete dakò: RLS ak `auth.ts:isAdmin()`.
- Tab `admins(user_id uuid primary key, email text, added_at)`.
- Tout RLS ak tout fonksyon konsilte tab la.
- `auth.ts:isAdmin()` mande baz done a.
- Ekran `#admin/team`: envite, retire. **Pa kite dènye admin lan retire tèt li.**

## E2 · Operasyon kòmand — ~3 h
- Nòt entèn (kliyan pa wè).
- Renvoye fakti pa imèl.
- Ranbousman pasyèl (lye ak Stripe lè faz sa a fèt).
- Filtè ak rechèch (estati, dat, imèl) — ak 200 kòmand paj la initil san sa.
- Ekspòte CSV pou kontablite.
- Ranplase `alert()` yo ak vrè mesaj nan paj la.

---

## §3 · Limit otonomi a

| Sa a | Ki moun |
|---|---|
| Pwodwi, pri, estòk, foto | **Admin** |
| Koleksyon: kreye, retire, reòdone | **Admin** |
| Livrezon, taks, rabè | **Admin** |
| Tèks legal ak paj enfòmasyon | **Admin** |
| Kontni vitrin ak archive | **Admin** |
| Adrès, telefòn, imèl biznis | **Admin** |
| Kòmand, estati, swivi, ranbousman | **Admin** |
| Design ak dispozisyon paj yo | Dev |
| Nouvo kalite paj oswa fonksyonalite | Dev |
| Etap checkout ak entegrasyon peman | Dev |
| Sekirite, pèfòmans, disponibilite, bug | Dev |

Kat dènye liy yo se **sante sit la** — se sa Winning Code rete responsab. Di sa klèman ak kliyan an, sinon chak demann vin yon diskisyon.

---

## §4 · Definisyon «fini»

- [ ] `npm run build` pase ak **0 erè**.
- [ ] Teste ak **vrè klik** nan navigatè a, pa nan konsòl la.
- [ ] Chak chanjman SQL nan yon fichye migrasyon komite. **Zewo `ALTER` manyèl** — se konsa Faz 1 te pèdi de èdtan sou yon règ ki te rele `orders_access` olye non ki te nan fichye a.
- [ ] Chak migrasyon sekirite fini ak yon `SELECT` ki **pwouve** eta final la. `DROP POLICY IF EXISTS` ki pa matche mouri an silans epi di «Success».
- [ ] Chak `SECURITY DEFINER` gen yon gad admin andedan l + yon tès ki konfime kle anon jwenn refi.
- [ ] Tès ki pwouve **sèvè a genyen**: chanje valè nan DevTools, konfime baz done a anrejistre bon an.
- [ ] Chak ekran admin teste sou telefòn.
- [ ] Yon commit pa tikè, ak mesaj ki di **poukisa**.

---

## §5 · Sekans

| Etap | Tikè | Poukisa nan lòd sa a | Tan |
|---|---|---|---|
| 1 | E1 | Tab `admins` — A1, B1, B4 depann de gad li bay | 3 h |
| 2 | A1 · A2 | Bug ki touche envantè ak done pwodwi | 1.5 h |
| 3 | B1 | Fondasyon konfigirasyon; fèmen T5 Faz 1 | 4 h |
| 4 | B2 · B3 | Livrezon ak taks soti nan settings | 6 h |
| 5 | C1 · C2 | Koleksyon ak katalòg konplè | 9 h |
| 6 | D1 · D2 · D3 | Kontni ak medya | 12 h |
| 7 | B4 · E2 | Rabè ak operasyon kòmand | 7 h |

**Total apeprè 6 jou.** Etap 1–4 bay Franckley kontwòl sou lajan — pati ki pi ijan. Etap 5–7 ka fèt apre lansman san bloke vant.

> **Sa dokiman sa a pa kouvri**: peman Stripe (T7 Faz 1) ak domèn nan (T8 Faz 1) rete kote yo te ye. Otonomi admin pa ranplase yo — yon boutik ki gen kontwòl total sou pri li men ki pa ka pran lajan pa yon boutik.
