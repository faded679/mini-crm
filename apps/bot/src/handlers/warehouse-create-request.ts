// @ts-nocheck
import { Context, InlineKeyboard } from "grammy";
import { API_BASE_URL } from "../env.js";
import { warehouseConversations } from "./warehouse.js";

/**
 * Начало процесса создания заявки
 */
export async function startCreateRequest(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const keyboard = new InlineKeyboard()
    .text("📦 FBO", "create_request:type:fbo")
    .text("🚚 FBS", "create_request:type:fbs")
    .row()
    .text("◀️ Назад", "warehouse:menu");

  await ctx.reply(
    "➕ *Создание заявки*\n\n" +
    "Выберите тип доставки:",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * Выбор типа заявки (FBO/FBS)
 */
export async function handleRequestTypeSelection(ctx: Context, type: "fbo" | "fbs") {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId) || { state: "idle" };
  conv.newRequest = { type };
  conv.state = "creating_request_client";
  warehouseConversations.set(telegramId, conv);

  // Загружаем список клиентов
  try {
    const response = await fetch(`${API_BASE_URL}/admin/clients`);
    if (!response.ok) {
      await ctx.editMessageText("❌ Ошибка загрузки списка организаций");
      return;
    }

    const allClients = await response.json();
    
    // Формируем список клиентов с их организациями
    const clients = allClients.map((client: any) => {
      const counterpartyName = client.counterparties?.[0]?.counterparty?.shortName || 
                               client.counterparties?.[0]?.counterparty?.name || 
                               "Без организации";
      const contactName = `${client.firstName || ""} ${client.lastName || ""}`.trim() || 
                         client.username || 
                         client.phone || 
                         "Контакт";
      
      return {
        clientId: client.id,
        name: counterpartyName,
        contactName: contactName,
      };
    });

    if (clients.length === 0) {
      await ctx.editMessageText("❌ Нет доступных организаций");
      return;
    }

    // Создаём клавиатуру с клиентами (по 1 на строку для удобства)
    const keyboard = new InlineKeyboard();
    for (const client of clients.slice(0, 20)) { // Ограничиваем 20 клиентами
      keyboard.text(
        `${client.name} - ${client.contactName}`,
        `create_request:client:${client.clientId}`
      ).row();
    }
    keyboard.text("◀️ Назад", "create_request:start");

    await ctx.editMessageText(
      `➕ *Создание заявки ${type.toUpperCase()}*\n\n` +
      "Выберите организацию:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error loading clients:", err);
    await ctx.editMessageText("❌ Произошла ошибка при загрузке организаций");
  }
}

/**
 * Выбор клиента
 */
export async function handleClientSelection(ctx: Context, clientId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  conv.newRequest.clientId = clientId;

  if (conv.newRequest.type === "fbo") {
    await showFboCitySelection(ctx, conv);
  } else {
    await showFbsCitySelection(ctx, conv);
  }
}

/**
 * Показать выбор города для FBO
 */
async function showFboCitySelection(ctx: Context, conv: any) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/cities`);
    if (!response.ok) {
      await ctx.editMessageText("❌ Ошибка загрузки списка городов");
      return;
    }

    const cities = await response.json();

    const keyboard = new InlineKeyboard();
    for (const city of cities.slice(0, 15)) {
      keyboard.text(city.shortName, `create_request:fbo_city:${city.id}`).row();
    }
    keyboard.text("◀️ Назад", "create_request:start");

    conv.state = "creating_request_fbo_city";
    warehouseConversations.set(telegramId, conv);

    await ctx.editMessageText(
      "➕ *Создание заявки FBO*\n\n" +
      "Выберите направление:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error loading cities:", err);
    await ctx.editMessageText("❌ Произошла ошибка");
  }
}

/**
 * Показать выбор города для FBS
 */
async function showFbsCitySelection(ctx: Context, conv: any) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/cities-fbs`);
    if (!response.ok) {
      await ctx.editMessageText("❌ Ошибка загрузки списка направлений FBS");
      return;
    }

    const cities = await response.json();

    const keyboard = new InlineKeyboard();
    for (const city of cities.slice(0, 15)) {
      keyboard.text(city.shortName, `create_request:fbs_city:${city.id}`).row();
    }
    keyboard.text("◀️ Назад", "create_request:start");

    conv.state = "creating_request_fbs_city";
    warehouseConversations.set(telegramId, conv);

    await ctx.editMessageText(
      "➕ *Создание заявки FBS*\n\n" +
      "Выберите направление:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error loading FBS cities:", err);
    await ctx.editMessageText("❌ Произошла ошибка");
  }
}

