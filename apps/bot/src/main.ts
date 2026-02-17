import { Bot } from "grammy";
import { env } from "./env.js";
import { handleStart } from "./handlers/start.js";
import { handleNewRequest, handleNewRequestStep, getSession, clearSession } from "./handlers/new-request.js";
import { handleMyRequests } from "./handlers/my-requests.js";

const bot = new Bot(env.BOT_TOKEN);

bot.command("start", handleStart);
bot.command("new", handleNewRequest);
bot.command("my", handleMyRequests);

bot.command("cancel", async (ctx) => {
  const userId = ctx.from?.id;
  if (userId) clearSession(userId);
  await ctx.reply("Действие отменено. Введите /new для новой заявки.");
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
