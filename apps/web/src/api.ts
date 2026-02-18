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

export interface ShipmentRequest {
  id: number;
  city: string;
  deliveryDate: string;
  volume?: number | null;
  size: string;
  weight: number;
  boxCount: number;
  comment: string | null;
  status: RequestStatus;
  createdAt: string;
  client: Client;
}

export interface StatusHistoryEntry {
  id: number;
  oldStatus: RequestStatus;
  newStatus: RequestStatus;
  changedAt: string;
}

export interface ShipmentRequestDetail extends ShipmentRequest {
  history: StatusHistoryEntry[];
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

export function getClients() {
  return request<Client[]>("/admin/clients");
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
