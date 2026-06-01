import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getRequests, bulkUpdateRequestStatus, createAdminRequest, getCounterparties, getCities, getCitiesFbs, getAdminScheduleFbs, getPriceFbs, createInvoice, getBoxTypes, getPalletTypes, getRates, type ShipmentRequest, type RequestStatus, type PackagingType, type Counterparty, type City, type CityFbs, type ScheduleEntryFbs, type PriceFbsEntry, type InvoiceItemPayload, type BoxType, type PalletType, type PriceRate } from "../api";
import { cn } from "../lib/utils";
import RequestDetail from "./RequestDetail";

// Requests page with filtering and sorting
const statusLabels: Record<RequestStatus, string> = {
  new: "Новый",
  warehouse: "Склад",
  shipped: "Отгружен",
  done: "Выполнена",
  archived: "Архив",
};

const statusColors: Record<RequestStatus, string> = {
  new: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  warehouse: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  done: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

type SortKey = "id" | "city" | "deliveryDate" | "volume" | "weight" | "boxCount" | "client" | "isFbs" | "mpDate" | "total" | "status" | "createdAt";
type SortDir = "asc" | "desc";

const SORT_KEYS: SortKey[] = [
  "id",
  "city",
  "deliveryDate",
  "volume",
  "weight",
  "boxCount",
  "client",
  "isFbs",
  "mpDate",
  "total",
  "status",
  "createdAt",
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

function getEffectiveVolume(r: ShipmentRequest): number | null {
  if (r.volume != null) return r.volume;
  const services = (r as any).services as { unit?: string; quantity?: number }[] | undefined;
  if (!services) return null;
  const m3svcs = services.filter((s) => s.unit === "м³");
  if (m3svcs.length === 0) return null;
  const total = m3svcs.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
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
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [citiesList, setCitiesList] = useState<City[]>([]);
  const [newReq, setNewReq] = useState({ clientId: "", cityId: "", deliveryDate: "", packagingType: "pallets" as PackagingType, boxCount: "1", weight: "", comment: "", boxTypeId: "", palletTypeId: "" });
  const [creating, setCreating] = useState(false);
  
  // Box types, pallet types and rates for FBO
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);

  // FBS new request state
  const [newReqType, setNewReqType] = useState<"fbo" | "fbs">("fbo");
  const [citiesFbs, setCitiesFbs] = useState<CityFbs[]>([]);
  const [scheduleFbs, setScheduleFbs] = useState<ScheduleEntryFbs[]>([]);
  const [pricesFbs, setPricesFbs] = useState<PriceFbsEntry[]>([]);
  const [fbsCityId, setFbsCityId] = useState<number | null>(null);
  const [fbsDate, setFbsDate] = useState("");
  const [fbsPriceId, setFbsPriceId] = useState<number | null>(null);
  const [fbsQty, setFbsQty] = useState("");

  // Invoice creation modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemPayload[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const [searchOrg, setSearchOrg] = useState("");

  const filterStatus = (searchParams.get("status") as RequestStatus | "all") || "all";
  const filterCity = searchParams.get("city") || "all";
  const filterDate = searchParams.get("date") || "";
  const filterType = searchParams.get("type") || "all";
  const sortParam = searchParams.get("sort");
  const sortKey = isSortKey(sortParam) ? sortParam : "id";
  const sortDir = isSortDir(searchParams.get("dir")) ? searchParams.get("dir") : "desc";

  // Отфильтрованные и отсортированные организации
  const filteredOrganizations = useMemo(() => {
    // Создаем плоский список: каждая пара (организация, контакт)
    const flatList = counterparties.flatMap((cp) =>
      cp.contacts.map((contact) => ({
        counterparty: cp,
        contact,
        clientId: contact.client.id,
        displayName: cp.name,
        shortName: cp.shortName || "",
        contactName: contact.client.firstName ?? contact.client.username ?? contact.client.telegramId,
        searchText: `${cp.name} ${cp.shortName || ""} ${contact.client.firstName || ""} ${contact.client.username || ""} ${contact.client.telegramId}`.toLowerCase(),
      }))
    );

    // Фильтрация по поисковому запросу
    const filtered = orgSearch.trim()
      ? flatList.filter((item) => item.searchText.includes(orgSearch.toLowerCase().trim()))
      : flatList;

    // Сортировка по алфавиту (по полному имени организации)
    return filtered.sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));
  }, [counterparties, orgSearch]);

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
  const setFilterType = (v: string) => setParam("type", v);

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
    if (filterDate && !r.deliveryDate.startsWith(filterDate)) return false;
    if (filterType !== "all") {
      if (filterType === "fbs" && r.deliveryTypeId !== 1) return false;
      if (filterType === "fbo" && r.deliveryTypeId !== 2) return false;
    }
    if (searchOrg.trim()) {
      const q = searchOrg.trim().toLowerCase();
      const cp = (r.client as any)?.counterparties?.[0]?.counterparty;
      const orgName = (cp?.shortName ?? cp?.name ?? "").toLowerCase();
      const inn = (cp?.inn ?? "").toLowerCase();
      const clientName = `${r.client.firstName ?? ""} ${r.client.lastName ?? ""}`.trim().toLowerCase();
      const username = (r.client.username ?? "").toLowerCase();
      if (!orgName.includes(q) && !inn.includes(q) && !clientName.includes(q) && !username.includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterStatus, filterCity, filterDate, filterType]);

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

  const handleOpenInvoiceModal = () => {
    if (selectedIds.size === 0) return;

    // Получаем выбранные заявки
    const selectedRequests = requests.filter(r => selectedIds.has(r.id));
    
    // Проверяем, что все заявки от одной организации (counterparty).
    // Берём все counterparty ids клиента и ищем пересечение — если у всех заявок
    // есть хотя бы один общий контрагент, ошибки нет.
    const cpIdSets = selectedRequests.map(r => {
      const cps = (r.client as any)?.counterparties as { counterparty: { id: number } }[] | undefined;
      return new Set((cps ?? []).map(c => c.counterparty.id));
    });
    // Найдём пересечение всех наборов
    let intersection: Set<number> = cpIdSets[0] ?? new Set();
    for (let i = 1; i < cpIdSets.length; i++) {
      intersection = new Set([...intersection].filter(id => cpIdSets[i].has(id)));
    }
    if (intersection.size === 0 && cpIdSets.some(s => s.size > 0)) {
      alert("Выберите заявки от одной организации");
      return;
    }

    // Автозаполняем позиции счета из услуг заявок, группируя одинаковые услуги
    const itemMap = new Map<string, InvoiceItemPayload>();
    selectedRequests.forEach(req => {
      const services = (req as any).services as { description?: string; amount?: number; quantity?: number; price?: number; unit?: string }[] | undefined;
      if (services && services.length > 0) {
        services.forEach(service => {
          const desc = service.description || "Услуга";
          const price = service.price || 0;
          const key = `${desc}__${price}`;
          const existing = itemMap.get(key);
          if (existing) {
            existing.quantity = (existing.quantity || 0) + (service.quantity || 1);
            existing.amount = (existing.amount || 0) + (service.amount || 0);
          } else {
            itemMap.set(key, {
              description: desc,
              quantity: service.quantity || 1,
              unit: service.unit || "шт",
              price,
              amount: service.amount || 0,
            });
          }
        });
      }
    });
    const items: InvoiceItemPayload[] = [...itemMap.values()];

    // Генерируем номер счета
    const now = new Date();
    const invoiceNum = `СЧ-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    setInvoiceNumber(invoiceNum);
    setInvoiceItems(items);
    setShowInvoiceModal(true);
  };

  const handleCreateInvoice = async () => {
    if (selectedIds.size === 0 || creatingInvoice) return;
    if (!invoiceNumber.trim()) {
      alert("Введите номер счета");
      return;
    }
    if (invoiceItems.length === 0) {
      alert("Добавьте хотя бы одну позицию в счет");
      return;
    }

    const selectedRequests = requests.filter(r => selectedIds.has(r.id));
    // Ищем общий counterparty через пересечение всех наборов
    const cpIdSetsCreate = selectedRequests.map(r => {
      const cps = (r.client as any)?.counterparties as { counterparty: { id: number } }[] | undefined;
      return new Set((cps ?? []).map(c => c.counterparty.id));
    });
    let commonCpIds: Set<number> = cpIdSetsCreate[0] ?? new Set();
    for (let i = 1; i < cpIdSetsCreate.length; i++) {
      commonCpIds = new Set([...commonCpIds].filter(id => cpIdSetsCreate[i].has(id)));
    }
    const counterpartyId = commonCpIds.size > 0 ? [...commonCpIds][0] : undefined;

    if (!counterpartyId) {
      alert("Не найдена организация для клиентов. Убедитесь, что все клиенты привязаны к одной организации.");
      return;
    }

    setCreatingInvoice(true);
    try {
      await createInvoice({
        number: invoiceNumber,
        counterpartyId,
        requestIds: [...selectedIds],
        items: invoiceItems,
      });
      
      alert(`Счет ${invoiceNumber} успешно создан!`);
      setShowInvoiceModal(false);
      setSelectedIds(new Set());
      setInvoiceNumber("");
      setInvoiceItems([]);
    } catch (err) {
      console.error("Error creating invoice:", err);
      alert("Ошибка при создании счета");
    } finally {
      setCreatingInvoice(false);
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
      totalVolume: 0,
    };

    for (const r of filtered) {
      s.totalPlaces += r.boxCount;
      s.placesByPackaging[r.packagingType] += r.boxCount;
      const vol = getEffectiveVolume(r);
      if (vol != null) s.totalVolume += vol;

      if (r.weight == null) {
        s.missingWeightCount += 1;
        s.missingWeightPlaces += r.boxCount;
      } else {
        s.knownWeightKg += r.weight;
      }
    }

    s.knownWeightKg = Math.round(s.knownWeightKg * 100) / 100;
    s.totalVolume = Math.round(s.totalVolume * 1000) / 1000;
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
      case "isFbs":
        res = compareNum(a.deliveryTypeId ?? 0, b.deliveryTypeId ?? 0);
        break;
      case "mpDate":
        res = compareNum(new Date(a.mpAccountDate ?? "").getTime(), new Date(b.mpAccountDate ?? "").getTime());
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
      case "createdAt":
        res = compareNum(new Date(a.createdAt).getTime(), new Date(b.createdAt).getTime());
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

  const hasActiveFilters = filterStatus !== "all" || filterCity !== "all" || !!filterDate || filterType !== "all";

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

      <div className="flex flex-wrap items-center gap-6 mb-6">
        <div className="flex gap-1.5">
          {(["all", "fbs", "fbo"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg font-medium transition",
                filterType === t
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              )}
            >
              {t === "all" ? "Все" : t.toUpperCase()}
            </button>
          ))}
        </div>

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

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate("all")}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕ Дата
          </button>
        )}

        <input
          value={searchOrg}
          onChange={(e) => setSearchOrg(e.target.value)}
          placeholder="Поиск по организации, клиенту..."
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 placeholder:text-gray-400 min-w-[220px]"
        />

        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          Найдено: {sorted.length}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <button
            onClick={() => {
              getCounterparties().then(setCounterparties).catch(() => {});
              getCities().then(setCitiesList).catch(() => {});
              getCitiesFbs().then(setCitiesFbs).catch(() => {});
              getBoxTypes().then(setBoxTypes).catch(() => {});
              getPalletTypes().then(setPalletTypes).catch(() => {});
              getRates().then(setRates).catch(() => {});
              setNewReq({ clientId: "", cityId: "", deliveryDate: "", packagingType: "pallets", boxCount: "1", weight: "", comment: "", boxTypeId: "", palletTypeId: "" });
              setNewReqType("fbo");
              setFbsCityId(null);
              setFbsDate("");
              setFbsPriceId(null);
              setFbsQty("");
              setScheduleFbs([]);
              setPricesFbs([]);
              setOrgSearch("");
              setShowNewModal(true);
            }}
            className="px-3 py-1 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Новая
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

          {summary.totalVolume > 0 && (
            <div className="text-gray-600 dark:text-gray-300">
              <span className="text-gray-400 dark:font-medium">Объём FBS:</span>{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {summary.totalVolume.toLocaleString("ru-RU")} м³
              </span>
            </div>
          )}
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
            onClick={handleOpenInvoiceModal}
            className="px-4 py-1.5 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition"
          >
            📄 Создать счет
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
                  <button onClick={() => toggleSort("createdAt")} className="hover:text-gray-900 dark:hover:text-white">
                    Создана {sortIndicator("createdAt")}
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
                {/* weight column hidden */}
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("client")} className="hover:text-gray-900 dark:hover:text-white">
                    Организация {sortIndicator("client")}
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("isFbs")} className="hover:text-gray-900 dark:hover:text-white">
                    Тип поставки {sortIndicator("isFbs")}
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("mpDate")} className="hover:text-gray-900 dark:hover:text-white">
                    Дата МП ЛК {sortIndicator("mpDate")}
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                  <button onClick={() => toggleSort("total")} className="hover:text-gray-900 dark:hover:text-white">
                    Сумма {sortIndicator("total")}
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  Счёт
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
                    <div>{new Date(r.createdAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{new Date(r.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {formatDateRu(r.deliveryDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {(() => { const v = getEffectiveVolume(r); return v != null ? v : "—"; })()}
                  </td>
                  {/* weight cell hidden */}
                  <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`/admin/clients/${r.client.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/admin/clients/${r.client.id}`;
                      }}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      {r.client.counterparties?.[0]?.counterparty?.shortName || r.client.counterparties?.[0]?.counterparty?.name || `${r.client.firstName ?? ""} ${r.client.lastName ?? ""}`.trim() || `#${r.client.id}`}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {r.deliveryType?.name || "—"}
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    r.mpAccountDate && r.deliveryDate &&
                    r.mpAccountDate.slice(0, 10) !== r.deliveryDate.slice(0, 10)
                      ? "text-red-600 dark:text-red-400 font-medium"
                      : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {r.mpAccountDate ? new Date(r.mpAccountDate).toLocaleDateString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                    {(() => {
                      const total = getRequestTotal(r);
                      return total == null ? "-" : `${total.toLocaleString("ru-RU")} ₽`;
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const inv = r.invoices;
                      if (!inv || inv.length === 0) return <span className="text-xs text-gray-400">—</span>;
                      const allPaid = inv.every((i) => i.isPaid || i.status === "paid");
                      const anyPaid = inv.some((i) => i.isPaid || i.status === "paid");
                      const anyAwaiting = inv.some((i) => i.status === "awaiting_payment");
                      if (allPaid) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Оплачен</span>;
                      if (anyPaid) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Частично</span>;
                      if (anyAwaiting) return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Ожидает оплаты</span>;
                      return <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Выставлен</span>;
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

      {showNewModal && (() => {
        const selectedFbsCity = citiesFbs.find((c) => c.id === fbsCityId);
        const selectedFbsPrice = pricesFbs.find((p) => p.id === fbsPriceId);
        const fbsAmount = (() => {
          if (!selectedFbsPrice || !fbsQty || Number(fbsQty) <= 0) return 0;
          const priceNum = parseFloat(selectedFbsPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          const volNum = parseFloat(selectedFbsPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
          // Calculate price per 1 m³, then multiply by ordered quantity
          const pricePerM3 = priceNum / volNum;
          return Math.round(pricePerM3 * Number(fbsQty) * 100) / 100;
        })();
        const canCreateFbs = !!newReq.clientId && !!fbsCityId && !!fbsDate && !!fbsPriceId && !!fbsQty && Number(fbsQty) > 0;

        // Calculate FBO price based on selected city, size and quantity
        const fboRate = (() => {
          if (!newReq.cityId || !newReq.boxCount || Number(newReq.boxCount) <= 0) return null;
          const cityId = Number(newReq.cityId);
          const boxCount = Number(newReq.boxCount);
          
          if (newReq.packagingType === "boxes" && newReq.boxTypeId) {
            const boxTypeId = Number(newReq.boxTypeId);
            return rates.find(r => r.cityId === cityId && r.unit === "boxes" && r.boxTypeId === boxTypeId);
          } else if (newReq.packagingType === "pallets" && newReq.palletTypeId) {
            const palletTypeId = Number(newReq.palletTypeId);
            return rates.find(r => r.cityId === cityId && r.unit === "pallet" && r.palletTypeId === palletTypeId);
          }
          return null;
        })();
        
        const fboAmount = fboRate && newReq.boxCount ? fboRate.price * Number(newReq.boxCount) : 0;
        const canCreateFbo = !!newReq.clientId && !!newReq.cityId && !!newReq.deliveryDate && !!newReq.boxCount && (
          (newReq.packagingType === "boxes" && !!newReq.boxTypeId) ||
          (newReq.packagingType === "pallets" && !!newReq.palletTypeId)
        );

        return (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowNewModal(false); setOrgSearch(""); } }}
        >
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
            {/* Step 1: Delivery type toggle */}
            <div className="mb-4">
              <div className="flex gap-2">
                {(["fbo", "fbs"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setNewReqType(t)} className={cn("flex-1 px-3 py-2 text-sm rounded-lg font-medium transition", newReqType === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {newReqType === "fbo" ? (
              /* ──── FBO FORM ──── */
              <>
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {!newReq.clientId ? "Выберите организацию" :
                     !newReq.cityId ? "Выберите направление" :
                     !newReq.deliveryDate ? "Выберите дату доставки" :
                     !newReq.boxCount ? "Укажите количество мест" :
                     "Проверьте данные и создайте заявку"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Организация</label>
                    <input
                      type="text"
                      placeholder="Поиск организации..."
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 mb-2"
                    />
                    <select value={newReq.clientId} onChange={(e) => setNewReq({ ...newReq, clientId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <option value="">Выберите организацию</option>
                      {filteredOrganizations.map((item) => (
                        <option key={item.clientId} value={item.clientId}>
                          {item.shortName || item.displayName} — {item.contactName}
                        </option>
                      ))}
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
                    <div className="flex gap-2">
                      {(["pallets", "boxes"] as PackagingType[]).map((p) => (
                        <button key={p} type="button" onClick={() => setNewReq({ ...newReq, packagingType: p, boxTypeId: "", palletTypeId: "" })} className={cn("flex-1 px-3 py-2 text-sm rounded-lg font-medium transition", newReq.packagingType === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                          {p === "pallets" ? "Палеты" : "Коробки"}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newReq.packagingType === "boxes" && boxTypes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Размер коробки</label>
                      <select value={newReq.boxTypeId} onChange={(e) => setNewReq({ ...newReq, boxTypeId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                        <option value="">Выберите размер</option>
                        {boxTypes.map((bt) => (
                          <option key={bt.id} value={bt.id}>
                            {bt.name} {bt.hint ? `(${bt.hint})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newReq.packagingType === "pallets" && palletTypes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Размер палеты</label>
                      <select value={newReq.palletTypeId} onChange={(e) => setNewReq({ ...newReq, palletTypeId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                        <option value="">Выберите размер</option>
                        {palletTypes.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.name} {pt.comment ? `(${pt.comment})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
                  {fboAmount > 0 && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Стоимость доставки:</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{fboAmount.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      {fboRate && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {fboRate.price.toLocaleString("ru-RU")} ₽ × {newReq.boxCount} {newReq.packagingType === "pallets" ? "палет" : "мест"}
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Комментарий</label>
                    <textarea value={newReq.comment} onChange={(e) => setNewReq({ ...newReq, comment: e.target.value })} rows={2} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 resize-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => { setShowNewModal(false); setOrgSearch(""); }} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">Отмена</button>
                  {canCreateFbo && (
                    <button
                      disabled={creating}
                      onClick={async () => {
                      setCreating(true);
                      try {
                        const selectedCity = citiesList.find(c => c.id === Number(newReq.cityId));
                        const selectedSize = newReq.packagingType === "boxes" 
                          ? boxTypes.find(bt => bt.id === Number(newReq.boxTypeId))
                          : palletTypes.find(pt => pt.id === Number(newReq.palletTypeId));
                        
                        await createAdminRequest({
                          clientId: Number(newReq.clientId),
                          cityId: Number(newReq.cityId),
                          deliveryDate: new Date(newReq.deliveryDate).toISOString(),
                          packagingType: newReq.packagingType,
                          boxCount: Number(newReq.boxCount),
                          deliveryTypeId: 2,
                          ...(newReq.packagingType === "boxes" && newReq.boxTypeId ? { boxTypeId: Number(newReq.boxTypeId) } : {}),
                          ...(newReq.weight ? { weight: Number(newReq.weight) } : {}),
                          ...(newReq.comment ? { comment: newReq.comment } : {}),
                          ...(fboRate && fboAmount > 0 ? {
                            items: [{
                              description: `${selectedCity?.shortName || "Доставка"} - ${selectedSize?.name || ""}`,
                              unit: newReq.packagingType === "pallets" ? "палета" : "место",
                              quantity: Number(newReq.boxCount),
                              price: fboRate.price,
                              amount: fboAmount,
                            }]
                          } : {}),
                        });
                        setShowNewModal(false);
                        const data = await getRequests();
                        setRequests(data);
                      } catch (err) { 
                        console.error("FBO request creation error:", err);
                        alert("Ошибка при создании заявки: " + (err instanceof Error ? err.message : String(err))); 
                      }
                      finally { setCreating(false); }
                    }}
                      className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {creating ? "Создание..." : "Создать"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              /* ──── FBS FORM ──── */
              <>
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {!newReq.clientId ? "Выберите организацию" :
                     !fbsCityId ? "Выберите направление ФБС" :
                     !fbsDate ? "Выберите дату доставки" :
                     !fbsPriceId ? "Выберите объём товара" :
                     !fbsQty || Number(fbsQty) <= 0 ? "Укажите количество м³" :
                     "Проверьте данные и создайте заявку"}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Организация</label>
                    <input
                      type="text"
                      placeholder="Поиск организации..."
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 mb-2"
                    />
                    <select value={newReq.clientId} onChange={(e) => setNewReq({ ...newReq, clientId: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200">
                      <option value="">Выберите организацию</option>
                      {filteredOrganizations.map((item) => (
                        <option key={item.clientId} value={item.clientId}>
                          {item.shortName || item.displayName} — {item.contactName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Направление ФБС</label>
                    <select
                      value={fbsCityId ?? ""}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null;
                        setFbsCityId(id);
                        setFbsDate("");
                        setFbsPriceId(null);
                        setFbsQty("");
                        setScheduleFbs([]);
                        setPricesFbs([]);
                        if (id) {
                          const city = citiesFbs.find((c) => c.id === id);
                          getAdminScheduleFbs().then((all) => {
                            setScheduleFbs(all.filter((s) => s.destination === (city?.shortName ?? "")));
                          }).catch(() => setScheduleFbs([]));
                          if (city) {
                            getPriceFbs().then((all) => {
                              const filtered = all.filter((p) => p.destination === city.shortName);
                              setPricesFbs(filtered);
                              if (filtered.length > 0) setFbsPriceId(filtered[0].id);
                            }).catch(() => setPricesFbs([]));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                    >
                      <option value="">Выберите направление</option>
                      {citiesFbs.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
                    </select>
                  </div>
                  {fbsCityId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Дата доставки (расписание ФБС)</label>
                      <select
                        value={fbsDate}
                        onChange={(e) => { setFbsDate(e.target.value); setFbsQty(""); }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      >
                        <option value="">Выберите дату</option>
                        {scheduleFbs.map((s) => (
                          <option key={s.id} value={s.deliveryDate}>
                            {new Date(s.deliveryDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {fbsDate && pricesFbs.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Объём товара</label>
                      <select
                        value={fbsPriceId ?? ""}
                        onChange={(e) => setFbsPriceId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      >
                        {pricesFbs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.volume} — {p.price}{p.comment ? ` (${p.comment})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {fbsDate && fbsPriceId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Количество м³</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={fbsQty}
                        onChange={(e) => setFbsQty(e.target.value)}
                        placeholder="Укажите объём"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                      />
                    </div>
                  )}
                  {fbsQty && Number(fbsQty) > 0 && selectedFbsPrice && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Сумма: </label>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{fbsAmount.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-5">
                  <button onClick={() => { setShowNewModal(false); setOrgSearch(""); }} className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200">Отмена</button>
                  <button
                    disabled={creating || !canCreateFbs}
                    onClick={async () => {
                      if (!canCreateFbs || !selectedFbsCity || !selectedFbsPrice) return;
                      setCreating(true);
                      try {
                        const priceNum = parseFloat(selectedFbsPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
                        const volNum = parseFloat(selectedFbsPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
                        const pricePerM3 = priceNum / volNum;
                        await createAdminRequest({
                          clientId: Number(newReq.clientId),
                          cityId: fbsCityId!,
                          deliveryDate: new Date(fbsDate).toISOString(),
                          packagingType: "boxes",
                          boxCount: 1,
                          volume: Number(fbsQty),
                          deliveryTypeId: 1,
                          items: [{
                            description: `${selectedFbsCity.fullName}`,
                            unit: "м³",
                            quantity: Number(fbsQty),
                            price: pricePerM3,
                            amount: fbsAmount,
                          }],
                        });
                        setShowNewModal(false);
                        const data = await getRequests();
                        setRequests(data);
                      } catch (err) { 
                        console.error("FBS request creation error:", err);
                        alert("Ошибка при создании заявки: " + (err instanceof Error ? err.message : String(err))); 
                      }
                      finally { setCreating(false); }
                    }}
                    className="px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {creating ? "Создание..." : "Создать"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        );
      })()}

      {showInvoiceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowInvoiceModal(false); }}
        >
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Создать счет</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Номер счета
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
                placeholder="СЧ-2026-01-01-1234"
              />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Позиции счета
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Выбрано заявок: {selectedIds.size}
                </span>
              </div>
              
              {invoiceItems.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  Нет позиций. Добавьте услуги в заявки или добавьте позиции вручную.
                </div>
              ) : (
                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.quantity} {item.unit} × {item.price} ₽ = {item.amount} ₽
                        </div>
                      </div>
                      <button
                        onClick={() => setInvoiceItems(items => items.filter((_, i) => i !== idx))}
                        className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 text-right">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Итого: {invoiceItems.reduce((sum, item) => sum + item.amount, 0).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creatingInvoice || !invoiceNumber.trim() || invoiceItems.length === 0}
                className="px-4 py-2 text-sm rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
              >
                {creatingInvoice ? "Создание..." : "Создать счет"}
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
              <RequestDetail embedded requestId={selectedRequestId} onArchived={() => { setSelectedRequestId(null); getRequests().then(setRequests); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