/**
 * Обработка выбора города FBO
 */
export async function handleFboCitySelection(ctx: Context, cityId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  conv.newRequest.cityId = cityId;
  conv.state = "creating_request_fbo_date";
  warehouseConversations.set(telegramId, conv);

  await ctx.editMessageText(
    "➕ *Создание заявки FBO*\n\n" +
    "Введите дату доставки в формате ДД.ММ.ГГГГ\n" +
    "Например: 15.04.2026",
    { parse_mode: "Markdown" }
  );
}

/**
 * Обработка выбора города FBS
 */
export async function handleFbsCitySelection(ctx: Context, cityId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  conv.newRequest.cityId = cityId;

  // Загружаем расписание и цены для выбранного города
  try {
    const [scheduleRes, citiesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/schedule-fbs`),
      fetch(`${API_BASE_URL}/admin/cities-fbs`),
    ]);

    if (!scheduleRes.ok || !citiesRes.ok) {
      await ctx.editMessageText("❌ Ошибка загрузки расписания");
      return;
    }

    const allSchedule = await scheduleRes.json();
    const cities = await citiesRes.json();
    const selectedCity = cities.find((c: any) => c.id === cityId);

    if (!selectedCity) {
      await ctx.editMessageText("❌ Город не найден");
      return;
    }

    const schedule = allSchedule.filter((s: any) => s.destination === selectedCity.shortName);

    if (schedule.length === 0) {
      await ctx.editMessageText("❌ Нет доступных дат для этого направления");
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const entry of schedule.slice(0, 10)) {
      const date = new Date(entry.deliveryDate);
      const dateStr = date.toLocaleDateString("ru-RU");
      keyboard.text(dateStr, `create_request:fbs_date:${entry.deliveryDate}`).row();
    }
    keyboard.text("◀️ Назад", "create_request:start");

    conv.state = "creating_request_fbs_date";
    warehouseConversations.set(telegramId, conv);

    await ctx.editMessageText(
      "➕ *Создание заявки FBS*\n\n" +
      "Выберите дату доставки:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error loading FBS schedule:", err);
    await ctx.editMessageText("❌ Произошла ошибка");
  }
}

/**
 * Обработка текстовых сообщений при создании заявки
 */
export async function handleCreateRequestMessage(ctx: Context) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !ctx.message?.text) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  const text = ctx.message.text;

  if (conv.state === "creating_request_fbo_date") {
    // Парсим дату в формате ДД.ММ.ГГГГ
    const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (!match) {
      await ctx.reply("❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ");
      return;
    }

    const [, day, month, year] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    
    if (isNaN(date.getTime())) {
      await ctx.reply("❌ Неверная дата");
      return;
    }

    conv.newRequest.deliveryDate = date.toISOString();
    await showFboPackagingTypeSelection(ctx, conv);
  } else if (conv.state === "creating_request_fbo_count") {
    const count = parseInt(text);
    if (isNaN(count) || count < 1) {
      await ctx.reply("❌ Введите корректное количество (число больше 0)");
      return;
    }

    conv.newRequest.boxCount = count;
    await createFboRequest(ctx, conv);
  } else if (conv.state === "creating_request_fbs_volume") {
    const volume = parseFloat(text.replace(",", "."));
    if (isNaN(volume) || volume <= 0) {
      await ctx.reply("❌ Введите корректный объём (число больше 0)");
      return;
    }

    conv.newRequest.volume = volume;
    await createFbsRequest(ctx, conv);
  }
}

/**
 * Показать выбор типа упаковки для FBO
 */
async function showFboPackagingTypeSelection(ctx: Context, conv: any) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const keyboard = new InlineKeyboard()
    .text("📦 Коробки", "create_request:packaging:boxes")
    .text("🪵 Палеты", "create_request:packaging:pallets")
    .row()
    .text("◀️ Назад", "create_request:start");

  conv.state = "creating_request_fbo_size";
  warehouseConversations.set(telegramId, conv);

  await ctx.reply(
    "➕ *Создание заявки FBO*\n\n" +
    "Выберите тип упаковки:",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * Обработка выбора типа упаковки
 */
export async function handlePackagingTypeSelection(ctx: Context, packagingType: "boxes" | "pallets") {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  conv.newRequest.packagingType = packagingType;

  // Загружаем размеры
  try {
    const endpoint = packagingType === "boxes" ? "/admin/box-types" : "/admin/pallet-types";
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      await ctx.editMessageText("❌ Ошибка загрузки размеров");
      return;
    }

    const sizes = await response.json();

    if (sizes.length === 0) {
      await ctx.editMessageText("❌ Нет доступных размеров");
      return;
    }

    const keyboard = new InlineKeyboard();
    for (const size of sizes) {
      const label = packagingType === "boxes" 
        ? `${size.name} ${size.hint || ""}`
        : `${size.name} ${size.comment || ""}`;
      keyboard.text(label.trim(), `create_request:size:${size.id}`).row();
    }
    keyboard.text("◀️ Назад", "create_request:start");

    await ctx.editMessageText(
      `➕ *Создание заявки FBO*\n\n` +
      `Выберите размер ${packagingType === "boxes" ? "коробки" : "палеты"}:`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error loading sizes:", err);
    await ctx.editMessageText("❌ Произошла ошибка");
  }
}

/**
 * Обработка выбора размера
 */
export async function handleSizeSelection(ctx: Context, sizeId: number) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  if (conv.newRequest.packagingType === "boxes") {
    conv.newRequest.boxTypeId = sizeId;
  } else {
    conv.newRequest.palletTypeId = sizeId;
  }

  conv.state = "creating_request_fbo_count";
  warehouseConversations.set(telegramId, conv);

  await ctx.editMessageText(
    "➕ *Создание заявки FBO*\n\n" +
    "Введите количество мест:",
    { parse_mode: "Markdown" }
  );
}

/**
 * Обработка выбора даты FBS
 */
export async function handleFbsDateSelection(ctx: Context, deliveryDate: string) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const conv = warehouseConversations.get(telegramId);
  if (!conv || !conv.newRequest) return;

  conv.newRequest.deliveryDate = deliveryDate;
  conv.state = "creating_request_fbs_volume";
  warehouseConversations.set(telegramId, conv);

  await ctx.editMessageText(
    "➕ *Создание заявки FBS*\n\n" +
    "Введите объём товара (м³):",
    { parse_mode: "Markdown" }
  );
}

/**
 * Создание FBO заявки
 */
async function createFboRequest(ctx: Context, conv: any) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    // Загружаем данные для расчёта цены
    const [ratesRes, citiesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/rates`),
      fetch(`${API_BASE_URL}/admin/cities`),
    ]);

    if (!ratesRes.ok || !citiesRes.ok) {
      await ctx.reply("❌ Ошибка загрузки тарифов");
      return;
    }

    const rates = await ratesRes.json();
    const cities = await citiesRes.json();

    const selectedCity = cities.find((c: any) => c.id === conv.newRequest.cityId);
    const rate = rates.find((r: any) => 
      r.cityId === conv.newRequest.cityId &&
      r.unit === (conv.newRequest.packagingType === "boxes" ? "boxes" : "pallet") &&
      (conv.newRequest.packagingType === "boxes" ? r.boxTypeId === conv.newRequest.boxTypeId : r.palletTypeId === conv.newRequest.palletTypeId)
    );

    const payload: any = {
      clientId: conv.newRequest.clientId,
      cityId: conv.newRequest.cityId,
      deliveryDate: conv.newRequest.deliveryDate,
      packagingType: conv.newRequest.packagingType,
      boxCount: conv.newRequest.boxCount,
      deliveryTypeId: 2,
    };

    if (conv.newRequest.packagingType === "boxes" && conv.newRequest.boxTypeId) {
      payload.boxTypeId = conv.newRequest.boxTypeId;
    }

    // Добавляем items с ценой если есть тариф
    if (rate) {
      const amount = rate.price * conv.newRequest.boxCount;
      payload.items = [{
        description: `${selectedCity?.shortName || "Доставка"}`,
        unit: conv.newRequest.packagingType === "pallets" ? "палета" : "место",
        quantity: conv.newRequest.boxCount,
        price: rate.price,
        amount: amount,
      }];
    }

    const response = await fetch(`${API_BASE_URL}/admin/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Create request error:", error);
      await ctx.reply("❌ Ошибка создания заявки");
      return;
    }

    const request = await response.json();

    // Сохраняем данные для сообщения перед удалением
    const boxCount = conv.newRequest.boxCount;
    const packagingType = conv.newRequest.packagingType;
    const totalAmount = rate ? rate.price * boxCount : 0;

    conv.newRequest = undefined;
    conv.state = "idle";
    warehouseConversations.set(telegramId, conv);

    await ctx.reply(
      `✅ *Заявка FBO создана!*\n\n` +
      `📋 Номер: #${request.id}\n` +
      `📍 Направление: ${selectedCity?.shortName || ""}\n` +
      `📦 Количество: ${boxCount} ${packagingType === "pallets" ? "палет" : "мест"}\n` +
      (totalAmount > 0 ? `💰 Сумма: ${totalAmount.toLocaleString("ru-RU")} ₽` : ""),
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Error creating FBO request:", err);
    await ctx.reply("❌ Произошла ошибка при создании заявки");
  }
}

