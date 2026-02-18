import type { Context } from "grammy";
import { getRequests } from "../api.js";

const STATUS_LABELS: Record<string, string> = {
  new: "🆕 Новый",
  warehouse: "🏬 Склад",
  shipped: "� Отгружен",
  done: "✅ Выполнена",
};

export async function handleMyRequests(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const requests = await getRequests(String(userId));

    if (requests.length === 0) {
      await ctx.reply("У вас пока нет заявок. Создайте первую командой /new");
      return;
    }

    const lines = requests.map((r, i) => {
      const date = new Date(r.deliveryDate).toLocaleDateString("ru-RU");
      const status = STATUS_LABELS[r.status] ?? r.status;
      return (
        `${i + 1}. Заявка #${r.id}\n` +
        `   📍 ${r.city} | 📅 ${date}\n` +
        `   � ${(r.volume ?? r.size ?? "—")} м³ | ⚖️ ${r.weight} кг | 📦 ${r.boxCount} мест\n` +
        `   ${status}`
      );
    });

    await ctx.reply(`📋 Ваши заявки:\n\n${lines.join("\n\n")}`);
  } catch (err) {
    console.error("Failed to fetch requests:", err);
    await ctx.reply("❌ Ошибка при загрузке заявок. Попробуйте позже.");
  }
}
