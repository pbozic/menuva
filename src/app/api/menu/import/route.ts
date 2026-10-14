import { NextResponse } from "next/server";
import { extractMenu, translateEntries, type MenuSource, type TranslatableEntry } from "@/lib/ai";
import { consumeQuota, MAX_TEXT_CHARS } from "@/lib/quota";
import { getOwnerContext } from "@/lib/supabase/server";

export const maxDuration = 300; // extraction + translation of a long menu can take a while

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Import a menu from a photo, PDF or pasted text.
 * Form fields: file (optional), text (optional), mode = "replace" | "append"
 */
export async function POST(req: Request) {
  const { supabase, user, restaurant } = await getOwnerContext();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!restaurant) return NextResponse.json({ error: "Create your restaurant first" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  const text = String(form.get("text") ?? "").trim();
  const mode = form.get("mode") === "append" ? "append" : "replace";

  let source: MenuSource;
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is larger than 20 MB" }, { status: 400 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    if (file.type === "application/pdf") source = { kind: "pdf", base64 };
    else if ((IMAGE_TYPES as readonly string[]).includes(file.type))
      source = { kind: "image", mediaType: file.type as (typeof IMAGE_TYPES)[number], base64 };
    else return NextResponse.json({ error: "Upload a JPG, PNG, WebP or PDF" }, { status: 400 });
  } else if (text) {
    if (text.length > MAX_TEXT_CHARS)
      return NextResponse.json({ error: `Besedilo je predolgo (največ ${MAX_TEXT_CHARS} znakov)` }, { status: 400 });
    source = { kind: "text", text };
  } else {
    return NextResponse.json({ error: "Upload a file or paste the menu text" }, { status: 400 });
  }

  const quotaError = await consumeQuota(supabase, restaurant.id, "import");
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 429 });

  try {
    const menu = await extractMenu(source, restaurant.source_lang);
    if (!menu.categories.length) return NextResponse.json({ error: "No dishes found in that menu" }, { status: 422 });

    // Build one flat list of strings to translate in as few calls as possible.
    const entries: TranslatableEntry[] = [];
    menu.categories.forEach((c, ci) => {
      entries.push({ id: `c${ci}`, kind: "category", text: c.name });
      c.items.forEach((it, ii) => {
        entries.push({ id: `c${ci}i${ii}n`, kind: "dish_name", text: it.name });
        if (it.description) entries.push({ id: `c${ci}i${ii}d`, kind: "dish_description", text: it.description });
      });
    });
    const tr = await translateEntries(entries, restaurant.source_lang, restaurant.languages);

    let posOffset = 0;
    if (mode === "replace") {
      await supabase.from("categories").delete().eq("restaurant_id", restaurant.id);
      await supabase.from("items").delete().eq("restaurant_id", restaurant.id);
    } else {
      const { count } = await supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id);
      posOffset = count ?? 0;
    }

    let itemCount = 0;
    for (const [ci, c] of menu.categories.entries()) {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .insert({ restaurant_id: restaurant.id, position: posOffset + ci, name: tr[`c${ci}`] })
        .select("id")
        .single();
      if (catErr || !cat) throw catErr ?? new Error("Could not save category");

      const rows = c.items.map((it, ii) => ({
        restaurant_id: restaurant.id,
        category_id: cat.id,
        position: ii,
        name: tr[`c${ci}i${ii}n`],
        description: tr[`c${ci}i${ii}d`] ?? {},
        price: it.price ?? null,
        allergens: it.suggested_allergens,
        allergens_confirmed: false,
      }));
      if (rows.length) {
        const { error } = await supabase.from("items").insert(rows);
        if (error) throw error;
        itemCount += rows.length;
      }
    }

    return NextResponse.json({ ok: true, categories: menu.categories.length, items: itemCount });
  } catch (err) {
    console.error("menu import failed", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
