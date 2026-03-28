// @ts-nocheck
import { Context, InlineKeyboard } from "grammy";
import { API_BASE_URL } from "../env.js";

// State management для кладовщиков
interface WarehouseConversation {
  state: "editing_volume" | "editing_boxes" | "uploading_photo" | "idle";
  requestId?: number;
  data?: any;
}

// API Response types
interface RequestPhoto {
  id: number;
  fileId: string;
  fileUrl?: string;
}

interface ShipmentRequest {
  id: number;
  status: string;
  packagingType: "pallets" | "boxes";
  volume?: number;
  weight?: number;
  boxCount: number;
  deliveryDate: string;
  comment?: string;
  client: {
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
  };
  cityRef: {
    shortName: string;
    fullName: string;
  };
  boxType?: {
    name: string;
  };
  photos?: RequestPhoto[];
}

const warehouseConversations = new Map<number, WarehouseConversation>();

/**
 * Проверка является ли пользователь кладовщиком
 */
export async function isWarehouseWorker(telegramId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/new?telegramId=${telegramId}`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Главное меню кладовщика
 */
export async function showWarehouseMenu(ctx: Context) {
  const keyboard = new InlineKeyboard()
    .text("📋 Новые заявки", "warehouse:new_requests")
    .row()
    .text("ℹ️ Помощь", "warehouse:help");

  await ctx.reply(
    "🏢 *Меню кладовщика*\n\n" +
    "Выберите действие:",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * Показать список новых заявок
 */
export async function showNewRequests(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/new?telegramId=${telegramId}`);
    
    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка загрузки заявок" });
      return;
    }

    const requests = await response.json() as ShipmentRequest[];

    if (!requests || requests.length === 0) {
      await ctx.editMessageText("📋 Нет новых заявок");
      return;
    }

    // Показываем список заявок с кнопками
    const keyboard = new InlineKeyboard();
    
    for (const req of requests.slice(0, 10)) { // Показываем первые 10
      const clientName = req.client.firstName 
        ? `${req.client.firstName} ${req.client.lastName || ""}`.trim()
        : req.client.username || "Клиент";
      
      const label = `#${req.id} - ${clientName} (${req.deliveryType?.name || "FBO"})`;
      keyboard.text(label, `warehouse:view:${req.id}`).row();
    }

    keyboard.text("◀️ Назад", "warehouse:menu");

    await ctx.editMessageText(
      `📋 *Новые заявки* (${requests.length})\n\n` +
      "Выберите заявку для просмотра:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );

    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error loading requests:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка загрузки" });
  }
}

/**
 * Показать детали заявки
 */
export async function showRequestDetails(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}?telegramId=${telegramId}`);
    
    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Заявка не найдена" });
      return;
    }

    const req = await response.json();

    const clientName = req.client.firstName 
      ? `${req.client.firstName} ${req.client.lastName || ""}`.trim()
      : req.client.username || "Клиент";

    const isFBS = req.deliveryType?.name === "FBS";
    
    let text = `📦 *Заявка #${req.id}*\n\n`;
    text += `👤 Клиент: ${clientName}\n`;
    text += `📞 Телефон: ${req.client.phone || "не указан"}\n`;
    text += `📍 Город: ${req.cityRef.fullName}\n`;
    text += `📅 Дата доставки: ${new Date(req.deliveryDate).toLocaleDateString("ru-RU")}\n`;
    text += `📦 Тип: ${req.deliveryType?.name || "FBO"} ${isFBS ? "(объем)" : req.packagingType === "pallets" ? "(паллеты)" : "(коробки)"}\n\n`;

    if (isFBS) {
      text += `📏 Объем: ${req.volume ? req.volume + " м³" : "❌ не указан"}\n`;
      text += `⚖️ Вес: ${req.weight ? req.weight + " кг" : "не указан"}\n`;
    } else {
      text += `📦 Количество: ${req.boxCount} ${req.boxType?.name || "коробок"}\n`;
    }

    if (req.comment) {
      text += `💬 Комментарий: ${req.comment}\n`;
    }

    if (req.photos && req.photos.length > 0) {
      text += `\n📸 Фото: загружено (${req.photos.length})\n`;
    } else {
      text += `\n📸 Фото: не загружено\n`;
    }

    text += `\n📊 Статус: ${req.status === "new" ? "Новый" : req.status}`;

    const keyboard = new InlineKeyboard();

    if (isFBS && !req.volume) {
      keyboard.text("✏️ Указать объем", `warehouse:edit_volume:${req.id}`).row();
    }

    if (!isFBS) {
      keyboard.text("✏️ Изменить кол-во", `warehouse:edit_boxes:${req.id}`).row();
    }

    if (!req.photos || req.photos.length === 0) {
      keyboard.text("📸 Добавить фото", `warehouse:add_photo:${req.id}`).row();
    } else {
      keyboard.text("🗑 Удалить фото", `warehouse:delete_photo:${req.id}:${req.photos[0].id}`).row();
    }

    keyboard.text("✅ На склад", `warehouse:to_warehouse:${req.id}`).row();
    keyboard.text("◀️ К списку", "warehouse:new_requests");

    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });

    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error loading request details:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка загрузки" });
  }
}

