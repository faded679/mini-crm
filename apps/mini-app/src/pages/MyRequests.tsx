import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRequests, type ShipmentRequest } from "../api";
import { getTelegramUser } from "../telegram";

const STATUS_LABELS: Record<string, string> = {
  open: "🆕 Открыта",
  in_progress: "🔄 В работе",
  done: "✅ Выполнена",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export default function MyRequests() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getTelegramUser();
    if (!user) {
      setError("Не удалось получить данные Telegram");
      setLoading(false);
      return;
    }

    getRequests(user.id)
      .then(setRequests)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-tg-hint">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">📋 Мои заявки</h1>
        <Link
          to="/new"
          className="px-4 py-2 rounded-lg bg-tg-button text-tg-button-text text-sm font-medium"
        >
          + Новая
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-tg-hint text-lg mb-4">Заявок пока нет</p>
          <Link
            to="/new"
            className="inline-block px-6 py-3 rounded-lg bg-tg-button text-tg-button-text font-medium"
          >
            Создать первую заявку
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-tg-secondary-bg rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Заявка #{r.id}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[r.status] ?? "bg-gray-100"}`}>
                  {STATUS_LABELS[r.status] ?? r.status}
                </span>
              </div>
              <div className="text-sm text-tg-hint space-y-1">
                <p>📍 {r.city}</p>
                <p>📅 {new Date(r.deliveryDate).toLocaleDateString("ru-RU")}</p>
                <p>📐 {r.size} · ⚖️ {r.weight} кг · 📦 {r.boxCount} мест</p>
                {r.comment && <p className="text-tg-text mt-1">💬 {r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
