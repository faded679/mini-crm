const API_URL = import.meta.env.VITE_API_URL || "https://sologo.ru/api";

function getToken(): string | null {
  return localStorage.getItem("logist_token");
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface LogistInfo {
  id: number;
  name: string;
  email: string;
}

export interface CityEntry {
  id: number;
  shortName: string;
  fullName: string;
  type: "fbo" | "fbs";
}

export interface CitiesResponse {
  fbo: CityEntry[];
  fbs: CityEntry[];
}

export interface RequestEntry {
  id: number;
  city: string;
  deliveryDate: string;
  boxCount: number;
  packagingType: string;
  volume: number | null;
  weight: number | null;
  status: string;
  deliveryType: string | null;
  clientName: string;
  carrierRecord: {
    id: number;
    driverName: string;
    carBrand: string;
    carNumber: string;
  } | null;
}

export interface CarrierRecord {
  id: number;
  carBrand: string;
  carNumber: string;
  driverName: string;
  driverPhone: string;
  logistInfo: string | null;
  city: string;
  deliveryDate: string;
  deliveryType: string;
  comment: string | null;
  createdAt: string;
  requests: { id: number; city: string; deliveryDate: string; status: string }[];
}

export interface CreateCarrierPayload {
  carBrand: string;
  carNumber: string;
  driverName: string;
  driverPhone: string;
  logistInfo?: string;
  city: string;
  deliveryDate: string;
  deliveryType: string;
  comment?: string;
  requestIds: number[];
}

export function login(email: string, password: string) {
  return req<{ token: string; logist: LogistInfo }>("/logist/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return req<LogistInfo>("/logist/me");
}

export function getCities() {
  return req<CitiesResponse>("/logist/cities");
}

export function getRequests(city: string, date: string, deliveryType: string) {
  return req<RequestEntry[]>(
    `/logist/requests?city=${encodeURIComponent(city)}&date=${encodeURIComponent(date)}&deliveryType=${encodeURIComponent(deliveryType)}`
  );
}

export function createCarrier(payload: CreateCarrierPayload) {
  return req<CarrierRecord>("/logist/carriers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCarriers() {
  return req<CarrierRecord[]>("/logist/carriers");
}

export function saveToken(token: string) {
  localStorage.setItem("logist_token", token);
}

export function removeToken() {
  localStorage.removeItem("logist_token");
}

export function isAuthenticated() {
  return !!getToken();
}
