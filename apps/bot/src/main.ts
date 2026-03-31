import { Bot } from "grammy";
import { env } from "./env.js";
import { handleStart } from "./handlers/start.js";
import { getSession, clearSession } from "./handlers/new-request.js";
import { acceptConsent, checkConsent, savePhone, saveEmail, linkInn } from "./api.js";
import {
  isWarehouseWorker,
  showWarehouseMenu,
  showNewRequests,
  showRequestDetails,
  startEditVolume,
  startEditBoxes,
  startAddPhoto,
  handleWarehouseInput,
  handleWarehousePhoto,
  deletePhoto,
  moveToWarehouse,
  clearWarehouseConversation,
  showWarehouseHelp,
} from "./handlers/warehouse.js";

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
  if (userId) {
    clearSession(userId);
    clearWarehouseConversation(userId);
  }
  await ctx.reply("Действие отменено.");
});

// Warehouse command - show menu for warehouse workers
bot.command("sklad", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isWorker = await isWarehouseWorker(String(userId));
  if (!isWorker) {
    await ctx.reply("❌ У вас нет доступа к функциям кладовщика.");
    return;
  }

  await showWarehouseMenu(ctx);
});

// Warehouse callback handlers
bot.callbackQuery("warehouse:menu", async (ctx) => {
  await showWarehouseMenu(ctx);
});

bot.callbackQuery("warehouse:new_requests", async (ctx) => {
  await showNewRequests(ctx);
});

bot.callbackQuery(/^warehouse:view:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  await showRequestDetails(ctx, requestId);
});

bot.callbackQuery(/^warehouse:edit_volume:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  await startEditVolume(ctx, requestId);
});

bot.callbackQuery(/^warehouse:edit_boxes:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  await startEditBoxes(ctx, requestId);
});

bot.callbackQuery(/^warehouse:add_photo:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  await startAddPhoto(ctx, requestId);
});

bot.callbackQuery(/^warehouse:photo_done:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const userId = ctx.from?.id;
  if (userId) {
    const { warehouseConversations, showRequestDetails } = await import("./handlers/warehouse.js");
    const conversation = warehouseConversations.get(userId);
    const photoCount = conversation?.photoCount || 0;
    warehouseConversations.delete(userId);
    await ctx.answerCallbackQuery({ text: `✅ Загружено ${photoCount} фото` });
    await showRequestDetails(ctx, requestId);
  }
});

bot.callbackQuery(/^warehouse:delete_photo:(\d+):(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const photoId = Number(match[2]);
  await deletePhoto(ctx, requestId, photoId);
});

bot.callbackQuery(/^warehouse:to_warehouse:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  await moveToWarehouse(ctx, requestId);
});

bot.callbackQuery("warehouse:help", async (ctx) => {
  await showWarehouseHelp(ctx);
});

bot.callbackQuery(/^warehouse:change_packaging:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const { changePackagingType } = await import("./handlers/warehouse.js");
  await changePackagingType(ctx, requestId);
});

bot.callbackQuery(/^warehouse:confirm_packaging:(\d+):(boxes|pallets)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const packagingType = match[2];
  const { confirmPackagingType } = await import("./handlers/warehouse.js");
  await confirmPackagingType(ctx, requestId, packagingType);
});

bot.callbackQuery(/^warehouse:change_size:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const { changeSize } = await import("./handlers/warehouse.js");
  await changeSize(ctx, requestId);
});

bot.callbackQuery(/^warehouse:set_size:(\d+):(\d+):(box|pallet)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const typeId = Number(match[2]);
  const sizeType = match[3];
  const { setSize } = await import("./handlers/warehouse.js");
  await setSize(ctx, requestId, typeId, sizeType);
});

bot.callbackQuery(/^warehouse:add_service:(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const { showAddService } = await import("./handlers/warehouse.js");
  await showAddService(ctx, requestId);
});

bot.callbackQuery(/^warehouse:confirm_service:(\d+):(\d+)$/, async (ctx) => {
  const match = ctx.match as RegExpMatchArray;
  const requestId = Number(match[1]);
  const servicePriceId = Number(match[2]);
  const { addServiceToRequest } = await import("./handlers/warehouse.js");
  await addServiceToRequest(ctx, requestId, servicePriceId);
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

// Handle photo from warehouse workers
bot.on("message:photo", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const warehouseHandled = await handleWarehousePhoto(ctx);
  if (warehouseHandled) return;
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

    // Ask for email
    await ctx.reply("📧 Введите вашу электронную почту (email):");
  } catch {
    await ctx.reply("Ошибка при сохранении номера. Попробуйте позже.");
  }
});

bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Check if warehouse worker is in conversation
  const warehouseHandled = await handleWarehouseInput(ctx);
  if (warehouseHandled) return;

  const { consentGiven, hasPhone, hasEmail, hasInn } = await checkConsent(String(userId));

  // Step: waiting for email (after phone, before INN)
  if (consentGiven && hasPhone && !hasEmail) {
    const text = ctx.message.text.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      await ctx.reply("❌ Введите корректный email (например: example@mail.ru):");
      return;
    }

    try {
      await saveEmail(String(userId), text);
      await ctx.reply("✅ Email сохранён.");

      // Ask for INN
      await ctx.reply("🏢 Введите ИНН вашей организации (10 или 12 цифр):");
    } catch {
      await ctx.reply("Ошибка при сохранении email. Попробуйте ещё раз:");
    }
    return;
  }

  // Step: waiting for INN (after email)
  if (consentGiven && hasPhone && hasEmail && !hasInn) {
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
    console.log("MINI_APP_URL:", env.MINI_APP_URL);
  },
});
