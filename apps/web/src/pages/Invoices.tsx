import { useEffect, useMemo, useState } from "react";
import { deleteInvoice, getInvoices, sendInvoicePdf, sendActPdf, sendInvoicePaymentLink, getInvoicePdfUrlById, getActPdfUrlById, getToken, setInvoicePaymentStatus, checkInvoicePayment, type Invoice } from "../api";
import { cn } from "../lib/utils";

function formatDateRu(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function getInvoiceTotal(inv: Invoice) {
  if (!inv.items || inv.items.length === 0) return 0;
  return inv.items.reduce((s, it) => s + (Number(it.amount) || 0), 0);
}

type SortKey = "id" | "number" | "date" | "counterparty" | "total" | "status";

type SortDir = "asc" | "desc";

const statusLabels: Record<string, string> = {
  new: "Новый",
  sent: "Отправлен",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачен",
  cancelled: "Отменён",
};

const statusColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  awaiting_payment: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const [paidToggling, setPaidToggling] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState<number | null>(null);

  const [filterCounterparty, setFilterCounterparty] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
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
    let list = invoices;
    const q = filterCounterparty.trim().toLowerCase();
    if (q) {
      list = list.filter((inv) => {
        const name = (inv.counterparty?.shortName || inv.counterparty?.name || "").toLowerCase();
        return name.includes(q) || (inv.counterparty?.inn || "").includes(q);
      });
    }
    if (filterStatus) {
      list = list.filter((inv) => inv.status === filterStatus);
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      list = list.filter((inv) => new Date(inv.date) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((inv) => new Date(inv.date) <= to);
    }
    return list;
  }, [invoices, filterCounterparty, filterStatus, filterDateFrom, filterDateTo]);

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
        case "total":
          res = compareNum(getInvoiceTotal(a), getInvoiceTotal(b));
          break;
        case "status":
          res = compareStr(a.status || "", b.status || "");
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

  const handleDownloadPdf = async (inv: Invoice) => {
    if (downloadingId !== null) return;
    setDownloadingId(inv.id);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Нет токена авторизации. Перезайдите в админку.");
        return;
      }

      const apiUrl = (import.meta as any).env?.VITE_API_URL || "https://test.ved31.ru/api";
      const res = await fetch(`${apiUrl}/admin/invoices/${inv.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Счет_${inv.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Ошибка при скачивании PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Счета/Акты</h1>
        <span className="text-xs text-gray-400 dark:text-gray-500">Найдено: {sorted.length}</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={filterCounterparty}
          onChange={(e) => setFilterCounterparty(e.target.value)}
          placeholder="Фильтр: организация / ИНН"
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        >
          <option value="">Все статусы</option>
          <option value="new">Новый</option>
          <option value="sent">Отправлен</option>
          <option value="awaiting_payment">Ожидает оплаты</option>
          <option value="paid">Оплачен</option>
          <option value="cancelled">Отменён</option>
        </select>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">с</span>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">по</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
          />
          {(filterDateFrom || filterDateTo) && (
            <button
              onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>
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
                  Заявки
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
                <th className="text-center px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Действия</th>
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
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col gap-1">
                        <span>{cpName}</span>
                        {inv.counterparty?.preferredPayment && (() => {
                          const payLabels: Record<string, string> = { qr: "QR", link: "Ссылка", invoice_act: "Счёт и Акт", edo: "ЭДО" };
                          const payColors: Record<string, string> = {
                            qr: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
                            link: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                            invoice_act: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                            edo: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
                            other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
                          };
                          const parts = inv.counterparty.preferredPayment.split(",").map(s => s.trim()).filter(Boolean);
                          return (
                            <div className="flex flex-wrap gap-1">
                              {parts.map(m => {
                                const isOther = m.startsWith("other:");
                                const key = isOther ? "other" : m;
                                const label = isOther ? `Др.: ${m.slice(6) || "…"}` : (payLabels[m] ?? m);
                                return (
                                  <span key={m} className={`inline-block px-1.5 py-0.5 rounded-full text-[11px] font-medium ${payColors[key] ?? "bg-gray-100 text-gray-600"}`}>
                                    {label}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {inv.requests && inv.requests.length > 0 
                        ? inv.requests.map(ir => `#${ir.request.id}`).join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {total.toLocaleString("ru-RU")} ₽
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                          statusColors[inv.status || "new"] || statusColors.new
                        )}>
                          {statusLabels[inv.status || "new"] || inv.status}
                        </span>
                        {inv.isPaid && inv.paidAt && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500">
                            {formatDateRu(inv.paidAt)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(inv)}
                          disabled={downloadingId === inv.id}
                          className="px-2 py-1 text-xs rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                        >
                          {downloadingId === inv.id ? "..." : "Счёт PDF"}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === inv.id}
                          onClick={async () => {
                            if (actionId) return;
                            setActionId(inv.id);
                            try {
                              const token = getToken();
                              if (!token) throw new Error("Not authenticated");
                              const url = getActPdfUrlById(inv.id);
                              const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                              if (!res.ok) throw new Error(`HTTP ${res.status}`);
                              const blob = await res.blob();
                              const objectUrl = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = objectUrl;
                              a.download = `Акт_${inv.number}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(objectUrl);
                            } catch { alert("Ошибка скачивания акта"); }
                            finally { setActionId(null); }
                          }}
                          className="px-2 py-1 text-xs rounded-lg font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 transition"
                        >
                          Акт PDF
                        </button>
                        {inv.status !== "paid" && inv.status !== "cancelled" && (
                          <button
                            type="button"
                            disabled={actionId === inv.id}
                            onClick={async () => {
                              if (actionId) return;
                              
                              // Ищем telegramId через заявку или через контакты контрагента
                              let telegramId: string | null = null;
                              
                              // Сначала пробуем через заявку
                              const client = inv.requests?.[0]?.request?.client;
                              telegramId = (client as any)?.telegramId;
                              
                              // Если не нашли через заявку, ищем через контакты контрагента
                              if (!telegramId && inv.counterparty?.contacts) {
                                const contact = inv.counterparty.contacts[0];
                                telegramId = (contact as any)?.client?.telegramId;
                              }
                              
                              if (!telegramId) {
                                alert("Не найден Telegram ID клиента. Привяжите заявку к счету или добавьте контакт контрагента.");
                                return;
                              }
                              
                              setActionId(inv.id);
                              try {
                                // Отправляем и счёт и акт
                                await sendInvoicePdf(inv.id, telegramId);
                                await sendActPdf(inv.id, telegramId);
                                alert("Счёт и акт отправлены клиенту!");
                                await reload();
                              } catch (err) { 
                                alert("Ошибка отправки: " + (err instanceof Error ? err.message : String(err))); 
                              }
                              finally { setActionId(null); }
                            }}
                            className="px-2 py-1 text-xs rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                          >
                            Отправить счёт
                          </button>
                        )}
                        {inv.status !== "paid" && inv.status !== "cancelled" && (
                          <button
                            type="button"
                            disabled={actionId === inv.id}
                            onClick={async () => {
                              if (actionId) return;
                              setActionId(inv.id);
                              try {
                                await sendInvoicePaymentLink(inv.id);
                                alert("Ссылка на оплату отправлена клиенту!");
                                await reload();
                              } catch (err) { alert(err instanceof Error ? err.message : "Ошибка отправки ссылки"); }
                              finally { setActionId(null); }
                            }}
                            className="px-2 py-1 text-xs rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                          >
                            QR/Оплата
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={paidToggling === inv.id}
                          onClick={async () => {
                            if (paidToggling) return;
                            setPaidToggling(inv.id);
                            try {
                              await setInvoicePaymentStatus(inv.id, !inv.isPaid);
                              await reload();
                            } catch { alert("Ошибка при изменении статуса оплаты"); }
                            finally { setPaidToggling(null); }
                          }}
                          className={`px-2 py-1 text-xs rounded-lg font-medium border transition disabled:opacity-50 ${
                            inv.isPaid
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700"
                              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {paidToggling === inv.id ? "..." : inv.isPaid ? "✓ Оплачен" : "Отметить оплаченным"}
                        </button>
                        {inv.tbankPaymentId && inv.status !== "paid" && (
                          <button
                            type="button"
                            disabled={checkingPayment === inv.id}
                            onClick={async () => {
                              if (checkingPayment) return;
                              setCheckingPayment(inv.id);
                              try {
                                const result = await checkInvoicePayment(inv.id);
                                alert(result.message);
                                if (result.checked && result.status === "CONFIRMED") {
                                  await reload();
                                }
                              } catch (err) {
                                alert(err instanceof Error ? err.message : "Ошибка проверки");
                              } finally {
                                setCheckingPayment(null);
                              }
                            }}
                            className="px-2 py-1 text-xs rounded-lg font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition"
                          >
                            {checkingPayment === inv.id ? "..." : "Проверить оплату"}
                          </button>
                        )}
                        {(() => {
                          const hasDone = inv.requests?.some(ir => ir.request?.status === "done");
                          return (
                            <button
                              onClick={() => handleDelete(inv.id)}
                              disabled={deletingId === inv.id || inv.isPaid || !!hasDone}
                              title={hasDone ? "Нельзя удалить: заявка выполнена" : undefined}
                              className="px-2 py-1 text-xs rounded-lg font-medium bg-red-600/[0.46] text-white hover:bg-red-700/[0.46] disabled:opacity-50 transition"
                            >
                              {deletingId === inv.id ? "..." : "Удалить"}
                            </button>
                          );
                        })()}
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
