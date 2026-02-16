import { env } from "../env.js";

type NotifyArgs = {
  telegramId: bigint;
  requestId: string;
  newStatus: string;
};

async function sendMessage(args: { chatId: bigint; text: string }) {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: args.chatId.toString(), text: args.text }),
  });
}

export const telegramNotifier = {
  async notifyStatusChanged(args: NotifyArgs) {
    await sendMessage({
      chatId: args.telegramId,
      text: `Статус вашей заявки ${args.requestId} изменён на: ${args.newStatus}`,
    });
  },
};
