import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCounterparties,
  getInvoicePdfUrl,
  getRequestById,
  sendInvoiceToClient,
  updateRequestStatus,
  type Counterparty,
  type ShipmentRequestDetail,
  type RequestStatus,
} from "../api";
import { cn } from "../lib/utils";
import { ArrowLeft, FileText } from "lucide-react";

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

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<RequestStatus | null>(null);
  const [confirmInvoice, setConfirmInvoice] = useState(false);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [invoiceCounterpartyId, setInvoiceCounterpartyId] = useState<number | "">("");
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoiceSending, setInvoiceSending] = useState(false);
  const [confirmInvoiceSend, setConfirmInvoiceSend] = useState(false);

  useEffect(() => {
    if (id) {
      getRequestById(Number(id))
        .then(setRequest)
        .finally(() => setLoading(false));
    }
  }, [id]);

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

  const handleIssueInvoice = async () => {
    setConfirmInvoice(false);
  };

  const parsedInvoiceAmount = Number(String(invoiceAmount).replace(",", "."));
  const canInvoice = Number.isFinite(parsedInvoiceAmount) && parsedInvoiceAmount > 0 && invoiceCounterpartyId !== "";

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (!request) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Заявка не найдена</div>;
  }

  return (
    <div className="max-w-5xl">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition">
        <ArrowLeft size={16} />
        Назад к заявкам
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Заявка #{request.id}</h1>
            <span className={cn("px-3 py-1 rounded-full text-sm font-medium", statusColors[request.status])}>
              {statusLabels[request.status]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Город</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{request.city}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Дата доставки</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{new Date(request.deliveryDate).toLocaleDateString("ru-RU")}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Объём</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{(request as any).volume ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Вес</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{request.weight} кг</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Кол-во мест</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{request.boxCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Клиент</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {request.client.firstName} {request.client.lastName || ""}
                {request.client.username && <span className="text-gray-400 dark:text-gray-500 ml-1">@{request.client.username}</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Дата создания</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(request.createdAt).toLocaleString("ru-RU")}
              </p>
            </div>
            {request.comment && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium mb-1">Комментарий</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{request.comment}</p>
              </div>
            )}
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
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">История</h2>
          {request.history.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Нет изменений</p>
          ) : (
            <div className="space-y-3">
              {request.history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {statusLabels[h.oldStatus]} → <span className="font-medium">{statusLabels[h.newStatus]}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(h.changedAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">Выставление счёта</div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setConfirmInvoice(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Контрагент</label>
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
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Сумма, руб.</label>
                <input
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                onClick={() => setConfirmInvoice(false)}
              >
                Отмена
              </button>

              <div className="flex items-center gap-2">
                <a
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    canInvoice
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500",
                  )}
                  href={
                    canInvoice
                      ? getInvoicePdfUrl({
                          requestId: request.id,
                          counterpartyId: invoiceCounterpartyId as number,
                          amount: parsedInvoiceAmount,
                        })
                      : undefined
                  }
                  onClick={(e) => {
                    if (!canInvoice) e.preventDefault();
                  }}
                  target="_blank"
                  rel="noreferrer"
                >
                  Скачать PDF
                </a>

                <button
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    canInvoice
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500",
                  )}
                  onClick={() => {
                    if (!canInvoice) return;
                    setConfirmInvoiceSend(true);
                  }}
                >
                  Отправить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmInvoiceSend && request && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="font-semibold text-gray-900 dark:text-white">Подтверждение</div>
              <button
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => setConfirmInvoiceSend(false)}
                disabled={invoiceSending}
              >
                ✕
              </button>
            </div>
            <div className="p-5 text-sm text-gray-700 dark:text-gray-200">
              Подтвердите отправку счёта клиенту по заявке #{request.id}.
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                onClick={() => setConfirmInvoiceSend(false)}
                disabled={invoiceSending}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 rounded-lg text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={async () => {
                  if (!request) return;
                  if (!canInvoice) return;
                  setInvoiceSending(true);
                  try {
                    await sendInvoiceToClient({
                      requestId: request.id,
                      counterpartyId: invoiceCounterpartyId as number,
                      amount: parsedInvoiceAmount,
                    });
                    setConfirmInvoiceSend(false);
                    setConfirmInvoice(false);
                  } finally {
                    setInvoiceSending(false);
                  }
                }}
                disabled={invoiceSending}
              >
                {invoiceSending ? "Отправка..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
