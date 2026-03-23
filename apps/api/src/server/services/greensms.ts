import GreenSMSModule from "greensms";

const GreenSMS = (GreenSMSModule as any).default || GreenSMSModule;

let _client: any = null;
function getClient() {
  if (!_client) {
    const user = process.env.GREENSMS_USER || "";
    const pass = process.env.GREENSMS_PASS || "";
    if (!user && !pass) throw new Error("GreenSMS credentials not configured");
    _client = new GreenSMS({ user, pass });
  }
  return _client;
}

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
    const response = await getClient().call.send({ to: phone });
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
    const response = await getClient().call.status({ id: requestId });
    return response.code === code && response.status === "completed";
  } catch (error: any) {
    return false;
  }
}
