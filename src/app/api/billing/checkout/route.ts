import { NextResponse } from "next/server";
import { billingConfigured, stripe } from "@/lib/stripe";
import { getOwnerContext } from "@/lib/supabase/server";

/** Start a Stripe Checkout subscription for the signed-in owner's restaurant. */
export async function POST(req: Request) {
  const { user, restaurant } = await getOwnerContext();
  const origin = new URL(req.url).origin;
  if (!user || !restaurant) return NextResponse.redirect(`${origin}/login`, 303);
  if (!billingConfigured()) return NextResponse.redirect(`${origin}/dashboard/billing?error=not-configured`, 303);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: restaurant.id,
    ...(restaurant.stripe_customer_id ? { customer: restaurant.stripe_customer_id } : { customer_email: user.email }),
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    locale: "sl",
    metadata: { restaurant_id: restaurant.id },
    subscription_data: { metadata: { restaurant_id: restaurant.id } },
    success_url: `${origin}/dashboard/billing?success=1`,
    cancel_url: `${origin}/dashboard/billing`,
  });
  return NextResponse.redirect(session.url!, 303);
}
