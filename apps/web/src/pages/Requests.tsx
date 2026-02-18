import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRequests, type ShipmentRequest, type RequestStatus } from "../api";
import { cn } from "../lib/utils";

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

type SortKey = "id" | "city" | "deliveryDate" | "volume" | "weight" | "boxCount" | "client" | "status";
type SortDir = "asc" | "desc";

export default function Requests() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const navigate = useNavigate();

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;

    const getClientName = (r: ShipmentRequest) => `${r.client.firstName ?? ""} ${r.client.lastName ?? ""}`.trim();

    const compareStr = (x: string, y: string) => x.localeCompare(y, "ru");
    const compareNum = (x: number, y: number) => (x === y ? 0 : x > y ? 1 : -1);

    let res = 0;
    switch (sortKey) {
      case "id":
        res = compareNum(a.id, b.id);
        break;
      case "city":
        res = compareStr(a.city, b.city);
        break;
      case "deliveryDate":
        res = compareNum(new Date(a.deliveryDate).getTime(), new Date(b.deliveryDate).getTime());
        break;
      case "volume":
        res = compareNum(a.volume ?? -1, b.volume ?? -1);
        break;
      case "weight":
        res = compareNum(a.weight, b.weight);
        break;
      case "boxCount":
        res = compareNum(a.boxCount, b.boxCount);
        break;
      case "client":
        res = compareStr(getClientName(a), getClientName(b));
        break;
      case "status":
        res = compareStr(statusLabels[a.status], statusLabels[b.status]);
        break;
    }

    if (res !== 0) return res * dir;
    return (a.id - b.id) * dir;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "▲" : "▼";
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заявки</h1>
        <div className="flex gap-2">
          {(["all", "open", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition",
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              )}
            >
              {s === "all" ? "Все" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Заявок нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("id")} className="hover:text-gray-900 dark:hover:text-white">
                    # {sortIndicator("id")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("city")} className="hover:text-gray-900 dark:hover:text-white">
                    Город {sortIndicator("city")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("deliveryDate")} className="hover:text-gray-900 dark:hover:text-white">
                    Дата доставки {sortIndicator("deliveryDate")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("volume")} className="hover:text-gray-900 dark:hover:text-white">
                    Объём {sortIndicator("volume")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("weight")} className="hover:text-gray-900 dark:hover:text-white">
                    Вес {sortIndicator("weight")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("boxCount")} className="hover:text-gray-900 dark:hover:text-white">
                    Мест {sortIndicator("boxCount")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("client")} className="hover:text-gray-900 dark:hover:text-white">
                    Клиент {sortIndicator("client")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("status")} className="hover:text-gray-900 dark:hover:text-white">
                    Статус {sortIndicator("status")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer">
                  <td className="px-4 py-3 text-blue-600 font-medium">#{r.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(r.deliveryDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.volume ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.weight} кг</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.boxCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {r.client.firstName} {r.client.lastName || ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                      {statusLabels[r.status]}
                    </span>
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
