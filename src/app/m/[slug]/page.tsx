import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALLERGENS } from "@/lib/allergens";
import { DEMO_MENU } from "@/lib/demo";
import { isLang, LANGUAGES, t, UI, type Lang } from "@/lib/languages";
import { formatPrice, loadMenu } from "@/lib/menu";
import type { MenuData } from "@/lib/types";

const LOCALE: Record<Lang, string> = { sl: "sl-SI", en: "en-GB", de: "de-AT", it: "it-IT", hr: "hr-HR" };

async function getMenu(slug: string): Promise<MenuData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const menu = await loadMenu(createClient(url, key), { slug });
    if (menu) return menu;
  }
  return slug === "demo" ? DEMO_MENU : null;
}

export async function generateMetadata({ params }: PageProps<"/m/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);
  return { title: menu ? `${menu.restaurant.name} — Menu` : "Menu" };
}

export default async function PublicMenu({ params, searchParams }: PageProps<"/m/[slug]">) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const menu = await getMenu(slug);
  if (!menu) notFound();

  const { restaurant } = menu;
  const lang: Lang = isLang(langParam) && restaurant.languages.includes(langParam) ? langParam : restaurant.source_lang;
  const categories = menu.categories.filter((c) => c.items.length > 0);
  const usedAllergens = [...new Set(categories.flatMap((c) => c.items.flatMap((i) => i.allergens)))].sort((a, b) => a - b);

  return (
    <main lang={lang} className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16" style={{ ["--accent" as string]: restaurant.accent_color }}>
      <header className="pt-10 pb-6 text-center">
        <h1 className="font-serif text-4xl text-accent">{restaurant.name}</h1>
      </header>

      <nav className="no-print sticky top-0 z-10 -mx-5 flex justify-center gap-1 overflow-x-auto bg-background/95 px-5 py-3 backdrop-blur">
        {restaurant.languages.map((l) => (
          <Link
            key={l}
            href={`?lang=${l}`}
            replace
            scroll={false}
            className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
              l === lang ? "bg-accent text-white" : "border border-line bg-card"
            }`}
          >
            {LANGUAGES[l].flag} {LANGUAGES[l].short}
          </Link>
        ))}
      </nav>

      {categories.map((cat) => (
        <section key={cat.id} className="mt-10">
          <h2 className="border-b border-line pb-2 font-serif text-2xl">{t(cat.name, lang, restaurant.source_lang)}</h2>
          <ul className="mt-4 space-y-5">
            {cat.items.map((item) => (
              <li key={item.id} className={`menu-item ${item.available ? "" : "opacity-50"}`}>
                <div className="flex items-baseline gap-3">
                  <h3 className="flex-1 font-medium">{t(item.name, lang, restaurant.source_lang)}</h3>
                  <span className="tabular-nums">{formatPrice(item.price, restaurant.currency, LOCALE[lang])}</span>
                </div>
                {t(item.description, lang, restaurant.source_lang) && (
                  <p className="mt-0.5 text-sm text-muted">{t(item.description, lang, restaurant.source_lang)}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                  {item.allergens.length > 0 && (
                    <span title={item.allergens.map((a) => ALLERGENS[a]?.[lang]).join(", ")}>
                      {UI.allergens[lang]}: {item.allergens.join(", ")}
                    </span>
                  )}
                  {!item.available && <span>{UI.unavailable[lang]}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="mt-14 rounded-xl border border-line bg-card p-5 text-sm">
        <h2 className="font-semibold">{UI.allergens[lang]}</h2>
        {usedAllergens.length > 0 && (
          <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
            {usedAllergens.map((a) => (
              <li key={a}>
                <span className="inline-block w-6 tabular-nums">{a}.</span> {ALLERGENS[a][lang]}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-muted">{UI.noAllergens[lang]}</p>
      </footer>
    </main>
  );
}
