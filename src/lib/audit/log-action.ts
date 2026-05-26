import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "cgu.accept"
  | "rdv.create"
  | "rdv.update"
  | "rdv.cancel"
  | "attachment.upload"
  | "attachment.download"
  | "user.invite"
  | "user.suspend"
  | "user.reactivate"
  | "org.update";

export type LogActionParams = {
  userId: string;
  organizationId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Insère une ligne dans audit_log. Utilise service_role pour bypass RLS.
 * Un échec d'audit ne doit PAS bloquer l'action métier : on log en console et on continue.
 *
 * IMPORTANT : ne JAMAIS appeler depuis du code client. Server-side uniquement
 * (route handlers, server actions, server components).
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const supabase = createAdminClient();
    const h = await headers();
    const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    const { error } = await supabase.from("audit_log").insert({
      user_id: params.userId,
      organization_id: params.organizationId ?? null,
      action: params.action,
      resource_type: params.resourceType ?? null,
      resource_id: params.resourceId ?? null,
      metadata: params.metadata ?? {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[audit_log] insert failed", {
        action: params.action,
        error: error.message,
      });
    }
  } catch (err) {
    console.error("[audit_log] unexpected error", {
      action: params.action,
      err,
    });
  }
}
