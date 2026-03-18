import { Bot } from "grammy";
import { env } from "./env.js";
import { handleStart } from "./handlers/start.js";
import { getSession, clearSession } from "./handlers/new-request.js";
import { acceptConsent, checkConsent, savePhone, linkInn } from "./api.js";

export const bot = new Bot(env.BOT_TOKEN);

// Helper function to set menu button for specific user
export async function setMenuButton(chatId: number, show: boolean) {
  try {
    if (show) {
      await bot.api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: "web_app",
          text: "📦 Открыть",
          web_app: { url: env.MINI_APP_URL },
        },
      });
    } else {
      await bot.api.setChatMenuButton({
        chat_id: chatId,
        menu_button: {
          type: "commands",
        },
      });
    }
  } catch (e) {
    console.error("Failed to set menu button:", e);
  }
}

// Track users waiting for INN input
const waitingForInn = new Set<number>();

bot.command("start", handleStart);

// Handle packaging type selection (legacy)
bot.callbackQuery(/^packaging:(pallets|boxes)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);
  if (!session) {
    await ctx.answerCallbackQuery({ text: "Сессия не найдена" });
    return;
  }

  const match = ctx.match as RegExpMatchArray;
  const packagingType = match[1] as "pallets" | "boxes";

  session.packagingType = packagingType;
  session.step = "boxCount";

  await ctx.answerCallbackQuery({ text: packagingType === "pallets" ? "Палеты" : "Коробки" });
  await ctx.reply(`📦 Укажите количество (${packagingType === "pallets" ? "палет" : "коробок"}):`);
});

bot.command("cancel", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) clearSession(userId);
  await ctx.reply("Действие отменено.");
});

// Handle consent callback
bot.callbackQuery("consent_accept", async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  try {
    await acceptConsent({
      telegramId: String(user.id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    });

    await ctx.answerCallbackQuery({ text: "Согласие принято ✅" });

    await ctx.editMessageText(
      "✅ Согласие на обработку персональных данных принято."
    );

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
  } catch {
    await ctx.answerCallbackQuery({ text: "Ошибка. Попробуйте позже." });
  }
});

// Handle shared contact (phone number)
bot.on("message:contact", async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  const contact = ctx.message.contact;
  if (contact.user_id !== user.id) {
    await ctx.reply("Пожалуйста, отправьте свой номер телефона, а не чужой.");
    return;
  }

  try {
    await savePhone(String(user.id), contact.phone_number);

    await ctx.reply("✅ Номер телефона сохранён.", {
      reply_markup: { remove_keyboard: true },
    });

    // Ask for INN
    waitingForInn.add(user.id);
    await ctx.reply("🏢 Введите ИНН вашей организации (10 или 12 цифр):");
  } catch {
    await ctx.reply("Ошибка при сохранении номера. Попробуйте позже.");
  }
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check if user needs to provide INN (either in waitingForInn set or missing INN in registration)
  const { consentGiven, hasPhone, hasInn } = await checkConsent(String(userId));
  
  if (consentGiven && hasPhone && !hasInn) {
    const text = ctx.message.text.trim();

    if (!/^\d{10}$|^\d{12}$/.test(text)) {
      await ctx.reply("❌ ИНН должен содержать 10 или 12 цифр. Попробуйте ещё раз:");
      return;
    }

    try {
      const result = await linkInn(String(userId), text);
      waitingForInn.delete(userId);

      // Set menu button for this user
      await setMenuButton(userId, true);

      await ctx.reply(
        `✅ Организация привязана: ${result.name} (ИНН: ${result.inn})\n\n` +
        "Добро пожаловать в Mini-CRM бот! 📦\n\n" +
        "Теперь вы можете открыть приложение через кнопку меню.",
        {
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
        }
      );
    } catch {
      await ctx.reply("Ошибка при привязке организации. Попробуйте ещё раз:");
    }
    return;
  }

  // Legacy flow handling
  if (getSession(userId)) {
    clearSession(userId);
    await ctx.reply("Сессия очищена. Используйте мини-приложение для создания заявок.");
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start({
  onStart: async (botInfo) => {
    console.log("Bot started");
  },
});