/**
 * Начать редактирование объема
 */
export async function startEditVolume(ctx: Context, requestId: number) {
  const userId = ctx.from?.id;
  if (!userId) return;

  warehouseConversations.set(userId, {
    state: "editing_volume",
    requestId,
  });

  await ctx.editMessageText(
    `✏️ Введите объем в м³ для заявки #${requestId}:\n\n` +
    "Например: 2.5\n\n" +
    "Для отмены используйте /cancel"
  );

  await ctx.answerCallbackQuery();
}

/**
 * Начать редактирование количества коробок
 */
export async function startEditBoxes(ctx: Context, requestId: number) {
  const userId = ctx.from?.id;
  if (!userId) return;

  warehouseConversations.set(userId, {
    state: "editing_boxes",
    requestId,
  });

  await ctx.editMessageText(
    `✏️ Введите количество коробок для заявки #${requestId}:\n\n` +
    "Например: 15\n\n" +
    "Для отмены используйте /cancel"
  );

  await ctx.answerCallbackQuery();
}

/**
 * Начать загрузку фото
 */
export async function startAddPhoto(ctx: Context, requestId: number) {
  const userId = ctx.from?.id;
  if (!userId) return;

  warehouseConversations.set(userId, {
    state: "uploading_photo",
    requestId,
  });

  await ctx.editMessageText(
    `📸 Отправьте фото груза для заявки #${requestId}\n\n` +
    "Для отмены используйте /cancel"
  );

  await ctx.answerCallbackQuery();
}

/**
 * Обработка текстового ввода от кладовщика
 */
export async function handleWarehouseInput(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const conversation = warehouseConversations.get(userId);
  if (!conversation || !conversation.requestId) return false;

  const text = ctx.message?.text?.trim();
  if (!text) return false;

  const telegramId = String(userId);

  try {
    if (conversation.state === "editing_volume") {
      const volume = parseFloat(text.replace(",", "."));
      
      if (isNaN(volume) || volume <= 0) {
        await ctx.reply("❌ Введите корректное значение объема (например: 2.5)");
        return true;
      }

      const response = await fetch(`${API_BASE_URL}/warehouse/requests/${conversation.requestId}/volume`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume, telegramId }),
      });

      if (!response.ok) {
        await ctx.reply("❌ Ошибка при обновлении объема");
        return true;
      }

      warehouseConversations.delete(userId);
      await ctx.reply(`✅ Объем обновлен: ${volume} м³`);
      
      // Показываем обновленную заявку
      await showRequestDetailsInNewMessage(ctx, conversation.requestId);
      return true;
    }

    if (conversation.state === "editing_boxes") {
      const boxCount = parseInt(text, 10);
      
      if (isNaN(boxCount) || boxCount <= 0) {
        await ctx.reply("❌ Введите корректное количество коробок (например: 15)");
        return true;
      }

      const response = await fetch(`${API_BASE_URL}/warehouse/requests/${conversation.requestId}/packaging`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxCount, telegramId }),
      });

      if (!response.ok) {
        await ctx.reply("❌ Ошибка при обновлении количества");
        return true;
      }

      warehouseConversations.delete(userId);
      await ctx.reply(`✅ Количество обновлено: ${boxCount} шт`);
      
      await showRequestDetailsInNewMessage(ctx, conversation.requestId);
      return true;
    }
  } catch (err) {
    console.error("Error handling warehouse input:", err);
    await ctx.reply("❌ Произошла ошибка");
    warehouseConversations.delete(userId);
  }

  return false;
}

/**
 * Обработка фото от кладовщика
 */
