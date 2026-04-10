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
  hint?: string | null;
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
  mpAccountDate?: string | null;
}

export interface CityFbs {
  id: number;
  shortName: string;
  fullName: string;
}

export interface ScheduleEntryFbs {
  id: number;
  cityId: number;
  destination: string;
  deliveryDate: string;
  acceptDays: string;
}

export interface PriceFbsEntry {
  id: number;
  destination: string;
  volume: string;
  price: string;
  comment: string | null;
}

export interface ClientServicePrice {
  id: number;
  deliveryTypeId: number;
  name: string;
  price: number;
  unit: string;
  comment: string | null;
  deliveryType: {
    id: number;
    name: string;
  };
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

export function getCitiesFbs() {
  return api<CityFbs[]>("/bot/cities-fbs");
}

export function getScheduleFbs(cityId: number) {
  return api<ScheduleEntryFbs[]>(`/bot/schedule-fbs?cityId=${cityId}`);
}

export function getPriceFbs(destination?: string) {
  const qs = destination ? `?destination=${encodeURIComponent(destination)}` : "";
  return api<PriceFbsEntry[]>(`/bot/price-fbs${qs}`);
}

export function getClientServicePrices(deliveryType?: string) {
  const qs = deliveryType ? `?deliveryType=${encodeURIComponent(deliveryType)}` : "";
  return api<ClientServicePrice[]>(`/bot/client-service-prices${qs}`);
}

// ---------- Auth ----------

export function requestVerification(phone: string) {
  return api<{ sessionId: string; verificationNumber: string; message: string }>("/public-auth/request-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
}

export function checkVerification(sessionId: string) {
  return api<{ 
    verified: boolean; 
    token?: string; 
    client?: { id: number; phone: string; email?: string; inn?: string }; 
    requiresProfileCompletion?: boolean;
    message?: string;
  }>(`/public-auth/check-verification/${sessionId}`, {
    method: "GET",
  });
}

export function completeProfile(email: string, inn: string) {
  const { getAuthHeader } = require("./auth");
  return api<{ success: boolean; message: string; client: { id: number; email: string; inn: string } }>("/public-auth/complete-profile", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify({ email, inn }),
  });
}

// ---------- Web requests ----------

interface CreateWebRequestPayload {
  phone: string;
  firstName?: string;
  lastName?: string;
  city: string;
  deliveryDate: string;
  packagingType: "pallets" | "boxes";
  boxTypeId?: number;
  deliveryTypeId?: number;
  weight?: number;
  boxCount: number;
  comment?: string;
  mpAccountDate?: string;
  items?: { description: string; unit: string; quantity: number; price: number; amount: number }[];
}

export function createWebRequest(data: CreateWebRequestPayload) {
  return api<ShipmentRequest>("/bot/requests-web", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getRequestsByPhone(phone: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return api<ShipmentRequest[]>(`/bot/requests-by-phone/${encodeURIComponent(phone)}`, { headers });
}
