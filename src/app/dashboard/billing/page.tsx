import { redirect } from "next/navigation";
import { hasAccess, trialDaysLeft } from "@/lib/billing";
import { billingConfigured } from "@/lib/stripe";
import { getOwnerContext } from "@/lib/supabase/server";
import { CreateRestaurant } from "../create-restaurant";

const STATUS: Record<string, string> = {
  trialing: "Preizkusno obdobje",
  active: "Aktivna naročnina",
  past_due: "Plačilo zamuja — posodobite kartico",
  incomplete: "Plačilo ni dokončano",
  canceled: "Naročnina preklicana",
};

export default async function BillingPage({ searchParams }: PageProps<"/dashboard/billing">) {
  const { user, restaurant: r } = await getOwnerContext();
  if (!user) redirect("/login");
  if (!r) return <CreateRestaurant />;
  const { success, error } = await searchParams;
  const price = process.env.NEXT_PUBLIC_PRICE_LABEL || "12,90 € / mesec + DDV";
  const paid = r.subscription_status === "active" || r.subscription_status === "past_due";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl">Naročnina</h1>

      {success && !paid && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-900">Hvala! Potrjujemo plačilo — osvežite stran čez nekaj sekund.</p>
      )}
      {error === "not-configured" && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">Plačila še niso nastavljena (manjkata STRIPE_SECRET_KEY / STRIPE_PRICE_ID).</p>
      )}

      <div className="mt-6 rounded-xl border border-line bg-card p-6">
        <p className="text-sm text-muted">Stanje</p>
        <p className="mt-1 text-xl font-semibold">{STATUS[r.subscription_status] ?? r.subscription_status}</p>
        {r.subscription_status === "trialing" && (
          <p className="mt-1 text-sm text-muted">
            {hasAccess(r) ? `Še ${trialDaysLeft(r)} dni brezplačno.` : "Preizkusno obdobje je poteklo."}
          </p>
        )}

        <div className="mt-6 border-t border-line pt-6">
          <p className="font-serif text-2xl">{price}</p>
          <ul className="mt-3 space-y-1 text-sm text-muted">
            <li>✓ Dnevna malica s fotografije v 20 sekundah</li>
            <li>✓ Slike za Instagram in Facebook, besedila za objave</li>
            <li>✓ Prevodi v EN, DE, IT, HR z alergeni</li>
            <li>✓ Spletni pripomoček in QR koda</li>
            <li>✓ Celoten jedilni list v petih jezikih</li>
          </ul>
          {paid && r.stripe_customer_id ? (
            <form action="/api/billing/portal" method="post" className="mt-6">
              <button className="btn-ghost w-full">Upravljaj naročnino in račune</button>
            </form>
          ) : (
            <form action="/api/billing/checkout" method="post" className="mt-6">
              <button className="btn-primary w-full py-3" disabled={!billingConfigured()}>
                Naroči se
              </button>
              <p className="mt-2 text-center text-xs text-muted">Prekličete lahko kadarkoli.</p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
