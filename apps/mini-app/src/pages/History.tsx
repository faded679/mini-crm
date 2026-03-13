import { useEffect, useState } from "react";
import { getRequests, type ShipmentRequest } from "../api";
import { getTelegramUser } from "../telegram";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  new:       { label: "Новая",     dot: "bg-blue-500",   bg: "bg-blue-50 text-blue-700" },
  warehouse: { label: "Склад",     dot: "bg-amber-500",  bg: "bg-amber-50 text-amber-700" },
  shipped:   { label: "В пути",    dot: "bg-purple-500", bg: "bg-purple-50 text-purple-700" },
  done:      { label: "Выполнена", dot: "bg-green-500",  bg: "bg-green-50 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

export default function History() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getTelegramUser();
    if (!user) { setLoading(false); return; }
    getRequests(user.id)
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-tg-hint text-sm">Загрузка...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 pb-28 fade-in">
        <div className="text-3xl mb-3">📭</div>
        <p className="text-tg-hint text-sm mb-4">Заявок пока нет</p>
        <button
          onClick={() => navigate("/new")}
          className="px-5 py-2.5 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold"
        >
          Создать заявку
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-28 fade-in">
      <h1 className="text-lg font-bold text-tg-text mb-3">История</h1>

      <div className="space-y-2">
        {requests.map((r) => {
          const st = statusConfig[r.status] || statusConfig.new;
          return (
            <div
              key={r.id}
              onClick={() => navigate(`/history/${r.id}`)}
              className="bg-tg-secondary-bg rounded-xl px-3 py-2.5 active:opacity-70 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-tg-text">#{r.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.bg}`}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-tg-hint">
                <span>{r.city} · {r.packagingType === "pallets" ? "Палеты" : "Коробки"} ×{r.boxCount}</span>
                <div className="flex items-center gap-1">
                  <span>{formatDate(r.createdAt)}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-tg-hint">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
