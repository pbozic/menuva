import type { Restaurant } from "./types";

export const TRIAL_DAYS = 14;

/** Statuses (from Stripe) that keep the account working. */
const PAID_STATUSES = new Set(["active", "past_due"]);

export function hasAccess(r: Pick<Restaurant, "subscription_status" | "trial_ends_at">, now = Date.now()): boolean {
  if (PAID_STATUSES.has(r.subscription_status)) return true;
  return r.subscription_status === "trialing" && Date.parse(r.trial_ends_at) > now;
}

export function trialDaysLeft(r: Pick<Restaurant, "trial_ends_at">, now = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(r.trial_ends_at) - now) / 86_400_000));
}

export const NO_ACCESS_MESSAGE = "Preizkusno obdobje je poteklo. Za nadaljevanje izberite naročnino.";
