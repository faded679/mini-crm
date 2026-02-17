import { useEffect, useState } from "react";
import { getSchedule, type ScheduleEntry } from "../api";

export default function Schedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getSchedule()
      .then(setEntries)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const destinations = [...new Set(entries.map((e) => e.destination))].sort();

  const filtered = filter
    ? entries.filter((e) => e.destination === filter)
    : entries;

  // Group by destination
  const grouped = filtered.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    if (!acc[e.destination]) acc[e.destination] = [];
    acc[e.destination].push(e);
    return acc;
  }, {});

  if (loading) {
    return <div className="p-4 text-center text-tg-hint">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📅 Расписание отправок</h1>

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text mb-4"
      >
        <option value="">Все направления</option>
        {destinations.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-tg-hint">Нет данных</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dest, items]) => (
            <div key={dest} className="bg-tg-secondary-bg rounded-xl p-4">
              <h2 className="font-semibold text-tg-text mb-3">📍 {dest}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-medium text-tg-text">
                        🚚 {new Date(item.deliveryDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          weekday: "short",
                        })}
                      </span>
                    </div>
                    <div className="text-right text-tg-hint text-xs max-w-[55%]">
                      {item.acceptDays}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
