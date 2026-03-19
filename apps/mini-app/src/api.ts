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

interface CreateRequestPayload {
  telegramId: string;
  username?: string;
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

export interface UpdateRequestPayload {
  deliveryDate?: string;
  packagingType?: "pallets" | "boxes";
  boxCount?: number;
  mpAccountDate?: string;
}

export function updateRequest(id: number, data: UpdateRequestPayload) {
  return api<ShipmentRequest>(`/bot/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- FBS ----------

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

// ---------- Additional Services ----------

export interface ServicePrice {
  id: number;
  name: string;
  price: number;
  unit: string;
  comment: string | null;
}

export function getServicePrices() {
  return api<ServicePrice[]>("/admin/service-prices");
}
