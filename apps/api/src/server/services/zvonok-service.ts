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
    // Номер кампании берём ТОЛЬКО из переменной окружения (data.data.phone — это номер клиента)
    const verificationNumber = process.env.ZVONOK_VERIFICATION_NUMBER || "+78005558607";
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
export async function checkVerificationStatus(phone: string, createdAfter?: string): Promise<CallStatusResponse> {
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

    const data: any = await response.json();

    console.log("Zvonok calls_by_phone response:", JSON.stringify(data).substring(0, 500));

    // Zvonok возвращает массив звонков напрямую ИЛИ объект с ошибкой
    let calls: any[] = [];
    if (Array.isArray(data)) {
      calls = data;
    } else if (data && data.status === "error") {
      console.log("Zvonok error:", data);
      return { verified: false };
    } else if (data && data.data) {
      calls = Array.isArray(data.data) ? data.data : [];
    }
    
    // Фильтруем только звонки, созданные после начала сессии
    const recentCalls = createdAfter 
      ? calls.filter((call: any) => new Date(call.created) >= new Date(createdAfter))
      : calls;

    // Zvonok статусы: pincode_ok = клиент подтвердил номер
    const hasSuccessfulCall = recentCalls.some((call: any) => 
      call.status === "pincode_ok" ||
      call.status === "success" || 
      call.status === "confirmed" || 
      call.call_status === "pincode_ok" ||
      call.call_status === "answered"
    );

    return {
      verified: hasSuccessfulCall,
      phone: hasSuccessfulCall ? phone : undefined,
    };
  } catch (error: any) {
    throw new Error(`Zvonok status check error: ${error.message}`);
  }
}
