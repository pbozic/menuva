import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Item, MenuData, Restaurant } from "./types";

/** Load a full menu (restaurant + categories + items) grouped by category. */
export async function loadMenu(
  supabase: SupabaseClient,
  by: { slug: string } | { id: string },
): Promise<MenuData | null> {
  const q = supabase.from("restaurants").select("*");
  const { data: restaurant } = await ("slug" in by ? q.eq("slug", by.slug) : q.eq("id", by.id)).maybeSingle();
  if (!restaurant) return null;

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", restaurant.id).order("position"),
    supabase.from("items").select("*").eq("restaurant_id", restaurant.id).order("position"),
  ]);

  const cats = (categories ?? []) as Category[];
  const its = (items ?? []) as Item[];
  return {
    restaurant: restaurant as Restaurant,
    categories: cats.map((c) => ({ ...c, items: its.filter((i) => i.category_id === c.id) })),
  };
}

export function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "restavracija"
  );
}

export function formatPrice(price: number | null, currency = "EUR", locale = "sl-SI"): string {
  if (price == null) return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(price);
}
