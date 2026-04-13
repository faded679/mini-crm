const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || "http://172.17.0.1:5001";

function isConfigured(): boolean {
  return !!process.env.EMAIL_SERVICE_URL || true;
}

async function callEmailService(payload: {
  to: string;
  subject: string;
  html: string;
  attachment_b64?: string;
  attachment_filename?: string;
}): Promise<void> {
  const res = await fetch(`${EMAIL_SERVICE_URL}/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email service error ${res.status}: ${text}`);
  }
}

export async function sendPaymentLinkEmail(opts: {
  to: string;
  invoiceNumber: string;
  amount: number;
  paymentUrl: string;
  requestNumbers?: string[];
}): Promise<void> {
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
    await callEmailService({
      to: opts.to,
      subject: `Счёт на оплату №${opts.invoiceNumber} — ${opts.amount.toLocaleString("ru-RU")} ₽`,
      html,
    });
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
  try {
    await callEmailService({
      to: opts.to,
      subject: `Счёт №${opts.invoiceNumber}`,
      html: `<p>Здравствуйте!</p><p>Во вложении — счёт №${opts.invoiceNumber}.</p>`,
      attachment_b64: opts.pdfBuffer.toString("base64"),
      attachment_filename: `Счёт_${opts.invoiceNumber}.pdf`,
    });
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
  console.log(`Sending act email to ${opts.to}`);
  try {
    await callEmailService({
      to: opts.to,
      subject: `Акт №${opts.invoiceNumber}`,
      html: `<p>Здравствуйте!</p><p>Во вложении — акт №${opts.invoiceNumber}.</p>`,
      attachment_b64: opts.pdfBuffer.toString("base64"),
      attachment_filename: `Акт_${opts.invoiceNumber}.pdf`,
    });
    console.log(`Act PDF email sent to ${opts.to}`);
  } catch (err) {
    console.error(`Act PDF email FAILED to ${opts.to}:`, err);
    throw err;
  }
}
