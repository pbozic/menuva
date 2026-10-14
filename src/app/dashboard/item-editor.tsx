"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALLERGENS, ALLERGEN_IDS } from "@/lib/allergens";
import { LANGUAGES, t, type Lang } from "@/lib/languages";
import { formatPrice } from "@/lib/menu";
import type { Item } from "@/lib/types";
import { deleteItem, updateItem } from "./actions";

export function ItemEditor({ item, langs, sourceLang }: { item: Item; langs: Lang[]; sourceLang: Lang }) {
  const router = useRouter();
  const [retranslating, setRetranslating] = useState(false);

  async function retranslate() {
    setRetranslating(true);
    try {
      const res = await fetch("/api/menu/retranslate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (!res.ok) alert((await res.json()).error || "Prevod ni uspel");
      router.refresh();
    } finally {
      setRetranslating(false);
    }
  }

  return (
    <details className="group rounded-lg border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className={`flex-1 ${item.available ? "" : "text-muted line-through"}`}>{t(item.name, sourceLang)}</span>
        {!item.allergens_confirmed && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">preveri alergene</span>
        )}
        <span className="text-sm tabular-nums text-muted">{formatPrice(item.price)}</span>
      </summary>

      {/* key forces the form to reset when the server data changes (e.g. after re-translation) */}
      <form key={JSON.stringify([item.name, item.description])} action={updateItem} className="space-y-4 border-t border-line px-4 py-4">
        <input type="hidden" name="id" value={item.id} />

        {langs.map((l) => (
          <fieldset key={l} className="grid gap-2 sm:grid-cols-[3rem_1fr]">
            <legend className="sr-only">{LANGUAGES[l].label}</legend>
            <span className="pt-2 text-sm font-medium" title={LANGUAGES[l].label}>
              {LANGUAGES[l].flag} {LANGUAGES[l].short}
            </span>
            <div className="space-y-2">
              <input name={`name_${l}`} defaultValue={item.name[l] ?? ""} className="input font-medium" placeholder="Ime jedi" />
              <textarea
                name={`description_${l}`}
                defaultValue={item.description[l] ?? ""}
                className="input min-h-10"
                rows={1}
                placeholder="Opis (neobvezno)"
              />
            </div>
          </fieldset>
        ))}

        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className="label">Cena (€)</label>
            <input name="price" inputMode="decimal" defaultValue={item.price ?? ""} className="input tabular-nums" />
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" name="available" defaultChecked={item.available} /> Na voljo
            </label>
          </div>
          <div>
            <p className="label">Alergeni {item.allergens_confirmed ? "" : "— predlog AI, prosimo preverite"}</p>
            <div className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
              {ALLERGEN_IDS.map((id) => (
                <label key={id} className="flex items-center gap-2">
                  <input type="checkbox" name="allergens" value={id} defaultChecked={item.allergens.includes(id)} />
                  <span>
                    {id}. {ALLERGENS[id].sl}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">Shrani</button>
          <button type="button" className="btn-ghost" onClick={retranslate} disabled={retranslating}>
            {retranslating ? "Prevajam…" : `Ponovno prevedi iz ${LANGUAGES[sourceLang].short}`}
          </button>
          <button
            formAction={deleteItem}
            className="btn-ghost ml-auto text-red-700"
            onClick={(e) => {
              if (!confirm("Izbrišem to jed?")) e.preventDefault();
            }}
          >
            Izbriši
          </button>
        </div>
      </form>
    </details>
  );
}
