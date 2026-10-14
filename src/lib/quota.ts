import type { SupabaseClient } from "@supabase/supabase-js";

export type UsageKind = "import" | "retranslate";

/**
 * Per-restaurant AI limits. Worst case per restaurant per month at these limits:
 * 30 imports × ~$0.11 + 300 re-translations × ~$0.002 ≈ $4.
 */
export const LIMITS: Record<UsageKind, { perDay: number; perMonth: number }> = {
  import: { perDay: 10, perMonth: 30 },
  retranslate: { perDay: 100, perMonth: 300 },
};

/** Max characters of pasted menu text we accept. */
export const MAX_TEXT_CHARS = 20_000;

const MESSAGES: Record<UsageKind, { day: string; month: string }> = {
  import: {
    day: "Dosegli ste dnevno omejitev uvozov. Poskusite znova jutri.",
    month: "Dosegli ste mesečno omejitev uvozov. Pišite nam, če potrebujete več.",
  },
  retranslate: {
    day: "Dosegli ste dnevno omejitev prevodov. Poskusite znova jutri.",
    month: "Dosegli ste mesečno omejitev prevodov. Pišite nam, če potrebujete več.",
  },
};

/**
 * Checks the quota and, if allowed, records the usage *before* the AI call
 * so that parallel requests can't all slip through.
 * Returns an error message, or null when the call may proceed.
 */
export async function consumeQuota(
  supabase: SupabaseClient,
  restaurantId: string,
  kind: UsageKind,
): Promise<string | null> {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  const count = async (since: string) => {
    const { count, error } = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("kind", kind)
      .gte("created_at", since);
    if (error) throw error;
    return count ?? 0;
  };

  const [day, month] = await Promise.all([count(dayAgo), count(monthAgo)]);
  if (day >= LIMITS[kind].perDay) return MESSAGES[kind].day;
  if (month >= LIMITS[kind].perMonth) return MESSAGES[kind].month;

  const { error } = await supabase.from("ai_usage").insert({ restaurant_id: restaurantId, kind });
  if (error) throw error;
  return null;
}
