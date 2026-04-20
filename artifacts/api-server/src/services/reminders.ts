import { db, remindersTable, smallClaimsCasesTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { sendReminderEmail } from "./email";
import { sendReminderSMS } from "./sms";

export async function scheduleFilingReminders(caseId: number): Promise<void> {
  const now = Date.now();
  await db.insert(remindersTable).values([
    {
      caseId,
      message: "Check if the defendant has responded to your claim. If they reach out, you may be able to settle without going to court.",
      sendAt: new Date(now + 3 * 24 * 60 * 60 * 1000),
      type: "email",
    },
    {
      caseId,
      message: "Follow up with the courthouse on your case status. If the defendant has not responded, you may be able to request a default judgment.",
      sendAt: new Date(now + 10 * 24 * 60 * 60 * 1000),
      type: "email",
    },
    {
      caseId,
      message: "Your case is 30 days old. Many small claims courts schedule hearings within 30–70 days of filing. Contact the court to confirm your hearing date.",
      sendAt: new Date(now + 30 * 24 * 60 * 60 * 1000),
      type: "email",
    },
  ]);
  console.log("[reminders] Scheduled 3 follow-up reminders for case", caseId);
}

export async function scheduleServedReminder(caseId: number): Promise<void> {
  await db.insert(remindersTable).values({
    caseId,
    message: "The defendant has been served. Many defendants pay or reach out to settle at this stage. Watch for contact and be prepared to negotiate.",
    sendAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    type: "email",
  });
  console.log("[reminders] Scheduled served follow-up for case", caseId);
}

export async function runReminders(): Promise<void> {
  const now = new Date();

  try {
    const pending = await db
      .select()
      .from(remindersTable)
      .where(and(eq(remindersTable.sent, "false"), lte(remindersTable.sendAt!, now)));

    if (pending.length === 0) return;

    console.log(`[reminders] Processing ${pending.length} pending reminder(s)`);

    for (const reminder of pending) {
      if (!reminder.caseId) {
        await db.update(remindersTable).set({ sent: "true" }).where(eq(remindersTable.id, reminder.id));
        continue;
      }

      const [caseData] = await db
        .select()
        .from(smallClaimsCasesTable)
        .where(eq(smallClaimsCasesTable.id, reminder.caseId));

      if (!caseData) {
        await db.update(remindersTable).set({ sent: "true" }).where(eq(remindersTable.id, reminder.id));
        continue;
      }

      const subject = `Case Update — ${caseData.claimantName} v. ${caseData.defendantName}`;

      if (reminder.type === "email" && caseData.claimantEmail && caseData.emailReminders !== "false") {
        await sendReminderEmail(caseData.claimantEmail, subject, reminder.message ?? "");
      }

      if (reminder.type === "sms" && caseData.claimantPhone && caseData.smsReminders === "true") {
        await sendReminderSMS(caseData.claimantPhone, reminder.message ?? "");
      }

      await db.update(remindersTable).set({ sent: "true" }).where(eq(remindersTable.id, reminder.id));
    }
  } catch (err) {
    console.error("[reminders] Runner error:", err);
  }
}

export function startReminderRunner(): void {
  console.log("[reminders] Starting reminder runner (60s interval)");
  setInterval(() => { void runReminders(); }, 60 * 1000);
  void runReminders();
}
