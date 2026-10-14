export const LANGUAGES = {
  sl: { label: "Slovenščina", short: "SL", flag: "🇸🇮" },
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  de: { label: "Deutsch", short: "DE", flag: "🇩🇪" },
  it: { label: "Italiano", short: "IT", flag: "🇮🇹" },
  hr: { label: "Hrvatski", short: "HR", flag: "🇭🇷" },
} as const;

export type Lang = keyof typeof LANGUAGES;
export const ALL_LANGS = Object.keys(LANGUAGES) as Lang[];

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && v in LANGUAGES;
}

/** Translatable text: {"sl": "Jota", "en": "Jota – sauerkraut and bean stew"} */
export type I18nText = Partial<Record<Lang, string>>;

/** Pick text in the wanted language, falling back to the source language. */
export function t(text: I18nText | null | undefined, lang: Lang, fallback: Lang = "sl"): string {
  if (!text) return "";
  return text[lang] || text[fallback] || Object.values(text).find(Boolean) || "";
}

/** UI strings for the public menu page. */
export const UI = {
  allergens: { sl: "Alergeni", en: "Allergens", de: "Allergene", it: "Allergeni", hr: "Alergeni" },
  noAllergens: {
    sl: "Za informacije o alergenih vprašajte osebje.",
    en: "Ask our staff about allergens.",
    de: "Fragen Sie unser Personal nach Allergenen.",
    it: "Chiedete al personale informazioni sugli allergeni.",
    hr: "Za informacije o alergenima pitajte osoblje.",
  },
  unavailable: { sl: "Trenutno ni na voljo", en: "Currently unavailable", de: "Derzeit nicht verfügbar", it: "Al momento non disponibile", hr: "Trenutno nije dostupno" },
} satisfies Record<string, Record<Lang, string>>;
