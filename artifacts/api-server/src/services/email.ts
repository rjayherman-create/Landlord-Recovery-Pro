import { Resend } from "resend";

const FROM = "SmallClaims AI <filings@smallclaimsai.com>";

export async function sendReminderEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[reminders] RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html: `
        <p>${body}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:11px;color:#9ca3af;">
          SmallClaims AI — self-help technology. Not a law firm. Not legal advice.
          <br/>To stop receiving reminders, <a href="https://smallclaimsai.com/scar-filing/cases">log in and update your preferences</a>.
        </p>
      `,
    });
    console.log("[reminders] Email sent to", to);
  } catch (err) {
    console.error("[reminders] Email send failed:", err);
  }
}
