import { connection } from "next/server";
import { DailyView } from "@/components/daily-view";
import { loadDaily } from "@/lib/daily";
import { todayISO } from "@/lib/dates";
import { isLang, type Lang } from "@/lib/languages";
import { publicClient } from "@/lib/public-supabase";
import { ResizeReporter } from "./resize-reporter";

/** Compact widget shown inside an iframe on the restaurant's own website (see public/widget.js). */
export default async function Embed({ params, searchParams }: PageProps<"/embed/[slug]">) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  await connection();
  const date = todayISO();
  const found = await loadDaily(publicClient(), slug, date).catch(() => (slug === "demo" ? loadDaily(null, slug, date) : null));
  if (!found) return <p className="p-4 text-sm text-muted">Menuva: restavracija ni najdena.</p>;
  const lang: Lang = isLang(langParam) && found.restaurant.languages.includes(langParam) ? langParam : found.restaurant.source_lang;

  return (
    <div id="menuva-embed" className="bg-card p-5">
      <DailyView restaurant={found.restaurant} menu={found.menu} lang={lang} date={date} compact />
      <ResizeReporter />
    </div>
  );
}
