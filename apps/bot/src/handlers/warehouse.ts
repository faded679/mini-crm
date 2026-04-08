// @ts-nocheck
import { Context, InlineKeyboard, Keyboard } from "grammy";
import { API_BASE_URL } from "../env.js";

// State management для кладовщиков
interface WarehouseConversation {
  state: "editing_volume" | "editing_boxes" | "uploading_photo" | "selecting_box_type" | "selecting_pallet_type" | "selecting_service" | "entering_service_quantity" | "creating_request_type" | "creating_request_client" | "creating_request_fbo_city" | "creating_request_fbo_date" | "creating_request_fbo_size" | "creating_request_fbo_count" | "creating_request_fbs_city" | "creating_request_fbs_date" | "creating_request_fbs_volume" | "idle";
  requestId?: number;
  data?: any;
  photoCount?: number;
  messageId?: number;
  servicePriceId?: number;
  serviceName?: string;
  newRequest?: {
    type?: "fbo" | "fbs";
    clientId?: number;
    cityId?: number;
    deliveryDate?: string;
    packagingType?: "pallets" | "boxes";
    boxTypeId?: number;
    palletTypeId?: number;
    boxCount?: number;
    volume?: number;
  };
}

// API Response types
interface RequestPhoto {
  id: number;
  fileId: string;
  url: string;
}

interface RequestService {
  id: number;
  description: string;
  quantity: number;
  price: number;
  amount: number;
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
    counterparties?: Array<{
      counterparty: {
        name: string;
        shortName?: string;
      };
    }>;
  };
  cityRef: {
    shortName: string;
    fullName: string;
  };
  boxType?: {
    name: string;
  };
  deliveryType?: {
    name: string;
  };
  photos?: RequestPhoto[];
  services?: RequestService[];
}

export const warehouseConversations = new Map<number, WarehouseConversation>();

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
  const keyboard = new Keyboard()
    .text("📋 Новые заявки")
    .row()
    .text("➕ Создать заявку")
    .row()
    .text("ℹ️ Помощь")
    .resized()
    .persistent();

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
 * Показать меню выбора типа доставки
 */
