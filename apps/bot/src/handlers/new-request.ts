import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { createRequest } from "../api.js";

interface SessionData {
  step: string;
  city?: string;
  deliveryDate?: string;
  weight?: number;
  boxCount?: number;
  packagingType?: "pallets" | "boxes";
  comment?: string;
}

const sessions = new Map<number, SessionData>();

export function getSession(userId: number): SessionData | undefined {
  return sessions.get(userId);
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}

export async function handleNewRequest(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  sessions.set(userId, { step: "city" });
  await ctx.reply("📦 Создание новой заявки на перевозку\n\nВ какой город доставка?");
}

const packagingKeyboard = new InlineKeyboard()
  .text("Палеты", "packaging:pallets")
  .text("Коробки", "packaging:boxes");

export async function handleNewRequestStep(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = sessions.get(userId);
  if (!session) return;

  const text = ctx.message?.text?.trim();
  if (!text) return;

  switch (session.step) {
    case "city":
      session.city = text;
      session.step = "deliveryDate";
      await ctx.reply("📅 Укажите желаемую дату доставки (ДД.ММ.ГГГГ):");
      break;

    case "deliveryDate": {
      const parts = text.split(".");
      if (parts.length !== 3) {
        await ctx.reply("❌ Неверный формат. Укажите дату в формате ДД.ММ.ГГГГ:");
        return;
      }
      const [day, month, year] = parts;
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) {
        await ctx.reply("❌ Неверная дата. Укажите дату в формате ДД.ММ.ГГГГ:");
        return;
      }
      session.deliveryDate = date.toISOString();
      session.step = "packagingType";
      await ctx.reply("Выберите тип груза:", { reply_markup: packagingKeyboard });
      break;
    }

    case "packagingType": {
      await ctx.reply("Пожалуйста, выберите тип кнопками выше.");
      break;
    }

    case "boxCount": {
      const boxCount = parseInt(text, 10);
      if (isNaN(boxCount) || boxCount <= 0) {
        await ctx.reply("❌ Укажите корректное количество (целое число > 0):");
        return;
      }
      session.boxCount = boxCount;
      session.step = "weight";
      await ctx.reply("⚖️ Укажите вес (кг) или отправьте /skip чтобы пропустить:");
      break;
    }

    case "weight": {
      if (text === "/skip") {
        session.weight = undefined;
        session.step = "comment";
        await ctx.reply("� Комментарий к заявке (или отправьте /skip чтобы пропустить):");
        return;
      }

      const weight = parseFloat(text.replace(",", "."));
      if (isNaN(weight) || weight <= 0) {
        await ctx.reply("❌ Укажите корректный вес (число > 0) или /skip:");
        return;
      }
      session.weight = weight;
      session.step = "comment";
      await ctx.reply("💬 Комментарий к заявке (или отправьте /skip чтобы пропустить):");
      break;
    }

    case "comment": {
      session.comment = text === "/skip" ? undefined : text;

      try {
        const request = await createRequest({
          telegramId: String(userId),
          username: ctx.from?.username,
          firstName: ctx.from?.first_name,
          lastName: ctx.from?.last_name,
          city: session.city!,
          deliveryDate: session.deliveryDate!,
          packagingType: session.packagingType!,
          boxCount: session.boxCount!,
          ...(session.weight !== undefined ? { weight: session.weight } : {}),
          comment: session.comment,
        });

        sessions.delete(userId);

        await ctx.reply(
          `✅ Заявка #${request.id} создана!\n\n` +
          `📍 Город: ${session.city}\n` +
          `📦 Тип: ${session.packagingType === "pallets" ? "Палеты" : "Коробки"}\n` +
          `📦 Кол-во: ${session.boxCount}\n` +
          `⚖️ Вес: ${session.weight ?? "—"} кг\n` +
          `📊 Статус: Новая\n\n` +
          `Отслеживайте статус командой /my`
        );
      } catch (err) {
        console.error("Failed to create request:", err);
        sessions.delete(userId);
        await ctx.reply("❌ Ошибка при создании заявки. Попробуйте позже.");
      }
      break;
    }
  }
}
