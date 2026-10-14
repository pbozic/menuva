# Menuva

Multilingual QR menus for restaurants in Slovenia. An owner uploads a photo, PDF or text of their menu; AI extracts the dishes, translates them into SL / EN / DE / IT / HR (keeping regional dish names like *štruklji* and explaining them), and suggests the 14 EU allergens for the owner to confirm. Guests scan a QR code and pick their language.

## What's in this MVP

- **Magic-link login** (Supabase Auth)
- **Menu import** — photo / PDF / pasted text → Claude extracts categories, dishes, prices and allergen suggestions → translated into every enabled language in one pass
- **Editor** — edit any language per dish, confirm allergens, mark dishes unavailable, add/delete dishes, re-translate a single dish from Slovenian
- **Public menu** at `/m/<slug>` with a language switcher, allergen numbers and a legend; prints cleanly (Ctrl+P → PDF)
- **QR code** as SVG on the dashboard and a 1024px PNG for print
- **Demo menu** at `/m/demo` (works even without a database — useful on sales visits)

Not yet: Stripe billing, branded PDF export, photos, multiple locations.

## Setup

1. **Supabase** — create a free project at supabase.com, open SQL Editor and run `supabase/schema.sql`.
   In Authentication → URL Configuration, add `http://localhost:3000/auth/callback` (and your production URL later) to Redirect URLs.
2. **Anthropic** — create an API key at console.anthropic.com.
3. **Env** — `cp .env.example .env.local` and fill in the values.
4. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000, sign in, name your restaurant and import a menu.

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

## Next steps (weekend 2)

- Stripe subscription (€15–25/month) with a trial
- Branded print PDF per language
- Landing page copy + pricing
- Better re-translation (whole menu when a language is added)
