import { Resend } from "resend";
import { hashShort } from "@/lib/safe-log";

let _resend: Resend | null = null;

export function getResendClient(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  _resend = new Resend(key);
  return _resend;
}

const FROM = "Axis Experts <noreply@axis-experts.be>";
const DEFAULT_REPLY_TO = "info@axis-experts.be";

const PRODUCTION_BLOCKLIST_DOMAINS = [
  "axis-experts.test",
  "example.com",
  "example.org",
];

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
  replyTo?: string;
};

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, text, tags, replyTo } = params;

  const recipients = Array.isArray(to) ? to : [to];
  for (const recipient of recipients) {
    const domain = recipient.split("@")[1]?.toLowerCase();
    if (!domain) {
      console.warn("[email] invalid recipient format");
      return { success: false, error: "Invalid recipient" };
    }
    if (
      process.env.NODE_ENV === "production" &&
      PRODUCTION_BLOCKLIST_DOMAINS.includes(domain)
    ) {
      console.warn("[email] blocked recipient domain in production");
      return { success: false, error: "Blocked recipient domain" };
    }
  }

  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo: replyTo ?? DEFAULT_REPLY_TO,
      ...(text ? { text } : {}),
      ...(tags ? { tags } : {}),
    });
    if (error) {
      console.error("[email] failed to send:", {
        subject_hash: hashShort(subject),
        error,
      });
      return { success: false, error: error.message ?? String(error) };
    }
    const id = data?.id ?? "";
    console.log("[email] sent:", { id, subject_hash: hashShort(subject) });
    return { success: true, id };
  } catch (err) {
    console.error("[email] failed to send:", {
      subject_hash: hashShort(subject),
      err,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
