import type { Context } from "grammy";
import { env } from "../env.js";
import { checkConsent } from "../api.js";
import { setMenuButton } from "../main.js";

const CONSENT_TEXT =
  "📋 <b>Согласие на обработку персональных данных</b>\n\n" +
  "Для использования сервиса нам необходимо ваше согласие на обработку персональных данных.\n\n" +
  "Мы обрабатываем следующие данные:\n" +
  "• Telegram ID, имя пользователя, имя и фамилия\n" +
  "• Данные о заявках на перевозку (город, дата, габариты, вес)\n\n" +
  "Данные используются исключительно для обработки ваших заявок на перевозку грузов и не передаются третьим лицам.\n\n" +
  "Нажмите кнопку ниже, чтобы дать согласие и продолжить.";

const WELCOME_TEXT =
  "Здесь вы можете создавать заявки и отслеживать их статус.\n\n" +
  "Нажмите кнопку ниже, чтобы открыть приложение:";

export async function handleStart(ctx: Context): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    const { consentGiven, hasPhone, hasInn } = await checkConsent(String(userId));

    // Step 1: Check consent
    if (!consentGiven) {
      await setMenuButton(userId, false);
      await ctx.reply(CONSENT_TEXT, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Даю согласие",
                callback_data: "consent_accept",
              },
            ],
          ],
        },
      });
      return;
    }

    // Step 2: Check phone
    if (!hasPhone) {
      await setMenuButton(userId, false);
      await ctx.reply(
        "📱 Пожалуйста, отправьте ваш номер телефона, нажав кнопку ниже:",
        {
          reply_markup: {
            keyboard: [
              [{ text: "📱 Отправить номер телефона", request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return;
    }

    // Step 3: Check INN
    if (!hasInn) {
      await setMenuButton(userId, false);
      await ctx.reply("🏢 Введите ИНН вашей организации (10 или 12 цифр):");
      return;
    }

    // All steps completed - show welcome and enable menu button
    await setMenuButton(userId, true);
    await ctx.reply(WELCOME_TEXT, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📦 Открыть приложение",
              web_app: { url: env.MINI_APP_URL },
            },
          ],
        ],
      },
    });
  } catch (err) {
    console.error("Error in /start handler:", err);
    await ctx.reply("Произошла ошибка. Попробуйте позже.");
  }
}
