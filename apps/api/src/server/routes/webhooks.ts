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

    console.log(`Webhook: OrderId=${OrderId}, Status=${Status}, PaymentId=${PaymentId}, Success=${Success}`);

    // Сначала ищем пополнение баланса (OrderId начинается с DEP-)
    const balancePayment = await (prisma as any).balancePayment.findFirst({
      where: {
        OR: [
          { tbankOrderId: OrderId },
          { tbankPaymentId: PaymentId },
        ],
      },
      include: {
        client: {
          include: {
            counterparties: {
              include: {
                counterparty: true,
              },
            },
          },
        },
      },
    });

    if (balancePayment) {
      await handleBalancePaymentWebhook(balancePayment, notification, res);
      return;
    }

    // Иначе ищем счет по OrderId (это наш invoice.id или invoice.number)
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

    await handleInvoiceWebhook(invoice, notification, res);
  } catch (err) {
    console.error("T-Bank webhook error:", err);
    next(err);
  }
});

async function handleBalancePaymentWebhook(
  balancePayment: any,
  notification: any,
  res: Response
) {
  const { Status, Success } = notification;
  const PaymentId = String(notification.PaymentId);
  const amount = Number(balancePayment.amount) || 0;

  if (Success && Status === "CONFIRMED") {
    const wasAlreadyPaid = balancePayment.status === "paid";

    await (prisma as any).balancePayment.update({
      where: { id: balancePayment.id },
      data: {
        status: "paid",
        paidAt: balancePayment.paidAt || new Date(),
        tbankPaymentId: PaymentId,
      },
    });

    console.log(`BalancePayment ${balancePayment.id} marked as paid (wasAlreadyPaid: ${wasAlreadyPaid})`);

    // Создаём BankTransaction для каждого связанного контрагента клиента
    if (!wasAlreadyPaid && balancePayment.client?.counterparties?.length > 0) {
      try {
        const existingTx = await (prisma as any).bankTransaction.findFirst({
          where: { tbankPaymentId: PaymentId },
        });
        if (!existingTx) {
          // Если у клиента один контрагент — зачисляем на него
          // Если несколько — зачисляем на первого (или можно распределить)
          const primaryCounterparty = balancePayment.client.counterparties[0].counterparty;
          await (prisma as any).bankTransaction.create({
            data: {
              counterpartyId: primaryCounterparty.id,
              direction: "incoming",
              status: "matched",
              amount: amount,
              purpose: `Пополнение баланса (T-Bank SBP) ${amount.toLocaleString("ru-RU")} ₽`,
              documentDate: new Date(),
              documentNumber: `TBANK-DEP-${PaymentId}`,
              payerName: balancePayment.client.phone || primaryCounterparty.shortName || primaryCounterparty.name || "T-Bank",
              recipientName: "Sologo",
              invoiceNumbers: [],
              matchedAt: new Date(),
              tbankPaymentId: PaymentId,
            },
          });
          console.log(`BankTransaction created for balance payment ${balancePayment.id}, counterpartyId=${primaryCounterparty.id}, amount=${amount}`);
          await recalculateBalance(primaryCounterparty.id);
          console.log(`Balance recalculated for counterpartyId=${primaryCounterparty.id}`);
        }
      } catch (balanceErr) {
        console.error("Failed to create BankTransaction or recalculate balance for deposit:", balanceErr);
      }
    }

    // Уведомление в Telegram
    if (!wasAlreadyPaid) {
      try {
        if (balancePayment.client?.telegramId) {
          const message = `✅ <b>Пополнение баланса получено!</b>\n\nСумма: ${amount.toLocaleString("ru-RU")} ₽\n\nСпасибо! Средства зачислены на баланс.`;
          await notifyClient(balancePayment.client.telegramId, message);
        }
      } catch (notifErr) {
        console.error("Failed to send deposit confirmation notification:", notifErr);
      }
    }
  } else if (Success && Status === "AUTHORIZED") {
    await (prisma as any).balancePayment.update({
      where: { id: balancePayment.id },
      data: { tbankPaymentId: PaymentId },
    });
    console.log(`BalancePayment ${balancePayment.id} authorized (PaymentId: ${PaymentId})`);
  } else if (Status === "REJECTED" || Status === "CANCELED") {
    await (prisma as any).balancePayment.update({
      where: { id: balancePayment.id },
      data: { status: "cancelled", tbankPaymentId: PaymentId },
    });
    console.log(`BalancePayment ${balancePayment.id} cancelled/rejected`);
  }

  res.json({ OK: true });
}

async function handleInvoiceWebhook(invoice: any, notification: any, res: Response) {
  const { Status, Success } = notification;
  const PaymentId = String(notification.PaymentId);

  const items = await (prisma as any).invoiceItem.findMany({ where: { invoiceId: invoice.id } });
  const totalAmount = items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

  if (Success && Status === "CONFIRMED") {
    const wasAlreadyPaid = invoice.status === "paid";

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
    await (prisma as any).invoice.update({
      where: { id: invoice.id },
      data: { tbankPaymentId: PaymentId },
    });
    console.log(`Invoice ${invoice.number} payment authorized (PaymentId: ${PaymentId})`);
  } else if (Status === "REJECTED" || Status === "CANCELED") {
    await (prisma as any).invoice.update({
      where: { id: invoice.id },
      data: { status: "cancelled", tbankPaymentId: PaymentId },
    });
    console.log(`Invoice ${invoice.number} payment cancelled/rejected`);
  }

  res.json({ OK: true });
}

export default router;
