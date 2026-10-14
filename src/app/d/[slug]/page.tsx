import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { DailyView } from "@/components/daily-view";
import { loadDaily } from "@/lib/daily";
import { todayISO } from "@/lib/dates";
import { isLang, LANGUAGES, type Lang } from "@/lib/languages";
import { publicClient } from "@/lib/public-supabase";

async function get(slug: string) {
  await connection(); // "today" depends on the request time
  return loadDaily(publicClient(), slug, todayISO()).catch(() => (slug === "demo" ? loadDaily(null, slug, todayISO()) : null));
}

export async function generateMetadata({ params }: PageProps<"/d/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await get(slug);
  return { title: found ? `${found.restaurant.name} — malica danes` : "Malica" };
}

/** Always shows today's malica — this is the link/QR restaurants share. */
export default async function DailyPage({ params, searchParams }: PageProps<"/d/[slug]">) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const found = await get(slug);
  if (!found) notFound();
  const { restaurant: r, menu } = found;
  const lang: Lang = isLang(langParam) && r.languages.includes(langParam) ? langParam : r.source_lang;

  return (
    <main lang={lang} className="mx-auto w-full max-w-xl flex-1 px-5 pb-16" style={{ ["--accent" as string]: r.accent_color }}>
      <header className="pt-10 pb-4 text-center">
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">{r.name}</p>
      </header>
      <nav className="mb-6 flex justify-center gap-1 overflow-x-auto">
        {r.languages.map((l) => (
          <Link
            key={l}
            href={`?lang=${l}`}
            replace
            scroll={false}
            className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${l === lang ? "bg-accent text-white" : "border border-line bg-card"}`}
          >
            {LANGUAGES[l].flag} {LANGUAGES[l].short}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl border border-line bg-card p-6">
        <DailyView restaurant={r} menu={menu} lang={lang} date={todayISO()} />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href={`/m/${r.slug}?lang=${lang}`} className="text-muted underline">
          {lang === "sl" ? "Celoten jedilni list" : "Full menu"} →
        </Link>
      </p>
    </main>
  );
}
