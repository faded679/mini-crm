import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";
import {
  getClientById,
  type ClientDetail as ClientDetailType,
  type RequestStatus,
} from "../api";

const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getClientById(Number(id))
      .then(setClient)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Клиент не найден</div>;
  }

  const fullName = `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() || "—";

  return (
    <div className="max-w-5xl">
      <Link
        to="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={16} />
        Назад к клиентам
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{fullName}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Username:</span> {client.username ? `@${client.username}` : "—"}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Telegram ID:</span> <span className="font-mono">{client.telegramId}</span>
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Дата регистрации:</span> {new Date(client.createdAt).toLocaleString("ru-RU")}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-gray-400 dark:text-gray-500">Заявок:</span> {client.requests.length}
          </div>
        </div>
      </div>

      {client.requests.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Заявок нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Город</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата доставки</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Создана</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {client.requests.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/requests/${r.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">#{r.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(r.deliveryDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleString("ru-RU")}
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
