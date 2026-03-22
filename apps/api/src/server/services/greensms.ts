import GreenSMS from "greensms";

const client = new GreenSMS({
  user: process.env.GREENSMS_USER || "",
  pass: process.env.GREENSMS_PASS || "",
});

interface CallResponse {
  request_id: string;
  code: string;
  phone: string;
}

interface CallStatusResponse {
  status: string;
  code: string;
}

export async function sendCallCode(phone: string): Promise<CallResponse> {
  try {
    const response = await client.call.send({ to: phone });
    return {
      request_id: response.request_id,
      code: response.code,
      phone: phone,
    };
  } catch (error: any) {
    throw new Error(`GreenSMS call error: ${error.message}`);
  }
}

export async function verifyCallCode(requestId: string, code: string): Promise<boolean> {
  try {
    const response = await client.call.status({ id: requestId });
    return response.code === code && response.status === "completed";
  } catch (error: any) {
    return false;
  }
}
