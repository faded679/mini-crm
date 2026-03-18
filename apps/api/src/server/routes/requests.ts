import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { ApiError } from "../errors.js";
import { tbankPayment } from "../../services/tbank-payment.js";
import { notifyClient } from "../services/telegram-notifier.js";

const router = Router();

// POST /admin/requests/:id/send-payment-link — отправить ссылку на оплату используя существующий счет
router.post("/:id/send-payment-link", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestId = Number(req.params.id);

    // Находим существующий счет для этой заявки
    const invoice = await (prisma as any).invoice.findFirst({
      where: { requestId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found for this request. Please create invoice first.");
    }

    const client = invoice.counterparty.contacts[0]?.client;
    if (!client?.telegramId) {
      throw new ApiError(400, "Client telegram ID not found");
    }

    // Если ссылка уже создана и счет ожидает оплату, просто отправляем существующую
    if (invoice.status === "awaiting_payment" && invoice.tbankPaymentUrl) {
      const message = 
        `💳 <b>Ссылка на оплату счета №${invoice.number}</b>\n\n` +
        `Сумма: ${invoice.amount.toLocaleString("ru-RU")} ₽\n\n` +
        `Для оплаты перейдите по ссылке:\n${invoice.tbankPaymentUrl}`;

      await notifyClient(client.telegramId, message);

      return res.json({
        success: true,
        paymentUrl: invoice.tbankPaymentUrl,
        paymentId: invoice.tbankPaymentId,
        amount: invoice.amount,
        message: "Existing payment link sent",
      });
    }

    // Если счет уже оплачен
    if (invoice.status === "paid") {
      throw new ApiError(400, "Invoice already paid");
    }

    // Создаем новый платеж в T-Bank
    const amountInKopecks = Math.round(invoice.amount * 100);
    // OrderId: только латиница, цифры и дефис, макс 36 символов
    const orderId = `INV-${invoice.id}-${Date.now()}`.slice(0, 36);
    const description = `Оплата счета №${invoice.number}`;
    const notificationURL = `${process.env.API_BASE_URL || "https://test.ved31.ru/api"}/webhooks/tbank`;

    console.log("T-Bank initPayment params:", {
      amount: amountInKopecks,
      orderId,
      description,
      customerKey: client.telegramId,
      notificationURL,
      invoiceAmount: invoice.amount,
    });

    if (amountInKopecks <= 0) {
      throw new ApiError(400, "Invoice amount is zero or negative");
    }

    const paymentResult = await tbankPayment.initPayment({
      amount: amountInKopecks,
      orderId,
      description,
      customerKey: client.telegramId,
      notificationURL,
    });

    // Обновляем счет
    await (prisma as any).invoice.update({
      where: { id: invoice.id },
      data: {
        status: "awaiting_payment",
        tbankPaymentId: paymentResult.PaymentId,
        tbankPaymentUrl: paymentResult.PaymentURL,
        tbankOrderId: paymentResult.OrderId,
      },
    });

    // Отправляем ссылку клиенту
    const message = 
      `💳 <b>Ссылка на оплату счета №${invoice.number}</b>\n\n` +
      `Сумма: ${invoice.amount.toLocaleString("ru-RU")} ₽\n\n` +
      `Для оплаты перейдите по ссылке:\n${paymentResult.PaymentURL}`;

    await notifyClient(client.telegramId, message);

    res.json({
      success: true,
      paymentUrl: paymentResult.PaymentURL,
      paymentId: paymentResult.PaymentId,
      amount: invoice.amount,
    });
  } catch (err) {
    console.error("send-payment-link error:", err);
    next(err);
  }
});

export default router;
