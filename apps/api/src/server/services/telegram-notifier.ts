import { env } from "../env.js";

const API_URL = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

export async function notifyClient(
  telegramId: string,
  htmlMessage: string,
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`${API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: htmlMessage,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

export async function sendClientDocument(
  telegramId: string,
  fileBuffer: Buffer,
  fileName: string,
  caption?: string,
): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  try {
    const form = new FormData();
    form.append("chat_id", telegramId);
    form.append("caption", caption ?? "");
    form.append("parse_mode", "HTML");
    form.append("document", new File([fileBuffer], fileName, { type: "application/pdf" }));

    const res = await fetch(`${API_URL}/sendDocument`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Telegram document sending failed:", res.status, text);
    }
  } catch (err) {
    console.error("Telegram document sending failed:", err);
  }
}
