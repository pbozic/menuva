import { formatLongDate, localeFor } from "./dates";
import { t, type Lang } from "./languages";
import type { DailyMenu, Restaurant } from "./types";

export type Channel = "facebook" | "instagram" | "google";

export const CHANNELS: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google profil",
};

export const DAILY_UI = {
  title: { sl: "Malica danes", en: "Today's lunch", de: "Mittagsmenü heute", it: "Pranzo di oggi", hr: "Dnevni meni" },
  setPrice: { sl: "Cena malice", en: "Lunch price", de: "Menüpreis", it: "Prezzo del menù", hr: "Cijena menija" },
  served: { sl: "Strežemo", en: "Served", de: "Serviert", it: "Serviamo", hr: "Poslužujemo" },
  allergens: { sl: "Alergeni", en: "Allergens", de: "Allergene", it: "Allergeni", hr: "Alergeni" },
  allergenHint: {
    sl: "številke v oklepaju po EU seznamu 14 alergenov",
    en: "numbers in brackets refer to the 14 EU allergens",
    de: "Zahlen in Klammern gemäß den 14 EU-Allergenen",
    it: "i numeri tra parentesi si riferiscono ai 14 allergeni UE",
    hr: "brojevi u zagradama prema EU popisu 14 alergena",
  },
  none: {
    sl: "Za danes malica še ni objavljena.",
    en: "Today's lunch menu hasn't been posted yet.",
    de: "Das heutige Mittagsmenü ist noch nicht veröffentlicht.",
    it: "Il menù di oggi non è ancora stato pubblicato.",
    hr: "Današnji meni još nije objavljen.",
  },
  hashtags: {
    sl: "#malica #dnevnamalica #kosilo",
    en: "#lunch #dailyspecial #slovenia",
    de: "#mittagsmenü #slowenien",
    it: "#pranzo #slovenia",
    hr: "#dnevnimeni #rucak",
  },
} satisfies Record<string, Record<Lang, string>>;

const money = (v: number, lang: Lang, currency: string) =>
  new Intl.NumberFormat(localeFor(lang), { style: "currency", currency }).format(v);

function block(r: Restaurant, m: DailyMenu, lang: Lang, channel: Channel): string {
  const src = r.source_lang;
  const bullet = channel === "google" ? "•" : "🍽️";
  const lines: string[] = [];
  lines.push(`${channel === "google" ? "" : "☀️ "}${DAILY_UI.title[lang]} – ${formatLongDate(m.menu_date, lang)}`);
  lines.push("");
  for (const it of m.items) {
    const name = t(it.name, lang, src);
    const desc = t(it.description, lang, src);
    const price = it.price != null ? ` – ${money(it.price, lang, r.currency)}` : "";
    // Allergen numbers inline after each dish, e.g. "(1, 3, 9)"; Instagram stays clean.
    const allergens = channel !== "instagram" && it.allergens.length ? ` (${it.allergens.join(", ")})` : "";
    lines.push(`${bullet} ${name}${desc ? `, ${desc}` : ""}${allergens}${price}`);
  }
  if (m.set_price != null) {
    lines.push("");
    lines.push(`${channel === "google" ? "" : "💶 "}${DAILY_UI.setPrice[lang]}: ${money(m.set_price, lang, r.currency)}`);
  }
  const note = t(m.note, lang, src);
  if (note) lines.push(note);
  return lines.join("\n");
}

/** Ready-to-paste post text. Pass two languages for a bilingual post (e.g. ["sl", "en"]). */
export function buildPost(r: Restaurant, m: DailyMenu, channel: Channel, langs: Lang[]): string {
  const parts = langs.map((l) => block(r, m, l, channel));
  const footer: string[] = [];
  const main = langs[0];
  if (r.malica_hours) footer.push(`${channel === "google" ? "" : "🕚 "}${DAILY_UI.served[main]}: ${r.malica_hours}`);
  if (r.phone) footer.push(`${channel === "google" ? "" : "📞 "}${r.phone}`);
  if (r.address && channel !== "google") footer.push(`📍 ${r.address}`);

  if (channel !== "instagram" && m.items.some((i) => i.allergens.length)) {
    footer.push(`${DAILY_UI.allergens[main]}: ${DAILY_UI.allergenHint[main]}`);
  }

  let text = parts.join("\n\n— — —\n\n");
  if (footer.length) text += `\n\n${footer.join("\n")}`;
  if (channel !== "google") text += `\n\n${langs.map((l) => DAILY_UI.hashtags[l]).join(" ")}`;
  // Google Business posts allow 1500 characters.
  return channel === "google" ? text.slice(0, 1500) : text;
}
