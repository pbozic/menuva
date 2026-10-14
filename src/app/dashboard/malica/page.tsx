import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAccess, trialDaysLeft } from "@/lib/billing";
import { formatLongDate, isISODate, todayISO } from "@/lib/dates";
import { buildPost, CHANNELS, type Channel } from "@/lib/post-text";
import { getOwnerContext } from "@/lib/supabase/server";
import type { DailyMenu } from "@/lib/types";
import { updateCardDetails } from "../actions";
import { CreateRestaurant } from "../create-restaurant";
import { DailyEditor } from "./daily-editor";
import { DailyOutputs } from "./outputs";

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function MalicaPage({ searchParams }: PageProps<"/dashboard/malica">) {
  const { supabase, user, restaurant: r } = await getOwnerContext();
  if (!user) redirect("/login");
  if (!r) return <CreateRestaurant />;

  const { date: dateParam } = await searchParams;
  const today = todayISO();
  const date = isISODate(dateParam) ? dateParam : today;

  const { data } = await supabase.from("daily_menus").select("*").eq("restaurant_id", r.id).eq("menu_date", date).maybeSingle();
  const menu = data as DailyMenu | null;

  const h = await headers();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`).replace(/\/$/, "");
  const langKeys: string[] = [...r.languages];
  if (r.languages.includes("en") && r.source_lang !== "en") langKeys.push(`${r.source_lang}+en`);
  const posts = menu
    ? (Object.fromEntries(
        (Object.keys(CHANNELS) as Channel[]).map((c) => [
          c,
          Object.fromEntries(langKeys.map((k) => [k, buildPost(r, menu, c, k.split("+") as typeof r.languages)])),
        ]),
      ) as Record<Channel, Record<string, string>>)
    : null;

  const access = hasAccess(r);
  const daysLeft = trialDaysLeft(r);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
      {!access ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900">
          Preizkusno obdobje je poteklo. Malice ne morete več brati s fotografije ali prevajati.{" "}
          <Link href="/dashboard/billing" className="font-medium underline">Izberite naročnino</Link>
        </p>
      ) : r.subscription_status === "trialing" ? (
        <p className="mb-6 text-sm text-muted">
          Preizkusno obdobje: še {daysLeft} {daysLeft === 1 ? "dan" : daysLeft === 2 ? "dneva" : daysLeft <= 4 ? "dnevi" : "dni"}.{" "}
          <Link href="/dashboard/billing" className="underline">Naročnina</Link>
        </p>
      ) : null}

      <header className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-muted">{r.name}</p>
          <h1 className="font-serif text-3xl">{formatLongDate(date, r.source_lang)}</h1>
        </div>
        <div className="flex gap-1 text-sm">
          <Link className="btn-ghost" href={`?date=${shiftDate(date, -1)}`}>← Prejšnji</Link>
          {date !== today && <Link className="btn-ghost" href="?">Danes</Link>}
          <Link className="btn-ghost" href={`?date=${shiftDate(date, 1)}`}>Naslednji →</Link>
        </div>
      </header>

      <div className="mt-6">
        {/* key resets the editor state when switching days */}
        <DailyEditor key={`${date}-${menu?.updated_at ?? "new"}`} date={date} initial={menu} sourceLang={r.source_lang} />
      </div>

      {menu && posts && (
        <div className="mt-12 border-t border-line pt-8">
          <h2 className="mb-4 font-serif text-2xl">Objavite</h2>
          <DailyOutputs
            slug={r.slug}
            date={date}
            version={menu.updated_at}
            langs={r.languages}
            siteUrl={siteUrl}
            posts={posts}
            published={menu.published}
          />
        </div>
      )}

      <details className="mt-12 rounded-xl border border-line bg-card">
        <summary className="cursor-pointer px-5 py-3 font-semibold">Podatki na karticah</summary>
        <form action={updateCardDetails} className="grid gap-4 border-t border-line p-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="malica_hours">Čas malice</label>
            <input id="malica_hours" name="malica_hours" defaultValue={r.malica_hours ?? ""} className="input" placeholder="11:00–15:00" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Telefon</label>
            <input id="phone" name="phone" defaultValue={r.phone ?? ""} className="input" placeholder="041 123 456" />
          </div>
          <div>
            <label className="label" htmlFor="address">Naslov</label>
            <input id="address" name="address" defaultValue={r.address ?? ""} className="input" placeholder="Trubarjeva 1, Ljubljana" />
          </div>
          <div>
            <label className="label" htmlFor="accent_color">Barva</label>
            <input id="accent_color" type="color" name="accent_color" defaultValue={r.accent_color} className="h-10 w-20" />
          </div>
          <div>
            <button className="btn-primary">Shrani</button>
          </div>
        </form>
      </details>
    </main>
  );
}
