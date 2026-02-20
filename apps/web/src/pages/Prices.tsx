import { useState, useEffect, useMemo, useRef } from "react";
import {
  getCities,
  createCity,
  getRates,
  createRate,
  updateRate,
  deleteRate,
  type City,
  type PriceRate,
  type RateUnit,
} from "../api";
import { cn } from "../lib/utils";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

const unitLabels: Record<RateUnit, string> = {
  pallet: "Паллет",
  kg: "Кг",
  m3: "м³",
};

export default function Prices() {
  const [cities, setCities] = useState<City[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<number | "all">("all");

  // add form
  const [addCityId, setAddCityId] = useState<number | "">("")
  const [addUnit, setAddUnit] = useState<RateUnit>("pallet");
  const [addMinWeightKg, setAddMinWeightKg] = useState("");
  const [addMaxWeightKg, setAddMaxWeightKg] = useState("");
  const [addMinVolumeM3, setAddMinVolumeM3] = useState("");
  const [addMaxVolumeM3, setAddMaxVolumeM3] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addComment, setAddComment] = useState("");
  const [adding, setAdding] = useState(false);

  // new city
  const [newCityName, setNewCityName] = useState("");
  const [creatingCity, setCreatingCity] = useState(false);

  // inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editMinWeightKg, setEditMinWeightKg] = useState("");
  const [editMaxWeightKg, setEditMaxWeightKg] = useState("");
  const [editMinVolumeM3, setEditMinVolumeM3] = useState("");
  const [editMaxVolumeM3, setEditMaxVolumeM3] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [c, r] = await Promise.all([getCities(), getRates()]);
    setCities(c);
    setRates(r);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filterCity === "all") return rates;
    return rates.filter((r) => r.cityId === filterCity);
  }, [rates, filterCity]);

  const handleAddRate = async () => {
    if (adding || addCityId === "" || !addPrice) return;
    setAdding(true);
    try {
      const tier: any = {};
      if (addUnit === "pallet") {
        tier.minWeightKg = addMinWeightKg ? Number(addMinWeightKg) : null;
        tier.maxWeightKg = addMaxWeightKg ? Number(addMaxWeightKg) : null;
      }
      if (addUnit === "m3") {
        tier.minVolumeM3 = addMinVolumeM3 ? Number(addMinVolumeM3) : null;
        tier.maxVolumeM3 = addMaxVolumeM3 ? Number(addMaxVolumeM3) : null;
      }

      await createRate({
        cityId: addCityId as number,
        unit: addUnit,
        ...tier,
        price: Number(addPrice),
        comment: addComment.trim() || null,
      });
      setAddMinWeightKg("");
      setAddMaxWeightKg("");
      setAddMinVolumeM3("");
      setAddMaxVolumeM3("");
      setAddPrice("");
      setAddComment("");
      await reload();
    } finally {
      setAdding(false);
    }
  };

  const handleAddCity = async () => {
    if (creatingCity || !newCityName.trim()) return;
    setCreatingCity(true);
    try {
      const c = await createCity(newCityName.trim());
      setCities((prev) => [...prev, c].sort((a, b) => a.shortName.localeCompare(b.shortName, "ru")));
      setNewCityName("");
      setAddCityId(c.id);
    } finally {
      setCreatingCity(false);
    }
  };

  const handleSaveEdit = async () => {
    if (saving || editId === null) return;
    setSaving(true);
    try {
      const tier: any = {};
      const r = rates.find((x) => x.id === editId);
      if (r?.unit === "pallet") {
        tier.minWeightKg = editMinWeightKg ? Number(editMinWeightKg) : null;
        tier.maxWeightKg = editMaxWeightKg ? Number(editMaxWeightKg) : null;
      }
      if (r?.unit === "m3") {
        tier.minVolumeM3 = editMinVolumeM3 ? Number(editMinVolumeM3) : null;
        tier.maxVolumeM3 = editMaxVolumeM3 ? Number(editMaxVolumeM3) : null;
      }
      await updateRate(editId, {
        ...tier,
        price: Number(editPrice),
        comment: editComment.trim() || null,
      });
      setEditId(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить тариф?")) return;
    await deleteRate(id);
    await reload();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Прайс-лист</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filterCity === "all" ? "all" : filterCity}
          onChange={(e) => setFilterCity(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="all">Все направления</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Тарифов: {filtered.length}
        </span>
      </div>

      {/* Add rate form */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Добавить тариф</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Направление</label>
            <div className="flex gap-1">
              <select
                value={addCityId}
                onChange={(e) => setAddCityId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите...</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.shortName}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Единица</label>
            <select
              value={addUnit}
              onChange={(e) => setAddUnit(e.target.value as RateUnit)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            >
              <option value="pallet">Паллет</option>
              <option value="kg">Кг</option>
              <option value="m3">м³</option>
            </select>
          </div>

          {addUnit === "pallet" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Мин. вес (кг)</label>
                <input
                  value={addMinWeightKg}
                  onChange={(e) => setAddMinWeightKg(e.target.value)}
                  inputMode="numeric"
                  className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Макс. вес (кг)</label>
                <input
                  value={addMaxWeightKg}
                  onChange={(e) => setAddMaxWeightKg(e.target.value)}
                  inputMode="numeric"
                  className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}

          {addUnit === "m3" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Мин. объём (м³)</label>
                <input
                  value={addMinVolumeM3}
                  onChange={(e) => setAddMinVolumeM3(e.target.value)}
                  inputMode="decimal"
                  className="w-32 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Макс. объём (м³)</label>
                <input
                  value={addMaxVolumeM3}
                  onChange={(e) => setAddMaxVolumeM3(e.target.value)}
                  inputMode="decimal"
                  className="w-32 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Цена (руб.)</label>
            <input
              value={addPrice}
              onChange={(e) => setAddPrice(e.target.value)}
              inputMode="numeric"
              className="w-28 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Комментарий</label>
            <input
              value={addComment}
              onChange={(e) => setAddComment(e.target.value)}
              className="w-40 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            onClick={handleAddRate}
            disabled={adding || addCityId === "" || !addPrice}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить
          </button>
        </div>

        {/* New city inline */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Новое направление</label>
            <input
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              placeholder="Название..."
              className="w-48 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={handleAddCity}
            disabled={creatingCity || !newCityName.trim()}
            className="px-3 py-2 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition"
          >
            Создать
          </button>
        </div>
      </div>

      {/* Rates table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Тарифов нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Направление</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Единица</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Диапазон</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена (руб.)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Комментарий</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.city.shortName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{unitLabels[r.unit]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editId === r.id ? (
                      <div className="flex flex-wrap gap-2">
                        {r.unit === "pallet" && (
                          <>
                            <input
                              value={editMinWeightKg}
                              onChange={(e) => setEditMinWeightKg(e.target.value)}
                              placeholder="мин кг"
                              inputMode="numeric"
                              className="w-20 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            <input
                              value={editMaxWeightKg}
                              onChange={(e) => setEditMaxWeightKg(e.target.value)}
                              placeholder="макс кг"
                              inputMode="numeric"
                              className="w-20 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </>
                        )}
                        {r.unit === "m3" && (
                          <>
                            <input
                              value={editMinVolumeM3}
                              onChange={(e) => setEditMinVolumeM3(e.target.value)}
                              placeholder="мин м³"
                              inputMode="decimal"
                              className="w-24 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                            <input
                              value={editMaxVolumeM3}
                              onChange={(e) => setEditMaxVolumeM3(e.target.value)}
                              placeholder="макс м³"
                              inputMode="decimal"
                              className="w-24 px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                            />
                          </>
                        )}
                        {r.unit === "kg" && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    ) : r.unit === "pallet" ? (
                      <span>
                        {r.minWeightKg ?? 0}–{r.maxWeightKg ?? "∞"} кг
                      </span>
                    ) : r.unit === "m3" ? (
                      <span>
                        {r.minVolumeM3 ?? 0}–{r.maxVolumeM3 ?? "∞"} м³
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {editId === r.id ? (
                      <input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        inputMode="numeric"
                        className="w-24 px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      r.price.toLocaleString("ru-RU")
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {editId === r.id ? (
                      <input
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      r.comment || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === r.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={saving}
                          className="p-1 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditId(r.id);
                            setEditPrice(String(r.price));
                            setEditComment(r.comment ?? "");
                            setEditMinWeightKg(r.minWeightKg === null ? "" : String(r.minWeightKg));
                            setEditMaxWeightKg(r.maxWeightKg === null ? "" : String(r.maxWeightKg));
                            setEditMinVolumeM3(r.minVolumeM3 === null ? "" : String(r.minVolumeM3));
                            setEditMaxVolumeM3(r.maxVolumeM3 === null ? "" : String(r.maxVolumeM3));
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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
      )}
    </div>
  );
}
