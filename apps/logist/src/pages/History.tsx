import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCarriers, type CarrierRecord } from "../api";
import { ArrowLeft, Truck, ChevronDown, ChevronUp } from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<CarrierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    getCarriers()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-dvh bg-slate-100 pb-8">
      <div className="bg-blue-600 px-4 pt-10 pb-5">
        <button onClick={() => navigate("/")} className="text-blue-200 flex items-center gap-1 mb-3 text-sm">
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-white font-bold text-lg">История рейсов</h1>
        <p className="text-blue-200 text-sm">{records.length} записей</p>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading && (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-40" />
            <p>Рейсов пока нет</p>
          </div>
        )}

        {records.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{r.city}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {r.deliveryType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(r.deliveryDate)}</p>
                  <p className="text-sm text-gray-800 font-medium mt-1">
                    {r.carBrand} · {r.carNumber}
                  </p>
                  <p className="text-sm text-gray-500">{r.driverName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {r.requests.length} заяв.
                  </span>
                  {expanded === r.id ? (
                    <ChevronUp size={16} className="text-gray-400 mt-1" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 mt-1" />
                  )}
                </div>
              </div>
            </button>

            {expanded === r.id && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Телефон</span>
                  <a href={`tel:${r.driverPhone}`} className="text-blue-600 font-medium text-right">
                    {r.driverPhone}
                  </a>
                  {r.logistInfo && (
                    <>
                      <span className="text-gray-500">Логист</span>
                      <span className="text-gray-900 text-right">{r.logistInfo}</span>
                    </>
                  )}
                  {r.comment && (
                    <>
                      <span className="text-gray-500">Комментарий</span>
                      <span className="text-gray-900 text-right">{r.comment}</span>
                    </>
                  )}
                  <span className="text-gray-500">Создано</span>
                  <span className="text-gray-600 text-right text-xs">{formatDateTime(r.createdAt)}</span>
                </div>

                {r.requests.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Заявки</p>
                    <div className="space-y-1">
                      {r.requests.map((req) => (
                        <div key={req.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">#{req.id} · {req.city}</span>
                          <span className="text-gray-400 text-xs">{req.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
