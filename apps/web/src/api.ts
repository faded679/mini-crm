const API_URL = import.meta.env.VITE_API_URL || "https://test.ved31.ru/api";

export function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface Manager {
  id: number;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  manager: Manager;
}

export interface Client {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  createdAt: string;
  _count?: { requests: number };
}

export interface CounterpartyContact {
  id: number;
  client: Client;
}

export interface Counterparty {
  id: number;
  name: string;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  address: string | null;
  account: string | null;
  bik: string | null;
  correspondentAccount: string | null;
  bank: string | null;
  director: string | null;
  contract: string | null;
  contacts: CounterpartyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface CounterpartyPayload {
  name: string;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  address?: string | null;
  account?: string | null;
  bik?: string | null;
  correspondentAccount?: string | null;
  bank?: string | null;
  director?: string | null;
  contract?: string | null;
  contactClientIds?: number[];
}

export type RequestStatus = "new" | "warehouse" | "shipped" | "done";

export type PackagingType = "pallets" | "boxes";

export type UpdateShipmentRequestPayload = {
  city?: string;
  deliveryDate?: string;
  packagingType?: PackagingType;
  volume?: number | null;
  boxCount?: number;
  weight?: number | null;
  comment?: string | null;
};

export interface ShipmentRequest {
  id: number;
  city: string;
  deliveryDate: string;
  volume?: number | null;
  size: string;
  weight?: number | null;
  boxCount: number;
  packagingType: PackagingType;
  comment: string | null;
  status: RequestStatus;
  createdAt: string;
  client: Client;
}

export interface StatusHistoryEntry {
  id: number;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  comment?: string | null;
  changedAt: string;
}

export interface FieldHistoryEntry {
  id: number;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  manager: { id: number; name: string };
}

export interface ShipmentRequestDetail extends ShipmentRequest {
  history: StatusHistoryEntry[];
  fieldHistory: FieldHistoryEntry[];
}

export interface ClientDetail extends Client {
  requests: ShipmentRequest[];
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getRequests() {
  return request<ShipmentRequest[]>("/admin/requests");
}

export function getRequestById(id: number) {
  return request<ShipmentRequestDetail>(`/admin/requests/${id}`);
}

export function updateRequestStatus(id: number, status: RequestStatus) {
  return request<ShipmentRequest>(`/admin/requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateRequest(id: number, payload: UpdateShipmentRequestPayload) {
  return request<ShipmentRequest>(`/admin/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getInvoicePdfUrl(params: {
  requestId: number;
  counterpartyId: number;
  amount: number;
}): string {
  const q = new URLSearchParams({
    counterpartyId: String(params.counterpartyId),
    amount: String(params.amount),
  });
  return `${API_URL}/admin/requests/${params.requestId}/invoice.pdf?${q.toString()}`;
}

export function sendInvoiceToClient(params: { requestId: number; counterpartyId: number; amount: number }) {
  return request<{ ok: true }>(`/admin/requests/${params.requestId}/invoice/send`, {
    method: "POST",
    body: JSON.stringify({ counterpartyId: params.counterpartyId, amount: params.amount }),
  });
}

// --------------- Invoices ---------------

export interface InvoiceItemPayload {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  amount: number;
}

export interface InvoiceItem extends InvoiceItemPayload {
  id: number;
  invoiceId: number;
}

export interface Invoice {
  id: number;
  number: string;
  date: string;
  counterpartyId: number;
  requestId: number | null;
  createdAt: string;
  updatedAt: string;
  counterparty: Counterparty;
  items: InvoiceItem[];
}

export interface CreateInvoicePayload {
  counterpartyId: number;
  requestId?: number | null;
  date?: string;
  items: InvoiceItemPayload[];
}

export function createInvoice(payload: CreateInvoicePayload) {
  return request<Invoice>("/admin/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getInvoices() {
  return request<Invoice[]>("/admin/invoices");
}

export function getInvoiceById(id: number) {
  return request<Invoice>(`/admin/invoices/${id}`);
}

export function deleteInvoice(id: number) {
  return request<void>(`/admin/invoices/${id}`, { method: "DELETE" });
}

export function getInvoicePdfUrlById(id: number): string {
  return `${API_URL}/admin/invoices/${id}/pdf`;
}

export function sendInvoicePdf(id: number, clientTelegramId: string) {
  return request<{ ok: true }>(`/admin/invoices/${id}/send`, {
    method: "POST",
    body: JSON.stringify({ clientTelegramId }),
  });
}

export function getClients() {
  return request<Client[]>("/admin/clients");
}

export function getClientById(id: number) {
  return request<ClientDetail>(`/admin/clients/${id}`);
}

export interface ScheduleEntry {
  id: number;
  destination: string;
  deliveryDate: string;
  acceptDays: string;
}

export function getSchedule() {
  return request<ScheduleEntry[]>("/schedule");
}

export type ScheduleEntryPayload = {
  cityId?: number;
  destination?: string;
  deliveryDate: string;
  acceptDays: string;
};

export function getAdminSchedule() {
  return request<ScheduleEntry[]>("/admin/schedule");
}

export function createScheduleEntry(payload: ScheduleEntryPayload) {
  return request<ScheduleEntry>("/admin/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduleEntry(id: number, payload: Partial<ScheduleEntryPayload>) {
  return request<ScheduleEntry>(`/admin/schedule/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteScheduleEntry(id: number) {
  return request<void>(`/admin/schedule/${id}`, {
    method: "DELETE",
  });
}

export function getCounterparties() {
  return request<Counterparty[]>("/admin/counterparties");
}

export function createCounterparty(payload: CounterpartyPayload) {
  return request<Counterparty>("/admin/counterparties", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCounterparty(id: number, payload: CounterpartyPayload) {
  return request<Counterparty>(`/admin/counterparties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCounterparty(id: number) {
  return request<void>(`/admin/counterparties/${id}`, {
    method: "DELETE",
  });
}

// --------------- Cities ---------------

export interface City {
  id: number;
  shortName: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export function getCities() {
  return request<City[]>("/admin/cities");
}

export function createCity(shortName: string, fullName?: string) {
  return request<City>("/admin/cities", {
    method: "POST",
    body: JSON.stringify({ shortName, fullName: fullName || shortName }),
  });
}

export function updateCity(id: number, data: { shortName?: string; fullName?: string }) {
  return request<City>(`/admin/cities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCity(id: number) {
  return request<void>(`/admin/cities/${id}`, {
    method: "DELETE",
  });
}

// Legacy aliases
export type Direction = City;
export const getDirections = getCities;

// --------------- Rates ---------------

export type RateUnit = "pallet" | "kg" | "m3";

export interface PriceRate {
  id: number;
  cityId: number;
  unit: RateUnit;
  minWeightKg: number | null;
  maxWeightKg: number | null;
  minVolumeM3: number | null;
  maxVolumeM3: number | null;
  price: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  city: City;
}

export interface PriceRatePayload {
  cityId: number;
  unit: RateUnit;
  minWeightKg?: number | null;
  maxWeightKg?: number | null;
  minVolumeM3?: number | null;
  maxVolumeM3?: number | null;
  price: number;
  comment?: string | null;
}

export function getRates(cityId?: number) {
  const q = cityId ? `?cityId=${cityId}` : "";
  return request<PriceRate[]>(`/admin/rates${q}`);
}

export function createRate(payload: PriceRatePayload) {
  return request<PriceRate>("/admin/rates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRate(id: number, payload: Partial<PriceRatePayload>) {
  return request<PriceRate>(`/admin/rates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRate(id: number) {
  return request<void>(`/admin/rates/${id}`, {
    method: "DELETE",
  });
}
