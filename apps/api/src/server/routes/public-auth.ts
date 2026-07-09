import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { initiateVerificationCall, checkVerificationStatus } from "../services/zvonok-service.js";
import { tbankPayment } from "../../services/tbank-payment.js";
import { recalculateBalance } from "../services/bank-import-service.js";

const JWT_SECRET = process.env.JWT_SECRET || "public-client-secret-change-me";

const router = Router();

// Временное хранилище для сессий верификации (в продакшене использовать Redis)
const verificationSessions = new Map<string, { phone: string; expiresAt: number; createdAt: string }>();

// POST /public-auth/request-verification - инициировать сессию верификации
router.post("/request-verification", async (req, res, next) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      throw new ApiError(400, "Phone number is required");
    }

    // Нормализация номера телефона
    let normalizedPhone = phone.replace(/\D/g, "");
    
    if (normalizedPhone.length < 10) {
      throw new ApiError(400, "Invalid phone number");
    }

    // Приводим к формату 7XXXXXXXXXX
    if (normalizedPhone.startsWith("8")) {
      // 89101111111 -> 79101111111
      normalizedPhone = "7" + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith("9")) {
      // 9101111111 -> 79101111111
      normalizedPhone = "7" + normalizedPhone;
    } else if (!normalizedPhone.startsWith("7")) {
      // Если не начинается с 7, 8 или 9 - добавляем 7
      normalizedPhone = "7" + normalizedPhone;
    }

    // Zvonok ожидает номер в формате +7XXXXXXXXXX
    normalizedPhone = "+" + normalizedPhone;

    // Инициируем сессию верификации через Zvonok
    const response = await initiateVerificationCall(normalizedPhone);
    
    // Сохраняем сессию с временем жизни 10 минут
    verificationSessions.set(response.request_id, {
      phone: normalizedPhone,
      expiresAt: Date.now() + 10 * 60 * 1000,
      createdAt: new Date().toISOString(),
    });

    // Очистка старых сессий
    for (const [key, value] of verificationSessions.entries()) {
      if (value.expiresAt < Date.now()) {
        verificationSessions.delete(key);
      }
    }

    res.json({ 
      sessionId: response.request_id,
      verificationNumber: response.verification_number,
      message: `Позвоните на номер ${response.verification_number} для подтверждения`
    });
  } catch (err) {
    next(err);
  }
});

