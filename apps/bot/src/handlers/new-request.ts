import type { Context } from "grammy";
import { createRequest } from "../api.js";

interface SessionData {
  step: string;
  city?: string;
  deliveryDate?: string;
  volume?: number;
  weight?: number;
  boxCount?: number;
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
      session.step = "volume";
      await ctx.reply("� Укажите объём груза (м³), например 0.12:");
      break;
    }

    case "volume": {
      const v = parseFloat(text.replace(",", "."));
      if (isNaN(v) || v <= 0) {
        await ctx.reply("❌ Укажите корректный объём (число > 0), например 0.12:");
        return;
      }
      session.volume = v;
      session.step = "weight";
      await ctx.reply("⚖️ Укажите вес груза (кг):");
      break;
    }

    case "weight": {
      const weight = parseFloat(text);
      if (isNaN(weight) || weight <= 0) {
        await ctx.reply("❌ Укажите корректный вес (число > 0):");
        return;
      }
      session.weight = weight;
      session.step = "boxCount";
      await ctx.reply("📦 Количество мест (коробок):");
      break;
    }

    case "boxCount": {
      const boxCount = parseInt(text, 10);
      if (isNaN(boxCount) || boxCount <= 0) {
        await ctx.reply("❌ Укажите корректное количество (целое число > 0):");
        return;
      }
      session.boxCount = boxCount;
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
          volume: session.volume!,
          weight: session.weight!,
          boxCount: session.boxCount!,
          comment: session.comment,
        });

        sessions.delete(userId);

        await ctx.reply(
          `✅ Заявка #${request.id} создана!\n\n` +
          `📍 Город: ${session.city}\n` +
          `� Объём: ${session.volume} м³\n` +
          `⚖️ Вес: ${session.weight} кг\n` +
          `📦 Мест: ${session.boxCount}\n` +
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
