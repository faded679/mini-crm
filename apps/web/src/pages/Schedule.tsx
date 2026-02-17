import { useState, useEffect } from "react";
import { getSchedule, type ScheduleEntry } from "../api";

export default function Schedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getSchedule()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  const destinations = [...new Set(entries.map((e) => e.destination))].sort();

  const filtered = filter
    ? entries.filter((e) => e.destination === filter)
    : entries;

  const grouped = filtered.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    if (!acc[e.destination]) acc[e.destination] = [];
    acc[e.destination].push(e);
    return acc;
  }, {});

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Расписание отправок</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700"
        >
          <option value="">Все направления</option>
          {destinations.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">Нет данных</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dest, items]) => (
            <div key={dest} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">📍 {dest}</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Дата выгрузки</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Приём груза на складе</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {new Date(item.deliveryDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          weekday: "short",
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.acceptDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
