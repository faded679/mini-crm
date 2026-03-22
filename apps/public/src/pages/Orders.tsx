import { useEffect, useState } from "react";
import { getRequestsByPhone, type ShipmentRequest } from "../api";
import { getPhone } from "../auth";

const statusConfig: Record<string, { label: string; color: string }> = {
  new:       { label: "Новая",     color: "bg-blue-50 text-blue-700" },
  warehouse: { label: "Склад",     color: "bg-amber-50 text-amber-700" },
  shipped:   { label: "В пути",    color: "bg-purple-50 text-purple-700" },
  done:      { label: "Выполнена", color: "bg-green-50 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function Orders() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const phone = getPhone();
    if (!phone) { setLoading(false); return; }
    getRequestsByPhone(phone)
      .then((all) => setRequests(all.filter((r) => r.status !== "archived")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-muted text-sm">Загрузка...</div>;
  }

  return (
    <div className="fade-in">
      <h1 className="text-heading text-[22px] font-bold mb-3">Заявки</h1>

      {requests.length === 0 ? (
        <section className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)] text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-muted text-sm">Заявок пока нет</p>
        </section>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const st = statusConfig[r.status] || statusConfig.new;
            return (
              <section key={r.id} className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-heading font-bold text-sm">Заявка #{r.id}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <p className="text-sm text-heading">Маршрут: {r.city}</p>
                <p className="text-sm text-muted">Дата: {formatDate(r.deliveryDate)}</p>
                <p className="text-sm text-heading">
                  {r.packagingType === "pallets" ? "Палеты" : "Коробки"} × {r.boxCount}
                </p>
                {r.comment && (
                  <p className="text-xs text-muted mt-1 truncate">{r.comment}</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
