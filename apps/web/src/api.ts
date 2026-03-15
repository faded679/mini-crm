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
  phone?: string | null;
  createdAt: string;
  _count?: { requests: number };
  counterparties?: Array<{ id: number; counterparty: Counterparty }>;
}

export interface CounterpartyContact {
  id: number;
  client: Client;
}

export interface Counterparty {
  id: number;
  name: string;
  shortName: string | null;
  orgType: string | null;
  orgStatus: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  address: string | null;
  account: string | null;
  bik: string | null;
  correspondentAccount: string | null;
  bank: string | null;
  director: string | null;
  directorPost: string | null;
  contract: string | null;
  contacts: CounterpartyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface CounterpartyPayload {
  name: string;
  shortName?: string | null;
  orgType?: string | null;
  orgStatus?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  address?: string | null;
  account?: string | null;
  bik?: string | null;
  correspondentAccount?: string | null;
  bank?: string | null;
  director?: string | null;
  directorPost?: string | null;
  contract?: string | null;
  contactClientIds?: number[];
}

export type RequestStatus = "new" | "warehouse" | "shipped" | "done";

export type PackagingType = "pallets" | "boxes";

export interface DeliveryType {
  id: number;
  name: string;
  note: string | null;
}

export type UpdateShipmentRequestPayload = {
  city?: string;
  deliveryDate?: string;
  packagingType?: PackagingType;
  boxTypeId?: number | null;
  volume?: number | null;
  boxCount?: number;
  weight?: number | null;
  comment?: string | null;
  deliveryTypeId?: number | null;
};

export interface ShipmentRequest {
  id: number;
  city: string;
  deliveryDate: string;
  boxTypeId?: number | null;
  volume?: number | null;
  size: string;
  weight?: number | null;
  boxCount: number;
  packagingType: PackagingType;
  comment: string | null;
  status: RequestStatus;
  isRead: boolean;
  deliveryTypeId?: number | null;
  deliveryType?: DeliveryType | null;
  createdAt: string;
  client: Client;
  services?: RequestService[];
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

export interface RequestService {
  id: number;
  requestId: number;
  description: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
  createdAt: string;
}

export interface RequestServicePayload {
  description: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface ShipmentRequestDetail extends ShipmentRequest {
  history: StatusHistoryEntry[];
  fieldHistory: FieldHistoryEntry[];
  services: RequestService[];
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

export interface CreateAdminRequestPayload {
  clientId: number;
  cityId: number;
  deliveryDate: string;
  packagingType: PackagingType;
  boxTypeId?: number;
  boxCount: number;
  weight?: number;
  comment?: string;
}

export function createAdminRequest(payload: CreateAdminRequestPayload) {
  return request<ShipmentRequest>("/admin/requests", {
    method: "POST",
    body: JSON.stringify(payload),
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

export function bulkUpdateRequestStatus(ids: number[], status: RequestStatus) {
  return request<{ updated: number }>("/admin/requests/bulk-status", {
    method: "POST",
    body: JSON.stringify({ ids, status }),
  });
}

export function updateRequest(id: number, payload: UpdateShipmentRequestPayload) {
  return request<ShipmentRequest>(`/admin/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// --------------- Request Services ---------------

export function createRequestService(requestId: number, payload: RequestServicePayload) {
  return request<RequestService>(`/admin/requests/${requestId}/services`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRequestService(requestId: number, serviceId: number, payload: Partial<RequestServicePayload>) {
  return request<RequestService>(`/admin/requests/${requestId}/services/${serviceId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRequestService(requestId: number, serviceId: number) {
  return request<{ ok: true }>(`/admin/requests/${requestId}/services/${serviceId}`, {
    method: "DELETE",
  });
}

export interface SuggestedService {
  found: boolean;
  message?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  amount?: number;
}

export function suggestRequestService(requestId: number) {
  return request<SuggestedService>(`/admin/requests/${requestId}/services/suggest`);
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
  isPaid: boolean;
  paidAt: string | null;
  counterpartyId: number;
  requestId?: number | null;
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

export function setInvoicePaymentStatus(id: number, isPaid: boolean) {
  return request<Invoice>(`/admin/invoices/${id}/payment`, {
    method: "PATCH",
    body: JSON.stringify({ isPaid }),
  });
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

export function getActPdfUrlById(id: number): string {
  return `${API_URL}/admin/invoices/${id}/act-pdf`;
}

export function sendActPdf(id: number, clientTelegramId: string) {
  return request<{ ok: true }>(`/admin/invoices/${id}/send-act`, {
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

export function deleteClient(id: number) {
  return request<void>(`/admin/clients/${id}`, {
    method: "DELETE",
  });
}

export function getDeliveryTypes() {
  return request<DeliveryType[]>("/admin/delivery-types");
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

// --------------- DaData ---------------

export interface DadataPartyResult {
  found: boolean;
  message?: string;
  name?: string;
  shortName?: string | null;
  orgType?: string | null;
  orgStatus?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  address?: string | null;
  director?: string | null;
  directorPost?: string | null;
}

export function dadataFindParty(query: string) {
  return request<DadataPartyResult>("/admin/tools/dadata/party", {
    method: "POST",
    body: JSON.stringify({ query, branchType: "MAIN" }),
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

export type RateUnit = "pallet" | "boxes";

export interface BoxType {
  id: number;
  name: string;
  minVolumeM3: number;
  maxVolumeM3: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PalletType {
  id: number;
  name: string;
  minValue: number;
  maxValue: number | null;
  comment: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceRate {
  id: number;
  cityId: number;
  unit: RateUnit;
  boxTypeId: number | null;
  palletTypeId: number | null;
  price: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  city: City;
  boxType?: BoxType | null;
  palletType?: PalletType | null;
}

export interface PriceRatePayload {
  cityId: number;
  unit: RateUnit;
  boxTypeId?: number | null;
  palletTypeId?: number | null;
  price: number;
  comment?: string | null;
}

export function getBoxTypes() {
  return request<BoxType[]>("/admin/box-types");
}

export function createBoxType(data: { name: string; minVolumeM3?: number; maxVolumeM3: number }) {
  return request<BoxType>("/admin/box-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBoxType(id: number, data: { name?: string; minVolumeM3?: number; maxVolumeM3?: number }) {
  return request<BoxType>(`/admin/box-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteBoxType(id: number) {
  return request<void>(`/admin/box-types/${id}`, {
    method: "DELETE",
  });
}

export function getPalletTypes() {
  return request<PalletType[]>("/admin/pallet-types");
}

export function createPalletType(data: { name: string; minValue: number; maxValue?: number | null; comment?: string | null }) {
  return request<PalletType>("/admin/pallet-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updatePalletType(id: number, data: { name?: string; minValue?: number; maxValue?: number | null; comment?: string | null }) {
  return request<PalletType>(`/admin/pallet-types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deletePalletType(id: number) {
  return request<void>(`/admin/pallet-types/${id}`, {
    method: "DELETE",
  });
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

// --------------- Service Prices ---------------

export interface ServicePrice {
  id: number;
  name: string;
  price: number;
  unit: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getServicePrices() {
  return request<ServicePrice[]>("/admin/service-prices");
}

export function createServicePrice(data: { name: string; price: number; unit?: string; comment?: string | null }) {
  return request<ServicePrice>("/admin/service-prices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateServicePrice(id: number, data: { name?: string; price?: number; unit?: string; comment?: string | null }) {
  return request<ServicePrice>(`/admin/service-prices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteServicePrice(id: number) {
  return request<void>(`/admin/service-prices/${id}`, {
    method: "DELETE",
  });
}

// --------------- Broadcast ---------------

export interface BroadcastResult {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
}

export function sendBroadcast(message: string, clientIds?: number[]) {
  return request<BroadcastResult>("/admin/broadcast", {
    method: "POST",
    body: JSON.stringify({ message, clientIds }),
  });
}
