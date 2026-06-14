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

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as unknown as T;
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
  email?: string | null;
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
  preferredPayment: string | null;
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
  preferredPayment?: string | null;
  contactClientIds?: number[];
}

export type RequestStatus = "new" | "warehouse" | "billed" | "shipped" | "done" | "archived";

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
  mpAccountDate?: string | null;
};

export interface RequestPhoto {
  id: number;
  fileId: string;
  fileUrl?: string | null;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ShipmentRequestInvoice {
  id: number;
  number: string;
  isPaid: boolean;
  status: string;
  amount: number;
}

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
  mpAccountDate?: string | null;
  createdAt: string;
  client: Client;
  services?: RequestService[];
  photos?: RequestPhoto[];
  invoices?: ShipmentRequestInvoice[];
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
  volume?: number;
  weight?: number;
  comment?: string;
  deliveryTypeId?: number;
  items?: { description: string; unit: string; quantity: number; price: number; amount: number }[];
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

export interface InvoiceRequest {
  id: number;
  invoiceId: number;
  requestId: number;
  request: ShipmentRequest;
}

export interface Invoice {
  id: number;
  number: string;
  date: string;
  status?: "new" | "sent" | "awaiting_payment" | "paid" | "cancelled";
  isPaid: boolean;
  paidAt: string | null;
  tbankPaymentUrl?: string | null;
  tbankPaymentId?: string | null;
  amount: number;
  counterpartyId: number;
  createdAt: string;
  updatedAt: string;
  counterparty: Counterparty;
  items: InvoiceItem[];
  requests?: InvoiceRequest[];
}

export interface CreateInvoicePayload {
  counterpartyId: number;
  requestId?: number;
  requestIds?: number[];
  date?: string;
  items: InvoiceItemPayload[];
  number: string;
}

export function createInvoice(payload: CreateInvoicePayload) {
  return request<Invoice>("/admin/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getInvoices(requestId?: number) {
  const params = requestId ? `?requestId=${requestId}` : "";
  return request<Invoice[]>(`/admin/invoices${params}`);
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

export function checkInvoicePayment(id: number) {
  return request<{ checked: boolean; status?: string; alreadyPaid?: boolean; message: string }>(
    `/admin/invoices/${id}/check-payment`,
    { method: "POST" }
  );
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

export function sendRequestPaymentLink(requestId: number) {
  return request<{ success: boolean; paymentUrl: string; paymentId: string; amount: number }>(
    `/admin/requests/${requestId}/send-payment-link`,
    { method: "POST" }
  );
}

export function sendInvoicePaymentLink(invoiceId: number) {
  return request<{ success: boolean; paymentUrl: string; paymentId: string }>(
    `/admin/invoices/${invoiceId}/send-payment-link`,
    { method: "POST" }
  );
}

export function getClients() {
  return request<Client[]>("/admin/clients");
}

export function createClient(data: { firstName?: string; lastName?: string; phone?: string; email?: string }) {
  return request<Client>("/admin/clients", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getClientById(id: number) {
  return request<ClientDetail>(`/admin/clients/${id}`);
}

export function updateClient(id: number, data: { email?: string | null; phone?: string | null }) {
  return request<Client>(`/admin/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
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

// --------------- Schedule FBS ---------------

export interface ScheduleEntryFbs {
  id: number;
  destination: string;
  deliveryDate: string;
  acceptDays: string;
}

export type ScheduleEntryFbsPayload = {
  cityId?: number;
  destination?: string;
  deliveryDate: string;
  acceptDays: string;
};

export function getAdminScheduleFbs() {
  return request<ScheduleEntryFbs[]>("/admin/schedule-fbs");
}

export function createScheduleEntryFbs(payload: ScheduleEntryFbsPayload) {
  return request<ScheduleEntryFbs>("/admin/schedule-fbs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduleEntryFbs(id: number, payload: Partial<ScheduleEntryFbsPayload>) {
  return request<ScheduleEntryFbs>(`/admin/schedule-fbs/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteScheduleEntryFbs(id: number) {
  return request<void>(`/admin/schedule-fbs/${id}`, {
    method: "DELETE",
  });
}

// --------------- Price FBS ---------------

export interface PriceFbsEntry {
  id: number;
  destination: string;
  volume: string;
  price: string;
  comment: string | null;
}

export type PriceFbsPayload = {
  destination: string;
  volume: string;
  price: string;
  comment?: string;
};

export function getPriceFbs() {
  return request<PriceFbsEntry[]>("/admin/price-fbs");
}

export function createPriceFbs(payload: PriceFbsPayload) {
  return request<PriceFbsEntry>("/admin/price-fbs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePriceFbs(id: number, payload: Partial<PriceFbsPayload>) {
  return request<PriceFbsEntry>(`/admin/price-fbs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePriceFbs(id: number) {
  return request<void>(`/admin/price-fbs/${id}`, {
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

// --------------- Cities FBS ---------------

export interface CityFbs {
  id: number;
  shortName: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export function getCitiesFbs() {
  return request<CityFbs[]>("/admin/cities-fbs");
}

export function createCityFbs(shortName: string, fullName?: string) {
  return request<CityFbs>("/admin/cities-fbs", {
    method: "POST",
    body: JSON.stringify({ shortName, fullName }),
  });
}

export function updateCityFbs(id: number, data: { shortName?: string; fullName?: string }) {
  return request<CityFbs>(`/admin/cities-fbs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCityFbs(id: number) {
  return request<void>(`/admin/cities-fbs/${id}`, {
    method: "DELETE",
  });
}

// --------------- Rates ---------------

export type RateUnit = "pallet" | "boxes";

export interface BoxType {
  id: number;
  name: string;
  minVolumeM3: number;
  maxVolumeM3: number;
  hint?: string | null;
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

export function createBoxType(data: { name: string; minVolumeM3?: number; maxVolumeM3: number; hint?: string }) {
  return request<BoxType>("/admin/box-types", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBoxType(id: number, data: { name?: string; minVolumeM3?: number; maxVolumeM3?: number; hint?: string }) {
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

// --------------- Client Service Prices ---------------

export interface ClientServicePrice {
  id: number;
  deliveryTypeId: number;
  name: string;
  price: number;
  unit: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  deliveryType: DeliveryType;
}

export function getClientServicePrices() {
  return request<ClientServicePrice[]>("/admin/client-service-prices");
}

export function createClientServicePrice(data: { deliveryTypeId: number; name: string; price: number; unit?: string; comment?: string | null }) {
  return request<ClientServicePrice>("/admin/client-service-prices", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateClientServicePrice(id: number, data: { deliveryTypeId?: number; name?: string; price?: number; unit?: string; comment?: string | null }) {
  return request<ClientServicePrice>(`/admin/client-service-prices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteClientServicePrice(id: number) {
  return request<void>(`/admin/client-service-prices/${id}`, {
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

// --------------- Finance ---------------

export interface BankTransaction {
  id: number;
  documentNumber: string;
  documentDate: string;
  amount: number;
  direction: string;
  payerName: string;
  payerInn: string | null;
  payerAccount: string | null;
  payerBik: string | null;
  payerBank: string | null;
  recipientName: string;
  recipientInn: string | null;
  recipientAccount: string | null;
  purpose: string;
  counterpartyId: number | null;
  counterparty: { id: number; name: string; shortName: string | null; inn: string | null } | null;
  invoiceNumbers: string[];
  status: "new" | "matched" | "unmatched" | "ignored";
  matchedAt: string | null;
  importBatchId: string;
  createdAt: string;
}

export interface BankImportResult {
  batchId: string;
  totalDocuments: number;
  incomingCount: number;
  importedCount: number;
  skippedDuplicates: number;
  matchedCount: number;
  unmatchedCount: number;
  transactions: {
    id: number;
    payerName: string;
    amount: number;
    status: string;
    counterpartyName?: string;
    invoiceNumbers: string[];
  }[];
}

export interface CounterpartyBalance {
  id: number;
  counterpartyId: number;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  lastUpdated: string;
  counterparty: { id: number; name: string; shortName: string | null; inn: string | null };
}

export interface BankImportBatch {
  id: string;
  fileName: string;
  periodStart: string;
  periodEnd: string;
  account: string;
  totalIncoming: number;
  totalOutgoing: number;
  openBalance: number;
  closeBalance: number;
  recordCount: number;
  source: string;
  importedAt: string;
}

export interface CounterpartyFinanceSummary {
  counterparty: { id: number; name: string; shortName: string | null; inn: string | null };
  balance: { totalBilled: number; totalPaid: number; balance: number };
  invoices: Invoice[];
  payments: BankTransaction[];
}

export function importBankStatement(fileContent: string, fileName: string) {
  return request<BankImportResult>("/admin/finance/import", {
    method: "POST",
    body: JSON.stringify({ fileContent, fileName }),
  });
}

export function getFinanceTransactions(filters?: {
  status?: string;
  counterpartyId?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.counterpartyId) params.set("counterpartyId", String(filters.counterpartyId));
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  const q = params.toString() ? `?${params.toString()}` : "";
  return request<BankTransaction[]>(`/admin/finance/transactions${q}`);
}

export function matchBankTransaction(id: number, counterpartyId: number) {
  return request<{ ok: true }>(`/admin/finance/transactions/${id}/match`, {
    method: "PATCH",
    body: JSON.stringify({ counterpartyId }),
  });
}

export function ignoreBankTransaction(id: number) {
  return request<{ ok: true }>(`/admin/finance/transactions/${id}/ignore`, {
    method: "PATCH",
  });
}

export function getFinanceBalances() {
  return request<CounterpartyBalance[]>("/admin/finance/balances");
}

export function getCounterpartyFinanceSummary(counterpartyId: number, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const q = params.toString() ? `?${params.toString()}` : "";
  return request<CounterpartyFinanceSummary>(`/admin/finance/counterparty/${counterpartyId}/summary${q}`);
}

export async function downloadReconciliationPdf(counterpartyId: number, dateFrom?: string, dateTo?: string): Promise<void> {
  const params = new URLSearchParams();
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  const q = params.toString() ? `?${params.toString()}` : "";
  const token = getToken();
  const res = await fetch(`/api/admin/finance/counterparty/${counterpartyId}/reconciliation-pdf${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Ошибка генерации PDF");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const disp = res.headers.get("content-disposition") || "";
  const match = disp.match(/filename\*=UTF-8''(.+)/);
  a.download = match ? decodeURIComponent(match[1]) : `act-sverki-${counterpartyId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// TODO: TEMPORARY - Remove after manual payment cleanup
export function deleteManualPayment(transactionId: number) {
  return request<{ success: boolean }>(`/admin/finance/transactions/${transactionId}`, {
    method: "DELETE",
  });
}

export function getFinanceImportHistory() {
  return request<BankImportBatch[]>("/admin/finance/import-history");
}

export function recalculateAllBalances() {
  return request<{ success: boolean; recalculated: number }>("/admin/finance/recalculate-all", {
    method: "POST",
  });
}

// ===== Warehouse Web API =====

export interface WarehouseWorker {
  id: number;
  name: string;
  email: string;
}

export interface WarehouseLoginResponse {
  token: string;
  worker: WarehouseWorker;
}

export interface WarehouseStats {
  inWarehouse: number;
  shippedToday: number;
}

export function getWarehouseToken(): string | null {
  return localStorage.getItem("warehouse_token");
}

export function setWarehouseToken(token: string) {
  localStorage.setItem("warehouse_token", token);
}

export function clearWarehouseToken() {
  localStorage.removeItem("warehouse_token");
}

async function warehouseRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getWarehouseToken();
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

export function warehouseLogin(email: string, password: string) {
  return warehouseRequest<WarehouseLoginResponse>("/warehouse-web/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getWarehouseRequests(deliveryType?: string) {
  const params = deliveryType ? `?deliveryType=${deliveryType}` : "";
  return warehouseRequest<ShipmentRequest[]>(`/warehouse-web/my-requests${params}`);
}

export function bulkShipRequests(requestIds: number[]) {
  return warehouseRequest<{ success: boolean; shipped: number }>("/warehouse-web/requests/bulk-ship", {
    method: "PATCH",
    body: JSON.stringify({ requestIds }),
  });
}

export function getWarehouseStats() {
  return warehouseRequest<WarehouseStats>("/warehouse-web/stats");
}

// --- New warehouse endpoints ---

export interface WarehouseRequestPhoto {
  id: number;
  fileId: string;
  fileUrl: string | null;
  uploadedAt: string;
}

export interface WarehouseRequestService {
  id: number;
  description: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface WarehouseRequest {
  id: number;
  status: string;
  packagingType: "pallets" | "boxes";
  boxCount: number;
  volume?: number | null;
  weight?: number | null;
  city: string;
  deliveryDate: string;
  source?: string;
  client: {
    id: number;
    firstName?: string;
    lastName?: string;
    username?: string;
    phone?: string;
    counterparties?: Array<{ counterparty: { id: number; name: string; shortName?: string } }>;
  };
  deliveryType?: { id: number; name: string };
  boxType?: { id: number; name: string } | null;
  palletType?: { id: number; name: string } | null;
  photos?: WarehouseRequestPhoto[];
  services?: WarehouseRequestService[];
  cityRef?: { shortName: string; fullName: string };
  comment?: string | null;
}

export interface WHBoxType { id: number; name: string; hint?: string; maxVolumeM3?: number; }
export interface WHPalletType { id: number; name: string; comment?: string; minValue?: number; maxValue?: number; }
export interface WHServicePrice { id: number; name: string; price: number; unit?: string; }
export interface WHCity { id: number; shortName: string; fullName: string; cityFullName?: string; }
export interface WHRate { id: number; cityId: number; unit: string; price: number; boxTypeId?: number; palletTypeId?: number; comment?: string; }
export interface WHScheduleFbs { id: number; cityId: number; destination: string; deliveryDate: string; cityRef?: { id: number; shortName: string; fullName: string }; }
export interface WHPriceFbs { id: number; destination: string; volume: string; price: string; comment?: string; }
export interface WHClient {
  id: number;
  firstName?: string;
  lastName?: string;
  counterparties?: Array<{ counterparty: { id: number; name: string; shortName?: string } }>;
}

export function getWarehouseNewRequests(deliveryType?: string) {
  const params = deliveryType ? `?deliveryType=${deliveryType}` : "";
  return warehouseRequest<WarehouseRequest[]>(`/warehouse-web/requests/new${params}`);
}

export function getWarehouseRequestById(id: number) {
  return warehouseRequest<WarehouseRequest>(`/warehouse-web/requests/${id}`);
}

export function updateWarehouseVolume(id: number, volume: number) {
  return warehouseRequest<any>(`/warehouse-web/requests/${id}/volume`, {
    method: "PATCH", body: JSON.stringify({ volume }),
  });
}

export function updateWarehousePackaging(id: number, data: { boxCount?: number; boxTypeId?: number | null; palletTypeId?: number | null }) {
  return warehouseRequest<any>(`/warehouse-web/requests/${id}/packaging`, {
    method: "PATCH", body: JSON.stringify(data),
  });
}

export function updateWarehousePackagingType(id: number, packagingType: "boxes" | "pallets") {
  return warehouseRequest<any>(`/warehouse-web/requests/${id}/packaging-type`, {
    method: "PATCH", body: JSON.stringify({ packagingType }),
  });
}

export function moveWarehouseToWarehouse(id: number) {
  return warehouseRequest<any>(`/warehouse-web/requests/${id}/status`, {
    method: "PATCH", body: JSON.stringify({}),
  });
}

export function updateWarehouseComment(id: number, comment: string | null) {
  return warehouseRequest<any>(`/warehouse-web/requests/${id}/comment`, {
    method: "PATCH", body: JSON.stringify({ comment }),
  });
}

export async function uploadWarehousePhoto(requestId: number, file: File): Promise<any> {
  const token = getWarehouseToken();
  const formData = new FormData();
  formData.append("photo", file);
  const res = await fetch(`${API_URL}/warehouse-web/requests/${requestId}/photo`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error((b as any).message || `HTTP ${res.status}`); }
  return res.json();
}

export function deleteWarehousePhoto(requestId: number, photoId: number) {
  return warehouseRequest<{ ok: boolean }>(`/warehouse-web/requests/${requestId}/photo/${photoId}`, { method: "DELETE" });
}

export function addWarehouseService(requestId: number, servicePriceId: number, quantity: number) {
  return warehouseRequest<any>(`/warehouse-web/requests/${requestId}/services`, {
    method: "POST", body: JSON.stringify({ servicePriceId, quantity }),
  });
}

export function addWarehouseBoxLine(requestId: number, data: { boxTypeId?: number; palletTypeId?: number; quantity: number }) {
  return warehouseRequest<any>(`/warehouse-web/requests/${requestId}/box-lines`, {
    method: "POST", body: JSON.stringify(data),
  });
}

export function deleteWarehouseService(requestId: number, serviceId: number) {
  return warehouseRequest<{ ok: boolean }>(`/warehouse-web/requests/${requestId}/services/${serviceId}`, { method: "DELETE" });
}

export function getWarehouseBoxTypes() { return warehouseRequest<WHBoxType[]>("/warehouse-web/box-types"); }
export function getWarehousePalletTypes() { return warehouseRequest<WHPalletType[]>("/warehouse-web/pallet-types"); }
export function getWarehouseServicePrices() { return warehouseRequest<WHServicePrice[]>("/warehouse-web/service-prices"); }
export function getWarehouseCities() { return warehouseRequest<WHCity[]>("/warehouse-web/cities"); }
export function getWarehouseCitiesFbs() { return warehouseRequest<WHCity[]>("/warehouse-web/cities-fbs"); }
export function getWarehouseClients() { return warehouseRequest<WHClient[]>("/warehouse-web/clients"); }
export function getWarehouseRates() { return warehouseRequest<WHRate[]>("/warehouse-web/rates"); }
export function getWarehouseScheduleFbs() { return warehouseRequest<WHScheduleFbs[]>("/warehouse-web/schedule-fbs"); }
export function getWarehousePriceFbs() { return warehouseRequest<WHPriceFbs[]>("/warehouse-web/price-fbs"); }

export function createWarehouseRequest(data: any) {
  return warehouseRequest<any>("/warehouse-web/create-request", {
    method: "POST", body: JSON.stringify(data),
  });
}
