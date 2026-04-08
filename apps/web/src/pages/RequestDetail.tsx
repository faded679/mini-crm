import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";

// Component to fetch and display warehouse worker name
function WarehouseWorkerName({ telegramId }: { telegramId: string }) {
  const [name, setName] = useState<string>("Загрузка...");
  
  useEffect(() => {
    // Fetch warehouse worker name from API
    const apiUrl = import.meta.env.VITE_API_URL || "https://test.ved31.ru/api";
    fetch(`${apiUrl}/warehouse/worker/${telegramId}`)
      .then(res => res.json())
      .then(data => setName(data.name || telegramId))
      .catch(() => setName(telegramId));
  }, [telegramId]);
  
  return <span>{name}</span>;
}
import {
  getToken,
  getInvoicePdfUrlById,
  getActPdfUrlById,
  getCities,
  getCitiesFbs,
  getBoxTypes,
  getPalletTypes,
  getRates,
  getRequestById,
  createInvoice,
  sendInvoicePdf,
  sendActPdf,
  sendRequestPaymentLink,
  updateRequest,
  updateRequestStatus,
  createRequestService,
  updateRequestService,
  deleteRequestService,
  suggestRequestService,
  getDeliveryTypes,
  getInvoices,
  getServicePrices,
  getPriceFbs,
  type City,
  type CityFbs,
  type PackagingType,
  type ShipmentRequestDetail,
  type RequestStatus,
  type RequestService,
  type BoxType,
  type PalletType,
  type PriceRate,
  type InvoiceItemPayload,
  type Invoice,
  type DeliveryType,
  type ServicePrice,
  type PriceFbsEntry,
} from "../api";
import { cn } from "../lib/utils";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
  archived: "Архив",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function RequestDetail({ embedded = false, requestId, onArchived }: { embedded?: boolean; requestId?: number; onArchived?: () => void }) {
  const { id } = useParams<{ id: string }>();
  const resolvedRequestId = requestId ?? (id ? Number(id) : null);
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesFbs, setCitiesFbs] = useState<CityFbs[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [editCity, setEditCity] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editPackagingType, setEditPackagingType] = useState<PackagingType>("boxes");
  const [editBoxTypeId, setEditBoxTypeId] = useState<string>("");
  const [editBoxCount, setEditBoxCount] = useState<string>("");
  const [editVolume, setEditVolume] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editComment, setEditComment] = useState<string>("");
  const [editDeliveryTypeId, setEditDeliveryTypeId] = useState<string>("");
  const [editMpAccountDate, setEditMpAccountDate] = useState<string>("");
  const [deliveryTypes, setDeliveryTypes] = useState<DeliveryType[]>([]);
  const [confirmStatus, setConfirmStatus] = useState<RequestStatus | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [invoiceCounterpartyId, setInvoiceCounterpartyId] = useState<number | "">("");
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [actSending, setActSending] = useState(false);
  const [actDownloading, setActDownloading] = useState(false);

  // Multi-item invoice
  const emptyItem = (): InvoiceItemPayload => ({ description: "", quantity: 1, unit: "усл", price: 0, amount: 0 });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemPayload[]>([emptyItem()]);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [invoiceCreating, setInvoiceCreating] = useState(false);

  // Services
  const [services, setServices] = useState<RequestService[]>([]);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);
  const [editingQtyId, setEditingQtyId] = useState<number | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState<string>("");

  // Price list data for inline add
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([]);

  // Inline add-from-pricelist form state
  const [addPkgType, setAddPkgType] = useState<"boxes" | "pallets">("boxes");
  const [addTypeId, setAddTypeId] = useState<string>("");
  const [addQty, setAddQty] = useState<string>("1");
  const [addingService, setAddingService] = useState(false);

  // FBS add-service form state
  const [pricesFbs, setPricesFbs] = useState<PriceFbsEntry[]>([]);
  const [fbsPriceId, setFbsPriceId] = useState<string>("");
  const [fbsAddQty, setFbsAddQty] = useState<string>("1");
  const [addingFbsService, setAddingFbsService] = useState(false);
  
  // Additional services form state
  const [selectedServicePriceId, setSelectedServicePriceId] = useState<string>("");
  const [serviceQty, setServiceQty] = useState<string>("1");
  const [addingAdditionalService, setAddingAdditionalService] = useState(false);

  useEffect(() => {
    getCities().then(setCities).catch(() => setCities([]));
    getCitiesFbs().then(setCitiesFbs).catch(() => setCitiesFbs([]));
    getPriceFbs().then(setPricesFbs).catch(() => setPricesFbs([]));
  }, []);

  useEffect(() => {
    getDeliveryTypes().then(setDeliveryTypes).catch(() => setDeliveryTypes([]));
  }, []);

  useEffect(() => {
    getBoxTypes().then(setBoxTypes).catch(() => setBoxTypes([]));
  }, []);

  useEffect(() => {
    getPalletTypes().then(setPalletTypes).catch(() => setPalletTypes([]));
  }, []);

  useEffect(() => {
    getRates().then(setRates).catch(() => setRates([]));
  }, []);

  useEffect(() => {
    getServicePrices().then(setServicePrices).catch(() => setServicePrices([]));
  }, []);

  useEffect(() => {
    if (!resolvedRequestId) {
      setRequest(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getRequestById(resolvedRequestId)
      .then((r) => {
        setRequest(r);
        setServices(r.services ?? []);
        setEditCity(r.city);
        setEditDeliveryDate(new Date(r.deliveryDate).toISOString().slice(0, 10));
        setEditPackagingType(r.packagingType);
        setEditBoxTypeId(r.boxTypeId == null ? "" : String(r.boxTypeId));
        setEditBoxCount(String(r.boxCount));
        setEditVolume((r as any).volume == null ? "" : String((r as any).volume));
        setEditWeight(r.weight == null ? "" : String(r.weight));
        setEditComment(r.comment ?? "");
        setEditDeliveryTypeId(r.deliveryTypeId == null ? "" : String(r.deliveryTypeId));
        setEditMpAccountDate(r.mpAccountDate ? new Date(r.mpAccountDate).toISOString().slice(0, 10) : "");
      })
      .finally(() => setLoading(false));
  }, [resolvedRequestId]);

  const updateItem = (idx: number, field: keyof InvoiceItemPayload, value: string | number) => {
    setInvoiceItems((prev) => {
      const items = [...prev];
      const item = { ...items[idx] };
      if (field === "description" || field === "unit") {
        (item as any)[field] = value;
      } else {
        (item as any)[field] = Number(value) || 0;
      }
      if (field === "quantity" || field === "price") {
        item.amount = item.quantity * item.price;
      }
      items[idx] = item;
      return items;
    });
  };

  const addItem = () => setInvoiceItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setInvoiceItems((prev) => prev.filter((_, i) => i !== idx));
  const invoiceTotal = invoiceItems.reduce((s, it) => s + it.amount, 0);
  const canCreateInvoice = invoiceCounterpartyId !== "" && invoiceItems.length > 0 && invoiceItems.some((it) => it.description && it.amount > 0);

  const formatDateTime = (value: unknown) => {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("ru-RU");
  };

  const formatDate = (value: unknown) => {
    const d = new Date(String(value));
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ru-RU");
  };

  const historyEntryStatus = (h: any): string => {
    const s = h?.newStatus ?? h?.status;
    return statusLabels[s as RequestStatus] ?? (s ? String(s) : "—");
  };

  const fieldLabels: Record<string, string> = {
    weight: "Вес",
    boxCount: "Кол-во мест",
    volume: "Объём",
    packagingType: "Упаковка",
    deliveryDate: "Дата доставки",
  };

  const formatFieldValue = (field: string, value: string | null): string => {
    if (value == null) return "—";
    if (field === "packagingType") return value === "pallets" ? "Палеты" : "Коробки";
    if (field === "deliveryDate") return formatDate(value);
    return value;
  };

  // Merge status history + field history into one sorted timeline
  const mergedHistory = (() => {
    if (!request) return [];
    const items: { type: "status" | "field"; date: number; data: any }[] = [];

    for (const h of request.history) {
      items.push({ type: "status", date: new Date(h.changedAt).getTime(), data: h });
    }
    for (const fh of (request.fieldHistory ?? [])) {
      items.push({ type: "field", date: new Date(fh.changedAt).getTime(), data: fh });
    }

    items.sort((a, b) => a.date - b.date);
    return items;
  })();

  const handleStatusChange = async (status: RequestStatus) => {
    if (!request || updating) return;
    setUpdating(true);
    try {
      await updateRequestStatus(request.id, status);
      const updated = await getRequestById(request.id);
      setRequest(updated);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!request) return;
    if (updating) return;

    const city = editCity.trim();
    if (!city) throw new Error("Город обязателен");

    const deliveryDate = editDeliveryDate;
    if (!deliveryDate) throw new Error("Дата доставки обязательна");

    // Optional fields - allow empty/null values
    const boxCount = editBoxCount && editBoxCount.trim() !== "" ? Number(editBoxCount) : 1;
    const volume = editVolume.trim() === "" ? null : Number(editVolume);
    const weight = editWeight.trim() === "" ? null : Number(editWeight);
    const boxTypeId = editBoxTypeId === "" ? null : Number(editBoxTypeId);

    setUpdating(true);
    try {
      await updateRequest(request.id, {
        city,
        deliveryDate,
        packagingType: editPackagingType,
        boxTypeId,
        boxCount,
        volume,
        weight,
        comment: editComment.trim() ? editComment.trim() : null,
        deliveryTypeId: editDeliveryTypeId === "" ? null : Number(editDeliveryTypeId),
        mpAccountDate: editMpAccountDate === "" ? null : editMpAccountDate,
      });
      const updated = await getRequestById(request.id);
      setRequest(updated);
      setEditing(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdits = () => {
    if (!request) return;
    setEditing(false);
    setEditCity(request.city);
    setEditDeliveryDate(new Date(request.deliveryDate).toISOString().slice(0, 10));
    setEditPackagingType(request.packagingType);
    setEditBoxTypeId(request.boxTypeId == null ? "" : String(request.boxTypeId));
    setEditBoxCount(String(request.boxCount));
    setEditVolume((request as any).volume == null ? "" : String((request as any).volume));
    setEditWeight(request.weight == null ? "" : String(request.weight));
    setEditComment(request.comment ?? "");
    setEditDeliveryTypeId(request.deliveryTypeId == null ? "" : String(request.deliveryTypeId));
    setEditMpAccountDate(request.mpAccountDate ? new Date(request.mpAccountDate).toISOString().slice(0, 10) : "");
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (!request) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Заявка не найдена</div>;
  }

  return (
    <div className={embedded ? "" : "max-w-5xl"}>
      {!embedded && (
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition">
          <ArrowLeft size={16} />
          Назад к заявкам
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Main inf */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Заявка #{request.id}</h1>

            <p className="text-sm text-gray-900 dark:text-gray-100">
              {(request.client as any)?.counterparties?.[0]?.counterparty?.shortName ||
                (request.client as any)?.counterparties?.[0]?.counterparty?.name ||
                "—"}
              <span className="text-gray-400 dark:text-gray-100 ml-1">(
                <a
                  href={`/admin/clients/${request.client.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/admin/clients/${request.client.id}`;
                  }}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                >
                  {[request.client.firstName, request.client.lastName].filter(Boolean).join(" ")
                    || request.client.username
                    || "—"}
                </a>
              )</span>
            </p>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    disabled={updating}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    onClick={handleCancelEdits}
                    type="button"
                  >
                    Отмена
                  </button>
                  <button
                    disabled={updating}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      try {
                        await handleSaveEdits();
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Ошибка сохранения");
                      }
                    }}
                    type="button"
                  >
                    {updating ? "Сохранение..." : "Сохранить"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-3 py-1.5 text-xs rounded-lg font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    onClick={() => setEditing(true)}
                    type="button"
                  >
                    Редактировать
                  </button>
                  <button
                    className="px-3 py-1.5 text-xs rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white flex items-center gap-1"
                    onClick={async () => {
                      if (!request) return;
                      if (!confirm("Переместить заявку в архив? Вы больше не увидите её в списке заявок.")) return;
                      await handleStatusChange("archived");
                      if (embedded && onArchived) {
                        onArchived();
                      } else if (!embedded) {
                        window.location.href = "/admin/requests";
                      }
                    }}
                    type="button"
                  >
                    <Trash2 size={14} />
                    В архив
                  </button>
                </>
              )}

            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Город</p>
              {editing ? (
                <select
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Выберите...</option>
                  {(request.deliveryTypeId === 1 ? citiesFbs : cities).map((c) => (
                    <option key={c.id} value={c.shortName}>{c.shortName}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{request.city}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Дата доставки</p>
              {editing ? (
                <input
                  type="date"
                  value={editDeliveryDate}
                  onChange={(e) => setEditDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(request.deliveryDate).toLocaleDateString("ru-RU")}
                </p>
              )}
            </div>
            {request.deliveryTypeId !== 1 && (
              <>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Упаковка</p>
                  {editing ? (
                    <select
                      value={editPackagingType}
                      onChange={(e) => setEditPackagingType(e.target.value as PackagingType)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    >
                      <option value="pallets">Палеты</option>
                      <option value="boxes">Коробки</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {request.packagingType === "pallets" ? "Палеты" : "Коробки"}
                      {request.packagingType === "boxes" && (request as any)?.boxType?.name
                        ? ` (${(request as any).boxType.name})`
                        : ""}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Тип коробки</p>
                  {editing ? (
                    <select
                      value={editBoxTypeId}
                      onChange={(e) => setEditBoxTypeId(e.target.value)}
                      disabled={editPackagingType !== "boxes"}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                    >
                      <option value="">Выберите...</option>
                      {boxTypes.map((bt) => (
                        <option key={bt.id} value={String(bt.id)}>
                          {bt.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {request.packagingType === "boxes" ? ((request as any)?.boxType?.name ?? "—") : "—"}
                    </p>
                  )}
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Вес</p>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {request.weight == null ? "—" : `${request.weight} кг`}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Кол-во мест</p>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  value={editBoxCount}
                  onChange={(e) => setEditBoxCount(e.target.value)}
                  placeholder="необяз."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{request.boxCount}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Комментарий</p>
              {editing ? (
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : request.comment ? (
                <p className="text-sm text-gray-900 dark:text-gray-100">{request.comment}</p>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
              )}
            </div>
            {request.photos && request.photos.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">
                  Фото груза ({request.photos.length})
                </p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {request.photos.map((photo) => (
                    <div key={photo.id} className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <img 
                        src={`/api/admin/requests/${request.id}/photo/${photo.id}`}
                        alt="Фото груза"
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => window.open(`/api/admin/requests/${request.id}/photo/${photo.id}`, '_blank')}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-white dark:bg-gray-800">
                        {new Date(photo.uploadedAt).toLocaleString("ru-RU", { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Кладовщик: <WarehouseWorkerName telegramId={photo.uploadedBy} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Тип поставки</p>
              {editing ? (
                <select
                  value={editDeliveryTypeId}
                  onChange={(e) => setEditDeliveryTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  <option value="">— не указан —</option>
                  {deliveryTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.name}{dt.note ? ` (${dt.note})` : ""}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {request.deliveryType?.name || "—"}
                  {request.deliveryType?.note ? <span className="text-gray-400 ml-1">({request.deliveryType.note})</span> : ""}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Дата МП ЛК</p>
              {editing ? (
                <input
                  type="date"
                  value={editMpAccountDate}
                  onChange={(e) => setEditMpAccountDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {request.mpAccountDate ? new Date(request.mpAccountDate).toLocaleDateString("ru-RU") : "—"}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Объём</p>
              {editing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editVolume}
                  onChange={(e) => setEditVolume(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{(request as any).volume ?? "—"}</p>
              )}
            </div>

              <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (!request) return;
                      try {
                        const suggestion = await suggestRequestService(request.id);
                        if (!suggestion.found) {
                          alert(suggestion.message || "Подходящий тариф не найден");
                          return;
                        }
                        const svc = await createRequestService(request.id, {
                          description: suggestion.description!,
                          unit: suggestion.unit!,
                          quantity: suggestion.quantity!,
                          price: suggestion.price!,
                        });
                        setServices((prev) => [...prev, svc]);
                      } catch {
                        alert("Ошибка при подборе тарифа");
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                  >
                    <FileText size={14} /> Подставить
                  </button>
                </div>

          </div>

          {/* Status change */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {(["new", "warehouse", "shipped", "done"] as RequestStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfirmStatus(s)}
                  disabled={updating || request.status === s}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium transition",
                    request.status === s
                      ? cn("cursor-not-allowed", statusColors[s])
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  {statusLabels[s]}
                </button>
              ))}


            </div>

            {/* Add from price list — FBO: boxes/pallets, FBS: transport service */}
            {request.deliveryTypeId === 1 ? (() => {
              // FBS: add transport service from FBS price list
              const cityFbs = citiesFbs.find((c) => c.shortName === request.city);
              const cityPrices = cityFbs ? pricesFbs.filter((p) => p.destination === cityFbs.shortName) : [];
              const selectedPrice = cityPrices.find((p) => String(p.id) === fbsPriceId);
              const priceNum = selectedPrice ? (parseFloat(selectedPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0) : 0;
              const volNum = selectedPrice ? (parseFloat(selectedPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1) : 1;
              const pricePerM3 = priceNum / volNum;
              const fbsQtyNum = Number(fbsAddQty.replace(",", ".")) || 0;
              const fbsTotal = Math.round(pricePerM3 * fbsQtyNum * 100) / 100;

              return (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Транспортная услуга FBS</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[200px] flex-1">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Тариф</label>
                      <select
                        value={fbsPriceId}
                        onChange={(e) => setFbsPriceId(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Выберите тариф...</option>
                        {cityPrices.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.volume} — {p.price}₽{p.comment ? ` (${p.comment})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Объём, м³</label>
                      <input
                        type="text"
                        value={fbsAddQty}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*[.,]?\d*$/.test(val)) {
                            setFbsAddQty(val);
                          }
                        }}
                        inputMode="decimal"
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                      />
                    </div>
                    <div className="w-24 text-center">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Цена/м³</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 py-1.5">
                        {pricePerM3 ? pricePerM3.toLocaleString("ru-RU") : "—"}
                      </p>
                    </div>
                    <div className="w-28 text-center">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Сумма</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 py-1.5">
                        {fbsTotal ? fbsTotal.toLocaleString("ru-RU") : "—"}
                      </p>
                    </div>
                    <button
                      disabled={!fbsPriceId || !fbsQtyNum || !pricePerM3 || addingFbsService || !request}
                      onClick={async () => {
                        if (!request || !fbsPriceId || !fbsQtyNum || !pricePerM3) return;
                        setAddingFbsService(true);
                        try {
                          const desc = cityFbs?.fullName ? `${cityFbs.fullName}` : `Транспортные услуги по маршруту ${request.city}`;
                          const svc = await createRequestService(request.id, {
                            description: desc,
                            unit: "м³",
                            quantity: fbsQtyNum,
                            price: pricePerM3,
                          });
                          setServices((prev) => [...prev, svc]);
                          setFbsPriceId("");
                          setFbsAddQty("1");
                        } catch {
                          alert("Ошибка при добавлении позиции");
                        } finally {
                          setAddingFbsService(false);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg font-medium transition",
                        fbsPriceId && fbsQtyNum && pricePerM3
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      )}
                    >
                      {addingFbsService ? "..." : "Добавить"}
                    </button>
                  </div>
                  {cityPrices.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Тарифы FBS не найдены для {request.city}
                    </p>
                  )}
                </div>
              );
            })() : (() => {
              // FBO: add from boxes/pallets price list
              const requestCity = request ? cities.find((c) => c.shortName === request.city) : null;
              const typeOptions = addPkgType === "boxes"
                ? boxTypes.map((bt) => ({ id: bt.id, name: bt.name }))
                : palletTypes.map((pt) => ({ id: pt.id, name: pt.name }));
              const matchedRate = requestCity && addTypeId
                ? rates.find((r) =>
                    r.cityId === requestCity.id &&
                    r.unit === (addPkgType === "pallets" ? "pallet" : "boxes") &&
                    (addPkgType === "boxes"
                      ? r.boxTypeId === Number(addTypeId)
                      : r.palletTypeId === Number(addTypeId))
                  )
                : null;
              const unitPrice = matchedRate?.price ?? 0;
              const qty = Number(addQty.replace(",", ".")) || 0;
              const lineTotal = unitPrice * qty;
              const selectedTypeName = typeOptions.find((t) => String(t.id) === addTypeId)?.name ?? "";

              return (
                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[120px]">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Упаковка</label>
                      <select
                        value={addPkgType}
                        onChange={(e) => { setAddPkgType(e.target.value as "boxes" | "pallets"); setAddTypeId(""); }}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="boxes">Коробки</option>
                        <option value="pallets">Палеты</option>
                      </select>
                    </div>
                    <div className="min-w-[160px] flex-1">
                      <label className="block text-[11px] text-gray-400 mb-0.5">
                        {addPkgType === "boxes" ? "Тип коробки" : "Тип палеты"}
                      </label>
                      <select
                        value={addTypeId}
                        onChange={(e) => setAddTypeId(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Выберите...</option>
                        {typeOptions.map((t) => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Кол-во</label>
                      <input
                        type="text"
                        value={addQty}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^\d*[.,]?\d*$/.test(val)) {
                            setAddQty(val);
                          }
                        }}
                        inputMode="decimal"
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                      />
                    </div>
                    <div className="w-24 text-center">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Цена</label>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 py-1.5">
                        {unitPrice ? unitPrice.toLocaleString("ru-RU") : "—"}
                      </p>
                    </div>
                    <div className="w-28 text-center">
                      <label className="block text-[11px] text-gray-400 mb-0.5">Сумма</label>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 py-1.5">
                        {lineTotal ? lineTotal.toLocaleString("ru-RU") : "—"}
                      </p>
                    </div>
                    <button
                      disabled={!addTypeId || !qty || !unitPrice || addingService || !request}
                      onClick={async () => {
                        if (!request || !addTypeId || !qty || !unitPrice) return;
                        setAddingService(true);
                        try {
                          const selectedTypeName2 = typeOptions.find((t) => String(t.id) === addTypeId)?.name ?? "";
                          const requestCity = cities.find((c) => c.shortName === request.city);
                          const cityFullName = requestCity?.fullName || request.city;
                          const pkgLabel = addPkgType === "boxes" ? "Коробка" : "Палета";
                          const desc = `${cityFullName} - ${pkgLabel}${selectedTypeName2 ? `  ${selectedTypeName2}` : ""}`.trim();
                          const svc = await createRequestService(request.id, {
                            description: desc,
                            unit: "шт",
                            quantity: qty,
                            price: unitPrice,
                          });
                          setServices((prev) => [...prev, svc]);
                          setAddTypeId("");
                          setAddQty("1");
                        } catch {
                          alert("Ошибка при добавлении позиции");
                        } finally {
                          setAddingService(false);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-lg font-medium transition",
                        addTypeId && qty && unitPrice
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      )}
                    >
                      {addingService ? "..." : "Добавить"}
                    </button>
                  </div>
                  {addTypeId && !unitPrice && requestCity && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Тариф не найден для {requestCity.shortName} + {selectedTypeName}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Additional Services from ServicePrice */}
          {servicePrices.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-600">
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">Дополнительные услуги</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1">
                  <label className="block text-[11px] text-gray-400 mb-0.5">Услуга</label>
                  <select
                    value={selectedServicePriceId}
                    onChange={(e) => setSelectedServicePriceId(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Выберите услугу...</option>
                    {servicePrices.map((sp) => (
                      <option key={sp.id} value={String(sp.id)}>
                        {sp.name} — {sp.price}₽
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-[11px] text-gray-400 mb-0.5">Кол-во</label>
                  <input
                    type="text"
                    value={serviceQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*[.,]?\d*$/.test(val)) {
                        setServiceQty(val);
                      }
                    }}
                    inputMode="decimal"
                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                  />
                </div>
                <button
                  disabled={!selectedServicePriceId || !serviceQty || Number(serviceQty.replace(",", ".")) <= 0 || addingAdditionalService || !request}
                  onClick={async () => {
                    if (!request || !selectedServicePriceId || !serviceQty || Number(serviceQty.replace(",", ".")) <= 0) return;
                    setAddingAdditionalService(true);
                    try {
                      const selectedService = servicePrices.find((sp) => String(sp.id) === selectedServicePriceId);
                      if (!selectedService) return;
                      const qty = Number(serviceQty.replace(",", "."));
                      const svc = await createRequestService(request.id, {
                        description: selectedService.name,
                        unit: selectedService.unit || "шт",
                        quantity: qty,
                        price: selectedService.price,
                      });
                      setServices((prev) => [...prev, svc]);
                      setSelectedServicePriceId("");
                      setServiceQty("1");
                    } catch {
                      alert("Ошибка при добавлении услуги");
                    } finally {
                      setAddingAdditionalService(false);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium transition",
                    selectedServicePriceId && serviceQty && Number(serviceQty.replace(",", ".")) > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                  )}
                >
                  {addingAdditionalService ? "..." : "Добавить"}
                </button>
              </div>
            </div>
          )}

          {/* Services */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">

            </div>

            {services.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        <th className="text-left py-2 pr-2 w-8">№</th>
                        <th className="text-left py-2 px-2">Наименование</th>
                        <th className="text-left py-2 px-2 w-20">Ед.</th>
                        <th className="text-right py-2 px-2 w-20">Кол-во</th>
                        <th className="text-right py-2 px-2 w-24">Цена</th>
                        <th className="text-right py-2 px-2 w-28">Стоимость</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {services.map((svc, idx) => (
                        <tr key={svc.id} className="group">
                          <td className="py-1.5 pr-2 text-xs text-gray-400">{idx + 1}</td>
                          <td className="py-1.5 px-1">
                            <input
                              value={svc.description}
                              onChange={(e) => setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, description: e.target.value } : s))}
                              onBlur={() => { if (request) { setSavingServiceId(svc.id); updateRequestService(request.id, svc.id, { description: svc.description }).finally(() => setSavingServiceId(null)); } }}
                              placeholder="Наименование"
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              value={svc.unit}
                              onChange={(e) => setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, unit: e.target.value } : s))}
                              onBlur={() => { if (request) { setSavingServiceId(svc.id); updateRequestService(request.id, svc.id, { unit: svc.unit }).finally(() => setSavingServiceId(null)); } }}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-center"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editingQtyId === svc.id ? editingQtyValue : (svc.quantity != null ? String(svc.quantity) : "")}
                              onFocus={() => {
                                setEditingQtyId(svc.id);
                                setEditingQtyValue(svc.quantity != null ? String(svc.quantity) : "");
                              }}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d*[.,]?\d*$/.test(val)) {
                                  setEditingQtyValue(val);
                                  const normalizedVal = val.replace(",", ".");
                                  const q = normalizedVal === "" || normalizedVal === "." ? 0 : (parseFloat(normalizedVal) || 0);
                                  setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, quantity: q, amount: q * s.price } : s));
                                }
                              }}
                              onBlur={() => {
                                setEditingQtyId(null);
                                if (request) { setSavingServiceId(svc.id); updateRequestService(request.id, svc.id, { quantity: svc.quantity, price: svc.price }).finally(() => setSavingServiceId(null)); }
                              }}
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-right"
                            />
                          </td>
                          <td className="py-1.5 px-1">
                            <input
                              value={svc.price || ""}
                              onChange={(e) => {
                                const p = Number(e.target.value) || 0;
                                setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, price: p, amount: s.quantity * p } : s));
                              }}
                              onBlur={() => { if (request) { setSavingServiceId(svc.id); updateRequestService(request.id, svc.id, { quantity: svc.quantity, price: svc.price }).finally(() => setSavingServiceId(null)); } }}
                              inputMode="decimal"
                              className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-right"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-right text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {svc.amount.toLocaleString("ru-RU")}
                          </td>
                          <td className="py-1.5 pl-1">
                            <button
                              onClick={async () => {
                                if (!request) return;
                                await deleteRequestService(request.id, svc.id);
                                setServices((prev) => prev.filter((s) => s.id !== svc.id));
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={async () => {
                      // Check if invoice already exists for this request
                      try {
                        const existingInvoices = await getInvoices(request.id);
                        if (existingInvoices.length > 0) {
                          // Show existing invoice
                          setCreatedInvoice(existingInvoices[0]);
                          setInvoiceCounterpartyId(existingInvoices[0].counterpartyId);
                          setInvoiceItems(existingInvoices[0].items.map((item) => ({
                            description: item.description,
                            quantity: item.quantity,
                            unit: item.unit,
                            price: item.price,
                            amount: item.amount,
                          })));
                          setConfirmInvoice(true);
                        } else {
                          // No existing invoice, prepare to create new one
                          const cp = (request?.client as any)?.counterparties?.[0]?.counterparty;
                          setInvoiceCounterpartyId(cp?.id ?? "");
                          if (services.length > 0) {
                            setInvoiceItems(services.map((s) => ({
                              description: s.description,
                              quantity: s.quantity,
                              unit: s.unit,
                              price: s.price,
                              amount: s.amount,
                            })));
                          } else {
                            setInvoiceItems([emptyItem()]);
                          }
                          setCreatedInvoice(null);
                          setConfirmInvoice(true);
                        }
                      } catch (err) {
                        console.error("Failed to check existing invoices:", err);
                        // Fallback to creating new invoice
                        const cp = (request?.client as any)?.counterparties?.[0]?.counterparty;
                        setInvoiceCounterpartyId(cp?.id ?? "");
                        if (services.length > 0) {
                          setInvoiceItems(services.map((s) => ({
                            description: s.description,
                            quantity: s.quantity,
                            unit: s.unit,
                            price: s.price,
                            amount: s.amount,
                          })));
                        } else {
                          setInvoiceItems([emptyItem()]);
                        }
                        setCreatedInvoice(null);
                        setConfirmInvoice(true);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    type="button"
                  >
                    <FileText size={16} />
                    Выписать счёт
                  </button>

                  <div className="text-right text-sm font-semibold text-gray-900 dark:text-white">
                    Итого: {services.reduce((sum, s) => sum + s.amount, 0).toLocaleString("ru-RU")} руб.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">История</h2>
          <div className="space-y-4">
            <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDateTime(request.createdAt)}</p>
              <p className="text-xs text-gray-900 dark:text-gray-100">
                Статус: <span className="font-medium">{statusLabels.new}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Создание заявки</p>
            </div>

            {mergedHistory.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">Нет изменений</p>
            ) : (
              mergedHistory.map((item, idx) =>
                item.type === "status" ? (
                  <div key={`s-${item.data.id}`} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">{formatDateTime(item.data.changedAt)}</p>
                    <p className="text-xs text-gray-900 dark:text-gray-100">
                      Статус: <span className="font-medium">{historyEntryStatus(item.data)}</span>
                    </p>
                    {item.data.comment && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.data.comment}</p>}
                  </div>
                ) : (
                  <div key={`f-${item.data.id}`} className="border-l-2 border-blue-300 dark:border-blue-600 pl-3">
                    <p className="text-[11px] text-gray-400 dark:text-gray-400">{formatDateTime(item.data.changedAt)}</p>
                    <p className="text-xs text-gray-900 dark:text-gray-400">
                      {fieldLabels[item.data.field] ?? item.data.field}:{" "}
                      <span className="text-gray-400">{formatFieldValue(item.data.field, item.data.oldValue)}</span>
                      {" → "}
                      <span className="text-gray-400">{formatFieldValue(item.data.field, item.data.newValue)}</span>
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-400 mt-0.5">
                      Аккаунт: {item.data.manager?.name ?? "—"}
                    </p>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {confirmStatus && request && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">Подтверждение</div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setConfirmStatus(null)}
                disabled={updating}
              >
                ✕
              </button>
            </div>
            <div className="p-5 text-sm text-gray-700 dark:text-gray-200">
              Подтвердите смену статуса клиенту по заявке #{request.id}: <b>{statusLabels[request.status]}</b> →{" "}
              <b>{statusLabels[confirmStatus]}</b>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                onClick={() => setConfirmStatus(null)}
                disabled={updating}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  const next = confirmStatus;
                  setConfirmStatus(null);
                  await handleStatusChange(next);
                }}
                disabled={updating}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmInvoice && request && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">
                {createdInvoice ? `Счёт ${createdInvoice.number}` : "Выставление счёта"}
              </div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => { setConfirmInvoice(false); setCreatedInvoice(null); }}
              >
                ✕
              </button>
            </div>

            {createdInvoice ? (
              <>
                <div className="p-5 space-y-4">

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Контрагент</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      {createdInvoice.counterparty?.shortName || createdInvoice.counterparty?.name || "—"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Услуги</label>
                    <div className="space-y-2">
                      {createdInvoice.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:text-gray-100 dark:bg-gray-900 text-sm">
                          <div className="flex-1">{item.description}</div>
                          <div className="w-16 text-center">{item.quantity}</div>
                          <div className="w-16 text-center">{item.unit}</div>
                          <div className="w-24 text-right">{item.price.toLocaleString("ru-RU")}</div>
                          <div className="w-24 text-right font-medium">{item.amount.toLocaleString("ru-RU")}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-sm font-semibold">
                        Итого: {createdInvoice.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString("ru-RU")} руб.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Счёт</span>
                    <div className="flex items-center gap-2">
                      <a
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (invoiceDownloading) return;
                          setInvoiceDownloading(true);
                          try {
                            const token = getToken();
                            if (!token) throw new Error("Not authenticated");
                            const url = getInvoicePdfUrlById(createdInvoice.id);
                            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            const blob = await res.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = objectUrl;
                            a.download = `Счет_${createdInvoice.number}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(objectUrl);
                          } finally {
                            setInvoiceDownloading(false);
                          }
                        }}
                      >
                        {invoiceDownloading ? "Скачивание..." : "Скачать счёт"}
                      </a>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={invoiceSending}
                        onClick={async () => {
                          if (!request || invoiceSending) return;
                          setInvoiceSending(true);
                          try {
                            await sendInvoicePdf(createdInvoice.id, request.client.telegramId);
                            alert("Счёт отправлен клиенту!");
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Ошибка отправки");
                          } finally {
                            setInvoiceSending(false);
                          }
                        }}
                      >
                        {invoiceSending ? "Отправка..." : "Отправить счёт"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Акт</span>
                    <div className="flex items-center gap-2">
                      <a
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (actDownloading) return;
                          setActDownloading(true);
                          try {
                            const token = getToken();
                            if (!token) throw new Error("Not authenticated");
                            const url = getActPdfUrlById(createdInvoice.id);
                            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                            if (!res.ok) throw new Error(`HTTP ${res.status}`);
                            const blob = await res.blob();
                            const objectUrl = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = objectUrl;
                            a.download = `Акт_${createdInvoice.number}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(objectUrl);
                          } finally {
                            setActDownloading(false);
                          }
                        }}
                      >
                        {actDownloading ? "Скачивание..." : "Скачать акт"}
                      </a>
                      <button
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={actSending}
                        onClick={async () => {
                          if (!request || actSending) return;
                          setActSending(true);
                          try {
                            await sendActPdf(createdInvoice.id, request.client.telegramId);
                            alert("Акт отправлен клиенту!");
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Ошибка отправки");
                          } finally {
                            setActSending(false);
                          }
                        }}
                      >
                        {actSending ? "Отправка..." : "Отправить акт"}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2 gap-2">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={invoiceCreating}
                      onClick={async () => {
                        if (invoiceCreating) return;
                        setInvoiceCreating(true);
                        try {
                          await sendRequestPaymentLink(request.id);
                          alert("Ссылка на оплату отправлена клиенту!");
                        } catch (err) {
                          alert(err instanceof Error ? err.message : "Ошибка отправки ссылки");
                        } finally {
                          setInvoiceCreating(false);
                        }
                      }}
                    >
                      {invoiceCreating ? "Отправка..." : "QR код"}
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                      onClick={() => { setConfirmInvoice(false); setCreatedInvoice(null); }}
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Контрагент (заказчик)</label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      {(request.client as any)?.counterparties?.[0]?.counterparty?.shortName ||
                        (request.client as any)?.counterparties?.[0]?.counterparty?.name ||
                        "Не привязан"}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Услуги</label>

                    </div>

                    <div className="space-y-2">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                          <div className="flex-1">
                            <input
                              value={item.description}
                              onChange={(e) => updateItem(idx, "description", e.target.value)}
                              placeholder="Наименование услуги"
                              className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                          <div className="w-16">
                            <input
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                              placeholder="Кол"
                              inputMode="numeric"
                              className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                            />
                          </div>
                          <div className="w-16">
                            <input
                              value={item.unit}
                              onChange={(e) => updateItem(idx, "unit", e.target.value)}
                              placeholder="Ед."
                              className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center"
                            />
                          </div>
                          <div className="w-24">
                            <input
                              value={item.price || ""}
                              onChange={(e) => updateItem(idx, "price", e.target.value)}
                              placeholder="Цена"
                              inputMode="decimal"
                              className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right"
                            />
                          </div>
                          <div className="w-24 flex items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300 w-full text-right">
                              {item.amount.toLocaleString("ru-RU")}
                            </span>
                          </div>
                          {invoiceItems.length > 1 && (
                            <button onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 mt-0.5">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      Итого: {invoiceTotal.toLocaleString("ru-RU")} руб.
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                  <button
                    className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                    onClick={() => setConfirmInvoice(false)}
                  >
                    Отмена
                  </button>

                  {!createdInvoice && (
                    <button
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium",
                        canCreateInvoice
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500",
                      )}
                      disabled={!canCreateInvoice || invoiceCreating}
                      onClick={async () => {
                        if (!canCreateInvoice || invoiceCreating) return;
                        
                        setInvoiceCreating(true);
                        try {
                          const inv = await createInvoice({
                            counterpartyId: invoiceCounterpartyId as number,
                            requestIds: [request.id],
                            items: invoiceItems,
                            number: `СЧ-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}-${String(new Date().getHours()).padStart(2, '0')}${String(new Date().getMinutes()).padStart(2, '0')}`,
                          });
                          
                          // Сохраняем созданный счёт для отображения
                          setCreatedInvoice(inv);
                          alert(`Счёт ${inv.number} успешно создан!\n\nОтправить счёт и акт клиенту можно на странице "Счета".`);
                        } catch (err) {
                          alert("Ошибка создания счёта: " + (err instanceof Error ? err.message : String(err)));
                        } finally {
                          setInvoiceCreating(false);
                        }
                      }}
                    >
                      {invoiceCreating ? "Создание..." : "Счёт/Акт"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
