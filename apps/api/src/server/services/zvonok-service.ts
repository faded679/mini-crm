interface VerificationCallResponse {
  request_id: string;
  verification_number: string; // Номер, на который клиент должен позвонить
  phone: string;
}

interface CallStatusResponse {
  verified: boolean;
  phone?: string;
}

// Инициировать сессию верификации - создать звонок для подтверждения
export async function initiateVerificationCall(phone: string): Promise<VerificationCallResponse> {
  const publicKey = process.env.ZVONOK_PUBLIC_KEY;
  const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

  if (!publicKey || !campaignId) {
    throw new Error("Zvonok credentials not configured");
  }

  try {
    // Используем endpoint /phones/confirm/ для создания звонка подтверждения
    const url = `https://zvonok.com/manager/cabapi_external/api/v1/phones/confirm/?campaign_id=${campaignId}&phone=${encodeURIComponent(phone)}&public_key=${publicKey}`;

    const response = await fetch(url, {
      method: "GET",
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

    // Для метода confirm, клиент должен позвонить на номер кампании
    // Используем номер из переменной окружения или из ответа API
    const verificationNumber = process.env.ZVONOK_VERIFICATION_NUMBER || data.data?.phone || "+78005558607";
    const sessionId = phone; // Используем номер телефона как ID сессии

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
export async function checkVerificationStatus(phone: string): Promise<CallStatusResponse> {
  const publicKey = process.env.ZVONOK_PUBLIC_KEY;
  const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

  if (!publicKey || !campaignId) {
    throw new Error("Zvonok credentials not configured");
  }

  try {
    // Используем endpoint /phones/calls_by_phone/ для проверки статуса звонков
    const url = `https://zvonok.com/manager/cabapi_external/api/v1/phones/calls_by_phone/?campaign_id=${campaignId}&phone=${encodeURIComponent(phone)}&public_key=${publicKey}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zvonok API error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as {
      status: string;
      data?: any[];
    };

    if (data.status === "error") {
      return { verified: false };
    }

    // Проверяем, был ли успешный входящий звонок
    // data.data - массив звонков для этого номера
    const calls = data.data || [];
    
    // Zvonok помечает входящие звонки как "in_process" когда клиент позвонил
    const hasSuccessfulCall = calls.some((call: any) => 
      call.status === "in_process" || 
      call.status === "success" || 
      call.status === "confirmed" || 
      call.call_status === "answered" ||
      call.call_status === "in_process"
    );

    return {
      verified: hasSuccessfulCall,
      phone: hasSuccessfulCall ? phone : undefined,
    };
  } catch (error: any) {
    throw new Error(`Zvonok status check error: ${error.message}`);
  }
}
