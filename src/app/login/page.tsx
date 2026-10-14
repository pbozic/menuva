"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-serif text-3xl">Prijava</h1>
      {state === "sent" ? (
        <p className="mt-4 text-muted">
          Poslali smo vam povezavo za prijavo na <strong className="text-foreground">{email}</strong>. Odprite e-pošto in
          kliknite povezavo.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              E-pošta
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lastnik@gostilna.si"
            />
          </div>
          <button className="btn-primary w-full" disabled={state === "sending"}>
            {state === "sending" ? "Pošiljam…" : "Pošlji povezavo za prijavo"}
          </button>
          {state === "error" && <p className="text-sm text-red-700">{error}</p>}
        </form>
      )}
    </main>
  );
}
