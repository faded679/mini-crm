import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getToken,
  getCounterparties,
  getInvoicePdfUrlById,
  getCities,
  getRequestById,
  createInvoice,
  sendInvoicePdf,
  updateRequest,
  updateRequestStatus,
  createRequestService,
  updateRequestService,
  deleteRequestService,
  suggestRequestService,
  type City,
  type Counterparty,
  type PackagingType,
  type ShipmentRequestDetail,
  type RequestStatus,
  type RequestService,
  type InvoiceItemPayload,
  type Invoice,
} from "../api";
import { cn } from "../lib/utils";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";

const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function RequestDetail({ embedded = false, requestId }: { embedded?: boolean; requestId?: number }) {
  const { id } = useParams<{ id: string }>();
  const resolvedRequestId = requestId ?? (id ? Number(id) : null);
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [editCity, setEditCity] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editPackagingType, setEditPackagingType] = useState<PackagingType>("boxes");
  const [editBoxCount, setEditBoxCount] = useState<string>("");
  const [editVolume, setEditVolume] = useState<string>("");
  const [editWeight, setEditWeight] = useState<string>("");
  const [editComment, setEditComment] = useState<string>("");
  const [confirmStatus, setConfirmStatus] = useState<RequestStatus | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [invoiceCounterpartyId, setInvoiceCounterpartyId] = useState<number | "">("");
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);

  // Multi-item invoice
  const emptyItem = (): InvoiceItemPayload => ({ description: "", quantity: 1, unit: "усл", price: 0, amount: 0 });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemPayload[]>([emptyItem()]);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [invoiceCreating, setInvoiceCreating] = useState(false);

  // Services
  const [services, setServices] = useState<RequestService[]>([]);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);

  useEffect(() => {
    getCities().then(setCities).catch(() => setCities([]));
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
        setEditBoxCount(String(r.boxCount));
        setEditVolume((r as any).volume == null ? "" : String((r as any).volume));
        setEditWeight(r.weight == null ? "" : String(r.weight));
        setEditComment(r.comment ?? "");
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
  const canCreateInvoice = invoiceCounterpartyId !== "" && invoiceItems.length > 0 && invoiceItems.every((it) => it.description && it.amount > 0);

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

    const volume = editVolume.trim() === "" ? null : Number(editVolume);
    if (volume !== null && (!Number.isFinite(volume) || volume <= 0)) throw new Error("Некорректный объём");

    const deliveryDate = editDeliveryDate;
    if (!deliveryDate) throw new Error("Дата доставки обязательна");

    const boxCount = Number(editBoxCount);
    if (!Number.isFinite(boxCount) || boxCount <= 0) throw new Error("Некорректное количество");

    const weight = editWeight.trim() === "" ? null : Number(editWeight);
    if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) throw new Error("Некорректный вес");

    setUpdating(true);
    try {
      await updateRequest(request.id, {
        city,
        deliveryDate,
        packagingType: editPackagingType,
        boxCount,
        volume,
        weight,
        comment: editComment.trim() ? editComment.trim() : null,
      });
      const updated = await getRequestById(request.id);
      setRequest(updated);
      setEditing(false);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (!embedded) return;

    const onEdit = () => setEditing(true);
    const onCancel = () => {
      if (!request) return;
      setEditing(false);
      setEditCity(request.city);
      setEditDeliveryDate(new Date(request.deliveryDate).toISOString().slice(0, 10));
      setEditPackagingType(request.packagingType);
      setEditBoxCount(String(request.boxCount));
      setEditVolume((request as any).volume == null ? "" : String((request as any).volume));
      setEditWeight(request.weight == null ? "" : String(request.weight));
      setEditComment(request.comment ?? "");
    };
    const onSave = () => {
      void handleSaveEdits();
    };

    window.addEventListener("requestDetail:edit", onEdit as EventListener);
    window.addEventListener("requestDetail:cancel", onCancel as EventListener);
    window.addEventListener("requestDetail:save", onSave as EventListener);
    return () => {
      window.removeEventListener("requestDetail:edit", onEdit as EventListener);
      window.removeEventListener("requestDetail:cancel", onCancel as EventListener);
      window.removeEventListener("requestDetail:save", onSave as EventListener);
    };
  }, [embedded, request]);

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
        {/* Main info */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Заявка #{request.id}</h1>
              
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {request.client.firstName} {request.client.lastName || ""}
                {request.client.username && <span className="text-gray-400 dark:text-gray-100 ml-1">@{request.client.username}</span>}
              </p>
           
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", statusColors[request.status])}>
              {statusLabels[request.status]}
            </span>
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
                  {cities.map((c) => (
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
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Объём</p>
              {editing ? (
                <input
                  value={editVolume}
                  onChange={(e) => setEditVolume(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{(request as any).volume ?? "—"}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Вес</p>
              {editing ? (
                <input
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  inputMode="decimal"
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
                  value={editBoxCount}
                  onChange={(e) => setEditBoxCount(e.target.value)}
                  inputMode="numeric"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="text-sm text-gray-900 dark:text-gray-100">{request.boxCount}</p>
              )}
            </div>
            <div className="col-span-2">
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
          </div>

          {/* Status change */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Изменить статус:</p>
            <div className="flex items-center gap-2">
              {(["new", "warehouse", "shipped", "done"] as RequestStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfirmStatus(s)}
                  disabled={updating || request.status === s}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg font-medium transition",
                    request.status === s
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  {statusLabels[s]}
                </button>
              ))}
              <div className="ml-auto">
                <button
                  onClick={() => setConfirmInvoice(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  <FileText size={16} />
                  Выписать счёт
                </button>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Выполненные услуги</p>
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
                <button
                  onClick={async () => {
                    if (!request) return;
                    const svc = await createRequestService(request.id, { description: "", unit: "шт", quantity: 1, price: 0 });
                    setServices((prev) => [...prev, svc]);
                  }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  <Plus size={14} /> Добавить строку
                </button>
              </div>
            </div>

            {services.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500">Нет услуг</p>
            ) : (
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
                              value={svc.quantity || ""}
                              onChange={(e) => {
                                const q = Number(e.target.value) || 0;
                                setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, quantity: q, amount: q * s.price } : s));
                              }}
                              onBlur={() => { if (request) { setSavingServiceId(svc.id); updateRequestService(request.id, svc.id, { quantity: svc.quantity, price: svc.price }).finally(() => setSavingServiceId(null)); } }}
                              inputMode="numeric"
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
                <div className="mt-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Итого: {services.reduce((sum, s) => sum + s.amount, 0).toLocaleString("ru-RU")} руб.
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

            {!createdInvoice ? (
              <>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Контрагент (заказчик)</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      value={invoiceCounterpartyId}
                      onChange={(e) => setInvoiceCounterpartyId(e.target.value ? Number(e.target.value) : "")}
                      onFocus={async () => {
                        if (counterparties.length) return;
                        try {
                          const cp = await getCounterparties();
                          setCounterparties(cp);
                        } catch {
                          setCounterparties([]);
                        }
                      }}
                    >
                      <option value="">Выберите...</option>
                      {counterparties.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Услуги</label>
                      <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        <Plus size={14} /> Добавить строку
                      </button>
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
                          requestId: request.id,
                          items: invoiceItems,
                        });
                        setCreatedInvoice(inv);
                      } finally {
                        setInvoiceCreating(false);
                      }
                    }}
                  >
                    {invoiceCreating ? "Создание..." : "Создать счёт"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Счёт <b>{createdInvoice.number}</b> создан. Заказчик: <b>{createdInvoice.counterparty.name}</b>.
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Итого: <b>{createdInvoice.items.reduce((s, it) => s + it.amount, 0).toLocaleString("ru-RU")} руб.</b>
                  </p>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                      <button
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                      onClick={() => { setConfirmInvoice(false); setCreatedInvoice(null); }}
                    >
                      Закрыть
                    </button>                  
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (invoiceDownloading || !createdInvoice) return;
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
                      {invoiceDownloading ? "Скачивание..." : "Скачать PDF"}
                    </a>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium",
                        "bg-emerald-600 hover:bg-emerald-700 text-white",
                      )}
                      disabled={invoiceSending}
                      onClick={async () => {
                        if (!createdInvoice || !request || invoiceSending) return;
                        setInvoiceSending(true);
                        try {
                          await sendInvoicePdf(createdInvoice.id, request.client.telegramId);
                          setConfirmInvoice(false);
                          setCreatedInvoice(null);
                        } finally {
                          setInvoiceSending(false);
                        }
                      }}
                    >
                      {invoiceSending ? "Отправка..." : "Отправить клиенту"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
