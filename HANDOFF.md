# Menuva — handoff (14 Oct 2026)

Weekend SaaS for Slovenian restaurants. **Main product: daily malica publisher** — the owner photographs the lunch whiteboard; Menuva produces Instagram story/post images, ready-to-paste Facebook/Instagram/Google text (SL + EN), a website widget and a QR code that always show today's malica. **Secondary:** full multilingual QR menu (SL/EN/DE/IT/HR) with EU allergens.

Pricing plan: 14-day card-free trial, then **€12.90/month + DDV**.

## Status at a glance

| Area | State |
| --- | --- |
| Code | On `main`, builds and lints clean |
| Production | **https://menuva-drab.vercel.app** — landing page and `/d/demo` verified live |
| Supabase | Base schema applied; **migration 002 not applied yet** (see below) |
| Stripe | Test-mode product, price and webhook created |
| Login, AI, payments | **Not working in production yet** — missing secrets (see below) |
| Tested end-to-end | Image cards, post text, public pages, widget (demo data, locally). **Not tested:** login, real photo extraction, translation, publishing, Stripe checkout |

## Infrastructure (IDs only — secrets live in Vercel)

- **GitHub:** `pbozic/menuva`, branch `main` = production (auto-deploys)
- **Vercel:** project `menuva` (`prj_PUQRjHfGTQFw7TJVrfCKIDIZBrKt`), team `primozbozics-projects`, functions in `fra1`. Vercel Authentication is on for **preview** deployments only — production must stay public or guests can't open menus.
- **Supabase:** project "pbozic's Project", ref `cnugvklekvxfzrgksbiv`, region `eu-west-1`
- **Stripe (test mode, account "Primož Božič"):** product `prod_VRS6nxnZfVHTIv`, price `price_1UQZCkI5893wXTsBxI9yZzyZ` (€12.90/month, tax exclusive), webhook `we_1UQZDaI5893wXTsBaNmct81e` → `https://menuva-drab.vercel.app/api/stripe/webhook`
  - This is an old account with another project's test products in it. Use a separate Stripe account for the business that will invoice restaurants before going live.

### Vercel env vars

| Variable | Set? |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `NEXT_PUBLIC_SITE_URL` | ✅ production only |
| `STRIPE_PRICE_ID` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | ✅ (sensitive) |
| `ANTHROPIC_API_KEY` | ❌ add manually |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ add manually (Supabase → Project Settings → API keys) |
| `STRIPE_SECRET_KEY` | ❌ add manually (`sk_test_…`) |

## To finish setup (in order)

1. **Apply `supabase/migrations-002-daily-menus.sql`** in the Supabase SQL editor. It contains a `drop constraint`, which is why the automated run was cancelled; it's safe on the current (empty) database.
2. **Add the three missing env vars** above in Vercel, then redeploy.
3. **Supabase → Authentication → URL Configuration:** Site URL `https://menuva-drab.vercel.app`; Redirect URLs `https://menuva-drab.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
4. **Anthropic Console:** set a monthly spend limit (backstop against free-account abuse).
5. **Supabase SMTP:** the built-in sender allows only a few magic-link emails per hour. Add Resend (free tier) under Authentication → Emails → SMTP before real users.
6. **Smoke test:** sign up → name a restaurant → photograph a real malica board → check items/allergens → Objavi → download story card → copy post text → open `/d/<slug>` → test checkout with card `4242 4242 4242 4242` → confirm `subscription_status` becomes `active`.

## How it works

```
Photo / text ──► /api/daily/extract (Claude, quota "daily") ──► draft in editor
Owner edits ──► /api/daily/save ──► translate if SL text changed (quota "retranslate") ──► daily_menus row
Published row ──► /api/card/[slug] (next/og PNG)  /d/[slug]  /embed/[slug] + widget.js  /api/qr/[slug]?target=daily
Post text is built client-side from the row (src/lib/post-text.ts) — no AI cost
```

| Path | What |
| --- | --- |
| `src/lib/ai.ts` | All Claude prompts: full-menu extraction, daily extraction, translation (model via `ANTHROPIC_MODEL`, default `claude-sonnet-5-5`) |
| `src/lib/glossary.ts` | Slovenian dish glossary — translation quality edge, keep growing it |
| `src/lib/quota.ts` | Per-restaurant AI limits; usage logged before each call |
| `src/lib/billing.ts`, `src/lib/stripe.ts` | Trial/access rules, Stripe status mapping |
| `src/lib/post-text.ts` | Facebook / Instagram / Google post text |
| `src/app/api/card/[slug]/route.tsx` | Image cards; fonts bundled in `assets/fonts` (latin + latin-ext registered under separate names so č/š/ž render without fetching Google Fonts) |
| `src/app/dashboard/malica` | Daily editor + outputs panel |
| `src/app/dashboard` | Full-menu editor; `actions.ts` holds server actions |
| `src/app/api/stripe/webhook` | Subscription sync (service-role client) |
| `supabase/` | `schema.sql`, `migrations-001` (legacy), `migrations-002` (malica + billing) |

### Gotchas

- **Next.js 16** with Cache Components: pages that read cookies, params or DB need a Suspense boundary — each such route has a `loading.tsx`. Middleware is `src/proxy.ts`. Read `node_modules/next/dist/docs/` before changing framework-level code (see `AGENTS.md`).
- **Billing columns** on `restaurants` can only be changed by the service role (DB triggers). Owners can't grant themselves `active`.
- **One restaurant per account** (unique index) — keeps quotas per account.
- `/d/demo`, `/m/demo` and `/api/card/demo` fall back to built-in demo data (`src/lib/demo.ts`) — use them on sales visits.
- Dates use `Europe/Ljubljana` (`src/lib/dates.ts`); "today" is computed per request.

## Costs

Sonnet 5.5 at $2 / $10 per million tokens. Rough estimates: full-menu import ≈ $0.11, daily malica ≈ $0.01, single re-translation ≈ $0.002. Worst case at the quota limits ≈ $5 per restaurant per month. Measure real numbers in the Anthropic Console after the first imports.

## Market notes

- Plain QR menus are crowded and cheap: doXmenu targets Slovenia at €12.99/month; MenuTiger has a free tier; Menutech does AI translation + allergens at €20–180/month.
- The daily malica angle had no direct competitor in what we checked — that's the bet.
- **Sales plan:** collect ~30 restaurants in one area that post malica on Facebook daily; send each a ready-made card built from *their own* post that day. First 3–5 free for feedback.

## Next steps

1. Finish setup + smoke test (above)
2. Test with 5 real whiteboard photos; tune the extraction prompt
3. "Copy yesterday" / weekly templates
4. Restaurant logo on cards
5. Edit individual translations of the daily menu
6. Transactional email: trial ending, payment failed (Resend)
7. Auto-post to Facebook/Instagram (needs Meta app review) and Google Business Profile API
