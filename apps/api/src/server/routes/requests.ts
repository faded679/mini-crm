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

    // Находим существующий счет для этой заявки через промежуточную таблицу
    const invoiceRequest = await (prisma as any).invoiceRequest.findFirst({
      where: { requestId },
      include: {
        invoice: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoice = invoiceRequest?.invoice;

    if (!invoice) {
      throw new ApiError(404, "Invoice not found for this request. Please create invoice first.");
    }

    const client = invoice.counterparty.contacts[0]?.client;
    if (!client?.telegramId) {
      throw new ApiError(400, "Client telegram ID not found");
    }

    // Считаем сумму из позиций счета
    const totalAmount = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    if (totalAmount <= 0) {
      throw new ApiError(400, "Invoice amount is zero or negative");
    }

    // Если ссылка уже создана и счет ожидает оплату, просто отправляем существующую
    if (invoice.status === "awaiting_payment" && invoice.tbankPaymentUrl) {
      let message = `💳 <b>Счет на оплату №${invoice.number}</b>\n`;
      if (invoice.requests && invoice.requests.length > 0) {
        const requestNumbers = invoice.requests.map((ir: any) => `#${ir.request.id}`).join(", ");
        message += `Заявки: ${requestNumbers}\n`;
      }
      message += `\nСумма: ${totalAmount.toLocaleString("ru-RU")} ₽\n\n` +
        `Для оплаты перейдите по ссылке:\n${invoice.tbankPaymentUrl}\n\nСсылка на оплату действует 24 часа.`;

      await notifyClient(client.telegramId, message);

      return res.json({
        success: true,
        paymentUrl: invoice.tbankPaymentUrl,
        paymentId: invoice.tbankPaymentId,
        amount: totalAmount,
        message: "Existing payment link sent",
      });
    }

    // Если счет уже оплачен
    if (invoice.status === "paid") {
      throw new ApiError(400, "Invoice already paid");
    }

    // Создаем новый платеж в T-Bank
    const amountInKopecks = Math.round(totalAmount * 100);
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
      totalAmount,
    });

    // Формируем чек (Receipt) для 54-ФЗ
    const receiptItems = invoice.items.map((item: any) => ({
      Name: item.description || "Услуга",
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
      where: { id: invoice.id },
      data: {
        status: "awaiting_payment",
        tbankPaymentId: String(paymentResult.PaymentId),
        tbankPaymentUrl: paymentResult.PaymentURL,
        tbankOrderId: paymentResult.OrderId,
      },
    });

    // Отправляем ссылку клиенту
    const message = 
      `💳 <b>Счет на оплату №${invoice.number}</b>\n` +
      `Заявка №${requestId}\n\n` +
      `Сумма: ${totalAmount.toLocaleString("ru-RU")} ₽\n\n` +
      `Для оплаты перейдите по ссылке:\n${paymentResult.PaymentURL}\n\nСсылка на оплату действует 24 часа.`;

    await notifyClient(client.telegramId, message);

    res.json({
      success: true,
      paymentUrl: paymentResult.PaymentURL,
      paymentId: paymentResult.PaymentId,
      amount: totalAmount,
    });
  } catch (err) {
    console.error("send-payment-link error:", err);
    next(err);
  }
});

export default router;