/**
 * Создание FBS заявки
 */
async function createFbsRequest(ctx: Context, conv: any) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  try {
    // Загружаем данные для расчёта цены
    const [pricesRes, citiesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/prices-fbs`),
      fetch(`${API_BASE_URL}/admin/cities-fbs`),
    ]);

    if (!pricesRes.ok || !citiesRes.ok) {
      await ctx.reply("❌ Ошибка загрузки тарифов FBS");
      return;
    }

    const prices = await pricesRes.json();
    const cities = await citiesRes.json();

    const selectedCity = cities.find((c: any) => c.id === conv.newRequest.cityId);
    
    // Находим подходящий тариф
    const cityPrices = prices.filter((p: any) => p.destination === selectedCity?.shortName);
    const selectedPrice = cityPrices.find((p: any) => {
      const volNum = parseFloat(p.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      return conv.newRequest.volume <= volNum;
    }) || cityPrices[cityPrices.length - 1];

    let amount = 0;
    let pricePerM3 = 0;

    if (selectedPrice) {
      const priceNum = parseFloat(selectedPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
      const volNum = parseFloat(selectedPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
      pricePerM3 = priceNum / volNum;
      amount = Math.round(pricePerM3 * conv.newRequest.volume * 100) / 100;
    }

    const payload = {
      clientId: conv.newRequest.clientId,
      cityId: conv.newRequest.cityId,
      deliveryDate: conv.newRequest.deliveryDate,
      packagingType: "boxes",
      boxCount: 1,
      volume: conv.newRequest.volume,
      deliveryTypeId: 1,
      items: selectedPrice ? [{
        description: `${selectedCity?.fullName || selectedCity?.shortName || "FBS"}`,
        unit: "м³",
        quantity: conv.newRequest.volume,
        price: pricePerM3,
        amount: amount,
      }] : [],
    };

    const response = await fetch(`${API_BASE_URL}/admin/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Create FBS request error:", error);
      await ctx.reply("❌ Ошибка создания заявки FBS");
      return;
    }

    const request = await response.json();

    // Сохраняем данные для сообщения перед удалением
    const volume = conv.newRequest.volume;

    conv.newRequest = undefined;
    conv.state = "idle";
    warehouseConversations.set(telegramId, conv);

    await ctx.reply(
      `✅ *Заявка FBS создана!*\n\n` +
      `📋 Номер: #${request.id}\n` +
      `📍 Направление: ${selectedCity?.shortName || ""}\n` +
      `📦 Объём: ${volume} м³\n` +
      (amount > 0 ? `💰 Сумма: ${amount.toLocaleString("ru-RU")} ₽` : ""),
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Error creating FBS request:", err);
    await ctx.reply("❌ Произошла ошибка при создании заявки");
  }
}
