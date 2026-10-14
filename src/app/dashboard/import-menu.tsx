"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportMenu({ hasMenu }: { hasMenu: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"replace" | "append">(hasMenu ? "append" : "replace");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !text.trim()) return;
    if (mode === "replace" && hasMenu && !confirm("To bo zamenjalo celoten obstoječi meni. Nadaljujem?")) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    if (file) fd.append("file", file);
    if (text.trim()) fd.append("text", text);
    fd.append("mode", mode);
    try {
      const res = await fetch("/api/menu/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Uvoz ni uspel");
      setMsg({ kind: "ok", text: `Uvoženih ${data.items} jedi v ${data.categories} kategorijah. Preverite alergene spodaj.` });
      setFile(null);
      setText("");
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Uvoz ni uspel" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-card p-5">
      <div>
        <h2 className="font-semibold">{hasMenu ? "Uvozi še en meni" : "Uvozite svoj meni"}</h2>
        <p className="text-sm text-muted">Fotografija (JPG/PNG), PDF ali prilepljeno besedilo. Traja 30–90 sekund.</p>
      </div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:text-background"
      />
      <textarea
        className="input min-h-24"
        placeholder="…ali prilepite besedilo menija"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {hasMenu && (
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "append"} onChange={() => setMode("append")} /> Dodaj k obstoječemu
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} /> Zamenjaj vse
          </label>
        </div>
      )}
      <button className="btn-primary" disabled={busy || (!file && !text.trim())}>
        {busy ? "Berem in prevajam meni…" : "Uvozi in prevedi"}
      </button>
      {msg && <p className={`text-sm ${msg.kind === "ok" ? "text-green-800" : "text-red-700"}`}>{msg.text}</p>}
    </form>
  );
}
