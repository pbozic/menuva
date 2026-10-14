import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOwnerContext } from "@/lib/supabase/server";

/** Stripe customer portal: change card, download invoices, cancel. */
export async function POST(req: Request) {
  const { restaurant } = await getOwnerContext();
  const origin = new URL(req.url).origin;
  if (!restaurant?.stripe_customer_id) return NextResponse.redirect(`${origin}/dashboard/billing`, 303);
  const session = await stripe().billingPortal.sessions.create({
    customer: restaurant.stripe_customer_id,
    return_url: `${origin}/dashboard/billing`,
    locale: "sl",
  });
  return NextResponse.redirect(session.url, 303);
}
