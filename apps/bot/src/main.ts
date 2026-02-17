import { Bot } from "grammy";
import { env } from "./env.js";
import { handleStart } from "./handlers/start.js";
import { handleNewRequest, handleNewRequestStep, getSession, clearSession } from "./handlers/new-request.js";
import { handleMyRequests } from "./handlers/my-requests.js";
import { acceptConsent, checkConsent } from "./api.js";

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
      "✅ Спасибо! Согласие на обработку персональных данных принято.\n\n" +
      "Добро пожаловать в Mini-CRM бот! 📦\n\n" +
      "Нажмите кнопку «📦 Открыть» слева от поля ввода, чтобы открыть приложение, или используйте команды:\n" +
      "/new — Создать новую заявку\n" +
      "/my — Мои заявки"
    );
  } catch {
    await ctx.answerCallbackQuery({ text: "Ошибка. Попробуйте позже." });
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

bot.api.setChatMenuButton({
  menu_button: {
    type: "web_app",
    text: "📦 Открыть",
    web_app: { url: env.MINI_APP_URL },
  },
}).then(() => console.log("Menu button set"))
  .catch((err) => console.error("Failed to set menu button:", err));

bot.start({
  onStart: () => console.log("Bot started"),
});
