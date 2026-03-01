import { useEffect, useMemo, useState } from "react";
import { deleteInvoice, getInvoicePdfUrlById, getInvoices, type Invoice } from "../api";
import { cn } from "../lib/utils";

function formatDateRu(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function getInvoiceTotal(inv: Invoice) {
  if (!inv.items || inv.items.length === 0) return 0;
  return inv.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

type SortKey = "id" | "number" | "date" | "counterparty" | "request" | "total";

type SortDir = "asc" | "desc";

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [filterCounterparty, setFilterCounterparty] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const reload = async () => {
    const data = await getInvoices();
    setInvoices(data);
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        await reload();
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filterCounterparty.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const name = (inv.counterparty?.shortName || inv.counterparty?.name || "").toLowerCase();
      return name.includes(q) || (inv.counterparty?.inn || "").includes(q);
    });
  }, [invoices, filterCounterparty]);

  const sorted = useMemo(() => {
    const dirFactor = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];

    const compareStr = (a: string, b: string) => a.localeCompare(b, "ru");
    const compareNum = (a: number, b: number) => (a === b ? 0 : a > b ? 1 : -1);

    list.sort((a, b) => {
      let res = 0;

      switch (sortKey) {
        case "id":
          res = compareNum(a.id, b.id);
          break;
        case "number":
          res = compareStr(a.number, b.number);
          break;
        case "date":
          res = compareNum(new Date(a.date).getTime(), new Date(b.date).getTime());
          break;
        case "counterparty": {
          const an = a.counterparty?.shortName || a.counterparty?.name || "";
          const bn = b.counterparty?.shortName || b.counterparty?.name || "";
          res = compareStr(an, bn);
          break;
        }
        case "request":
          res = compareNum(a.requestId ?? -1, b.requestId ?? -1);
          break;
        case "total":
          res = compareNum(getInvoiceTotal(a), getInvoiceTotal(b));
          break;
      }

      if (res !== 0) return res * dirFactor;
      return (a.id - b.id) * dirFactor;
    });

    return list;
  }, [filtered, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? "▲" : "▼";
  };

  const handleDelete = async (id: number) => {
    if (deletingId !== null) return;
    if (!confirm("Удалить счёт?")) return;

    setDeletingId(id);
    try {
      await deleteInvoice(id);
      await reload();
    } catch {
      alert("Ошибка при удалении счёта");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Счета</h1>
        <span className="text-xs text-gray-400 dark:text-gray-500">Найдено: {sorted.length}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={filterCounterparty}
          onChange={(e) => setFilterCounterparty(e.target.value)}
          placeholder="Фильтр: организация / ИНН"
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">Счетов нет</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("number")} className="hover:text-gray-900 dark:hover:text-white">
                    № {sortIndicator("number")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("date")} className="hover:text-gray-900 dark:hover:text-white">
                    Дата {sortIndicator("date")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("counterparty")} className="hover:text-gray-900 dark:hover:text-white">
                    Организация {sortIndicator("counterparty")}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">
                  <button onClick={() => toggleSort("request")} className="hover:text-gray-900 dark:hover:text-white">
                    Заявка {sortIndicator("request")}
                  </button>
                </th>
                <th className="text-right px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400">
                  <button onClick={() => toggleSort("total")} className="hover:text-gray-900 dark:hover:text-white">
                    Сумма {sortIndicator("total")}
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Акт</th>
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Оплата</th>
                <th className="text-right px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((inv) => {
                const total = getInvoiceTotal(inv);
                const cpName = inv.counterparty?.shortName || inv.counterparty?.name || "—";

                return (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">{inv.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDateRu(inv.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{cpName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{inv.requestId ? `#${inv.requestId}` : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {total.toLocaleString("ru-RU")} ₽
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      )}>
                        Нет
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        Не оплачен
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={getInvoicePdfUrlById(inv.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition"
                        >
                          PDF
                        </a>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="px-3 py-1.5 text-xs rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {deletingId === inv.id ? "Удаление..." : "Удалить"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
