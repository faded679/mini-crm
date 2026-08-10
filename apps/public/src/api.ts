import { getAuthHeader } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiRequestError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API error ${status}: ${body}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.text();
    throw new ApiRequestError(res.status, body);
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
  palletTypeId?: number | null;
  size?: string;
  weight?: number | null;
  volume?: number | null;
  boxCount: number;
  packagingType: "pallets" | "boxes";
  comment: string | null;
  status: string;
  createdAt: string;
  mpAccountDate?: string | null;
  deliveryTypeId?: number | null;
  boxType?: { id: number; name: string } | null;
  palletType?: { id: number; name: string } | null;
  deliveryType?: { id: number; name: string } | null;
  _totalAmount?: number;
  invoices?: { invoice: { id: number; number: string; isPaid: boolean; status: string } }[];
  carrierRecord?: { id: number; carNumber: string; driverName: string; driverPhone: string } | null;
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
  volume?: number;
  comment?: string;
  mpAccountDate?: string;
  counterpartyId?: number;
  items?: { description: string; unit: string; quantity: number; price: number; amount: number }[];
}

export function createWebRequest(data: CreateWebRequestPayload) {
  return api<ShipmentRequest>("/bot/requests-web", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getRequestsByPhone(phone: string, token?: string, counterpartyId?: number | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const params = new URLSearchParams({ _ts: String(Date.now()) });
  if (counterpartyId != null) params.set("counterpartyId", String(counterpartyId));
  return api<ShipmentRequest[]>(`/bot/requests-by-phone/${encodeURIComponent(phone)}?${params}`, {
    headers,
    cache: "no-store",
  });
}

export function patchRequest(id: number, data: {
  deliveryDate?: string;
  packagingType?: "pallets" | "boxes";
  boxCount?: number;
  boxTypeId?: number | null;
  palletTypeId?: number | null;
  volume?: number | null;
  mpAccountDate?: string | null;
}) {
  return api<ShipmentRequest>(`/bot/requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export interface BalanceResponse {
  totalBilled: number;
  totalPaid: number;
  balance: number; // положительный = долг, отрицательный = переплата
  organizationCount: number;
  counterpartyId?: number | null;
  organization?: string | null;
}

export function getBalance(token: string, counterpartyId?: number | null) {
  const params = new URLSearchParams();
  if (counterpartyId != null) params.set("counterpartyId", String(counterpartyId));
  const qs = params.toString();
  return api<BalanceResponse>(`/public-auth/balance${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export interface CreateDepositResponse {
  success: boolean;
  depositId: number;
  amount: number;
  paymentUrl: string;
  paymentId: string;
}

export interface ClientOrganization {
  id: number;
  name: string;
  fullName: string | null;
  inn: string | null;
}

export interface MeResponse {
  id: number;
  phone: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isBlocked: boolean;
  organization: string | null;
  organizations?: ClientOrganization[];
}

export interface CompanyInfoItem {
  id: number;
  type: "news" | "info";
  title: string;
  content: string;
  createdAt: string;
}

export function getMe(token: string) {
  return api<MeResponse>("/public-auth/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}

export function getCompanyInfo() {
  return api<CompanyInfoItem[]>("/public-auth/company-info", { cache: "no-store" });
}

export interface FeedbackPayload {
  message: string;
  counterpartyId?: number;
}

export interface FeedbackResponse {
  id: number;
  success: boolean;
}

export function createFeedback(payload: FeedbackPayload, token: string) {
  return api<FeedbackResponse>("/public-auth/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export function createDeposit(amount: number, token: string, counterpartyId?: number | null) {
  return api<CreateDepositResponse>("/public-auth/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      ...(counterpartyId != null ? { counterpartyId } : {}),
    }),
  });
}

export interface DepositStatusResponse {
  depositId: number;
  status: string;
  amount: number;
  tbankStatus: string | null;
  paidAt: string | null;
}

export function getDepositStatus(depositId: number, token: string) {
  return api<DepositStatusResponse>(`/public-auth/deposit/${depositId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}
