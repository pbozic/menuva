import type { Lang } from "./languages";

export const TIME_ZONE = "Europe/Ljubljana";

const LOCALES: Record<Lang, string> = { sl: "sl-SI", en: "en-GB", de: "de-AT", it: "it-IT", hr: "hr-HR" };

/** Today's date in Slovenia as YYYY-MM-DD. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function isISODate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

/** "Sreda, 14. oktober" / "Wednesday 14 October" — only the first letter is capitalised (months stay lowercase in SL/IT/HR). */
export function formatLongDate(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const s = new Intl.DateTimeFormat(LOCALES[lang], { timeZone: TIME_ZONE, weekday: "long", day: "numeric", month: "long" }).format(d);
  return s.charAt(0).toLocaleUpperCase(LOCALES[lang]) + s.slice(1);
}

export function localeFor(lang: Lang): string {
  return LOCALES[lang];
}
