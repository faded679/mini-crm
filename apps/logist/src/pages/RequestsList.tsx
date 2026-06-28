import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRequests, type RequestEntry } from "../api";
import { ArrowLeft, Package, Truck, CheckSquare, Square, ChevronRight } from "lucide-react";

const statusLabels: Record<string, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
};

const statusColors: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800",
  warehouse: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  done: "bg-green-100 text-green-800",
};

export default function RequestsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const city = searchParams.get("city") || "";
  const date = searchParams.get("date") || "";
  const type = searchParams.get("type") || "fbo";

  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!city || !date) return;
    setLoading(true);
    setError("");
    getRequests(city, date, type)
      .then((data) => {
        setRequests(data);
        setSelectedIds(new Set(data.map((r) => r.id)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [city, date, type]);

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)));
    }
  };

  const handleNext = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    navigate(
      `/carrier-form?city=${encodeURIComponent(city)}&date=${date}&type=${type}&ids=${ids}`
    );
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-dvh bg-slate-100 pb-8">
      {/* Header */}
      <div className="bg-blue-600 px-4 pt-10 pb-5">
        <button onClick={() => navigate("/")} className="text-blue-200 flex items-center gap-1 mb-3 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-white font-bold text-lg">{city}</h1>
        <p className="text-blue-200 text-sm">
          {date ? formatDate(date) : ""} · {type.toUpperCase()}
        </p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <div className="text-center py-12 text-gray-400">Загрузка заявок...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p>Заявок на эту дату и направление нет</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <>
            {/* Выбрать все */}
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-sm text-blue-600 font-medium py-1"
            >
              {selectedIds.size === requests.length ? (
                <CheckSquare size={18} />
              ) : (
                <Square size={18} />
              )}
              {selectedIds.size === requests.length ? "Снять всё" : "Выбрать все"}
            </button>

            {/* Список заявок */}
            {requests.map((r) => {
              const selected = selectedIds.has(r.id);
              const hasCarrier = !!r.carrierRecord;
              return (
                <div
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className={`bg-white rounded-2xl shadow-sm p-4 border-2 transition-colors ${
                    selected ? "border-blue-500" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {selected ? (
                        <CheckSquare size={20} className="text-blue-600" />
                      ) : (
                        <Square size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">#{r.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[r.status] || r.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{r.clientName}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {r.packagingType === "pallets" ? (
                          <span className="flex items-center gap-1">
                            <Truck size={12} /> {r.boxCount} пал.
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Package size={12} /> {r.boxCount} кор.
                          </span>
                        )}
                        {r.volume && <span>{r.volume} м³</span>}
                        {r.weight && <span>{r.weight} кг</span>}
                        {r.deliveryType && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">{r.deliveryType}</span>
                        )}
                      </div>
                      {hasCarrier && (
                        <div className="mt-2 bg-green-50 rounded-lg px-2.5 py-1.5 text-xs text-green-700">
                          ✓ {r.carrierRecord!.driverName} · {r.carrierRecord!.carBrand} {r.carrierRecord!.carNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Итог и кнопка */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Выбрано заявок:</span>
                <span className="font-bold text-gray-900">{selectedIds.size} из {requests.length}</span>
              </div>
              <button
                onClick={handleNext}
                disabled={selectedIds.size === 0}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base disabled:opacity-40 active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Заполнить данные перевозчика
                <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
