import { useState, useEffect, useMemo, useRef } from "react";
import {
  getDirections,
  createDirection,
  getRates,
  createRate,
  updateRate,
  deleteRate,
  importRates,
  type Direction,
  type PriceRate,
  type RateUnit,
  type ImportReport,
} from "../api";
import { cn } from "../lib/utils";
import { Plus, Trash2, Pencil, Upload, X, Check } from "lucide-react";

const unitLabels: Record<RateUnit, string> = {
  pallet: "Паллет",
  kg: "Кг",
  m3: "м³",
};

export default function Prices() {
  const [directions, setDirections] = useState<Direction[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDir, setFilterDir] = useState<number | "all">("all");

  // add form
  const [addDirId, setAddDirId] = useState<number | "">("");
  const [addUnit, setAddUnit] = useState<RateUnit>("pallet");
  const [addPrice, setAddPrice] = useState("");
  const [addComment, setAddComment] = useState("");
  const [adding, setAdding] = useState(false);

  // new direction
  const [newDirName, setNewDirName] = useState("");
  const [creatingDir, setCreatingDir] = useState(false);

  // inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  // import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const [importing, setImporting] = useState(false);

  const reload = async () => {
    const [d, r] = await Promise.all([getDirections(), getRates()]);
    setDirections(d);
    setRates(r);
  };

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (filterDir === "all") return rates;
    return rates.filter((r) => r.directionId === filterDir);
  }, [rates, filterDir]);

  const handleAddRate = async () => {
    if (adding || addDirId === "" || !addPrice) return;
    setAdding(true);
    try {
      await createRate({
        directionId: addDirId as number,
        unit: addUnit,
        price: Number(addPrice),
        comment: addComment.trim() || null,
      });
      setAddPrice("");
      setAddComment("");
      await reload();
    } finally {
      setAdding(false);
    }
  };

  const handleAddDirection = async () => {
    if (creatingDir || !newDirName.trim()) return;
    setCreatingDir(true);
    try {
      const d = await createDirection(newDirName.trim());
      setDirections((prev) => [...prev, d].sort((a, b) => a.name.localeCompare(b.name, "ru")));
      setNewDirName("");
      setAddDirId(d.id);
    } finally {
      setCreatingDir(false);
    }
  };

  const handleSaveEdit = async () => {
    if (saving || editId === null) return;
    setSaving(true);
    try {
      await updateRate(editId, {
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportReport(null);

    try {
      const XLSX = await import(/* @vite-ignore */ "xlsx");
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);

      const rows = json.map((row: Record<string, any>) => ({
        direction: String(row["direction"] ?? row["Direction"] ?? row["направление"] ?? row["Направление"] ?? ""),
        unit: String(row["unit"] ?? row["Unit"] ?? row["единица"] ?? row["Единица"] ?? ""),
        price: Number(row["price"] ?? row["Price"] ?? row["цена"] ?? row["Цена"] ?? 0),
        comment: row["comment"] ?? row["Comment"] ?? row["комментарий"] ?? row["Комментарий"] ?? null,
      }));

      const report = await importRates(rows);
      setImportReport(report);
      await reload();
    } catch (err: any) {
      setImportReport({ created: 0, updated: 0, errors: [{ row: 0, message: err.message }] });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          value={filterDir === "all" ? "all" : filterDir}
          onChange={(e) => setFilterDir(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="all">Все направления</option>
          {directions.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
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
                value={addDirId}
                onChange={(e) => setAddDirId(e.target.value ? Number(e.target.value) : "")}
                className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">Выберите...</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
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
            disabled={adding || addDirId === "" || !addPrice}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Plus size={16} />
            Добавить
          </button>
        </div>

        {/* New direction inline */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Новое направление</label>
            <input
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="Название..."
              className="w-48 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={handleAddDirection}
            disabled={creatingDir || !newDirName.trim()}
            className="px-3 py-2 text-sm rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 disabled:opacity-50 transition"
          >
            Создать
          </button>
        </div>
      </div>

      {/* Import Excel */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer transition">
            <Upload size={16} />
            {importing ? "Загрузка..." : "Импорт Excel"}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Формат: direction | unit (pallet/kg/m3) | price | comment
          </span>
        </div>

        {importReport && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              Создано: <b>{importReport.created}</b>, обновлено: <b>{importReport.updated}</b>
              {importReport.errors.length > 0 && (
                <span className="text-red-600 dark:text-red-400 ml-2">
                  , ошибок: <b>{importReport.errors.length}</b>
                </span>
              )}
            </p>
            {importReport.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-red-600 dark:text-red-400">
                {importReport.errors.map((e, i) => (
                  <li key={i}>Строка {e.row}: {e.message}</li>
                ))}
              </ul>
            )}
            <button
              onClick={() => setImportReport(null)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Скрыть
            </button>
          </div>
        )}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена (руб.)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Комментарий</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{r.direction.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{unitLabels[r.unit]}</td>
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
