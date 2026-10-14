import { NextResponse } from "next/server";
import { extractDailyMenu, type MenuSource } from "@/lib/ai";
import { hasAccess, NO_ACCESS_MESSAGE } from "@/lib/billing";
import type { DailyDraft } from "@/lib/daily";
import { consumeQuota } from "@/lib/quota";
import { getOwnerContext } from "@/lib/supabase/server";

export const maxDuration = 60;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_TEXT = 4000;

/** Read a whiteboard photo or pasted post and return a source-language draft (not saved). */
export async function POST(req: Request) {
  const { supabase, user, restaurant } = await getOwnerContext();
  if (!user) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });
  if (!restaurant) return NextResponse.json({ error: "Najprej ustvarite restavracijo" }, { status: 400 });
  if (!hasAccess(restaurant)) return NextResponse.json({ error: NO_ACCESS_MESSAGE }, { status: 402 });

  const form = await req.formData();
  const file = form.get("file");
  const text = String(form.get("text") ?? "").trim();

  let source: Exclude<MenuSource, { kind: "pdf" }>;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Slika je večja od 10 MB" }, { status: 400 });
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type))
      return NextResponse.json({ error: "Naložite JPG, PNG ali WebP" }, { status: 400 });
    source = {
      kind: "image",
      mediaType: file.type as (typeof IMAGE_TYPES)[number],
      base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
    };
  } else if (text) {
    if (text.length > MAX_TEXT) return NextResponse.json({ error: `Besedilo je predolgo (največ ${MAX_TEXT} znakov)` }, { status: 400 });
    source = { kind: "text", text };
  } else {
    return NextResponse.json({ error: "Fotografirajte tablo ali prilepite besedilo" }, { status: 400 });
  }

  const quotaError = await consumeQuota(supabase, restaurant.id, "daily");
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 429 });

  try {
    const x = await extractDailyMenu(source, restaurant.source_lang);
    const draft: DailyDraft = {
      items: x.items.map((i) => ({
        name: i.name,
        description: i.description,
        price: i.price ?? null,
        allergens: i.suggested_allergens,
      })),
      set_price: x.set_price ?? null,
      note: x.note,
    };
    if (!draft.items.length) return NextResponse.json({ error: "Na sliki nisem našel jedi" }, { status: 422 });
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("daily extract failed", err);
    return NextResponse.json({ error: "Branje ni uspelo, poskusite znova" }, { status: 500 });
  }
}
