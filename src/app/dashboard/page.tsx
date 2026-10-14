import Link from "next/link";
import { redirect } from "next/navigation";
import { ALL_LANGS, LANGUAGES, t } from "@/lib/languages";
import { loadMenu } from "@/lib/menu";
import { getOwnerContext } from "@/lib/supabase/server";
import { addItem, createRestaurant, signOut, updateCategory, updateRestaurant } from "./actions";
import { ImportMenu } from "./import-menu";
import { ItemEditor } from "./item-editor";

export default async function Dashboard() {
  const { supabase, user, restaurant } = await getOwnerContext();
  if (!user) redirect("/login");

  if (!restaurant) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-20">
        <h1 className="font-serif text-3xl">Dobrodošli</h1>
        <p className="mt-2 text-muted">Kako se imenuje vaša restavracija?</p>
        <form action={createRestaurant} className="mt-6 space-y-4">
          <input name="name" required className="input" placeholder="Gostilna Pri Lojzetu" />
          <button className="btn-primary w-full">Nadaljuj</button>
        </form>
      </main>
    );
  }

  const menu = await loadMenu(supabase, { id: restaurant.id });
  const categories = menu?.categories ?? [];
  const itemCount = categories.reduce((n, c) => n + c.items.length, 0);
  const unconfirmed = categories.reduce((n, c) => n + c.items.filter((i) => !i.allergens_confirmed).length, 0);
  const langs = restaurant.languages;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="text-sm text-muted">Menuva</p>
          <h1 className="font-serif text-3xl">{restaurant.name}</h1>
        </div>
        <Link href={`/m/${restaurant.slug}`} target="_blank" className="btn-ghost">
          Odpri javni meni ↗
        </Link>
        <form action={signOut}>
          <button className="btn-ghost">Odjava</button>
        </form>
      </header>

      <section className="mt-8 grid gap-6 md:grid-cols-[1fr_16rem]">
        <ImportMenu hasMenu={itemCount > 0} />

        <div className="rounded-xl border border-line bg-card p-5 text-center">
          <h2 className="font-semibold">QR koda</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${restaurant.slug}`} alt="QR koda menija" className="mx-auto mt-3 w-40" />
          <a href={`/api/qr/${restaurant.slug}?format=png`} className="btn-ghost mt-3 w-full">
            Prenesi PNG za tisk
          </a>
        </div>
      </section>

      <details className="mt-6 rounded-xl border border-line bg-card">
        <summary className="cursor-pointer px-5 py-3 font-semibold">Nastavitve</summary>
        <form action={updateRestaurant} className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
          <div>
            <label className="label">Ime</label>
            <input name="name" defaultValue={restaurant.name} className="input" />
          </div>
          <div>
            <label className="label">Barva</label>
            <input type="color" name="accent_color" defaultValue={restaurant.accent_color} className="h-10 w-20" />
          </div>
          <div className="sm:col-span-2">
            <p className="label">Jeziki na meniju</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {ALL_LANGS.map((l) => (
                <label key={l} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="languages"
                    value={l}
                    defaultChecked={langs.includes(l)}
                    disabled={l === restaurant.source_lang}
                  />
                  {LANGUAGES[l].flag} {LANGUAGES[l].label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Nov jezik se prevede ob naslednjem uvozu ali s »Ponovno prevedi« pri jedi.</p>
          </div>
          <div>
            <button className="btn-primary">Shrani nastavitve</button>
          </div>
        </form>
      </details>

      <section className="mt-10">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-2xl">Meni</h2>
          <p className="text-sm text-muted">
            {itemCount} jedi
            {unconfirmed > 0 && <span className="text-amber-800"> · {unconfirmed} z nepotrjenimi alergeni</span>}
          </p>
        </div>

        {categories.length === 0 && <p className="mt-4 text-muted">Meni je še prazen. Uvozite ga zgoraj.</p>}

        <div className="mt-6 space-y-10">
          {categories.map((cat) => (
            <div key={cat.id}>
              <details>
                <summary className="cursor-pointer list-none">
                  <h3 className="text-lg font-semibold">
                    {t(cat.name, restaurant.source_lang)} <span className="text-xs font-normal text-muted">uredi ime</span>
                  </h3>
                </summary>
                <form action={updateCategory} className="my-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={cat.id} />
                  {langs.map((l) => (
                    <div key={l} className="w-40">
                      <label className="label">{LANGUAGES[l].short}</label>
                      <input name={`name_${l}`} defaultValue={cat.name[l] ?? ""} className="input" />
                    </div>
                  ))}
                  <button className="btn-ghost">Shrani</button>
                </form>
              </details>

              <div className="mt-3 space-y-2">
                {cat.items.map((item) => (
                  <ItemEditor key={item.id} item={item} langs={langs} sourceLang={restaurant.source_lang} />
                ))}
              </div>

              <form action={addItem} className="mt-2 flex gap-2">
                <input type="hidden" name="category_id" value={cat.id} />
                <input name="name" className="input" placeholder="+ Nova jed (ime v slovenščini)" />
                <button className="btn-ghost shrink-0">Dodaj</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
