import { createHash } from "crypto";

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "<invalid>";
  const [local, domain] = email.split("@");
  const localMasked =
    local.length > 2 ? `${local[0]}***${local[local.length - 1]}` : "***";
  const domainParts = domain.split(".");
  const domainMasked =
    domainParts[0].length > 1 ? `${domainParts[0][0]}***` : "***";
  return `${localMasked}@${domainMasked}.${domainParts.slice(1).join(".")}`;
}

export function hashShort(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}

export function safeLogContext(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.includes("@")) {
      result[key] = maskEmail(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
