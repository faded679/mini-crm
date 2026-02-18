const API_URL = import.meta.env.VITE_API_URL ?? "";

interface CreateRequestPayload {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  deliveryDate: string;
  volume: number;
  weight: number;
  boxCount: number;
  comment?: string;
}

export interface ShipmentRequest {
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
  const res = await fetch(`${API_URL}/bot/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export interface ScheduleEntry {
  id: number;
  destination: string;
  deliveryDate: string;
  acceptDays: string;
}

export async function getSchedule(): Promise<ScheduleEntry[]> {
  const res = await fetch(`${API_URL}/schedule`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function getDestinations(): Promise<string[]> {
  const res = await fetch(`${API_URL}/schedule/destinations`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function checkConsent(telegramId: string): Promise<{ consentGiven: boolean }> {
  const res = await fetch(`${API_URL}/bot/consent/${telegramId}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function acceptConsent(data: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ consentGiven: boolean }> {
  const res = await fetch(`${API_URL}/bot/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function getRequests(telegramId: string): Promise<ShipmentRequest[]> {
  const res = await fetch(`${API_URL}/bot/requests/${telegramId}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  return res.json();
}
