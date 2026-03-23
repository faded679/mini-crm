interface VerificationCallResponse {
  request_id: string;
  verification_number: string; // Номер, на который клиент должен позвонить
  phone: string;
}

interface CallStatusResponse {
  verified: boolean;
  phone?: string;
}

// Инициировать сессию верификации - получить номер для звонка
export async function initiateVerificationCall(phone: string): Promise<VerificationCallResponse> {
  const publicKey = process.env.ZVONOK_PUBLIC_KEY;
  const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

  if (!publicKey || !campaignId) {
    throw new Error("Zvonok credentials not configured");
  }

  try {
    // TODO: Заменить на реальный endpoint из документации Zvonok
    // Этот endpoint нужно получить из личного кабинета Zvonok для кампании "Звонок на проверочный номер"
    const params = new URLSearchParams({
      public_key: publicKey,
      campaign_id: campaignId,
      phone: phone,
    });

    const response = await fetch("https://zvonok.com/manager/cabapi_external/api/v1/phones/verification/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zvonok API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      status: string;
      message?: string;
      data?: any;
    };
    
    if (data.status === "error") {
      throw new Error(`Zvonok verification init failed: ${data.data || data.message || "Unknown error"}`);
    }

    // Zvonok должен вернуть номер для звонка и ID сессии
    const verificationNumber = data.data?.verification_number || data.data?.phone || "+78005558607";
    const sessionId = data.data?.session_id || data.data?.id || String(Date.now());

    return {
      request_id: sessionId,
      verification_number: verificationNumber,
      phone: phone,
    };
  } catch (error: any) {
    throw new Error(`Zvonok verification error: ${error.message}`);
  }
}

// Проверить статус верификации - позвонил ли клиент
export async function checkVerificationStatus(sessionId: string): Promise<CallStatusResponse> {
  const publicKey = process.env.ZVONOK_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Zvonok credentials not configured");
  }

  try {
    // TODO: Заменить на реальный endpoint из документации Zvonok
    const params = new URLSearchParams({
      public_key: publicKey,
      session_id: sessionId,
    });

    const response = await fetch(`https://zvonok.com/manager/cabapi_external/api/v1/phones/verification/status/?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zvonok API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      status: string;
      data?: any;
    };

    if (data.status === "error") {
      return { verified: false };
    }

    // Проверяем, был ли входящий звонок
    const verified = data.data?.verified === true || data.data?.status === "verified";
    const phone = data.data?.phone;

    return {
      verified,
      phone,
    };
  } catch (error: any) {
    throw new Error(`Zvonok status check error: ${error.message}`);
  }
}
