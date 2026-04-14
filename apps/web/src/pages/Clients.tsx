import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getClients, type Client } from "../api";

type SortField = "name" | "organization" | "requests" | "date";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();

  useEffect(() => {
    getClients()
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      let compare = 0;
      
      switch (sortField) {
        case "name":
          const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
          const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
          compare = nameA.localeCompare(nameB, "ru");
          break;
        case "organization":
          const orgA = a.counterparties?.[0]?.counterparty?.shortName || a.counterparties?.[0]?.counterparty?.name || "";
          const orgB = b.counterparties?.[0]?.counterparty?.shortName || b.counterparties?.[0]?.counterparty?.name || "";
          compare = orgA.localeCompare(orgB, "ru");
          break;
        case "requests":
          compare = (a._count?.requests ?? 0) - (b._count?.requests ?? 0);
          break;
        case "date":
          compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortDirection === "asc" ? compare : -compare;
    });
  }, [clients, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function getSortIcon(field: SortField) {
    if (sortField !== field) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Клиенты</h1>

      {clients.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Клиентов нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th 
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("name")}
                >
                  Имя{getSortIcon("name")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Почта</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Телефон</th>
                <th 
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("organization")}
                >
                  Организация{getSortIcon("organization")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ИНН</th>
                <th 
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("requests")}
                >
                  Заявок{getSortIcon("requests")}
                </th>
                <th 
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSort("date")}
                >
                  Дата{getSortIcon("date")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sortedClients.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/admin/clients/${c.id}`)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {c.firstName} {c.lastName || ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {c.username ? `@${c.username}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {c.counterparties?.[0]?.counterparty?.shortName || c.counterparties?.[0]?.counterparty?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {c.counterparties?.[0]?.counterparty?.inn || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{c._count?.requests ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">
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
