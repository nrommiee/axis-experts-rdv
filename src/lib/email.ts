import { Resend } from "resend";

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

export type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, subject, html, text, tags } = params;
  try {
    const { data, error } = await getResendClient().emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
      ...(tags ? { tags } : {}),
    });
    if (error) {
      console.error("[email] failed to send:", subject, error);
      return { success: false, error: error.message ?? String(error) };
    }
    const id = data?.id ?? "";
    console.log("[email] sent:", id, subject);
    return { success: true, id };
  } catch (err) {
    console.error("[email] failed to send:", subject, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
