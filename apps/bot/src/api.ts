import { env } from "./env.js";

interface CreateRequestPayload {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  deliveryDate: string;
  volume: number;
  size?: string;
  weight: number;
  boxCount: number;
  comment?: string;
}

interface ShipmentRequest {
  id: number;
  city: string;
  deliveryDate: string;
  volume?: number | null;
  size?: string;
  weight: number;
  boxCount: number;
  comment: string | null;
  status: string;
  createdAt: string;
}

export async function createRequest(data: CreateRequestPayload): Promise<ShipmentRequest> {
  const res = await fetch(`${env.API_URL}/bot/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<ShipmentRequest>;
}

export async function checkConsent(telegramId: string): Promise<{ consentGiven: boolean }> {
  const res = await fetch(`${env.API_URL}/bot/consent/${telegramId}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<{ consentGiven: boolean }>;
}

export async function acceptConsent(data: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ consentGiven: boolean }> {
  const res = await fetch(`${env.API_URL}/bot/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<{ consentGiven: boolean }>;
}

export async function getRequests(telegramId: string): Promise<ShipmentRequest[]> {
  const res = await fetch(`${env.API_URL}/bot/requests/${telegramId}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<ShipmentRequest[]>;
}
