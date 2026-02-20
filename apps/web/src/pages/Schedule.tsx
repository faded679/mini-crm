import { useState, useEffect, useMemo } from "react";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  getAdminSchedule,
  type ScheduleEntry,
  updateScheduleEntry,
} from "../api";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

export default function Schedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const [addDestination, setAddDestination] = useState("");
  const [addDeliveryDate, setAddDeliveryDate] = useState("");
  const [addAcceptDays, setAddAcceptDays] = useState("");
  const [adding, setAdding] = useState(false);
  const [addDestinationCustom, setAddDestinationCustom] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editDestination, setEditDestination] = useState("");
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editAcceptDays, setEditAcceptDays] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminSchedule()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, []);

  async function reload() {
    setLoading(true);
    try {
      const data = await getAdminSchedule();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  const destinations = useMemo(() => [...new Set(entries.map((e) => e.destination))].sort(), [entries]);

  const filtered = filter
    ? entries.filter((e) => e.destination === filter)
    : entries;

  const grouped = filtered.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    if (!acc[e.destination]) acc[e.destination] = [];
    acc[e.destination].push(e);
    return acc;
  }, {});

  async function onAdd() {
    if (adding) return;
    const dest = addDestination === "__other__" ? addDestinationCustom.trim() : addDestination.trim();
    if (!dest || !addDeliveryDate || !addAcceptDays.trim()) return;
    setAdding(true);
    try {
      await createScheduleEntry({
        destination: dest,
        deliveryDate: addDeliveryDate,
        acceptDays: addAcceptDays.trim(),
      });
      setAddDestination("");
      setAddDestinationCustom("");
      setAddDeliveryDate("");
      setAddAcceptDays("");
      await reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function onSaveEdit() {
    if (saving || editId === null) return;
    if (!editDestination.trim() || !editDeliveryDate || !editAcceptDays.trim()) return;
    setSaving(true);
    try {
      await updateScheduleEntry(editId, {
        destination: editDestination.trim(),
        deliveryDate: editDeliveryDate,
        acceptDays: editAcceptDays.trim(),
      });
      setEditId(null);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Удалить запись расписания?")) return;
    try {
      await deleteScheduleEntry(id);
      await reload();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Расписание отправок</h1>
      </div>

      {/* Add schedule entry */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Добавить запись</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Направление</label>
            <div className="flex gap-1">
              <select
                value={addDestination}
                onChange={(e) => {
                  setAddDestination(e.target.value);
                  if (e.target.value !== "__other__") setAddDestinationCustom("");
                }}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите...</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value="__other__">Другое...</option>
              </select>
              {addDestination === "__other__" && (
                <input
                  value={addDestinationCustom}
                  onChange={(e) => setAddDestinationCustom(e.target.value)}
                  placeholder="Название..."
                  className="w-48 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Дата выгрузки</label>
            <input
              type="date"
              value={addDeliveryDate}
              onChange={(e) => setAddDeliveryDate(e.target.value)}
              className="w-44 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Приём груза</label>
            <input
              value={addAcceptDays}
              onChange={(e) => setAddAcceptDays(e.target.value)}
              placeholder="Понедельник: 9:00–18:00, Вторник: 9:00–15:00"
              className="w-[28rem] max-w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={adding || (addDestination === "" || (addDestination === "__other__" && !addDestinationCustom.trim())) || !addDeliveryDate || !addAcceptDays.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить
          </button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Нет данных</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dest, items]) => (
            <div key={dest} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">📍 {dest}</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Дата выгрузки</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Приём груза на складе</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                        {editId === item.id ? (
                          <input
                            type="date"
                            value={editDeliveryDate}
                            onChange={(e) => setEditDeliveryDate(e.target.value)}
                            className="w-44 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                          />
                        ) : (
                          new Date(item.deliveryDate).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            weekday: "short",
                          })
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {editId === item.id ? (
                          <div className="space-y-2">
                            <input
                              value={editDestination}
                              onChange={(e) => setEditDestination(e.target.value)}
                              className="w-full max-w-lg px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            <input
                              value={editAcceptDays}
                              onChange={(e) => setEditAcceptDays(e.target.value)}
                              className="w-full max-w-3xl px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ) : (
                          item.acceptDays
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editId === item.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={onSaveEdit}
                              disabled={saving}
                              className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditId(item.id);
                                setEditDestination(item.destination);
                                setEditDeliveryDate(String(item.deliveryDate).slice(0, 10));
                                setEditAcceptDays(item.acceptDays);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
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
