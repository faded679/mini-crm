import { useEffect, useState } from "react";
import { getRequests, type ShipmentRequest } from "../api";
import { getTelegramUser } from "../telegram";
import { useNavigate } from "react-router-dom";

const statusLabels: Record<string, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  warehouse: "bg-yellow-100 text-yellow-800",
  shipped: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function History() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getTelegramUser();
    if (!user) {
      setLoading(false);
      return;
    }
    getRequests(user.id)
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-tg-hint">Загрузка...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 pb-20">
        <p className="text-tg-hint text-base mb-4">У вас пока нет заявок</p>
        <button
          onClick={() => navigate("/new")}
          className="px-6 py-3 rounded-2xl bg-tg-button text-tg-button-text font-semibold"
        >
          Создать заявку
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-tg-text mb-4">История заявок</h1>

      <div className="space-y-3">
        {requests.map((r) => (
          <div
            key={r.id}
            className="bg-tg-secondary-bg rounded-xl p-4 active:opacity-80 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-tg-text">Заявка #{r.id}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>
                {statusLabels[r.status] || r.status}
              </span>
            </div>
            <div className="text-sm text-tg-hint space-y-1">
              <div className="flex justify-between">
                <span>Направление:</span>
                <span className="text-tg-text font-medium">{r.city}</span>
              </div>
              <div className="flex justify-between">
                <span>Упаковка:</span>
                <span className="text-tg-text font-medium">
                  {r.packagingType === "pallets" ? "Палеты" : "Коробки"} × {r.boxCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Дата:</span>
                <span className="text-tg-text font-medium">{formatDate(r.createdAt)}</span>
              </div>
              {r.comment && (
                <div className="pt-1 text-xs text-tg-hint border-t border-tg-bg mt-1">
                  {r.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
