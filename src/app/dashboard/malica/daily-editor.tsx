"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ALLERGENS, ALLERGEN_IDS } from "@/lib/allergens";
import type { DailyDraft } from "@/lib/daily";
import type { Lang } from "@/lib/languages";
import type { DailyMenu } from "@/lib/types";

type Row = { name: string; description: string; price: string; allergens: number[] };

const emptyRow = (): Row => ({ name: "", description: "", price: "", allergens: [] });
const priceStr = (p: number | null | undefined) => (p == null ? "" : String(p).replace(".", ","));

function rowsFrom(menu: DailyMenu | null, src: Lang): Row[] {
  if (!menu?.items.length) return [emptyRow()];
  return menu.items.map((i) => ({
    name: i.name[src] ?? "",
    description: i.description[src] ?? "",
    price: priceStr(i.price),
    allergens: i.allergens,
  }));
}

export function DailyEditor({ date, initial, sourceLang }: { date: string; initial: DailyMenu | null; sourceLang: Lang }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>(() => rowsFrom(initial, sourceLang));
  const [setPrice, setSetPrice] = useState(priceStr(initial?.set_price));
  const [note, setNote] = useState(initial?.note[sourceLang] ?? "");
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState<null | "read" | "save" | "publish">(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  async function read(file?: File) {
    if (!file && !pasted.trim()) return;
    setBusy("read");
    setMsg(null);
    const fd = new FormData();
    if (file) fd.append("file", file);
    else fd.append("text", pasted);
    try {
      const res = await fetch("/api/daily/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const d = data.draft as DailyDraft;
      setRows(d.items.map((i) => ({ ...i, price: priceStr(i.price) })));
      setSetPrice(priceStr(d.set_price));
      setNote(d.note);
      setPasted("");
      setMsg({ kind: "ok", text: "Prebrano. Preverite jedi in alergene, nato objavite." });
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Branje ni uspelo" });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save(publish: boolean) {
    setBusy(publish ? "publish" : "save");
    setMsg(null);
    try {
      const res = await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          publish,
          draft: { items: rows.filter((r) => r.name.trim()), set_price: setPrice, note },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg({ kind: "ok", text: publish ? "Objavljeno! Kartice in besedila so spodaj." : "Osnutek shranjen." });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Shranjevanje ni uspelo" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Quick input */}
      <div className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            📷 {busy === "read" ? "Berem…" : "Fotografiraj tablo"}
          </button>
          <span className="text-sm text-muted">ali prilepite besedilo objave</span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && read(e.target.files[0])}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <textarea
            className="input min-h-12"
            rows={2}
            placeholder="Malica danes: goveja juha, pečen piščanec s pražen krompirjem, solata – 8,50 €"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <button type="button" className="btn-ghost shrink-0 self-start" disabled={!!busy || !pasted.trim()} onClick={() => read()}>
            Preberi
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="rounded-xl border border-line bg-card p-4">
            <div className="flex gap-2">
              <input
                className="input font-medium"
                placeholder={`Jed ${i + 1}`}
                value={row.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <input
                className="input w-24 shrink-0 text-right tabular-nums"
                inputMode="decimal"
                placeholder="€"
                value={row.price}
                onChange={(e) => update(i, { price: e.target.value })}
              />
              <button
                type="button"
                aria-label="Odstrani jed"
                className="btn-ghost shrink-0 px-3"
                onClick={() => setRows((r) => (r.length > 1 ? r.filter((_, j) => j !== i) : [emptyRow()]))}
              >
                ✕
              </button>
            </div>
            <input
              className="input mt-2"
              placeholder="Priloga / opis (neobvezno)"
              value={row.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Alergeni">
              {ALLERGEN_IDS.map((id) => {
                const on = row.allergens.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    title={ALLERGENS[id].sl}
                    aria-pressed={on}
                    onClick={() =>
                      update(i, { allergens: on ? row.allergens.filter((a) => a !== id) : [...row.allergens, id].sort((a, b) => a - b) })
                    }
                    className={`h-7 min-w-7 rounded-full border px-2 text-xs tabular-nums ${
                      on ? "border-foreground bg-foreground text-background" : "border-line text-muted"
                    }`}
                  >
                    {id}
                  </button>
                );
              })}
              <span className="self-center pl-1 text-xs text-muted">
                {row.allergens.length ? row.allergens.map((a) => ALLERGENS[a].sl).join(", ") : "alergeni"}
              </span>
            </div>
          </div>
        ))}
        <button type="button" className="btn-ghost" onClick={() => setRows((r) => [...r, emptyRow()])}>
          + Dodaj jed
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <div>
          <label className="label" htmlFor="set-price">Cena malice (€)</label>
          <input id="set-price" className="input tabular-nums" inputMode="decimal" value={setPrice} onChange={(e) => setSetPrice(e.target.value)} placeholder="npr. 8,50" />
        </div>
        <div>
          <label className="label" htmlFor="note">Opomba</label>
          <input id="note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. Vegetarijanska možnost na voljo" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary px-6" disabled={!!busy} onClick={() => save(true)}>
          {busy === "publish" ? "Prevajam in objavljam…" : initial?.published ? "Posodobi objavo" : "Objavi malico"}
        </button>
        <button type="button" className="btn-ghost" disabled={!!busy} onClick={() => save(false)}>
          {busy === "save" ? "Shranjujem…" : initial?.published ? "Skrij (osnutek)" : "Shrani osnutek"}
        </button>
        {msg && <p className={`text-sm ${msg.kind === "ok" ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}
