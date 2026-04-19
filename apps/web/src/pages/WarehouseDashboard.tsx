import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWarehouseAuth } from "../warehouseAuth";
import { getWarehouseStats, type WarehouseStats } from "../api";

export default function WarehouseDashboard() {
  const { worker, logout } = useWarehouseAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<WarehouseStats | null>(null);
  const [newCount, setNewCount] = useState<number | null>(null);

  useEffect(() => {
    getWarehouseStats().then(setStats).catch(() => {});
    import("../api").then(({ getWarehouseNewRequests }) =>
      getWarehouseNewRequests().then((r) => setNewCount(r.length)).catch(() => {})
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">🏢</div>
          <div>
            <div className="font-bold text-gray-900 text-sm">{worker?.name}</div>
            <div className="text-xs text-gray-400">{worker?.email}</div>
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600">Выход</button>
      </div>

      {/* Stats */}
      <div className="px-4 pt-5 grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Новые</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{newCount ?? "..."}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wide">На складе</div>
          <div className="text-3xl font-bold text-amber-600 mt-1">{stats?.inWarehouse ?? "..."}</div>
        </div>
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-400 uppercase tracking-wide">Отгружено сегодня</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{stats?.shippedToday ?? "..."}</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pt-6 flex-1 flex flex-col gap-3">
        <button
          onClick={() => navigate("/warehouse/new")}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl py-4 text-base font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          📋 Новые заявки
        </button>
        <button
          onClick={() => navigate("/warehouse/shipment")}
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl py-4 text-base font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          🚚 Отгрузка
        </button>
        <button
          onClick={() => navigate("/warehouse/create")}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl py-4 text-base font-semibold flex items-center justify-center gap-2 transition shadow-sm"
        >
          ➕ Создать заявку
        </button>
      </div>

      <div className="px-4 py-4 text-center text-xs text-gray-300">warehouse.sologo.ru</div>
    </div>
  );
}
