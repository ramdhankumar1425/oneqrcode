import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

interface SendEmailParams {
  to: string[];
  subject: string;
  text: string;
  html: string;
  from?: string; // defaults to RESEND_FROM_EMAIL
}

export async function sendEmail(params: SendEmailParams) {
  if (params.to.length === 0) return;
  else if (!params.text && !params.html)
    throw new Error("Email must have either text or html content");

  const { data, error } = await resend.emails.send({
    from: params.from ?? process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });

  // Resend resolves (doesn't throw) on API errors — surface it so callers can react
  if (error) throw new Error(`Resend send failed: ${JSON.stringify(error)}`);

  console.info(
    `Email sent to ${params.to.length} recipient(s) via Resend (id: ${data?.id})`,
  );
}
