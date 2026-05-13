import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
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
