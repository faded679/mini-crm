import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { tbankPayment } from "../../services/tbank-payment.js";
import { notifyClient } from "../services/telegram-notifier.js";
import { sendPaymentLinkEmail } from "../services/email-service.js";

const router = Router();

// POST /admin/invoices — создать счет
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { number, counterpartyId, requestIds, items } = req.body;

    if (!number || !counterpartyId || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, "Missing required fields");
    }

    // Вычисляем общую сумму
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (Number(item.amount) || 0);
    }, 0);

    // Создаем счет
    const invoice = await (prisma as any).invoice.create({
      data: {
        number,
        counterpartyId: Number(counterpartyId),
        status: "new",
        amount: totalAmount,
        items: {
          create: items.map((item: any) => ({
            description: String(item.description),
            quantity: Number(item.quantity) || 1,
            unit: String(item.unit) || "шт",
            price: Number(item.price) || 0,
            amount: Number(item.amount) || 0,
          })),
        },
        // Связываем счет с заявками через промежуточную таблицу
        requests: requestIds && Array.isArray(requestIds) && requestIds.length > 0 ? {
          create: requestIds.map((requestId: number) => ({
            requestId: Number(requestId),
          })),
        } : undefined,
      },
      include: {
        items: true,
        counterparty: {
          include: {
            contacts: {
              include: {
                client: true,
              },
            },
          },
        },
        requests: {
          include: {
            request: true,
          },
        },
      },
    });

    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

