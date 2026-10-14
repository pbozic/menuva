"use client";

import { useState } from "react";
import { LANGUAGES, type Lang } from "@/lib/languages";
import { CHANNELS, type Channel } from "@/lib/post-text";

type Props = {
  slug: string;
  date: string;
  version: string;
  langs: Lang[];
  siteUrl: string;
  /** posts[channel][langKey] where langKey is "sl" or "sl+en" */
  posts: Record<Channel, Record<string, string>>;
  published: boolean;
};

function CopyButton({ text, label = "Kopiraj" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? "Kopirano ✓" : label}
    </button>
  );
}

export function DailyOutputs({ slug, date, version, langs, siteUrl, posts, published }: Props) {
  const [lang, setLang] = useState<Lang>(langs[0]);
  const [channel, setChannel] = useState<Channel>("facebook");
  const second = langs.includes("en") && langs[0] !== "en" ? "en" : null;
  const [bilingual, setBilingual] = useState(!!second);
  const postKey = bilingual && second ? `${langs[0]}+${second}` : lang;
  const text = posts[channel][postKey] ?? posts[channel][lang];
  const card = (format: "story" | "post") => `/api/card/${slug}?date=${date}&lang=${lang}&format=${format}&v=${encodeURIComponent(version)}`;
  const dailyUrl = `${siteUrl}/d/${slug}`;
  const widget = `<script src="${siteUrl}/widget.js" data-restaurant="${slug}" async></script>`;

  async function share(format: "story" | "post") {
    const res = await fetch(card(format));
    const blob = await res.blob();
    const file = new File([blob], `malica-${date}-${format}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    }
  }

  return (
    <section className="space-y-6">
      {!published && (
        <p className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900">
          Predogled osnutka — gostje ga še ne vidijo. Kliknite »Objavi malico«.
        </p>
      )}

      <div className="flex flex-wrap gap-1">
        {langs.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`rounded-full px-3 py-1.5 text-sm ${l === lang ? "bg-foreground text-background" : "border border-line bg-card"}`}
          >
            {LANGUAGES[l].flag} {LANGUAGES[l].short}
          </button>
        ))}
      </div>

      {/* Image cards */}
      <div>
        <h3 className="font-semibold">Slike za objavo</h3>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:max-w-lg">
          {(["story", "post"] as const).map((f) => (
            <div key={f} className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card(f)} alt={f === "story" ? "Zgodba" : "Objava"} className="w-full rounded-lg border border-line" />
              <button type="button" className="btn-ghost w-full" onClick={() => share(f)}>
                {f === "story" ? "Zgodba 9:16" : "Objava 4:5"} ↓
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Post text */}
      <div>
        <h3 className="font-semibold">Besedilo objave</h3>
        <div className="mt-3 flex flex-wrap items-center gap-1">
          {(Object.keys(CHANNELS) as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`rounded-lg px-3 py-1.5 text-sm ${c === channel ? "bg-foreground text-background" : "border border-line bg-card"}`}
            >
              {CHANNELS[c]}
            </button>
          ))}
          {second && (
            <label className="ml-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={bilingual} onChange={(e) => setBilingual(e.target.checked)} />
              {LANGUAGES[langs[0]].short} + {LANGUAGES[second].short}
            </label>
          )}
        </div>
        <textarea readOnly value={text} className="input mt-3 min-h-64 font-mono text-xs" />
        <div className="mt-2">
          <CopyButton text={text} label="Kopiraj besedilo" />
        </div>
      </div>

      {/* Link, QR, widget */}
      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Povezava, ki vedno kaže današnjo malico</h3>
            <div className="mt-2 flex gap-2">
              <input readOnly value={dailyUrl} className="input" />
              <CopyButton text={dailyUrl} />
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Za vašo spletno stran</h3>
            <p className="text-sm text-muted">Prilepite enkrat — malica se nato posodablja sama.</p>
            <div className="mt-2 flex gap-2">
              <input readOnly value={widget} className="input font-mono text-xs" />
              <CopyButton text={widget} />
            </div>
          </div>
        </div>
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/qr/${slug}?target=daily`} alt="QR koda za dnevno malico" className="mx-auto w-36" />
          <a href={`/api/qr/${slug}?target=daily&format=png`} className="btn-ghost mt-2 w-full">
            QR za izlog ↓
          </a>
        </div>
      </div>
    </section>
  );
}
