import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getRequests, bulkUpdateRequestStatus, createAdminRequest, getClients, getCities, type ShipmentRequest, type RequestStatus, type PackagingType, type Client, type City } from "../api";
import { cn } from "../lib/utils";
import RequestDetail from "./RequestDetail";

const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

type SortKey = "id" | "city" | "deliveryDate" | "volume" | "weight" | "boxCount" | "client" | "total" | "status";
type SortDir = "asc" | "desc";

const SORT_KEYS: SortKey[] = [
  "id",
  "city",
  "deliveryDate",
  "volume",
  "weight",
  "boxCount",
  "client",
  "total",
  "status",
];

function isSortKey(v: string | null): v is SortKey {
  return v !== null && (SORT_KEYS as string[]).includes(v);
}

function isSortDir(v: string | null): v is SortDir {
  return v === "asc" || v === "desc";
}

function formatDateRu(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function getRequestTotal(r: ShipmentRequest) {
  const services = (r as any).services as { amount?: number }[] | undefined;
  if (!services || services.length === 0) return null;
  const total = services.reduce((s, it) => s + (Number(it.amount) || 0), 0);
  return total > 0 ? total : null;
}

export default function Requests() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [modalEditing, setModalEditing] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<RequestStatus>("warehouse");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // New request modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [newReq, setNewReq] = useState({ clientId: "", cityId: "", deliveryDate: "", packagingType: "pallets" as PackagingType, boxCount: "1", weight: "", comment: "" });
  const [creating, setCreating] = useState(false);

  const filterStatus = (searchParams.get("status") as RequestStatus | "all") || "all";
  const filterCity = searchParams.get("city") || "all";
  const filterDate = searchParams.get("date") || "all";
  const sortParam = searchParams.get("sort");
  const sortKey = isSortKey(sortParam) ? sortParam : "id";
  const sortDir = isSortDir(searchParams.get("dir")) ? searchParams.get("dir") : "desc";

  const setParam = useCallback((key: string, value: string | "") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "all" || value === "") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilterStatus = (v: RequestStatus | "all") => setParam("status", v);
  const setFilterCity = (v: string) => setParam("city", v);
  const setFilterDate = (v: string) => setParam("date", v);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const data = await getRequests();
        if (!alive) return;
        setRequests(data);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (selectedRequestId === null) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setSelectedRequestId(null); getRequests().then(setRequests); }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRequestId]);

  const uniqueCities = useMemo(() => {
    const set = new Set(requests.map((r) => r.city));
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [requests]);

  const uniqueDates = useMemo(() => {
    const set = new Set(requests.map((r) => r.deliveryDate.slice(0, 10)));
    return [...set].sort();
  }, [requests]);

  const filtered = requests.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterCity !== "all" && r.city !== filterCity) return false;
    if (filterDate !== "all" && !r.deliveryDate.startsWith(filterDate)) return false;
    return true;
  });

  // Reset selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterStatus, filterCity, filterDate]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = sorted.map((r) => r.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0 || bulkUpdating) return;
    setBulkUpdating(true);
    try {
      await bulkUpdateRequestStatus([...selectedIds], bulkStatus);
      const data = await getRequests();
      setRequests(data);
      setSelectedIds(new Set());
    } catch {
      alert("Ошибка при массовом обновлении статуса");
    } finally {
      setBulkUpdating(false);
    }
  };

  const summary = useMemo(() => {
    const s = {
      requestCount: filtered.length,
      totalPlaces: 0,
      placesByPackaging: { pallets: 0, boxes: 0 } as Record<PackagingType, number>,
      knownWeightKg: 0,
      missingWeightCount: 0,
      missingWeightPlaces: 0,
    };

    for (const r of filtered) {
      s.totalPlaces += r.boxCount;
      s.placesByPackaging[r.packagingType] += r.boxCount;

      if (r.weight == null) {
        s.missingWeightCount += 1;
        s.missingWeightPlaces += r.boxCount;
      } else {
        s.knownWeightKg += r.weight;
      }
    }

    s.knownWeightKg = Math.round(s.knownWeightKg * 100) / 100;
    return s;
  }, [filtered]);

  const sorted = [...filtered].sort((a, b) => {
    const dirFactor = sortDir === "asc" ? 1 : -1;

    const getClientName = (r: ShipmentRequest) => `${r.client.firstName ?? ""} ${r.client.lastName ?? ""}`.trim();

    const compareStr = (x: string, y: string) => x.localeCompare(y, "ru");
    const compareNum = (x: number, y: number) => (x === y ? 0 : x > y ? 1 : -1);

    let res = 0;
    switch (sortKey) {
      case "id":
        res = compareNum(a.id, b.id);
        break;
      case "city":
        res = compareStr(a.city, b.city);
        break;
      case "deliveryDate":
        res = compareNum(new Date(a.deliveryDate).getTime(), new Date(b.deliveryDate).getTime());
        break;
      case "volume":
        res = compareNum(a.volume ?? -1, b.volume ?? -1);
        break;
      case "weight":
        res = compareNum(a.weight ?? -1, b.weight ?? -1);
        break;
      case "boxCount":
        res = compareNum(a.boxCount, b.boxCount);
        break;
      case "client":
        res = compareStr(getClientName(a), getClientName(b));
        break;
      case "total": {
        const ta = getRequestTotal(a) ?? -1;
        const tb = getRequestTotal(b) ?? -1;
        res = compareNum(ta, tb);
        break;
      }
      case "status":
        res = compareStr(statusLabels[a.status], statusLabels[b.status]);
        break;
    }

    if (res !== 0) return res * dirFactor;
    return a.id - b.id;
  });

  const toggleSort = (key: SortKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (sortKey === key) {
          next.set("dir", sortDir === "asc" ? "desc" : "asc");
          return next;
        }

        next.set("sort", key);
        next.set("dir", "asc");
        return next;
      },
      { replace: true },
    );
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "▲" : "▼";
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  const hasActiveFilters = filterStatus !== "all" || filterCity !== "all" || filterDate !== "all";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Заявки</h1>
        {hasActiveFilters && (
          <button
            onClick={() => setSearchParams({}, { replace: true })}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {(["all", "new", "warehouse", "shipped", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition",
                filterStatus === s
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              )}
            >
              {s === "all" ? "Все" : statusLabels[s]}
            </button>
          ))}
        </div>

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="all">Все направления</option>
          {uniqueCities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="all">Все даты</option>
          {uniqueDates.map((d) => (
            <option key={d} value={d}>{formatDateRu(d)}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Найдено: {sorted.length}
        </span>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <button
            onClick={() => {
              getClients().then(setClients).catch(() => {});
              getCities().then(setCitiesList).catch(() => {});
              setNewReq({ clientId: "", cityId: "", deliveryDate: "", packagingType: "pallets", boxCount: "1", weight: "", comment: "" });
              setShowNewModal(true);
            }}
            className="px-3 py-1 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            + Новая
          </button>
          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-gray-400 dark:text-gray-500">Заявок:</span>{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">{summary.requestCount}</span>
          </div>

          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-gray-400 dark:font-medium">Мест:</span>{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">{summary.totalPlaces}</span>
          </div>

          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-gray-400 dark:font-medium">Палеты:</span>{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">{summary.placesByPackaging.pallets}</span>
          </div>

          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-gray-400 dark:font-medium">Короба:</span>{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">{summary.placesByPackaging.boxes}</span>
          </div>

          <div className="text-gray-600 dark:text-gray-300">
            <span className="text-gray-400 dark:font-medium">Вес:</span>{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {summary.knownWeightKg.toLocaleString("ru-RU")} кг
            </span>
            {summary.missingWeightCount > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                (без веса: {summary.missingWeightCount} / мест: {summary.missingWeightPlaces})
              </span>
            )}
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5">
          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Выбрано: {selectedIds.size} из {sorted.length}
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as RequestStatus)}
            className="px-3 py-1.5 text-sm rounded-lg border border-blue-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-blue-700 dark:text-gray-300"
          >
            {(["new", "warehouse", "shipped", "done"] as RequestStatus[]).map((s) => (
              <option key={s} value={s}>{statusLabels[s]}</option>
            ))}
          </select>
          <button
            onClick={handleBulkStatusUpdate}
            disabled={bulkUpdating}
            className="px-4 py-1.5 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {bulkUpdating ? "Обновление..." : "Применить"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-sm rounded-lg text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Снять выделение
          </button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Заявок нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={sorted.length > 0 && sorted.every((r) => selectedIds.has(r.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("id")} className="hover:text-gray-900 dark:hover:text-white">
                    # {sortIndicator("id")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("city")} className="hover:text-gray-900 dark:hover:text-white">
                    Город {sortIndicator("city")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("deliveryDate")} className="hover:text-gray-900 dark:hover:text-white">
                    Дата доставки {sortIndicator("deliveryDate")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("volume")} className="hover:text-gray-900 dark:hover:text-white">
                    Объём {sortIndicator("volume")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("weight")} className="hover:text-gray-900 dark:hover:text-white">
                    Вес {sortIndicator("weight")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("boxCount")} className="hover:text-gray-900 dark:hover:text-white">
                    Мест {sortIndicator("boxCount")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("client")} className="hover:text-gray-900 dark:hover:text-white">
                    Клиент {sortIndicator("client")}
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                  <button onClick={() => toggleSort("total")} className="hover:text-gray-900 dark:hover:text-white">
                    Сумма {sortIndicator("total")}
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("status")} className="hover:text-gray-900 dark:hover:text-white">
                    Статус {sortIndicator("status")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((r) => (
                <tr
                  key={r.id}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                    setSelectedRequestId(r.id);
                  }}
                  className={cn(
                    "hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer",
                    !r.isRead && "font-bold bg-blue-50/50 dark:bg-blue-900/10",
                    selectedIds.has(r.id) && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">#{r.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.city}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDateRu(r.deliveryDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.volume ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.weight ?? "—"} кг</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{r.boxCount}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {r.client.firstName} {r.client.lastName || ""}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                    {(() => {
                      const total = getRequestTotal(r);
                      return total == null ? "-" : `${total.toLocaleString("ru-RU")} ₽`;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium", statusColors[r.status])}>
                      {statusLabels[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowNewModal(false); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Новая заявка</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Клиент</label>
                <select value={newReq.clientId} onChange={(e) => setNewReq({ ...newReq, clientId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <option value="">Выберите клиента</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName ?? ""} {c.lastName ?? ""} {c.phone ? `(${c.phone})` : `(@${c.username ?? c.telegramId})`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Направление</label>
                <select value={newReq.cityId} onChange={(e) => setNewReq({ ...newReq, cityId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                  <option value="">Выберите город</option>
                  {citiesList.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Дата доставки</label>
                <input type="date" value={newReq.deliveryDate} onChange={(e) => setNewReq({ ...newReq, deliveryDate: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Упаковка</label>
                <div className="flex gap-2">
                  {(["pallets", "boxes"] as PackagingType[]).map((p) => (
                    <button key={p} type="button" onClick={() => setNewReq({ ...newReq, packagingType: p })} className={cn("flex-1 px-3 py-2 text-sm rounded-lg font-medium transition", newReq.packagingType === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                      {p === "pallets" ? "Палеты" : "Коробки"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Кол-во мест</label>
                  <input type="number" min="1" value={newReq.boxCount} onChange={(e) => setNewReq({ ...newReq, boxCount: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Вес (кг)</label>
                  <input type="number" min="0" step="0.1" value={newReq.weight} onChange={(e) => setNewReq({ ...newReq, weight: e.target.value })} placeholder="необяз." className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Комментарий</label>
                <textarea value={newReq.comment} onChange={(e) => setNewReq({ ...newReq, comment: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">Отмена</button>
              <button
                disabled={creating || !newReq.clientId || !newReq.cityId || !newReq.deliveryDate || !newReq.boxCount}
                onClick={async () => {
                  setCreating(true);
                  try {
                    await createAdminRequest({
                      clientId: Number(newReq.clientId),
                      cityId: Number(newReq.cityId),
                      deliveryDate: new Date(newReq.deliveryDate).toISOString(),
                      packagingType: newReq.packagingType,
                      boxCount: Number(newReq.boxCount),
                      ...(newReq.weight ? { weight: Number(newReq.weight) } : {}),
                      ...(newReq.comment ? { comment: newReq.comment } : {}),
                    });
                    setShowNewModal(false);
                    const data = await getRequests();
                    setRequests(data);
                  } catch { alert("Ошибка при создании заявки"); }
                  finally { setCreating(false); }
                }}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {creating ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRequestId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) { setSelectedRequestId(null); setModalEditing(false); getRequests().then(setRequests); }
          }}
        >
          <div className="w-full max-w-7xl mt-6 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end p-3 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setSelectedRequestId(null); setModalEditing(false); getRequests().then(setRequests); }}
                className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <RequestDetail embedded requestId={selectedRequestId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
