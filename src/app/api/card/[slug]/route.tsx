import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadDaily } from "@/lib/daily";
import { formatLongDate, isISODate, localeFor, todayISO } from "@/lib/dates";
import { isLang, t, type Lang } from "@/lib/languages";
import { DAILY_UI } from "@/lib/post-text";
import { createClient } from "@/lib/supabase/server";

const fontDir = join(process.cwd(), "assets/fonts");
// latin and latin-ext are separate files; registering them under different names and listing both
// in fontFamily makes Satori fall back to the -ext file for č, š, ž instead of fetching Google Fonts.
const fonts = Promise.all(
  [
    ["Fraunces", "fraunces-latin-600-normal.woff", 600],
    ["FrauncesExt", "fraunces-latin-ext-600-normal.woff", 600],
    ["Inter", "inter-latin-400-normal.woff", 400],
    ["InterExt", "inter-latin-ext-400-normal.woff", 400],
    ["Inter", "inter-latin-600-normal.woff", 600],
    ["InterExt", "inter-latin-ext-600-normal.woff", 600],
  ].map(async ([name, file, weight]) => ({
    name: name as string,
    data: await readFile(join(fontDir, file as string)),
    weight: weight as 400 | 600,
    style: "normal" as const,
  })),
);

const SIZES = { story: { width: 1080, height: 1920 }, post: { width: 1080, height: 1350 } } as const;

/** Mix a hex colour with white (amount 0–1) for soft backgrounds. */
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - amount) + 255 * amount);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/**
 * Shareable image card for a daily menu.
 * /api/card/<slug>?date=YYYY-MM-DD&lang=sl&format=story|post
 * Owners can preview drafts; everyone else only sees published menus (RLS).
 */
export async function GET(req: Request, ctx: RouteContext<"/api/card/[slug]">) {
  const { slug } = await ctx.params;
  const q = new URL(req.url).searchParams;
  const date = isISODate(q.get("date")) ? q.get("date")! : todayISO();
  const format = q.get("format") === "post" ? "post" : "story";
  const size = SIZES[format];

  const hasDb = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  // Owner client: RLS shows drafts to the owner and only published menus to everyone else.
  const found = await loadDaily(hasDb ? await createClient() : null, slug, date, false).catch(() =>
    slug === "demo" ? loadDaily(null, slug, date) : null,
  );
  if (!found?.menu) return new Response("No daily menu for this date", { status: 404 });
  const { restaurant: r, menu: m } = found;
  const langParam = q.get("lang");
  const lang: Lang = isLang(langParam) && r.languages.includes(langParam) ? langParam : r.source_lang;

  const accent = /^#[0-9a-f]{6}$/i.test(r.accent_color) ? r.accent_color : "#b45309";
  const money = (v: number) => new Intl.NumberFormat(localeFor(lang), { style: "currency", currency: r.currency }).format(v);
  const n = m.items.length;
  // Scale type down as the list grows so 1–8 dishes all fit.
  const itemSize = format === "story" ? (n <= 3 ? 72 : n <= 5 ? 56 : 44) : n <= 3 ? 50 : n <= 5 ? 42 : 34;
  const descSize = Math.round(itemSize * 0.62);
  const note = t(m.note, lang, r.source_lang);
  const footer = [r.malica_hours && `${DAILY_UI.served[lang]} ${r.malica_hours}`, r.phone, r.address].filter(Boolean).join("  ·  ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: tint(accent, 0.92),
          padding: format === "story" ? "120px 90px 110px" : "80px 80px 70px",
          fontFamily: "Inter, InterExt",
          color: "#1f1a14",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6, textTransform: "uppercase", color: accent, fontWeight: 600 }}>
          {r.name}
        </div>
        <div style={{ display: "flex", fontFamily: "Fraunces, FrauncesExt", fontSize: format === "story" ? 112 : 96, lineHeight: 1.05, marginTop: 24 }}>
          {DAILY_UI.title[lang]}
        </div>
        <div style={{ display: "flex", fontSize: 38, color: "#6b6257", marginTop: 14 }}>
          {formatLongDate(m.menu_date, lang)}
        </div>

        <div style={{ display: "flex", height: 4, width: 120, background: accent, marginTop: 48, marginBottom: 40 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: format === "story" ? 56 : 30,
          }}
        >
          {m.items.map((it, i) => {
            const desc = t(it.description, lang, r.source_lang);
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                  <div style={{ display: "flex", flex: 1, fontSize: itemSize, fontWeight: 600, lineHeight: 1.15 }}>
                    {t(it.name, lang, r.source_lang)}
                  </div>
                  {it.price != null && (
                    <div style={{ display: "flex", fontSize: itemSize * 0.85, color: accent, fontWeight: 600, marginTop: itemSize * 0.08 }}>
                      {money(it.price)}
                    </div>
                  )}
                </div>
                {(desc || it.allergens.length > 0) && (
                  <div style={{ display: "flex", fontSize: descSize, color: "#6b6257", marginTop: 6 }}>
                    {[desc, it.allergens.length ? `(${it.allergens.join(", ")})` : ""].filter(Boolean).join("  ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(m.set_price != null || note) && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16, marginTop: format === "story" ? 64 : 30 }}>
            {m.set_price != null && (
              <div
                style={{
                  display: "flex",
                  background: accent,
                  color: "white",
                  borderRadius: 999,
                  padding: "16px 40px",
                  fontSize: 44,
                  fontWeight: 600,
                }}
              >
                {DAILY_UI.setPrice[lang]}: {money(m.set_price)}
              </div>
            )}
            {note && <div style={{ display: "flex", fontSize: 34, color: "#6b6257" }}>{note}</div>}
          </div>
        )}

        <div style={{ display: "flex", flexGrow: 1 }} />

        {footer && (
          <div style={{ display: "flex", marginTop: 40, paddingTop: 28, borderTop: "2px solid rgba(31,26,20,0.12)", fontSize: 30, color: "#6b6257" }}>
            {footer}
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts: await fonts,
      headers: {
        "Cache-Control": m.published ? "public, max-age=300, s-maxage=300" : "private, no-store",
        ...(q.get("download") ? { "Content-Disposition": `attachment; filename="malica-${r.slug}-${m.menu_date}-${lang}-${format}.png"` } : {}),
      },
    },
  );
}