export async function showDeliveryTypeMenu(ctx: Context) {
  const keyboard = new InlineKeyboard()
    .text("📦 FBO", "warehouse:new_requests:FBO").row()
    .text("🚚 FBS", "warehouse:new_requests:FBS").row()
    .text("◀️ Назад", "warehouse:menu");

  const messageText = "📋 *Новые заявки*\n\nВыберите тип доставки:";
  
  if (ctx.callbackQuery) {
    await ctx.editMessageText(messageText, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(messageText, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

/**
 * Показать список новых заявок с фильтром по типу доставки
 */
export async function showNewRequests(ctx: Context, deliveryTypeFilter?: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/new?telegramId=${telegramId}`);
    
    if (!response.ok) {
      if (ctx.callbackQuery) {
        await ctx.answerCallbackQuery({ text: "Ошибка загрузки заявок" });
      } else {
        await ctx.reply("❌ Ошибка загрузки заявок");
      }
      return;
    }

    let requests = await response.json() as ShipmentRequest[];

    // Фильтруем по типу доставки, если указан
    if (deliveryTypeFilter) {
      requests = requests.filter(req => {
        const deliveryType = req.deliveryType?.name || "FBO";
        return deliveryType === deliveryTypeFilter;
      });
    }

    if (!requests || requests.length === 0) {
      const message = deliveryTypeFilter 
        ? `📋 Нет новых заявок типа ${deliveryTypeFilter}`
        : "📋 Нет новых заявок";
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message);
        await ctx.answerCallbackQuery();
      } else {
        await ctx.reply(message);
      }
      return;
    }

    // Показываем список заявок с кнопками
    const keyboard = new InlineKeyboard();
    
    for (const req of requests) { // Показываем отфильтрованные заявки
      // Формируем название организации
      let orgName = "—";
      if (req.client.counterparties && req.client.counterparties.length > 0) {
        const cp = req.client.counterparties[0].counterparty;
        const fullName = cp.name || "";
        const shortName = cp.shortName || "";
        
        // Определяем название для отображения
        const nameToProcess = shortName || fullName;
        
        if (nameToProcess) {
          // Для ИП извлекаем только "ИП Фамилия"
          const ipMatch = nameToProcess.match(/^(ИП)\s+([А-ЯЁ][а-яё]+)/i);
          if (ipMatch) {
            orgName = `${ipMatch[1]} ${ipMatch[2]}`; // ИП Иванов
          } else {
            // Для ООО и остальных используем полное название
            orgName = nameToProcess;
          }
        }
      }
      
      const deliveryType = req.deliveryType?.name || "FBO";
      const label = `#${req.id} - ${orgName} (${deliveryType})`;
      keyboard.text(label, `warehouse:view:${req.id}`).row();
    }

    keyboard.text("◀️ Назад", "warehouse:new_requests");

    const deliveryTypeLabel = deliveryTypeFilter ? ` ${deliveryTypeFilter}` : "";
    const messageText = `📋 *Новые заявки${deliveryTypeLabel}* (${requests.length})\n\n` +
      "Выберите заявку для просмотра:";
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(messageText, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
      await ctx.answerCallbackQuery();
    } else {
      await ctx.reply(messageText, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    }
  } catch (err) {
    console.error("Error loading requests:", err);
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Ошибка загрузки" });
    } else {
      await ctx.reply("❌ Ошибка загрузки");
    }
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

    // Формируем название организации
    let orgName = "—";
    if (req.client.counterparties && req.client.counterparties.length > 0) {
      const cp = req.client.counterparties[0].counterparty;
      const fullName = cp.name || "";
      const shortName = cp.shortName || "";
      const nameToProcess = shortName || fullName;
      
      if (nameToProcess) {
        const ipMatch = nameToProcess.match(/^(ИП)\s+([А-ЯЁ][а-яё]+)/i);
        if (ipMatch) {
          orgName = `${ipMatch[1]} ${ipMatch[2]}`;
        } else {
          orgName = nameToProcess;
        }
      }
    }

    const isFBS = req.deliveryType?.name === "FBS";
    const packagingTypeRu = req.packagingType === "pallets" ? "палеты" : "коробки";
    
    let text = `📦 *Заявка #${req.id}*\n`;
    text += `📦 Тип: ${req.deliveryType?.name || "FBO"} (${isFBS ? "объем" : packagingTypeRu})\n\n`;
    text += `� ${orgName}\n`;
    text += `🏢 ${req.cityRef?.shortName || 'Не указано'}\n`;
    text += `📅 Дата доставки: ${new Date(req.deliveryDate).toLocaleDateString("ru-RU")}\n\n`;

    if (isFBS) {
      text += `📏 Объем: ${req.volume ? req.volume + " м³" : "❌ не указан"}\n`;
    } else {
      text += `📦 Количество: ${req.boxCount} ${req.boxType?.name || packagingTypeRu}\n`;
    }

    if (req.photos && req.photos.length > 0) {
      text += `\n📸 Фото: загружено (${req.photos.length})\n`;
    } else {
      text += `\n📸 Фото: не загружено\n`;
    }

    // Отображаем добавленные услуги
    if (req.services && req.services.length > 0) {
      text += `\n✨ Доп. услуги:\n`;
      for (const service of req.services) {
        text += `  • ${service.description} x${service.quantity} - ${service.amount} ₽\n`;
      }
    }

    const keyboard = new InlineKeyboard();

    if (isFBS) {
      keyboard.text("✏️ Указать объем", `warehouse:edit_volume:${req.id}`).row();
    } else {
      // Для FBO: изменение типа упаковки и размера
      const currentType = req.packagingType === "pallets" ? "Палеты" : "Коробки";
      keyboard.text(`📦 ${currentType}`, `warehouse:change_packaging:${req.id}`).row();
      keyboard.text("✏️ Изменить размер", `warehouse:change_size:${req.id}`).row();
      keyboard.text("✏️ Изменить кол-во", `warehouse:edit_boxes:${req.id}`).row();
    }

    // Добавление доп. услуг
    keyboard.text("➕ Добавить услугу", `warehouse:add_service:${req.id}`).row();

    if (!req.photos || req.photos.length === 0) {
      keyboard.text("📸 Добавить фото", `warehouse:add_photo:${req.id}`).row();
    } else {
      keyboard.text(`📸 Добавить еще (${req.photos.length})`, `warehouse:add_photo:${req.id}`);
      keyboard.text("🗑 Удалить последнее", `warehouse:delete_photo:${req.id}:${req.photos[req.photos.length - 1].id}`).row();
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

  const message = await ctx.editMessageText(
    `📸 Отправьте фото груза для заявки #${requestId}\n\n` +
    "Вы можете отправить несколько фотографий.\n" +
    "Когда закончите, нажмите кнопку 'Готово'",
    {
      reply_markup: new InlineKeyboard()
        .text("✅ Готово", `warehouse:photo_done:${requestId}`)
        .row()
        .text("◀️ Отмена", "warehouse:new_requests")
    }
  );

  warehouseConversations.set(userId, {
    state: "uploading_photo",
    requestId,
    messageId: message.message_id,
  });

  await ctx.answerCallbackQuery();
}

/**
 * Обработка текстового ввода от кладовщика
 */
export async function handleWarehouseInput(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return false;

  const conversation = warehouseConversations.get(userId);
  if (!conversation) return false;

  const text = ctx.message?.text?.trim();
  if (!text) return false;

  const telegramId = String(userId);

  // Обработка создания заявки
  if (conversation.state.startsWith("creating_request_")) {
    const { handleCreateRequestMessage } = await import("./warehouse-create-request.js");
    await handleCreateRequestMessage(ctx);
    return true;
  }

  // Для остальных состояний требуется requestId
  if (!conversation.requestId) return false;

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

    if (conversation.state === "entering_service_quantity") {
      const quantity = parseInt(text, 10);
      
      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply("❌ Введите корректное количество (например: 5)");
        return true;
      }

      const { requestId, servicePriceId } = conversation;
      if (!requestId || !servicePriceId) {
        await ctx.reply("❌ Ошибка: данные не найдены");
        warehouseConversations.delete(userId);
        return true;
      }

      warehouseConversations.delete(userId);
      await addServiceToRequest(ctx, requestId, servicePriceId, quantity);
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

    // Не удаляем conversation, чтобы можно было загрузить еще фото
    const photoCount = (conversation.photoCount || 0) + 1;
    conversation.photoCount = photoCount;
    
    // Редактируем существующее сообщение вместо создания нового
    if (conversation.messageId) {
      try {
        await ctx.api.editMessageText(
          ctx.chat?.id!,
          conversation.messageId,
          `✅ Фото загружено: ${photoCount}\n\n` +
          "Отправьте еще фото или нажмите 'Готово'",
          {
            reply_markup: new InlineKeyboard()
              .text("✅ Готово", `warehouse:photo_done:${conversation.requestId}`)
              .row()
              .text("◀️ Отмена", "warehouse:new_requests")
          }
        );
      } catch (err) {
        // Если не удалось отредактировать, отправляем новое сообщение
        await ctx.reply(
          `✅ Фото ${photoCount} добавлено\n\n` +
          "Отправьте еще фото или нажмите 'Готово'",
          {
            reply_markup: new InlineKeyboard()
              .text("✅ Готово", `warehouse:photo_done:${conversation.requestId}`)
              .row()
              .text("◀️ Отмена", "warehouse:new_requests")
          }
        );
      }
    }
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
    console.log('Full response:', req);
    console.log('cityRef:', req.cityRef);
    const clientName = req.client.firstName 
      ? `${req.client.firstName} ${req.client.lastName || ""}`.trim()
      : req.client.username || "Клиент";

    const isFBS = req.deliveryType?.name === "FBS";
    
    let text = `📦 *Заявка #${req.id}*\n\n`;
    text += `🏢 ${req.cityRef?.shortName || 'Не указано'}\n`;
    text += `👤 Клиент: ${clientName}\n`;
    text += `📍 Город: ${req.cityRef.fullName}\n`;
    text += `📦 Тип: ${req.deliveryType?.name || "FBO"} ${isFBS ? "(объем)" : req.packagingType === "pallets" ? "(паллеты)" : "(коробки)"}\n\n`;

    if (isFBS) {
      text += `📏 Объем: ${req.volume ? req.volume + " м³" : "не указан"}\n`;
    } else {
      text += `📦 Количество: ${req.boxCount} шт\n`;
    }

    if (req.photos && req.photos.length > 0) {
      text += `📸 Фото: загружено (${req.photos.length})\n`;
    }

    const keyboard = new InlineKeyboard();
    
    if (isFBS) {
      keyboard.text("✏️ Указать объем", `warehouse:edit_volume:${req.id}`).row();
    }
    
    if (!isFBS) {
      keyboard.text("✏️ Изменить кол-во", `warehouse:edit_boxes:${req.id}`).row();
    }
    
    if (!req.photos || req.photos.length === 0) {
      keyboard.text("📸 Добавить фото", `warehouse:add_photo:${req.id}`).row();
    } else {
      keyboard.text(`📸 Добавить еще (${req.photos.length})`, `warehouse:add_photo:${req.id}`);
      keyboard.text("🗑 Удалить последнее", `warehouse:delete_photo:${req.id}:${req.photos[req.photos.length - 1].id}`).row();
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

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
    await ctx.answerCallbackQuery();
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

/**
 * Изменить тип упаковки (коробки/палеты)
 */
export async function changePackagingType(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}?telegramId=${telegramId}`);
    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Заявка не найдена" });
      return;
    }

    const req = await response.json();
    const currentType = req.packagingType;
    const newType = currentType === "boxes" ? "pallets" : "boxes";
    const newTypeRu = newType === "pallets" ? "палеты" : "коробки";

    const keyboard = new InlineKeyboard();
    keyboard.text(`✅ Изменить на ${newTypeRu}`, `warehouse:confirm_packaging:${requestId}:${newType}`).row();
    keyboard.text("❌ Отмена", `warehouse:view:${requestId}`);

    await ctx.editMessageText(
      `Изменить тип упаковки для заявки #${requestId}?\n\nТекущий: ${currentType === "boxes" ? "коробки" : "палеты"}\nНовый: ${newTypeRu}`,
      { reply_markup: keyboard }
    );
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error changing packaging type:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Подтвердить изменение типа упаковки
 */
export async function confirmPackagingType(ctx: Context, requestId: number, packagingType: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}/packaging-type`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: String(telegramId), packagingType }),
    });

    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка изменения" });
      return;
    }

    await ctx.answerCallbackQuery({ text: "✅ Тип упаковки изменен" });
    await showRequestDetails(ctx, requestId);
  } catch (err) {
    console.error("Error confirming packaging type:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Изменить размер коробок/палет
 */
export async function changeSize(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const reqResponse = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}?telegramId=${telegramId}`);
    if (!reqResponse.ok) {
      await ctx.answerCallbackQuery({ text: "Заявка не найдена" });
      return;
    }

    const req = await reqResponse.json();
    const isBoxes = req.packagingType === "boxes";
    const endpoint = isBoxes ? "/warehouse/box-types" : "/warehouse/pallet-types";

    const typesResponse = await fetch(`${API_BASE_URL}${endpoint}?telegramId=${telegramId}`);
    if (!typesResponse.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка загрузки типов" });
      return;
    }

    const types = await typesResponse.json();
    const keyboard = new InlineKeyboard();

    for (const type of types) {
      const label = isBoxes ? type.name : `${type.name} (${type.minValue}-${type.maxValue})`;
      keyboard.text(label, `warehouse:set_size:${requestId}:${type.id}:${isBoxes ? 'box' : 'pallet'}`).row();
    }

    keyboard.text("❌ Отмена", `warehouse:view:${requestId}`);

    await ctx.editMessageText(
      `Выберите ${isBoxes ? "размер коробки" : "тип палеты"} для заявки #${requestId}:`,
      { reply_markup: keyboard }
    );
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error changing size:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Установить размер коробки/палеты
 */
export async function setSize(ctx: Context, requestId: number, typeId: number, sizeType: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}/packaging`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        telegramId: String(telegramId), 
        boxCount: 1,
        boxTypeId: typeId
      }),
    });

    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка изменения" });
      return;
    }

    await ctx.answerCallbackQuery({ text: "✅ Размер изменен" });
    await showRequestDetails(ctx, requestId);
  } catch (err) {
    console.error("Error setting size:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Показать список доп. услуг
 */
export async function showAddService(ctx: Context, requestId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/service-prices?telegramId=${telegramId}`);
    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка загрузки услуг" });
      return;
    }

    const allServices = await response.json();
    
    const keyboard = new InlineKeyboard();

    // Ищем конкретные услуги по приоритету (точные названия из прайс-листа)
    const serviceCategories = [
      { pattern: /Распечатка \(шк коробов или поставки\)/i, found: false },
      { pattern: /Гофрокартон 60х40х40 \(б\/у 5ти слойные\)/i, found: false },
      { pattern: /Помощь на выгрузке/i, found: false },
      { pattern: /Выгрузка\/[CС]борка/i, found: false }  // C может быть латинской или кириллической
    ];

    const selectedServices: any[] = [];

    // Для каждой категории находим первое совпадение
    for (const category of serviceCategories) {
      const service = allServices.find((s: any) => {
        const serviceName = s.name || "";
        return category.pattern.test(serviceName);
      });
      
      if (service && !category.found) {
        selectedServices.push(service);
        category.found = true;
      }
    }

    for (const service of selectedServices) {
      const label = `${service.name} (${service.price} ₽)`;
      keyboard.text(label, `warehouse:confirm_service:${requestId}:${service.id}`).row();
    }

    keyboard.text("❌ Отмена", `warehouse:view:${requestId}`);

    await ctx.editMessageText(
      `Выберите услугу для добавления к заявке #${requestId}:`,
      { reply_markup: keyboard }
    );
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error showing services:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Начать процесс добавления услуги - запросить количество
 */
export async function startAddServiceQuantity(ctx: Context, requestId: number, servicePriceId: number) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Получаем информацию об услуге
    const response = await fetch(`${API_BASE_URL}/warehouse/service-prices?telegramId=${userId}`);
    if (!response.ok) {
      await ctx.answerCallbackQuery({ text: "Ошибка загрузки услуги" });
      return;
    }

    const services = await response.json();
    const service = services.find((s: any) => s.id === servicePriceId);
    
    if (!service) {
      await ctx.answerCallbackQuery({ text: "Услуга не найдена" });
      return;
    }

    warehouseConversations.set(userId, {
      state: "entering_service_quantity",
      requestId,
      servicePriceId,
      serviceName: service.name,
    });

    await ctx.editMessageText(
      `✏️ Введите количество для услуги:\n\n` +
      `📋 ${service.name}\n` +
      `💰 Цена: ${service.price} ₽\n\n` +
      `Например: 5\n\n` +
      `Для отмены используйте /cancel`
    );

    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Error starting service quantity:", err);
    await ctx.answerCallbackQuery({ text: "Ошибка" });
  }
}

/**
 * Добавить услугу к заявке с указанным количеством
 */
export async function addServiceToRequest(ctx: Context, requestId: number, servicePriceId: number, quantity: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/warehouse/requests/${requestId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        telegramId: String(telegramId), 
        servicePriceId,
        quantity
      }),
    });

    if (!response.ok) {
      await ctx.reply("❌ Ошибка добавления услуги");
      return;
    }

    await ctx.reply(`✅ Услуга добавлена (количество: ${quantity})`);
    await showRequestDetailsInNewMessage(ctx, requestId);
  } catch (err) {
    console.error("Error adding service:", err);
    await ctx.reply("❌ Произошла ошибка");
  }
}
