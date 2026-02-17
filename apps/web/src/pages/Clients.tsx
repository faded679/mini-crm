import { useState, useEffect } from "react";
import { getClients, type Client } from "../api";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Клиенты</h1>

      {clients.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Клиентов нет</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Имя</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Telegram ID</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Заявок</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {c.firstName} {c.lastName || ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.username ? `@${c.username}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{c.telegramId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{c._count?.requests ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString("ru-RU")}
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
