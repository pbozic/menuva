import { NextResponse } from "next/server";
import { translateEntries, type TranslatableEntry } from "@/lib/ai";
import { hasAccess, NO_ACCESS_MESSAGE } from "@/lib/billing";
import { consumeQuota } from "@/lib/quota";
import { getOwnerContext } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";

export const maxDuration = 120;

/**
 * Re-translate one item from its source-language text into every other language.
 * Body: { itemId: string }
 */
export async function POST(req: Request) {
  const { supabase, user, restaurant } = await getOwnerContext();
  if (!user || !restaurant) return NextResponse.json({ error: "Not allowed" }, { status: 401 });

  const { itemId } = (await req.json().catch(() => ({}))) as { itemId?: string };
  if (!itemId) return NextResponse.json({ error: "itemId is required" }, { status: 400 });

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  const item = data as Item | null;
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const src = restaurant.source_lang;
  const entries: TranslatableEntry[] = [{ id: "n", kind: "dish_name", text: item.name[src] ?? "" }];
  if (item.description[src]) entries.push({ id: "d", kind: "dish_description", text: item.description[src]! });

  if (!hasAccess(restaurant)) return NextResponse.json({ error: NO_ACCESS_MESSAGE }, { status: 402 });
  const quotaError = await consumeQuota(supabase, restaurant.id, "retranslate");
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 429 });

  try {
    const tr = await translateEntries(entries, src, restaurant.languages);
    const update = { name: tr.n, description: tr.d ?? {} };
    const { error } = await supabase.from("items").update(update).eq("id", item.id);
    if (error) throw error;
    return NextResponse.json({ ok: true, ...update });
  } catch (err) {
    console.error("retranslate failed", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Translation failed" }, { status: 500 });
  }
}
