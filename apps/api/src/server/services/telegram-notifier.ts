import { env } from "../env.js";

export async function notifyClient(
  telegramId: string,
  message: string,
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}
