import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../db/prisma.js";
import { tbankPayment } from "../../services/tbank-payment.js";
import { notifyClient } from "../services/telegram-notifier.js";
import { recalculateBalance } from "../services/bank-import-service.js";

const router = Router();

// POST /webhooks/tbank — webhook для уведомлений от T-Bank
router.post("/tbank", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = req.body;

    console.log("T-Bank webhook received:", JSON.stringify(notification, null, 2));

    // Проверяем подпись уведомления
    const isValid = tbankPayment.verifyNotification(notification);
    if (!isValid) {
      console.error("Invalid T-Bank notification signature");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const { OrderId, Status, Success } = notification;
    const PaymentId = String(notification.PaymentId);

    // Находим счет по OrderId (это наш invoice.id или invoice.number)
    const invoice = await (prisma as any).invoice.findFirst({
      where: {
        OR: [
          { tbankOrderId: OrderId },
          { number: OrderId },
        ],
      },
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
      },
    });

    if (!invoice) {
      console.error(`Invoice not found for OrderId: ${OrderId}`);
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    // Считаем сумму из позиций счета
    const items = await (prisma as any).invoiceItem.findMany({ where: { invoiceId: invoice.id } });
    const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

    console.log(`Webhook: OrderId=${OrderId}, Status=${Status}, PaymentId=${PaymentId}, Success=${Success}`);

    // Обновляем статус счета в зависимости от статуса платежа
    if (Success && Status === "CONFIRMED") {
      // Проверяем, не был ли счет уже оплачен
      const wasAlreadyPaid = invoice.status === "paid";

      // Платеж успешно подтвержден
      await (prisma as any).invoice.update({
        where: { id: invoice.id },
        data: {
          status: "paid",
          isPaid: true,
          paidAt: invoice.paidAt || new Date(),
          tbankPaymentId: PaymentId,
        },
      });

      console.log(`Invoice ${invoice.number} marked as paid (wasAlreadyPaid: ${wasAlreadyPaid})`);

      // Создаём BankTransaction и пересчитываем баланс ТОЛЬКО если счет не был оплачен ранее
      if (!wasAlreadyPaid && invoice.counterpartyId) {
        try {
          const existingTx = await (prisma as any).bankTransaction.findFirst({
            where: { tbankPaymentId: PaymentId },
          });
          if (!existingTx) {
            await (prisma as any).bankTransaction.create({
              data: {
                counterpartyId: invoice.counterpartyId,
                direction: "incoming",
                status: "matched",
                amount: totalAmount,
                purpose: `Оплата счёта №${invoice.number} (T-Bank QR/ссылка)`,
                documentDate: new Date(),
                documentNumber: `TBANK-${PaymentId}`,
                payerName: invoice.counterparty?.shortName || invoice.counterparty?.name || "T-Bank",
                recipientName: "Sologo",
                invoiceNumbers: [invoice.number],
                matchedAt: new Date(),
                tbankPaymentId: PaymentId,
              },
            });
            console.log(`BankTransaction created for invoice ${invoice.number}, amount=${totalAmount}`);
          }
          await recalculateBalance(invoice.counterpartyId);
          console.log(`Balance recalculated for counterpartyId=${invoice.counterpartyId}`);
        } catch (balanceErr) {
          console.error("Failed to create BankTransaction or recalculate balance:", balanceErr);
        }
      }

      // Отправляем уведомление клиенту ТОЛЬКО если счет не был оплачен ранее
      if (!wasAlreadyPaid) {
        try {
          const client = invoice.counterparty.contacts[0]?.client;
          if (client?.telegramId) {
            const message = `✅ <b>Оплата получена!</b>\n\nСчет №${invoice.number} успешно оплачен.\nСумма: ${totalAmount.toLocaleString("ru-RU")} ₽\n\nСпасибо за оплату!`;
            await notifyClient(client.telegramId, message);
          }
        } catch (notifErr) {
          console.error("Failed to send payment confirmation notification:", notifErr);
        }
      }
    } else if (Success && Status === "AUTHORIZED") {
      // Платеж авторизован (деньги заблокированы), но еще не подтвержден
      // Просто сохраняем PaymentId, не меняем статус счета
      await (prisma as any).invoice.update({
        where: { id: invoice.id },
        data: {
          tbankPaymentId: PaymentId,
        },
      });

      console.log(`Invoice ${invoice.number} payment authorized (PaymentId: ${PaymentId})`);
    } else if (Status === "REJECTED" || Status === "CANCELED") {
      // Платеж отклонен или отменен
      await (prisma as any).invoice.update({
        where: { id: invoice.id },
        data: {
          status: "cancelled",
          tbankPaymentId: PaymentId,
        },
      });

      console.log(`Invoice ${invoice.number} payment cancelled/rejected`);
    }

    // Отправляем OK ответ T-Bank
    res.json({ OK: true });
  } catch (err) {
    console.error("T-Bank webhook error:", err);
    next(err);
  }
});

export default router;
