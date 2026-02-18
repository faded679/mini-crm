import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getRequestById, updateRequestStatus, type ShipmentRequestDetail, type RequestStatus } from "../api";
import { cn } from "../lib/utils";
import { ArrowLeft, FileText } from "lucide-react";

const statusLabels: Record<RequestStatus, string> = {
  open: "Открыта",
  in_progress: "В работе",
  done: "Выполнена",
};

const statusColors: Record<RequestStatus, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
              {(["open", "in_progress", "done"] as RequestStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
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
    </div>
  );
}
