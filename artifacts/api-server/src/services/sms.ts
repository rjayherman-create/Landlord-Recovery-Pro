export async function sendReminderSMS(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_SID;
  const auth = process.env.TWILIO_AUTH;
  const from = process.env.TWILIO_NUMBER;

  if (!sid || !auth || !from) {
    console.warn("[reminders] Twilio not configured — skipping SMS to", to);
    return;
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(sid, auth);
    await client.messages.create({ body, from, to });
    console.log("[reminders] SMS sent to", to);
  } catch (err) {
    console.error("[reminders] SMS send failed:", err);
  }
}
