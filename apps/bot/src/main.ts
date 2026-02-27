import { Bot } from "grammy";
import { env } from "./env.js";
import { handleStart } from "./handlers/start.js";
import { handleNewRequest, handleNewRequestStep, getSession, clearSession } from "./handlers/new-request.js";
import { handleMyRequests } from "./handlers/my-requests.js";
import { acceptConsent, checkConsent, savePhone } from "./api.js";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", handleStart);
bot.command("new", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const { consentGiven } = await checkConsent(String(userId));
  if (!consentGiven) {
    await ctx.reply("Сначала необходимо дать согласие на обработку персональных данных. Введите /start");
    return;
  }
  await handleNewRequest(ctx);
});

// Handle packaging type selection in /new flow
bot.callbackQuery(/^packaging:(pallets|boxes)$/, async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = getSession(userId);
  if (!session) {
    await ctx.answerCallbackQuery({ text: "Сессия не найдена. Введите /new" });
    return;
  }

  const match = ctx.match as RegExpMatchArray;
  const packagingType = match[1] as "pallets" | "boxes";

  session.packagingType = packagingType;
  session.step = "boxCount";

  await ctx.answerCallbackQuery({ text: packagingType === "pallets" ? "Палеты" : "Коробки" });
  await ctx.reply(`📦 Укажите количество (${packagingType === "pallets" ? "палет" : "коробок"}):`);
});
bot.command("my", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  const { consentGiven } = await checkConsent(String(userId));
  if (!consentGiven) {
    await ctx.reply("Сначала необходимо дать согласие на обработку персональных данных. Введите /start");
    return;
  }
  await handleMyRequests(ctx);
});

bot.command("cancel", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) clearSession(userId);
  await ctx.reply("Действие отменено. Введите /new для новой заявки.");
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

    // Remove the keyboard button first
    await ctx.reply("✅ Спасибо! Номер телефона сохранён.", {
      reply_markup: { remove_keyboard: true },
    });

    await ctx.reply(
      "Добро пожаловать в Mini-CRM бот! 📦\n\n" +
      "Нажмите кнопку ниже, чтобы открыть приложение, или используйте команды:\n" +
      "/new — Создать новую заявку\n" +
      "/my — Мои заявки",
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
    await ctx.reply("Ошибка при сохранении номера. Попробуйте позже.");
  }
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId && getSession(userId)) {
    await handleNewRequestStep(ctx);
  }
});

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start({
  onStart: () => console.log("Bot started"),
});
