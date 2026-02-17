const API_URL = import.meta.env.VITE_API_URL || "https://test.ved31.ru/api";

function getToken(): string | null {
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
  firstName: string;
  lastName: string | null;
  username: string | null;
  phone: string | null;
  createdAt: string;
  _count?: { requests: number };
}

export type RequestStatus = "open" | "in_progress" | "done";

export interface ShipmentRequest {
  id: number;
  cargoDescription: string;
  fromCity: string;
  toCity: string;
  weight: number | null;
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

export function getClients() {
  return request<Client[]>("/admin/clients");
}
