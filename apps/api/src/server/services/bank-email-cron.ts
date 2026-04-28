/**
 * Cron job: fetch Tinkoff bank statements from email via IMAP and import them.
 * Runs daily at 08:00 Moscow time.
 * Calls the email-service's /fetch-bank-statements endpoint, then feeds
 * each statement into importBankStatement (which handles deduplication).
 */
import { importBankStatement } from "./bank-import-service.js";

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://172.17.0.1:5001";
const CRON_HOUR = Number(process.env.BANK_CRON_HOUR ?? 8); // default 08:00

interface FetchedStatement {
  filename: string;
  content: string;
  subject: string;
  date: string;
}

async function fetchAndImportStatements(): Promise<void> {
  console.log("[bank-cron] Starting bank statement fetch from email...");

  try {
    const res = await fetch(`${EMAIL_SERVICE_URL}/fetch-bank-statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days_back: 3, mark_read: false }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[bank-cron] Email service error ${res.status}: ${text}`);
      return;
    }

    const data = (await res.json()) as { statements: FetchedStatement[]; count: number };
    console.log(`[bank-cron] Found ${data.count} statement(s) in email`);

    if (!data.statements || data.statements.length === 0) {
      console.log("[bank-cron] No new statements found");
      return;
    }

    for (const stmt of data.statements) {
      try {
        console.log(`[bank-cron] Importing: ${stmt.filename} (from: ${stmt.subject})`);
        const result = await importBankStatement(stmt.content, stmt.filename, "email-auto");
        console.log(
          `[bank-cron] Imported: ${result.importedCount} new, ${result.skippedDuplicates} duplicates skipped, ${result.matchedCount} matched`
        );
      } catch (err) {
        console.error(`[bank-cron] Failed to import ${stmt.filename}:`, err);
      }
    }

    console.log("[bank-cron] Done");
  } catch (err) {
    console.error("[bank-cron] Fetch failed:", err);
  }
}

/**
 * Schedule the cron job using setInterval.
 * Calculates ms until next target hour, then repeats every 24h.
 */
export function startBankEmailCron(): void {
  // Run once on startup (delayed by 30s to let everything initialize)
  setTimeout(() => {
    fetchAndImportStatements().catch((err) =>
      console.error("[bank-cron] Initial run failed:", err)
    );
  }, 30_000);

  // Schedule daily at CRON_HOUR (Moscow = UTC+3)
  function scheduleDailyRun() {
    const now = new Date();
    // Moscow time offset +3
    const moscowOffset = 3 * 60;
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const moscowMinutes = (utcMinutes + moscowOffset) % (24 * 60);
    const targetMinutes = CRON_HOUR * 60;

    let diffMinutes = targetMinutes - moscowMinutes;
    if (diffMinutes <= 0) diffMinutes += 24 * 60; // next day

    const msUntilRun = diffMinutes * 60 * 1000;

    console.log(
      `[bank-cron] Next run in ${Math.round(msUntilRun / 60000)} minutes (${CRON_HOUR}:00 MSK)`
    );

    setTimeout(() => {
      fetchAndImportStatements().catch((err) =>
        console.error("[bank-cron] Scheduled run failed:", err)
      );
      // Re-schedule for next day
      scheduleDailyRun();
    }, msUntilRun);
  }

  scheduleDailyRun();
  console.log(`[bank-cron] Bank email import cron started (daily at ${CRON_HOUR}:00 MSK)`);
}