// POST /admin/invoices/:id/send-payment-link — отправить ссылку на оплату
router.post("/:id/send-payment-link", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = Number(req.params.id);

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: {
        counterparty: {
          include: {
            contacts: {
              include: {
                client: true,
              },
            },
          },
        },
        requests: {
          include: {
            request: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    if (invoice.status === "paid") {
      throw new ApiError(400, "Invoice already paid");
    }

    // Получаем клиента — сначала из связанных заявок, потом из контактов контрагента
    let client = invoice.requests?.[0]?.request?.client;
    if (!client?.telegramId) {
      client = invoice.counterparty?.contacts?.[0]?.client;
    }
    if (!client?.telegramId) {
      throw new ApiError(400, "Client telegram ID not found. Привяжите заявку к счету или добавьте контактное лицо к организации.");
    }

    // Вычисляем сумму из items если amount не заполнен
    const items = await (prisma as any).invoiceItem.findMany({ where: { invoiceId } });
    const totalAmount = invoice.amount > 0
      ? invoice.amount
      : items.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);

    if (totalAmount <= 0) {
      throw new ApiError(400, "Сумма счета равна нулю. Проверьте позиции счета.");
    }

    // Если есть старый платёж — проверяем его статус в T-Bank
    if (invoice.tbankPaymentId && invoice.tbankPaymentUrl) {
      try {
        const state = await tbankPayment.getPaymentState(invoice.tbankPaymentId);
        const activeStatuses = ["NEW", "FORM_SHOWED", "AUTHORIZING", "AUTHORIZED", "CONFIRMING"];
        if (state.Success && activeStatuses.includes(state.Status)) {
          // Платёж ещё активен — пересылаем существующую ссылку
          let message = `💳 <b>Ссылка на оплату №${invoice.number}</b>\n`;
          if (invoice.requests && invoice.requests.length > 0) {
            const requestNumbers = invoice.requests.map((ir: any) => `#${ir.request.id}`).join(", ");
            message += `Заявки: ${requestNumbers}\n`;
          }
          message += `\nСумма: ${totalAmount.toLocaleString("ru-RU")} ₽\n\n` +
            `Для оплаты перейдите по ссылке:\n${invoice.tbankPaymentUrl}\n\nСсылка на оплату действует 24 часа.`;

          notifyClient(client.telegramId, message).catch((err: any) =>
            console.error("Telegram notification failed (resend):", err?.message ?? err)
          );

          // Отправляем email при пересылке существующей ссылки
          if (client.email && invoice.tbankPaymentUrl) {
            const reqNums = invoice.requests?.map((ir: any) => `#${ir.request.id}`);
            console.log(`[email] Resend: sending to ${client.email}`);
            sendPaymentLinkEmail({
              to: client.email,
              invoiceNumber: invoice.number,
              amount: totalAmount,
              paymentUrl: invoice.tbankPaymentUrl,
              requestNumbers: reqNums,
            }).then(() => console.log(`[email] Resend delivered to ${client.email}`))
              .catch((err: any) => console.error(`[email] Resend FAILED to ${client.email}:`, err?.message ?? err));
          }

          return res.json({
            success: true,
            paymentUrl: invoice.tbankPaymentUrl,
            paymentId: invoice.tbankPaymentId,
          });
        }
        // Платёж истёк/отклонён — создадим новый ниже
        console.log(`T-Bank payment ${invoice.tbankPaymentId} status: ${state.Status} — creating new payment`);
      } catch (checkErr) {
        console.error("Failed to check T-Bank payment state:", checkErr);
        // Не смогли проверить — создадим новый
      }
    }

    // Создаем платеж в T-Bank
    const amountInKopecks = Math.round(totalAmount * 100);
    // OrderId: только латиница, цифры и дефис, макс 36 символов
    const orderId = `INV-${invoice.id}-${Date.now()}`.slice(0, 36);
    const description = `Oplata scheta ${invoice.number}`;

    const notificationURL = `${process.env.API_BASE_URL || "https://test.ved31.ru/api"}/webhooks/tbank`;

    // Формируем чек (Receipt) для 54-ФЗ
    const receiptItems = items.map((item: any) => ({
      Name: (item.description || "Услуга").slice(0, 128),
      Price: Math.round((Number(item.amount) || 0) * 100),
      Quantity: 1,
      Amount: Math.round((Number(item.amount) || 0) * 100),
      Tax: "none",
    }));

    const receipt: any = {
      Taxation: "usn_income",
      Items: receiptItems,
    };

    if (client.email) {
      receipt.Email = client.email;
    } else if (client.phone) {
      receipt.Phone = client.phone;
    }

    const paymentResult = await tbankPayment.initPayment({
      amount: amountInKopecks,
      orderId,
      description,
      customerKey: client.telegramId,
      notificationURL,
      ...(receipt.Email || receipt.Phone ? { receipt } : {}),
    });

    // Обновляем счет
    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: "awaiting_payment",
        tbankPaymentId: String(paymentResult.PaymentId),
        tbankPaymentUrl: paymentResult.PaymentURL,
        tbankOrderId: paymentResult.OrderId,
      },
    });

    // Отправляем ссылку клиенту через бот (неблокирующе)
    {
      let message = `💳 <b>Ссылка на оплату №${invoice.number}</b>\n`;
      if (invoice.requests && invoice.requests.length > 0) {
        const requestNumbers = invoice.requests.map((ir: any) => `#${ir.request.id}`).join(", ");
        message += `Заявки: ${requestNumbers}\n`;
      }
      message += `\nСумма: ${totalAmount.toLocaleString("ru-RU")} ₽\n\n` +
        `Для оплаты перейдите по ссылке:\n${paymentResult.PaymentURL}\n\nСсылка на оплату действует 24 часа.`;

      notifyClient(client.telegramId, message).catch((err: any) =>
        console.error("Telegram notification failed:", err?.message ?? err)
      );
    }

    // Отправляем ссылку на email если есть
    console.log(`[email] client.email=${client.email ?? "null"}, EMAIL_SERVICE_URL=${process.env.EMAIL_SERVICE_URL ?? "(default 172.17.0.1:5001)"}`);
    if (client.email && paymentResult.PaymentURL) {
      const requestNumbers = invoice.requests?.map((ir: any) => `#${ir.request.id}`);
      console.log(`[email] Sending payment link to ${client.email}`);
      sendPaymentLinkEmail({
        to: client.email,
        invoiceNumber: invoice.number,
        amount: totalAmount,
        paymentUrl: paymentResult.PaymentURL as string,
        requestNumbers,
      }).then(() => {
        console.log(`[email] Payment link email delivered to ${client.email}`);
      }).catch((err: any) => {
        console.error(`[email] Payment link email FAILED to ${client.email}:`, err?.message ?? err);
      });
    } else {
      console.warn(`[email] Skipped: client.email=${client.email ?? "null"}, paymentURL=${paymentResult.PaymentURL ? "ok" : "null"}`);
    }

    res.json({
      success: true,
      paymentUrl: paymentResult.PaymentURL,
      paymentId: paymentResult.PaymentId,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices — получить список счетов
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, counterpartyId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (counterpartyId) where.counterpartyId = Number(counterpartyId);

    const invoices = await (prisma as any).invoice.findMany({
      where,
      include: {
        counterparty: true,
        items: true,
        requests: {
          include: {
            request: {
              include: {
                client: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// GET /admin/invoices/:id — получить счет
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = Number(req.params.id);

    const invoice = await (prisma as any).invoice.findUnique({
      where: { id: invoiceId },
      include: {
        counterparty: true,
        items: true,
        requests: {
          include: {
            request: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

export default router;
