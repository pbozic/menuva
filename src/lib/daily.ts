import type { SupabaseClient } from "@supabase/supabase-js";
import { translateEntries, type TranslatableEntry } from "./ai";
import { cleanAllergens } from "./allergens";
import type { I18nText, Lang } from "./languages";
import { DEMO_MENU, demoDaily } from "./demo";
import type { DailyItem, DailyMenu, Restaurant } from "./types";

/** Source-language draft as it comes from the editor or from extraction. */
export type DailyDraft = {
  items: { name: string; description: string; price: number | null; allergens: number[] }[];
  set_price: number | null;
  note: string;
};

/** Translate a source-language draft into every language the restaurant uses. */
export async function translateDraft(
  draft: DailyDraft,
  sourceLang: Lang,
  langs: Lang[],
): Promise<{ items: DailyItem[]; note: I18nText }> {
  const entries: TranslatableEntry[] = [];
  draft.items.forEach((it, i) => {
    entries.push({ id: `i${i}n`, kind: "dish_name", text: it.name });
    if (it.description.trim()) entries.push({ id: `i${i}d`, kind: "dish_description", text: it.description });
  });
  if (draft.note.trim()) entries.push({ id: "note", kind: "dish_description", text: draft.note });

  const tr = await translateEntries(entries, sourceLang, langs);
  return {
    items: draft.items.map((it, i) => ({
      name: tr[`i${i}n`] ?? { [sourceLang]: it.name },
      description: tr[`i${i}d`] ?? {},
      price: it.price,
      allergens: cleanAllergens(it.allergens),
    })),
    note: tr.note ?? {},
  };
}

/**
 * Load a daily menu by restaurant slug and date. With the anon client only published menus are
 * visible (RLS); with the owner's client drafts are visible too. /demo works without a database.
 */
export async function loadDaily(
  supabase: SupabaseClient | null,
  slug: string,
  date: string,
  publishedOnly = true,
): Promise<{ restaurant: Restaurant; menu: DailyMenu | null } | null> {
  if (!supabase) return slug === "demo" ? { restaurant: DEMO_MENU.restaurant, menu: demoDaily(date) } : null;
  if (publishedOnly) return loadPublishedDaily(supabase, slug, date);
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (!restaurant) return slug === "demo" ? { restaurant: DEMO_MENU.restaurant, menu: demoDaily(date) } : null;
  const { data: menu } = await supabase
    .from("daily_menus")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("menu_date", date)
    .maybeSingle();
  return { restaurant: restaurant as Restaurant, menu: (menu as DailyMenu | null) ?? null };
}

/** Load the published daily menu for a restaurant slug on a date (defaults handled by caller). */
export async function loadPublishedDaily(
  supabase: SupabaseClient,
  slug: string,
  date: string,
): Promise<{ restaurant: Restaurant; menu: DailyMenu | null } | null> {
  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (!restaurant) return slug === "demo" ? { restaurant: DEMO_MENU.restaurant, menu: demoDaily(date) } : null;
  const { data: menu } = await supabase
    .from("daily_menus")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("menu_date", date)
    .eq("published", true)
    .maybeSingle();
  return { restaurant: restaurant as Restaurant, menu: (menu as DailyMenu | null) ?? null };
}

/** Parse and sanitise a draft posted from the browser. */
export function parseDraft(input: unknown): DailyDraft | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;
  const num = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) && n >= 0 && n < 10000 ? Math.round(n * 100) / 100 : null;
  };
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const items = o.items
    .slice(0, 20)
    .map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      return {
        name: str(r.name, 200),
        description: str(r.description, 500),
        price: num(r.price),
        allergens: cleanAllergens(r.allergens),
      };
    })
    .filter((i) => i.name);
  return { items, set_price: num(o.set_price), note: str(o.note, 300) };
}
