import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { tbankPayment } from "../../services/tbank-payment.js";
import { notifyClient } from "../services/telegram-notifier.js";

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
            request: true,
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

    // Получаем клиента
    const client = invoice.counterparty.contacts[0]?.client;
    if (!client?.telegramId) {
      throw new ApiError(400, "Client telegram ID not found");
    }

    // Создаем платеж в T-Bank
    const amountInKopecks = Math.round(invoice.amount * 100);
    const orderId = invoice.number;
    const description = `Оплата счета №${invoice.number}`;

    const notificationURL = `${process.env.API_BASE_URL || "https://test.ved31.ru/api"}/webhooks/tbank`;

    const paymentResult = await tbankPayment.initPayment({
      amount: amountInKopecks,
      orderId,
      description,
      customerKey: client.telegramId,
      notificationURL,
    });

    // Обновляем счет
    await (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        status: "awaiting_payment",
        tbankPaymentId: paymentResult.PaymentId,
        tbankPaymentUrl: paymentResult.PaymentURL,
        tbankOrderId: paymentResult.OrderId,
      },
    });

    // Отправляем ссылку клиенту через бот
    try {
      let message = `💳 <b>Счет на оплату №${invoice.number}</b>\n`;
      if (invoice.requests && invoice.requests.length > 0) {
        const requestNumbers = invoice.requests.map((ir: any) => `#${ir.request.id}`).join(", ");
        message += `Заявки: ${requestNumbers}\n`;
      }
      message += `\nСумма: ${invoice.amount.toLocaleString("ru-RU")} ₽\n\n` +
        `Для оплаты перейдите по ссылке:\n${paymentResult.PaymentURL}\n\nСсылка на оплату действует 24 часа.`;

      await notifyClient(client.telegramId, message);
    } catch (notifErr) {
      console.error("Failed to send payment link notification:", notifErr);
      throw new ApiError(500, "Failed to send payment link to client");
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
