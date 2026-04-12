import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.yandex.ru",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  socketTimeout: 15000,
  connectionTimeout: 15000,
});

const FROM = process.env.SMTP_FROM || `"Соловьев-Экспресс" <${process.env.SMTP_USER}>`;

function isConfigured(): boolean {
  return !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
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

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Счёт на оплату №${opts.invoiceNumber} — ${opts.amount.toLocaleString("ru-RU")} ₽`,
    html,
  });

  console.log(`Payment link email sent to ${opts.to}`);
}

export async function sendInvoiceEmail(opts: {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  if (!isConfigured()) return;

  await transporter.sendMail({
    from: FROM,
    to: opts.to,
    subject: `Счёт №${opts.invoiceNumber}`,
    html: `<p>Здравствуйте!</p><p>Во вложении — счёт №${opts.invoiceNumber}.</p>`,
    attachments: [
      {
        filename: `Счёт_${opts.invoiceNumber}.pdf`,
        content: opts.pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log(`Invoice PDF email sent to ${opts.to}`);
}

export async function sendActEmail(opts: {
  to: string;
  invoiceNumber: string;
  pdfBuffer: Buffer;
}): Promise<void> {
  if (!isConfigured()) {
    console.log("Email not configured (SMTP_USER or SMTP_PASS missing), skipping");
    return;
  }

  console.log(`Sending act email to ${opts.to}, SMTP_USER=${process.env.SMTP_USER}, host=${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);

  try {
    const result = await transporter.sendMail({
      from: FROM,
      to: opts.to,
      subject: `Акт №${opts.invoiceNumber}`,
      html: `<p>Здравствуйте!</p><p>Во вложении — акт №${opts.invoiceNumber}.</p>`,
      attachments: [
        {
          filename: `Акт_${opts.invoiceNumber}.pdf`,
          content: opts.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    console.log(`Act PDF email sent to ${opts.to}, messageId: ${result.messageId}`);
  } catch (err) {
    console.error(`Act PDF email FAILED to ${opts.to}:`, err);
    throw err;
  }
}
