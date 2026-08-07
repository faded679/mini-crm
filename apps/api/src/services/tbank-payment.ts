import crypto from "crypto";
import https from "https";
import { URL } from "url";

interface TBankReceiptItem {
  Name: string;
  Price: number;
  Quantity: number;
  Amount: number;
  Tax: string;
}

interface TBankReceipt {
  Email?: string;
  Phone?: string;
  Taxation: string;
  Items: TBankReceiptItem[];
}

interface TBankInitPaymentParams {
  amount: number; // в копейках
  orderId: string;
  description: string;
  customerKey?: string;
  notificationURL?: string;
  successURL?: string;
  failURL?: string;
  receipt?: TBankReceipt;
}

interface TBankInitPaymentResponse {
  Success: boolean;
  ErrorCode?: string;
  Message?: string;
  TerminalKey?: string;
  Amount?: number;
  OrderId?: string;
  PaymentId?: string;
  PaymentURL?: string;
}

interface TBankNotification {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: string;
  PaymentId: string;
  ErrorCode?: string;
  Amount: number;
  CardId?: string;
  Pan?: string;
  ExpDate?: string;
  Token: string;
}

function envFlagTrue(name: string, defaultValue = false): boolean {
  const v = process.env[name];
  if (v == null || v === "") return defaultValue;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes";
}

export class TBankPaymentService {
  private terminalKey: string;
  private secretKey: string;
  private apiUrl: string;
  private insecureSsl: boolean;
  private httpsAgent: https.Agent;

  constructor() {
    this.terminalKey = process.env.TBANK_TERMINAL_KEY || "";
    this.secretKey = process.env.TBANK_SECRET_KEY || "";
    this.apiUrl = process.env.TBANK_API_URL || "https://securepay.tinkoff.ru/v2";
    // На части серверов в цепочке TLS появляется self-signed (прокси/антивирус).
    // Включаем точечно для T-Bank, не для всего Node.
    this.insecureSsl = envFlagTrue("TBANK_INSECURE_SSL", true);
    this.httpsAgent = new https.Agent({ rejectUnauthorized: !this.insecureSsl });

    if (!this.terminalKey || !this.secretKey) {
      console.warn("T-Bank credentials not configured");
    }
    if (this.insecureSsl) {
      console.warn("T-Bank: TBANK_INSECURE_SSL enabled (TLS verify disabled for T-Bank API only)");
    }
  }

  /**
   * Генерация токена для подписи запроса
   */
  private generateToken(params: Record<string, any>): string {
    const values: Record<string, any> = {
      ...params,
      Password: this.secretKey,
    };

    // Удаляем поля, которые не участвуют в подписи
    delete values.Token;
    delete values.Receipt;
    delete values.DATA;

    // Сортируем по ключам и объединяем значения
    const sortedKeys = Object.keys(values).sort();
    const concatenated = sortedKeys.map((key) => values[key]).join("");

    // SHA-256 хеш
    return crypto.createHash("sha256").update(concatenated).digest("hex");
  }

  private postJson(urlStr: string, body: Record<string, any>): Promise<{ status: number; statusText: string; text: string }> {
    const url = new URL(urlStr);
    const payload = JSON.stringify(body);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          agent: this.httpsAgent,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on("end", () => {
            resolve({
              status: res.statusCode || 0,
              statusText: res.statusMessage || "",
              text: Buffer.concat(chunks).toString("utf8"),
            });
          });
        }
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });
  }

  /**
   * Инициализация платежа
   */
  async initPayment(params: TBankInitPaymentParams): Promise<TBankInitPaymentResponse> {
    const requestData = {
      TerminalKey: this.terminalKey,
      Amount: params.amount,
      OrderId: params.orderId,
      Description: params.description,
      ...(params.customerKey && { CustomerKey: params.customerKey }),
      ...(params.notificationURL && { NotificationURL: params.notificationURL }),
      ...(params.successURL && { SuccessURL: params.successURL }),
      ...(params.failURL && { FailURL: params.failURL }),
      ...(params.receipt && { Receipt: params.receipt }),
    };

    const token = this.generateToken(requestData);

    const body = {
      ...requestData,
      Token: token,
    };

    const url = `${this.apiUrl}/Init`;
    console.log("T-Bank Init URL:", url);
    console.log("T-Bank Init request:", JSON.stringify(body, null, 2));

    const response = await this.postJson(url, body);
    console.log("T-Bank Init response status:", response.status);

    let result: TBankInitPaymentResponse;
    try {
      result = JSON.parse(response.text) as TBankInitPaymentResponse;
    } catch {
      console.error("T-Bank returned non-JSON response:", response.text.slice(0, 500));
      throw new Error(`T-Bank API error: ${response.status} ${response.statusText} (non-JSON response)`);
    }

    console.log("T-Bank Init response:", JSON.stringify(result, null, 2));

    if (response.status < 200 || response.status >= 300 || !result.Success) {
      throw new Error(
        `T-Bank payment init failed: ${result.ErrorCode || response.status} - ${result.Message || response.statusText}`
      );
    }

    return result;
  }

  /**
   * Проверка подписи webhook уведомления
   */
  verifyNotification(notification: TBankNotification): boolean {
    const receivedToken = notification.Token;
    const calculatedToken = this.generateToken(notification);

    return receivedToken === calculatedToken;
  }

  /**
   * Получение статуса платежа
   */
  async getPaymentState(paymentId: string): Promise<any> {
    const requestData = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };

    const token = this.generateToken(requestData);

    const response = await this.postJson(`${this.apiUrl}/GetState`, {
      ...requestData,
      Token: token,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`);
    }

    return JSON.parse(response.text);
  }
}

export const tbankPayment = new TBankPaymentService();
