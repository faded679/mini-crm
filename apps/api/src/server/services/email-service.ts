import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Соловьев-Экспресс <noreply@ved31.ru>";

function isConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendPaymentLinkEmail(opts: {
  to: string;
  invoiceNumber: string;
  amount: number;
  paymentUrl: string;
  requestNumbers?: string[];
}): Promise<void> {
  if (!isConfigured()) return;

  const requestsLine = opts.requestNumbers?.length
    ? `<p>Заявки: ${opts.requestNumbers.join(", ")}</p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Счёт на оплату №${opts.invoiceNumber}</h2>
      ${requestsLine}
      <p>Сумма: <strong>${opts.amount.toLocaleString("ru-RU")} ₽</strong></p>
      <p>Для оплаты нажмите кнопку ниже:</p>
      <a href="${opts.paymentUrl}" 
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Оплатить
      </a>
      <p style="color: #888; font-size: 12px; margin-top: 24px;">Ссылка действует 24 часа.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Счёт на оплату №${opts.invoiceNumber} — ${opts.amount.toLocaleString("ru-RU")} ₽`,
      html,
    });
    if (error) throw new Error(error.message);
    console.log(`Payment link email sent to ${opts.to}`);
  } catch (err) {
    console.error(`Payment link email FAILED to ${opts.to}:`, err);
    throw err;
  }
}

export async function sendInvoiceEmail(opts: {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  if (!isConfigured()) return;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Счёт №${opts.invoiceNumber}`,
      html: `<p>Здравствуйте!</p><p>Во вложении — счёт №${opts.invoiceNumber}.</p>`,
      attachments: [
        {
          filename: `Счёт_${opts.invoiceNumber}.pdf`,
          content: opts.pdfBuffer.toString("base64"),
        },
      ],
    });
    if (error) throw new Error(error.message);
    console.log(`Invoice PDF email sent to ${opts.to}`);
  } catch (err) {
    console.error(`Invoice PDF email FAILED to ${opts.to}:`, err);
    throw err;
  }
}

export async function sendActEmail(opts: {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  if (!isConfigured()) {
    console.log("Email not configured (RESEND_API_KEY missing), skipping");
    return;
  }

  console.log(`Sending act email to ${opts.to}`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `Акт №${opts.invoiceNumber}`,
      html: `<p>Здравствуйте!</p><p>Во вложении — акт №${opts.invoiceNumber}.</p>`,
      attachments: [
        {
          filename: `Акт_${opts.invoiceNumber}.pdf`,
          content: opts.pdfBuffer.toString("base64"),
        },
      ],
    });
    if (error) throw new Error(error.message);
    console.log(`Act PDF email sent to ${opts.to}, id: ${data?.id}`);
  } catch (err) {
    console.error(`Act PDF email FAILED to ${opts.to}:`, err);
    throw err;
  }
}
