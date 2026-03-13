import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequestDetail, type ShipmentRequestDetail } from "../api";

const statusConfig: Record<string, { label: string; bg: string }> = {
  new:       { label: "Новая",     bg: "bg-blue-50 text-blue-700" },
  warehouse: { label: "Склад",     bg: "bg-amber-50 text-amber-700" },
  shipped:   { label: "В пути",    bg: "bg-purple-50 text-purple-700" },
  done:      { label: "Выполнена", bg: "bg-green-50 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getRequestDetail(Number(id))
      .then(setRequest)
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-tg-hint text-sm">Загрузка...</div>;
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 fade-in">
        <div className="text-3xl mb-3">😔</div>
        <p className="text-tg-hint text-sm mb-4">{error || "Заявка не найдена"}</p>
        <button
          onClick={() => navigate("/history")}
          className="px-5 py-2.5 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold"
        >
          Назад
        </button>
      </div>
    );
  }

  const st = statusConfig[request.status] || statusConfig.new;
  const total = request.services.reduce((s, srv) => s + srv.amount, 0);

  return (
    <div className="px-3 pt-3 pb-24 fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate("/history")}
        className="flex items-center gap-1 text-tg-link text-sm font-medium mb-3 active:opacity-60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        История
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-tg-text">Заявка #{request.id}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.bg}`}>
          {st.label}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-tg-secondary-bg rounded-xl px-3 py-3 mb-3 space-y-2">
        <Row label="Направление" value={request.city} />
        <Row label="Упаковка" value={request.packagingType === "pallets" ? "Палеты" : "Коробки"} />
        <Row label="Кол-во" value={String(request.boxCount)} />
        {request.boxType && <Row label="Тип" value={request.boxType.name} />}
        {request.weight && <Row label="Вес" value={`${request.weight} кг`} />}
        <Row label="Дата доставки" value={formatDate(request.deliveryDate)} />
        <Row label="Создана" value={formatDate(request.createdAt)} />
      </div>

      {/* Services */}
      {request.services.length > 0 && (
        <div className="mb-3">
          <h2 className="text-sm font-bold text-tg-text mb-2">Услуги</h2>
          <div className="bg-tg-secondary-bg rounded-xl overflow-hidden">
            {request.services.map((srv) => (
              <div key={srv.id} className="flex items-center px-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-tg-text truncate">{srv.description}</div>
                  <div className="text-[11px] text-tg-hint">
                    {srv.quantity} {srv.unit} × {srv.price.toLocaleString("ru-RU")} ₽
                  </div>
                </div>
                <span className="text-sm font-semibold text-tg-text ml-2 whitespace-nowrap">
                  {srv.amount.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-3 py-2" style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}>
              <span className="text-sm font-bold text-tg-text">Итого</span>
              <span className="text-sm font-bold text-tg-button">{total.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
        </div>
      )}

      {/* Comment */}
      {request.comment && (
        <div className="bg-tg-secondary-bg rounded-xl px-3 py-3">
          <h2 className="text-sm font-bold text-tg-text mb-1">Комментарий</h2>
          <p className="text-xs text-tg-hint leading-relaxed">{request.comment}</p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-tg-hint">{label}</span>
      <span className="text-sm font-medium text-tg-text">{value}</span>
    </div>
  );
}
