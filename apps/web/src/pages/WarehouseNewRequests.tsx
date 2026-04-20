import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWarehouseNewRequests, getWarehouseCities, getWarehouseCitiesFbs, type WarehouseRequest } from "../api";

type Filter = "all" | "FBO" | "FBS";

function getOrgName(req: WarehouseRequest): string {
  const cp = req.client?.counterparties?.[0]?.counterparty;
  if (!cp) return "—";
  const name = cp.shortName || cp.name || "";
  const m = name.match(/^(ИП)\s+([А-ЯЁ][а-яё]+)/i);
  return m ? `${m[1]} ${m[2]}` : name;
}

export default function WarehouseNewRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [allCities, setAllCities] = useState<string[]>([]);

  const load = () => {
    setLoading(true);
    const param = filter === "all" ? undefined : filter;
    getWarehouseNewRequests(param)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    Promise.all([getWarehouseCities(), getWarehouseCitiesFbs()])
      .then(([fbo, fbs]) => {
        const names = Array.from(new Set([...fbo.map((c) => c.shortName), ...fbs.map((c) => c.shortName)])).sort();
        setAllCities(names);
      })
      .catch(() => {});
  }, []);

  // Города из загруженных заявок + все доступные
  const cities = allCities.length > 0 ? allCities : Array.from(new Set(requests.map((r) => r.city).filter(Boolean))).sort();

  // Сбрасываем фильтр города при смене типа
  const handleFilterChange = (f: Filter) => { setFilter(f); setCityFilter("all"); };

  const visible = requests
    .filter((r) => cityFilter === "all" || r.city === cityFilter)
    .filter((r) => !search.trim() || getOrgName(r).toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/warehouse")} className="text-2xl leading-none">←</button>
        <h1 className="font-bold text-gray-900">Новые заявки</h1>
        <span className="ml-auto text-sm text-gray-400">{visible.length}</span>
        <button
          onClick={() => { setSearchOpen((v) => !v); if (searchOpen) setSearch(""); }}
          className={`w-8 h-8 flex items-center justify-center rounded-full text-lg transition ${searchOpen ? "bg-blue-100 text-blue-600" : "text-gray-400"}`}
        >🔍</button>
      </div>

      {/* Collapsible search */}
      {searchOpen && (
        <div className="px-4 pt-2 pb-1 bg-white border-b border-gray-100">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по организации..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 outline-none focus:border-blue-400"
          />
        </div>
      )}

      {/* Filters row */}
      <div className="px-4 pt-3 flex gap-2">
        {(["all", "FBO", "FBS"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {f === "all" ? "Все" : f === "FBO" ? "📦 FBO" : "🚚 FBS"}
          </button>
        ))}
        {/* City filter */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="flex-1 py-2 px-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 font-medium min-w-0"
        >
          <option value="all">📍 Все</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pt-3 pb-4">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Загрузка...</div>
        ) : visible.length === 0 ? (
          <div className="text-center text-gray-400 py-12">Нет новых заявок</div>
        ) : (
          <div className="space-y-2">
            {visible.map((req) => {
              const isFbs = req.deliveryType?.name === "FBS";
              const photoCount = req.photos?.length || 0;
              return (
                <button
                  key={req.id}
                  onClick={() => navigate(`/warehouse/request/${req.id}`)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">#{req.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      isFbs ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {req.deliveryType?.name || "FBO"}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 ml-auto">
                      📍 {req.city || "—"}
                    </span>
                    {photoCount > 0 && <span className="text-xs text-gray-400">📸 {photoCount}</span>}
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{getOrgName(req)}</div>
                  <div className="text-xs text-gray-400 mt-1 flex gap-3">
                    <span>
                      {isFbs
                        ? `📏 ${req.volume || "—"} м³`
                        : `📦 ${req.boxCount} шт`}
                    </span>
                    <span>📅 {new Date(req.deliveryDate).toLocaleDateString("ru-RU")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Refresh */}
      <div className="px-4 pb-4">
        <button
          onClick={load}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-medium text-sm active:bg-gray-50 transition disabled:opacity-50"
        >
          🔄 Обновить
        </button>
      </div>
    </div>
  );
}
