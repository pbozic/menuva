"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanAllergens } from "@/lib/allergens";
import { ALL_LANGS, isLang, type I18nText, type Lang } from "@/lib/languages";
import { slugify } from "@/lib/menu";
import { getOwnerContext } from "@/lib/supabase/server";

async function requireOwner() {
  const ctx = await getOwnerContext();
  if (!ctx.user) redirect("/login");
  return ctx;
}

function done(restaurantSlug?: string) {
  revalidatePath("/dashboard");
  if (restaurantSlug) revalidatePath(`/m/${restaurantSlug}`);
}

export async function createRestaurant(formData: FormData) {
  const { supabase, user, restaurant } = await requireOwner();
  if (restaurant) redirect("/dashboard");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  // Find a free slug: gostilna-pri-lojzetu, gostilna-pri-lojzetu-2, ...
  const base = slugify(name);
  let slug = base;
  for (let n = 2; n < 50; n++) {
    const { data } = await supabase.from("restaurants").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${base}-${n}`;
  }

  const { error } = await supabase.from("restaurants").insert({ owner_id: user!.id, name, slug });
  if (error) throw new Error(error.message);
  done();
  redirect("/dashboard/malica");
}

export async function updateRestaurant(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;

  const name = String(formData.get("name") ?? "").trim() || restaurant.name;
  const accent = String(formData.get("accent_color") ?? "");
  const languages = formData.getAll("languages").filter(isLang) as Lang[];
  if (!languages.includes(restaurant.source_lang)) languages.unshift(restaurant.source_lang);

  await supabase
    .from("restaurants")
    .update({
      name,
      accent_color: /^#[0-9a-f]{6}$/i.test(accent) ? accent : restaurant.accent_color,
      languages: ALL_LANGS.filter((l) => languages.includes(l)),
    })
    .eq("id", restaurant.id);
  done(restaurant.slug);
}

function readI18n(formData: FormData, prefix: string, langs: Lang[]): I18nText {
  const out: I18nText = {};
  for (const l of langs) {
    const v = String(formData.get(`${prefix}_${l}`) ?? "").trim();
    if (v) out[l] = v;
  }
  return out;
}

export async function updateItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;
  const id = String(formData.get("id"));
  const priceRaw = String(formData.get("price") ?? "").replace(",", ".").trim();
  const price = priceRaw === "" ? null : Number(priceRaw);

  await supabase
    .from("items")
    .update({
      name: readI18n(formData, "name", restaurant.languages),
      description: readI18n(formData, "description", restaurant.languages),
      price: Number.isFinite(price) ? price : null,
      allergens: cleanAllergens(formData.getAll("allergens")),
      allergens_confirmed: true, // saving the item = owner reviewed the allergens
      available: formData.get("available") === "on",
    })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  done(restaurant.slug);
}

export async function addItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;
  const categoryId = String(formData.get("category_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);
  await supabase.from("items").insert({
    restaurant_id: restaurant.id,
    category_id: categoryId,
    position: count ?? 0,
    name: { [restaurant.source_lang]: name },
  });
  done(restaurant.slug);
}

export async function deleteItem(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;
  await supabase.from("items").delete().eq("id", String(formData.get("id"))).eq("restaurant_id", restaurant.id);
  done(restaurant.slug);
}

export async function updateCategory(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;
  await supabase
    .from("categories")
    .update({ name: readI18n(formData, "name", restaurant.languages) })
    .eq("id", String(formData.get("id")))
    .eq("restaurant_id", restaurant.id);
  done(restaurant.slug);
}

export async function signOut() {
  const { supabase } = await getOwnerContext();
  await supabase.auth.signOut();
  redirect("/");
}

/** Details printed on the daily malica cards. */
export async function updateCardDetails(formData: FormData) {
  const { supabase, restaurant } = await requireOwner();
  if (!restaurant) return;
  const clean = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max) || null;
  const accent = String(formData.get("accent_color") ?? "");
  await supabase
    .from("restaurants")
    .update({
      phone: clean("phone", 40),
      address: clean("address", 120),
      malica_hours: clean("malica_hours", 40),
      accent_color: /^#[0-9a-f]{6}$/i.test(accent) ? accent : restaurant.accent_color,
    })
    .eq("id", restaurant.id);
  revalidatePath("/dashboard/malica");
}
