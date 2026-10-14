import type { Lang } from "./languages";

/**
 * The 14 allergens that must be declared under EU Regulation 1169/2011, Annex II.
 * Numbered 1–14 as is common on Slovenian menus.
 */
export const ALLERGENS: Record<number, { icon: string } & Record<Lang, string>> = {
  1: { icon: "🌾", sl: "Žita z glutenom", en: "Cereals containing gluten", de: "Glutenhaltiges Getreide", it: "Cereali contenenti glutine", hr: "Žitarice s glutenom" },
  2: { icon: "🦐", sl: "Raki", en: "Crustaceans", de: "Krebstiere", it: "Crostacei", hr: "Rakovi" },
  3: { icon: "🥚", sl: "Jajca", en: "Eggs", de: "Eier", it: "Uova", hr: "Jaja" },
  4: { icon: "🐟", sl: "Ribe", en: "Fish", de: "Fisch", it: "Pesce", hr: "Riba" },
  5: { icon: "🥜", sl: "Arašidi", en: "Peanuts", de: "Erdnüsse", it: "Arachidi", hr: "Kikiriki" },
  6: { icon: "🫘", sl: "Soja", en: "Soybeans", de: "Soja", it: "Soia", hr: "Soja" },
  7: { icon: "🥛", sl: "Mleko in laktoza", en: "Milk and lactose", de: "Milch und Laktose", it: "Latte e lattosio", hr: "Mlijeko i laktoza" },
  8: { icon: "🌰", sl: "Oreški", en: "Tree nuts", de: "Schalenfrüchte", it: "Frutta a guscio", hr: "Orašasti plodovi" },
  9: { icon: "🥬", sl: "Listna zelena", en: "Celery", de: "Sellerie", it: "Sedano", hr: "Celer" },
  10: { icon: "🟡", sl: "Gorčično seme", en: "Mustard", de: "Senf", it: "Senape", hr: "Gorušica" },
  11: { icon: "⚪", sl: "Sezamovo seme", en: "Sesame seeds", de: "Sesam", it: "Sesamo", hr: "Sezam" },
  12: { icon: "🍷", sl: "Žveplov dioksid in sulfiti", en: "Sulphur dioxide and sulphites", de: "Schwefeldioxid und Sulfite", it: "Anidride solforosa e solfiti", hr: "Sumporni dioksid i sulfiti" },
  13: { icon: "🫛", sl: "Volčji bob", en: "Lupin", de: "Lupinen", it: "Lupini", hr: "Lupina" },
  14: { icon: "🐚", sl: "Mehkužci", en: "Molluscs", de: "Weichtiere", it: "Molluschi", hr: "Mekušci" },
};

export const ALLERGEN_IDS = Object.keys(ALLERGENS).map(Number);

export function cleanAllergens(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.map(Number).filter((n) => ALLERGEN_IDS.includes(n)))].sort((a, b) => a - b);
}
