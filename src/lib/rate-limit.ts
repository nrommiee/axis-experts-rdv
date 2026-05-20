import { createAdminClient } from "@/lib/supabase/admin";

export async function checkRateLimit({
  userId,
  ipAddress,
  endpoint,
  limit,
  windowMinutes,
}: {
  userId?: string;
  ipAddress?: string;
  endpoint: string;
  limit: number;
  windowMinutes: number;
}): Promise<{ ok: boolean; count: number }> {
  const supabase = createAdminClient();
  const since = new Date(
    Date.now() - windowMinutes * 60 * 1000
  ).toISOString();

  let query = supabase
    .from("request_log")
    .select("id", { count: "exact", head: true })
    .eq("endpoint", endpoint)
    .gte("created_at", since);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (ipAddress) {
    query = query.eq("ip_address", ipAddress);
  } else {
    return { ok: true, count: 0 };
  }

  const { count } = await query;
  if ((count ?? 0) >= limit) {
    return { ok: false, count: count ?? 0 };
  }

  await supabase.from("request_log").insert({
    user_id: userId ?? null,
    ip_address: ipAddress ?? null,
    endpoint,
  });

  return { ok: true, count: (count ?? 0) + 1 };
}

export function extractClientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? undefined;
}
