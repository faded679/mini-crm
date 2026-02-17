import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRequests, type ShipmentRequest, type RequestStatus } from "../api";
import { cn } from "../lib/utils";

const statusLabels: Record<RequestStatus, string> = {
  open: "Открыта",
  in_progress: "В работе",
  done: "Выполнена",
};

const statusColors: Record<RequestStatus, string> = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  done: "bg-green-100 text-green-800",
};

export default function Requests() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Заявки</h1>
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition",
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              )}
            >
              {s === "all" ? "Все" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Заявок нет</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Груз</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Маршрут</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link to={`/requests/${r.id}`} className="text-blue-600 font-medium hover:underline">
                      #{r.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{r.cargoDescription}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.fromCity} → {r.toCity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.client.firstName} {r.client.lastName || ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
