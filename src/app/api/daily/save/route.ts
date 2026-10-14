import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hasAccess, NO_ACCESS_MESSAGE } from "@/lib/billing";
import { parseDraft, translateDraft } from "@/lib/daily";
import { isISODate } from "@/lib/dates";
import { consumeQuota } from "@/lib/quota";
import { getOwnerContext } from "@/lib/supabase/server";
import type { DailyMenu } from "@/lib/types";

export const maxDuration = 60;

/**
 * Save (and optionally publish) the daily menu for a date.
 * Body: { date: "YYYY-MM-DD", draft: DailyDraft, publish: boolean }
 * Re-translates only when the source-language text changed, so price/allergen edits are free.
 */
export async function POST(req: Request) {
  const { supabase, user, restaurant } = await getOwnerContext();
  if (!user || !restaurant) return NextResponse.json({ error: "Niste prijavljeni" }, { status: 401 });
  if (!hasAccess(restaurant)) return NextResponse.json({ error: NO_ACCESS_MESSAGE }, { status: 402 });

  const body = (await req.json().catch(() => null)) as { date?: unknown; draft?: unknown; publish?: unknown } | null;
  const date = body?.date;
  const draft = parseDraft(body?.draft);
  if (!isISODate(date) || !draft) return NextResponse.json({ error: "Napačni podatki" }, { status: 400 });
  if (!draft.items.length) return NextResponse.json({ error: "Dodajte vsaj eno jed" }, { status: 400 });

  const src = restaurant.source_lang;
  const { data: existingRow } = await supabase
    .from("daily_menus")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("menu_date", date)
    .maybeSingle();
  const existing = existingRow as DailyMenu | null;

  // Fingerprint of everything that needs translating; if unchanged we keep the stored translations.
  const fingerprint = (items: { name: string; description: string }[], note: string) =>
    JSON.stringify([items.map((i) => [i.name, i.description]), note]);
  const before = existing
    ? fingerprint(
        existing.items.map((i) => ({ name: i.name[src] ?? "", description: i.description[src] ?? "" })),
        existing.note[src] ?? "",
      )
    : null;
  const langsCovered =
    existing?.items.every((i) => restaurant.languages.every((l) => i.name[l])) ?? false;
  const needsTranslation = !existing || !langsCovered || before !== fingerprint(draft.items, draft.note);

  let items = existing?.items ?? [];
  let note = existing?.note ?? {};
  try {
    if (needsTranslation) {
      const quotaError = await consumeQuota(supabase, restaurant.id, "retranslate");
      if (quotaError) return NextResponse.json({ error: quotaError }, { status: 429 });
      ({ items, note } = await translateDraft(draft, src, restaurant.languages));
    } else {
      items = items.map((it, i) => ({ ...it, price: draft.items[i].price, allergens: draft.items[i].allergens }));
    }

    const { data, error } = await supabase
      .from("daily_menus")
      .upsert(
        {
          restaurant_id: restaurant.id,
          menu_date: date,
          items,
          note,
          set_price: draft.set_price,
          published: body?.publish === true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "restaurant_id,menu_date" },
      )
      .select("*")
      .single();
    if (error) throw error;

    revalidatePath("/dashboard/malica");
    return NextResponse.json({ menu: data, translated: needsTranslation });
  } catch (err) {
    console.error("daily save failed", err);
    return NextResponse.json({ error: "Shranjevanje ni uspelo" }, { status: 500 });
  }
}
