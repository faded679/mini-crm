import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWarehouseAuth } from "../warehouseAuth";
import { getWarehouseRequests, bulkShipRequests, getWarehouseStats, getWarehouseCities, getWarehouseCitiesFbs, type ShipmentRequest, type WarehouseStats } from "../api";

type DeliveryFilter = "all" | "FBO" | "FBS";

export default function WarehouseShipment() {
  const navigate = useNavigate();
  const { worker, logout } = useWarehouseAuth();
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<DeliveryFilter>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [shipping, setShipping] = useState(false);
  const [allCities, setAllCities] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filterParam = filter === "all" ? undefined : filter;
      const [requestsData, statsData] = await Promise.all([
        getWarehouseRequests(filterParam),
        getWarehouseStats(),
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (err: any) {
      alert("Ошибка загрузки: " + (err.message || "Неизвестная ошибка"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  useEffect(() => {
    Promise.all([getWarehouseCities(), getWarehouseCitiesFbs()])
      .then(([fbo, fbs]) => {
        const names = Array.from(new Set([...fbo.map((c) => c.shortName), ...fbs.map((c) => c.shortName)])).sort();
        setAllCities(names);
      })
      .catch(() => {});
  }, []);

  const cities = allCities.length > 0 ? allCities : Array.from(new Set(requests.map((r) => (r as any).city).filter(Boolean))).sort() as string[];

  const handleFilterChange = (f: DeliveryFilter) => { setFilter(f); setCityFilter("all"); };

  const visible = requests
    .filter((r) => cityFilter === "all" || (r as any).city === cityFilter)
    .filter((r) => !search.trim() || getOrgName(r).toLowerCase().includes(search.trim().toLowerCase()));

  const handleToggle = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((r) => r.id)));
    }
  };

  const handleShip = async () => {
    if (selectedIds.size === 0) {
      alert("Выберите хотя бы одну заявку");
      return;
    }

    if (!confirm(`Отгрузить ${selectedIds.size} заявок?`)) {
      return;
    }

    setShipping(true);
    try {
      const result = await bulkShipRequests(Array.from(selectedIds));
      alert(`Успешно отгружено: ${result.shipped} заявок`);
      setSelectedIds(new Set());
      await loadData();
    } catch (err: any) {
      alert("Ошибка отгрузки: " + (err.message || "Неизвестная ошибка"));
    } finally {
      setShipping(false);
    }
  };

  const getOrgName = (req: ShipmentRequest) => {
    if (req.client?.counterparties && req.client.counterparties.length > 0) {
      const cp = req.client.counterparties[0].counterparty;
      const name = cp.shortName || cp.name || "";
      const match = name.match(/^(ИП)\s+([А-ЯЁ][а-яё]+)/i);
      if (match) {
        return `${match[1]} ${match[2]}`;
      }
      return name;
    }
    return "—";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/warehouse")} className="text-2xl leading-none">←</button>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-xl">🏢</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Кладовщик: {worker?.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{worker?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearch(""); }}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition ${searchOpen ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              >🔍</button>
              <button onClick={logout} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Выход</button>
            </div>
          </div>
          {searchOpen && (
            <div className="mt-3">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по организации..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:border-blue-400"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">В складе</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inWarehouse}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">Отгружено сегодня</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.shippedToday}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {(["all", "FBO", "FBS"] as DeliveryFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {f === "all" ? "Все" : f === "FBO" ? "📦 FBO" : "🚚 FBS"}
              </button>
            ))}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium ml-auto"
            >
              <option value="all">📍 Все города</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              📦 Заявки в складе ({visible.length})
            </h2>
            {visible.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedIds.size === visible.length ? "Снять все" : "Выбрать все"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              Нет заявок в складе
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {visible.map((req) => (
                <label
                  key={req.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(req.id)}
                    onChange={() => handleToggle(req.id)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white">#{req.id}</span>
                      <span className="text-gray-600 dark:text-gray-400">{getOrgName(req)}</span>
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                        {req.deliveryType?.name || "FBO"}
                      </span>
                      {(req as any).city && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ml-auto">
                          📍 {(req as any).city}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {req.deliveryType?.name === "FBS"
                        ? `Объем: ${req.volume || "—"} м³`
                        : `Коробок: ${req.boxCount || "—"}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Ship Button */}
        {visible.length > 0 && (
          <button
            onClick={handleShip}
            disabled={selectedIds.size === 0 || shipping}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            {shipping
              ? "Отгрузка..."
              : `🚚 Отгрузить выбранные (${selectedIds.size})`}
          </button>
        )}
      </div>
    </div>
  );
}
