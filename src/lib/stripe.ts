import Stripe from "stripe";

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

export const billingConfigured = () => !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);

/** Map Stripe's subscription status onto ours (our own card-free trial uses "trialing"). */
export function toOurStatus(s: Stripe.Subscription.Status): string {
  switch (s) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "incomplete":
      return "incomplete";
    default:
      return "canceled";
  }
}
