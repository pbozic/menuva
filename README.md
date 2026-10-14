# Menuva

**Daily malica publisher** for Slovenian restaurants: photograph the whiteboard, and Menuva turns today's lunch into an Instagram story/post image, ready-to-paste Facebook/Instagram/Google text (SL + EN), a website widget and a QR code that always shows today's menu.

Also: multilingual QR menus for restaurants in Slovenia. An owner uploads a photo, PDF or text of their menu; AI extracts the dishes, translates them into SL / EN / DE / IT / HR (keeping regional dish names like *štruklji* and explaining them), and suggests the 14 EU allergens for the owner to confirm. Guests scan a QR code and pick their language.

## What's in this MVP

### Daily malica (`/dashboard/malica`)
- **Photo or text in** → Claude reads dishes, prices, set price and suggests allergens (`/api/daily/extract`)
- Owner checks/edits, then **Objavi** → translated into the restaurant's languages and published (`/api/daily/save`; price/allergen-only edits don't re-translate)
- **Image cards** `/api/card/<slug>?date=&lang=&format=story|post` (1080×1920 / 1080×1350) with the restaurant's colour, hours, phone, address
- **Post text** for Facebook, Instagram and Google profile, single language or SL+EN, with copy buttons
- **Public page** `/d/<slug>` and **website widget** — `<script src="https://YOUR-DOMAIN/widget.js" data-restaurant="<slug>" async></script>` — always show today's malica
- **QR code** for the window: `/api/qr/<slug>?target=daily`
- Demo: `/d/demo` and `/api/card/demo` work without a database

### Billing
- 14-day card-free trial on signup, then Stripe Checkout subscription (`/dashboard/billing`)
- AI features stop when the trial ends without a subscription; public pages keep working
- Webhook at `/api/stripe/webhook` keeps `subscription_status` in sync; billing columns can only be changed by the service role (DB trigger)

### Full menu

- **Magic-link login** (Supabase Auth)
- **Menu import** — photo / PDF / pasted text → Claude extracts categories, dishes, prices and allergen suggestions → translated into every enabled language in one pass
- **Editor** — edit any language per dish, confirm allergens, mark dishes unavailable, add/delete dishes, re-translate a single dish from Slovenian
- **Public menu** at `/m/<slug>` with a language switcher, allergen numbers and a legend; prints cleanly (Ctrl+P → PDF)
- **QR code** as SVG on the dashboard and a 1024px PNG for print
- **Demo menu** at `/m/demo` (works even without a database — useful on sales visits)

Not yet: Stripe billing, branded PDF export, photos, multiple locations.

## Setup

1. **Supabase** — create a free project at supabase.com (EU region), open SQL Editor and run `supabase/schema.sql`, then `supabase/migrations-002-daily-menus.sql`.
   In Authentication → URL Configuration, add `http://localhost:3000/auth/callback` (and your production URL later) to Redirect URLs.
2. **Anthropic** — create an API key at console.anthropic.com.
3. **Stripe** (optional until you charge) — in test mode create a product with a monthly recurring price, copy its `price_...` id, and add a webhook endpoint `https://YOUR-DOMAIN/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. **Env** — `cp .env.example .env.local` and fill in the values.
5. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000, sign in, name your restaurant and import a menu.

## Cost protection

- **Per-restaurant quotas** (`src/lib/quota.ts`): 10 imports/day and 30/month, 100 re-translations/day and 300/month, pasted text capped at 20k characters. Worst case is about $4 per restaurant per month. Every AI call is logged in `ai_usage` before it runs, so parallel requests can't slip past the limit.
- **One restaurant per account**, so quotas can't be dodged by creating more restaurants.
- **Set a monthly spend limit in the Anthropic Console** (Settings → Limits) as the final backstop, since anyone can still create new free accounts.

If you already ran `schema.sql` before quotas existed, run `supabase/migrations-001-ai-usage.sql`.

## Deploy

Push to GitHub and import the repo in Vercel; add the same env vars. Set `NEXT_PUBLIC_SITE_URL` to your real domain so QR codes point to it. The import route can run up to 5 minutes, so the Vercel plan must allow that function duration (Pro, or lower `maxDuration` and keep menus short).

## Where things live

| Path | What |
| --- | --- |
| `src/lib/ai.ts` | Claude prompts for extraction and translation |
| `src/lib/glossary.ts` | Slovenian dish glossary — **the translation quality edge, keep growing it** |
| `src/lib/allergens.ts` | The 14 EU allergens in 5 languages |
| `src/app/api/menu/import` | Upload → extract → translate → save |
| `src/app/dashboard` | Owner editor + server actions |
| `src/app/m/[slug]` | Public guest menu |
| `supabase/schema.sql` | Tables + row-level security |

## Next steps

- Auto-post to Facebook/Instagram (needs Meta app review) and Google Business Profile API
- "Copy yesterday" / weekly templates for restaurants that repeat dishes
- Logo on the cards
- Editing individual translations of the daily menu
- Transactional email (trial ending, payment failed) via Resend
