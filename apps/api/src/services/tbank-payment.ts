import crypto from "crypto";

interface TBankInitPaymentParams {
  amount: number; // в копейках
  orderId: string;
  description: string;
  customerKey?: string;
  notificationURL?: string;
  successURL?: string;
  failURL?: string;
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

export class TBankPaymentService {
  private terminalKey: string;
  private secretKey: string;
  private apiUrl: string;

  constructor() {
    this.terminalKey = process.env.TBANK_TERMINAL_KEY || "";
    this.secretKey = process.env.TBANK_SECRET_KEY || "";
    this.apiUrl = process.env.TBANK_API_URL || "https://securepay.tinkoff.ru/v2";

    if (!this.terminalKey || !this.secretKey) {
      console.warn("T-Bank credentials not configured");
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
    };

    const token = this.generateToken(requestData);

    const body = {
      ...requestData,
      Token: token,
    };

    const url = `${this.apiUrl}/Init`;
    console.log("T-Bank Init URL:", url);
    console.log("T-Bank Init request:", JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as TBankInitPaymentResponse;

    if (!result.Success) {
      throw new Error(`T-Bank payment init failed: ${result.ErrorCode} - ${result.Message}`);
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

    const response = await fetch(`${this.apiUrl}/GetState`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestData,
        Token: token,
      }),
    });

    if (!response.ok) {
      throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const tbankPayment = new TBankPaymentService();
