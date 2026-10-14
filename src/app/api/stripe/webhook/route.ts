import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, toOurStatus } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook. Configure in Stripe → Developers → Webhooks with these events:
 * checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = adminClient();
  const customerId = (c: string | { id: string } | null) => (typeof c === "string" ? c : (c?.id ?? null));

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      const restaurantId = s.client_reference_id ?? s.metadata?.restaurant_id;
      if (!restaurantId || s.mode !== "subscription") break;
      const sub = s.subscription ? await stripe().subscriptions.retrieve(String(typeof s.subscription === "string" ? s.subscription : s.subscription.id)) : null;
      await db
        .from("restaurants")
        .update({ stripe_customer_id: customerId(s.customer), subscription_status: sub ? toOurStatus(sub.status) : "active" })
        .eq("id", restaurantId);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : toOurStatus(sub.status);
      const restaurantId = sub.metadata?.restaurant_id;
      const q = db.from("restaurants").update({ subscription_status: status, stripe_customer_id: customerId(sub.customer) });
      await (restaurantId ? q.eq("id", restaurantId) : q.eq("stripe_customer_id", customerId(sub.customer)));
      break;
    }
  }
  return NextResponse.json({ received: true });
}