export async function handleWarehousePhoto(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const conversation = warehouseConversations.get(userId);
  if (!conversation || conversation.state !== "uploading_photo" || !conversation.requestId) {
    return false;
  }

  const photo = ctx.message?.photo;
  if (!photo || photo.length === 0) return false;

  const telegramId = String(userId);
  const fileId = photo[photo.length - 1].file_id; // Берем самое большое фото

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${conversation.requestId}/photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, telegramId }),
    });

    if (!response.ok) {
      const error = await response.json();
      await ctx.reply(`❌ ${error.message || "Ошибка при загрузке фото"}`);
      return true;
    }

    warehouseConversations.delete(userId);
    await ctx.reply("✅ Фото добавлено");
    
    await showRequestDetailsInNewMessage(ctx, conversation.requestId);
    return true;
  } catch (err) {
    console.error("Error uploading photo:", err);
    await ctx.reply("❌ Произошла ошибка при загрузке фото");
    warehouseConversations.delete(userId);
  }

  return false;
}

/**
 * Удалить фото
 */
export async function deletePhoto(ctx: Context, requestId: number, photoId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/warehouse/requests/${requestId}/photo/${photoId}?telegramId=${telegramId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка удаления" });
      return;
    }

    await ctx.answerCallbackQuery({ text: "Фото удалено" });
    await showRequestDetails(ctx, requestId);
  } catch (err) {
    console.error("Error deleting photo:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Изменить статус на "warehouse"
 */
export async function moveToWarehouse(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: String(telegramId) }),
    });

    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка изменения статуса" });
      return;
    }

    await ctx.answerCallbackQuery({ text: "✅ Статус изменен" });
    await ctx.editMessageText(`✅ Заявка #${requestId} перемещена на склад`);
    
    // Показываем список заявок
    setTimeout(() => showNewRequests(ctx), 1500);
  } catch (err) {
    console.error("Error moving to warehouse:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Показать детали заявки в новом сообщении (после редактирования)
 */
async function showRequestDetailsInNewMessage(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}?telegramId=${telegramId}`);
    
    if (!response.ok) return;

    const req = await response.json();
    const clientName = req.client.firstName 
      ? `${req.client.firstName} ${req.client.lastName || ""}`.trim()
      : req.client.username || "Клиент";

    const isFBS = req.deliveryType?.name === "FBS";
    
    let text = `📦 *Заявка #${req.id}*\n\n`;
    text += `👤 Клиент: ${clientName}\n`;
    text += `📍 Город: ${req.cityRef.fullName}\n`;
    text += `📦 Тип: ${req.deliveryType?.name || "FBO"} ${isFBS ? "(объем)" : req.packagingType === "pallets" ? "(паллеты)" : "(коробки)"}\n\n`;

    if (isFBS) {
      text += `📏 Объем: ${req.volume ? req.volume + " м³" : "не указан"}\n`;
    } else {
      text += `📦 Количество: ${req.boxCount} шт\n`;
    }

    if (req.photos && req.photos.length > 0) {
      text += `📸 Фото: загружено\n`;
    }

    const keyboard = new InlineKeyboard();
    
    if (isFBS && !req.volume) {
      keyboard.text("✏️ Указать объем", `warehouse:edit_volume:${req.id}`).row();
    }
    
    if (!isFBS) {
      keyboard.text("✏️ Изменить кол-во", `warehouse:edit_boxes:${req.id}`).row();
    }
    
    if (!req.photos || req.photos.length === 0) {
      keyboard.text("📸 Добавить фото", `warehouse:add_photo:${req.id}`).row();
    } else {
      keyboard.text("🗑 Удалить фото", `warehouse:delete_photo:${req.id}:${req.photos[0].id}`).row();
    }
    
    keyboard.text("✅ На склад", `warehouse:to_warehouse:${req.id}`).row();
    keyboard.text("◀️ К списку", "warehouse:new_requests");

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Error showing request details:", err);
  }
}

/**
 * Очистить состояние разговора
 */
export function clearWarehouseConversation(userId: number) {
  warehouseConversations.delete(userId);
}

/**
 * Показать помощь
 */
export async function showWarehouseHelp(ctx: Context) {
  const text = `ℹ️ *Помощь для кладовщиков*\n\n` +
    `📋 *Новые заявки* - просмотр всех заявок со статусом "Новый"\n\n` +
    `Для каждой заявки вы можете:\n` +
    `• Указать объем (для FBS)\n` +
    `• Изменить количество коробок (для FBO)\n` +
    `• Добавить фото груза\n` +
    `• Изменить статус на "На складе"\n\n` +
    `Используйте /cancel для отмены текущего действия`;

  const keyboard = new InlineKeyboard().text("◀️ Назад", "warehouse:menu");

  await ctx.editMessageText(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });

  await ctx.answerCallbackQuery();
}