// GET /public-auth/check-verification/:sessionId - проверить статус верификации
router.get("/check-verification/:sessionId", async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      throw new ApiError(400, "Session ID is required");
    }

    // Проверяем существование сессии
    const session = verificationSessions.get(sessionId);
    
    if (!session) {
      throw new ApiError(404, "Session not found or expired");
    }

    if (session.expiresAt < Date.now()) {
      verificationSessions.delete(sessionId);
      throw new ApiError(401, "Session expired");
    }

    // Проверяем статус верификации в Zvonok по номеру телефона (только свежие звонки)
    const status = await checkVerificationStatus(session.phone, session.createdAt);

    if (status.verified) {
      console.log("Verification successful for phone:", session.phone);

      // Верификация успешна, удаляем сессию
      verificationSessions.delete(sessionId);

      // Нормализуем номер для поиска (с + и без)
      const phoneWithPlus = session.phone.startsWith("+") ? session.phone : "+" + session.phone;
      const phoneWithoutPlus = session.phone.startsWith("+") ? session.phone.slice(1) : session.phone;

      // Пытаемся найти или создать клиента
      let clientId = 0;
      let clientPhone = session.phone;
      
      try {
        // Ищем клиента по обоим форматам номера с включением связей
        let client = await (prisma as any).client.findFirst({
          where: { 
            OR: [
              { phone: phoneWithPlus },
              { phone: phoneWithoutPlus },
            ]
          },
          include: {
            counterparties: {
              include: {
                counterparty: true,
              },
            },
          },
        });
        console.log("Found existing client:", client ? client.id : "none");

        if (!client) {
          client = await (prisma as any).client.create({
            data: {
              phone: phoneWithoutPlus,
              telegramId: `phone_${phoneWithoutPlus}_${Date.now()}`,
            },
            include: {
              counterparties: {
                include: {
                  counterparty: true,
                },
              },
            },
          });
          console.log("Created new client:", client.id);
        }
        
        clientId = client.id;
        clientPhone = client.phone || session.phone;

        // Проверяем заполненность профиля
        const hasEmail = !!client.email;
        const hasCounterparty = client.counterparties && client.counterparties.length > 0;
        const hasInn = hasCounterparty && !!client.counterparties[0]?.counterparty?.inn;
        const requiresProfileCompletion = !hasEmail || !hasInn;

        console.log("Profile check:", { hasEmail, hasInn, requiresProfileCompletion });

        // Генерируем JWT токен для авторизации
        const token = jwt.sign(
          { clientId, phone: clientPhone },
          JWT_SECRET,
          { expiresIn: "30d" }
        );

        res.json({
          verified: true,
          token,
          client: {
            id: clientId,
            phone: clientPhone,
            email: client.email,
            inn: hasCounterparty ? client.counterparties[0]?.counterparty?.inn : null,
          },
          requiresProfileCompletion,
        });
        return;
      } catch (dbErr: any) {
        console.error("DB error (non-fatal):", dbErr.message);
      }

      // Fallback если произошла ошибка БД
      const token = jwt.sign(
        { clientId, phone: clientPhone },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      res.json({
        verified: true,
        token,
        client: {
          id: clientId,
          phone: clientPhone,
        },
        requiresProfileCompletion: true,
      });
    } else {
      // Верификация еще не завершена
      res.json({
        verified: false,
        message: "Ожидание звонка..."
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /public-auth/complete-profile - заполнение профиля (email и ИНН)
router.post("/complete-profile", async (req, res, next) => {
  try {
    const { email, inn } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization required");
    }

    const token = authHeader.slice(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid token");
    }

    const clientId = decoded.clientId;
    if (!clientId) {
      throw new ApiError(401, "Invalid token payload");
    }

    // Валидация email
    if (!email || !email.includes("@")) {
      throw new ApiError(400, "Valid email is required");
    }

    // Валидация ИНН (10 или 12 цифр)
    const innDigits = inn?.replace(/\D/g, "");
    if (!innDigits || (innDigits.length !== 10 && innDigits.length !== 12)) {
      throw new ApiError(400, "ИНН должен содержать 10 или 12 цифр");
    }

    // Обновляем email клиента
    await (prisma as any).client.update({
      where: { id: clientId },
      data: { email: email.trim() },
    });

    // Ищем или создаём контрагента по ИНН
    // Поиск по точному значению и по варианту "ИНН XXXXXXXXXX" (если в базе так записано)
    let counterparty = await (prisma as any).counterparty.findFirst({
      where: { inn: { in: [innDigits, `ИНН ${innDigits}`] } },
    });

    if (!counterparty) {
      // Создаём нового контрагента с минимальными данными
      counterparty = await (prisma as any).counterparty.create({
        data: {
          inn: innDigits,
          name: `Контрагент ${innDigits}`,
          shortName: innDigits,
        },
      });
    }

    // Проверяем существует ли связь клиента с контрагентом
    const existingLink = await (prisma as any).counterpartyContact.findFirst({
      where: {
        clientId: clientId,
        counterpartyId: counterparty.id,
      },
    });

    if (!existingLink) {
      // Создаём связь клиента с контрагентом
      await (prisma as any).counterpartyContact.create({
        data: {
          clientId: clientId,
          counterpartyId: counterparty.id,
        },
      });
    }

    res.json({
      success: true,
      message: "Профиль успешно заполнен",
      client: {
        id: clientId,
        email: email.trim(),
        inn: innDigits,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /public-auth/balance - получить баланс клиента (итоговый долг/переплата)
router.get("/balance", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization required");
    }

    const token = authHeader.slice(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid token");
    }

    const clientId = decoded.clientId;
    if (!clientId) {
      throw new ApiError(401, "Invalid token payload");
    }

    // Находим клиента со связанными контрагентами
    const client = await (prisma as any).client.findUnique({
      where: { id: clientId },
      include: {
        counterparties: {
          include: {
            counterparty: {
              include: {
                balance: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new ApiError(404, "Client not found");
    }

    // Суммируем балансы всех связанных контрагентов
    let totalBilled = 0;
    let totalPaid = 0;
    let balance = 0;

    for (const link of client.counterparties || []) {
      const cp = link.counterparty;
      if (cp?.balance) {
        totalBilled += Number(cp.balance.totalBilled) || 0;
        totalPaid += Number(cp.balance.totalPaid) || 0;
        balance += Number(cp.balance.balance) || 0;
      }
    }

    res.json({
      totalBilled,
      totalPaid,
      balance, // положительный = долг, отрицательный = переплата
      organizationCount: client.counterparties?.length || 0,
    });
  } catch (err) {
    next(err);
  }
});

function getClientIdFromToken(req: any): number {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization required");
  }
  const token = authHeader.slice(7);
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid token");
  }
  const clientId = decoded.clientId;
  if (!clientId) {
    throw new ApiError(401, "Invalid token payload");
  }
  return Number(clientId);
}

// POST /public-auth/deposit - создать платёж пополнения баланса
router.post("/deposit", async (req, res, next) => {
  try {
    const clientId = getClientIdFromToken(req);
    const { amount } = req.body;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new ApiError(400, "Сумма пополнения должна быть больше 0");
    }

    const client = await (prisma as any).client.findUnique({
      where: { id: clientId },
      include: { counterparties: { include: { counterparty: true } } },
    });
    if (!client) {
      throw new ApiError(404, "Client not found");
    }

    // Создаём запись пополнения
    const balancePayment = await (prisma as any).balancePayment.create({
      data: { clientId, amount: numericAmount, status: "new" },
    });

    const amountInKopecks = Math.round(numericAmount * 100);
    const orderId = `DEP-${balancePayment.id}-${Date.now()}`.slice(0, 36);
    const description = `Popolnenie balansa`;
    const notificationURL = `${process.env.API_BASE_URL || "https://test.ved31.ru/api"}/webhooks/tbank`;

    const receipt: any = {
      Taxation: "usn_income",
      Items: [
        {
          Name: "Пополнение баланса",
          Price: amountInKopecks,
          Quantity: 1,
          Amount: amountInKopecks,
          Tax: "none",
        },
      ],
    };
    if (client.email) receipt.Email = client.email;
    else if (client.phone) receipt.Phone = client.phone;

    const paymentResult = await tbankPayment.initPayment({
      amount: amountInKopecks,
      orderId,
      description,
      customerKey: client.telegramId || String(clientId),
      notificationURL,
      receipt,
    });

    await (prisma as any).balancePayment.update({
      where: { id: balancePayment.id },
      data: {
        status: "awaiting_payment",
        tbankPaymentId: String(paymentResult.PaymentId),
        tbankPaymentUrl: paymentResult.PaymentURL,
        tbankOrderId: paymentResult.OrderId,
      },
    });

    res.json({
      success: true,
      depositId: balancePayment.id,
      amount: numericAmount,
      paymentUrl: paymentResult.PaymentURL,
      paymentId: paymentResult.PaymentId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /public-auth/deposit/:id/status - проверить статус платежа пополнения
router.get("/deposit/:id/status", async (req, res, next) => {
  try {
    const clientId = getClientIdFromToken(req);
    const depositId = Number(req.params.id);
    if (!Number.isFinite(depositId)) {
      throw new ApiError(400, "Invalid deposit id");
    }

    const deposit = await (prisma as any).balancePayment.findFirst({
      where: { id: depositId, clientId },
    });
    if (!deposit) {
      throw new ApiError(404, "Deposit not found");
    }

    let tbankStatus: string | null = null;
    if (deposit.tbankPaymentId) {
      try {
        const state = await tbankPayment.getPaymentState(deposit.tbankPaymentId);
        tbankStatus = state.Status;
      } catch (e) {
        console.error("Failed to get TBank state for deposit", depositId, e);
      }
    }

    res.json({
      depositId: deposit.id,
      status: deposit.status,
      amount: deposit.amount,
      tbankStatus,
      paidAt: deposit.paidAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
