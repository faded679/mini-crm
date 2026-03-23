interface CallResponse {
  request_id: string;
  code: string;
  phone: string;
}

export async function sendCallCode(phone: string): Promise<CallResponse> {
  const publicKey = process.env.ZVONOK_PUBLIC_KEY;
  const campaignId = process.env.ZVONOK_CAMPAIGN_ID;

  if (!publicKey || !campaignId) {
    throw new Error("Zvonok credentials not configured");
  }

  try {
    const params = new URLSearchParams({
      public_key: publicKey,
      campaign_id: campaignId,
      phone: phone,
    });

    const response = await fetch("https://zvonok.com/manager/cabapi_external/api/v1/phones/call/", {
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
    
    // Проверяем на ошибку
    if (data.status === "error") {
      throw new Error(`Zvonok call failed: ${data.data || data.message || "Unknown error"}`);
    }

    // Zvonok возвращает pincode в data (может быть строкой или объектом)
    const pincode = typeof data.data === 'string' ? data.data : data.data?.pincode;
    const callId = data.data?.call_id || data.data?.id || String(Date.now());

    if (!pincode) {
      throw new Error(`Zvonok call failed: pincode not found in response`);
    }

    return {
      request_id: callId,
      code: pincode,
      phone: phone,
    };
  } catch (error: any) {
    throw new Error(`Zvonok call error: ${error.message}`);
  }
}

export async function verifyCallCode(requestId: string, code: string): Promise<boolean> {
  // Zvonok не требует отдельной проверки статуса
  // Проверка кода происходит на стороне нашего сервера
  return true;
}
