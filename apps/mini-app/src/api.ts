const API_URL = import.meta.env.VITE_API_URL ?? "";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ---------- Types ----------

export interface City {
  id: number;
  shortName: string;
  fullName: string;
}

export interface BoxType {
  id: number;
  name: string;
  maxVolumeM3: number;
}

export interface PalletType {
  id: number;
  name: string;
  minValue: number;
  maxValue: number | null;
  comment: string | null;
}

export interface PriceRate {
  id: number;
  cityId: number;
  unit: "pallet" | "boxes";
  boxTypeId: number | null;
  palletTypeId: number | null;
  price: number;
  comment: string | null;
  boxType: BoxType | null;
  palletType: PalletType | null;
}

export interface ScheduleEntry {
  id: number;
  cityId: number;
  destination: string;
  deliveryDate: string;
  acceptDays: string;
}

export interface ShipmentRequest {
  id: number;
  city: string;
  cityId: number;
  deliveryDate: string;
  boxTypeId?: number | null;
  size?: string;
  weight?: number | null;
  boxCount: number;
  packagingType: "pallets" | "boxes";
  comment: string | null;
  status: string;
  createdAt: string;
}

interface CreateRequestPayload {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  city: string;
  deliveryDate: string;
  packagingType: "pallets" | "boxes";
  boxTypeId?: number;
  weight?: number;
  boxCount: number;
  comment?: string;
  items?: { description: string; unit: string; quantity: number; price: number; amount: number }[];
}

// ---------- API calls ----------

export function getCities() {
  return api<City[]>("/bot/cities");
}

export function getBoxTypes() {
  return api<BoxType[]>("/bot/box-types");
}

export function getPalletTypes() {
  return api<PalletType[]>("/bot/pallet-types");
}

export function getRates(cityId: number) {
  return api<PriceRate[]>(`/bot/rates?cityId=${cityId}`);
}

export function getScheduleForCity(cityId: number) {
  return api<ScheduleEntry[]>(`/bot/schedule?cityId=${cityId}`);
}

export function getRequests(telegramId: string) {
  return api<ShipmentRequest[]>(`/bot/requests/${telegramId}`);
}

export interface RequestService {
  id: number;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface ShipmentRequestDetail extends ShipmentRequest {
  services: RequestService[];
  boxType: BoxType | null;
}

export function getRequestDetail(id: number) {
  return api<ShipmentRequestDetail>(`/bot/request-detail/${id}`);
}

export function createRequest(data: CreateRequestPayload) {
  return api<ShipmentRequest>("/bot/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function checkConsent(telegramId: string) {
  return api<{ consentGiven: boolean }>(`/bot/consent/${telegramId}`);
}

export function acceptConsent(data: {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}) {
  return api<{ consentGiven: boolean }>("/bot/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
