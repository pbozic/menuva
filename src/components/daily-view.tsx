import { ALLERGENS } from "@/lib/allergens";
import { formatLongDate, localeFor } from "@/lib/dates";
import { t, type Lang } from "@/lib/languages";
import { DAILY_UI } from "@/lib/post-text";
import type { DailyMenu, Restaurant } from "@/lib/types";

/** Today's malica, used by the public page and the website widget. */
export function DailyView({
  restaurant: r,
  menu,
  lang,
  date,
  compact = false,
}: {
  restaurant: Restaurant;
  menu: DailyMenu | null;
  lang: Lang;
  date: string;
  compact?: boolean;
}) {
  const money = (v: number) => new Intl.NumberFormat(localeFor(lang), { style: "currency", currency: r.currency }).format(v);
  const note = menu ? t(menu.note, lang, r.source_lang) : "";
  const used = menu ? [...new Set(menu.items.flatMap((i) => i.allergens))].sort((a, b) => a - b) : [];

  return (
    <div style={{ ["--accent" as string]: r.accent_color }}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={`font-serif ${compact ? "text-2xl" : "text-3xl"}`}>{DAILY_UI.title[lang]}</h2>
        <span className="text-sm text-muted">{formatLongDate(date, lang)}</span>
      </div>

      {!menu || menu.items.length === 0 ? (
        <p className="mt-4 text-muted">{DAILY_UI.none[lang]}</p>
      ) : (
        <>
          <ul className={`mt-4 ${compact ? "space-y-3" : "space-y-5"}`}>
            {menu.items.map((it, i) => (
              <li key={i}>
                <div className="flex items-baseline gap-3">
                  <span className="flex-1 font-medium">{t(it.name, lang, r.source_lang)}</span>
                  {it.price != null && <span className="tabular-nums text-accent">{money(it.price)}</span>}
                </div>
                {(t(it.description, lang, r.source_lang) || it.allergens.length > 0) && (
                  <p className="text-sm text-muted">
                    {t(it.description, lang, r.source_lang)}
                    {it.allergens.length > 0 && (
                      <span title={it.allergens.map((a) => ALLERGENS[a]?.[lang]).join(", ")}>
                        {" "}
                        ({it.allergens.join(", ")})
                      </span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {menu.set_price != null && (
            <p className="mt-5 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white">
              {DAILY_UI.setPrice[lang]}: {money(menu.set_price)}
            </p>
          )}
          {note && <p className="mt-3 text-sm text-muted">{note}</p>}
          {used.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              {DAILY_UI.allergens[lang]}: {used.map((a) => `${a} ${ALLERGENS[a][lang]}`).join(" · ")}
            </p>
          )}
        </>
      )}

      {!compact && (r.malica_hours || r.phone || r.address) && (
        <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
          {[r.malica_hours && `${DAILY_UI.served[lang]} ${r.malica_hours}`, r.phone, r.address].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
