import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCounterpartyFinanceSummary,
  downloadReconciliationPdf,
  deleteManualPayment,
  type CounterpartyFinanceSummary,
  type Invoice,
  type BankTransaction,
} from "../api";

type LedgerEntry = {
  date: string;
  type: "invoice" | "payment";
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  invoiceNumber?: string;
  isPaid?: boolean;
  sourceId: number;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function fmtMoney(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentYear() {
  return new Date().getFullYear();
}

export default function Reconciliation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CounterpartyFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState(`${currentYear()}-01-01`);
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null); // TODO: TEMPORARY

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    getCounterpartyFinanceSummary(Number(id), dateFrom, dateTo)
      .then(setSummary)
      .catch((e) => setError(e?.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id, dateFrom, dateTo]);

  async function handleDownloadPdf() {
    if (!id) return;
    setPdfLoading(true);
    try {
      await downloadReconciliationPdf(Number(id), dateFrom, dateTo);
    } catch (e: any) {
      alert(e?.message || "Ошибка генерации PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  const ledger = useMemo<LedgerEntry[]>(() => {
    if (!summary) return [];

    const entries: Omit<LedgerEntry, "runningBalance">[] = [];

    // Invoices → debits (we billed them)
    for (const inv of summary.invoices) {
      const total = inv.items.reduce((s, it) => s + it.amount, 0);
      const descriptions = inv.items.map(
        (it) => `${it.description} (${it.quantity} ${it.unit} × ${fmtMoney(it.price)} ₽)`
      );
      entries.push({
        date: inv.date,
        type: "invoice",
        description: `Счёт №${inv.number}: ${descriptions.join("; ")}`,
        debit: total,
        credit: 0,
        invoiceNumber: inv.number,
        isPaid: inv.isPaid,
        sourceId: inv.id,
      });
    }

    // Payments → credits (they paid us)
    for (const p of summary.payments) {
      entries.push({
        date: p.documentDate,
        type: "payment",
        description: p.purpose,
        debit: 0,
        credit: p.amount,
        sourceId: p.id,
      });
    }

    // Sort chronologically
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance: payment (+), invoice (−)
    let balance = 0;
    return entries.map((e) => {
      balance += e.credit - e.debit;
      return { ...e, runningBalance: balance };
    });
  }, [summary]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline text-sm">
          Назад
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const cp = summary.counterparty;
  const bal = summary.balance;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400 mb-2 inline-block"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Акт сверки — {cp.shortName || cp.name}
          </h1>
          {cp.inn && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ИНН: {cp.inn}</div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400">С:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <label className="text-sm text-gray-500 dark:text-gray-400">По:</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
          >
            {pdfLoading ? "Генерация..." : "⬇ Скачать PDF"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Выставлено</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{fmtMoney(bal.totalBilled)} ₽</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Оплачено</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{fmtMoney(bal.totalPaid)} ₽</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
            {"Итог"}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {fmtMoney(bal.totalPaid - bal.totalBilled)} ₽
          </div>
        </div>
      </div>

      {/* Ledger table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-medium text-gray-900 dark:text-white">
            Хронология операций ({ledger.length})
          </h2>
        </div>

        {ledger.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Нет операций по данной организации
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-4 py-2.5">Дата</th>
                  <th className="px-4 py-2.5">Тип</th>
                  <th className="px-4 py-2.5">Описание</th>
                  <th className="px-4 py-2.5 text-right">Начислено</th>
                  <th className="px-4 py-2.5 text-right">Оплата</th>
                  <th className="px-4 py-2.5 text-right">Итог</th>
                  {/* TODO: TEMPORARY - Remove after manual payment cleanup */}
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry, i) => (
                  <tr
                    key={`${entry.type}-${entry.sourceId}`}
                    className={`border-t border-gray-100 dark:border-gray-700/50 ${
                      entry.type === "payment"
                        ? "bg-green-50/50 dark:bg-green-900/10"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {fmtDate(entry.date)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {entry.type === "invoice" ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-blue-700 dark:text-blue-400 text-xs font-medium">Счёт</span>
                          {entry.isPaid !== undefined && (
                            entry.isPaid ? (
                              <span className="ml-1 text-green-600 dark:text-green-400 text-xs">(оплачен)</span>
                            ) : (
                              <span className="ml-1 text-yellow-600 dark:text-yellow-400 text-xs">(не оплачен)</span>
                            )
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-green-700 dark:text-green-400 text-xs font-medium">Оплата</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 max-w-[400px]">
                      <div className="truncate" title={entry.description}>
                        {entry.description}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {entry.debit > 0 ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                          −{fmtMoney(entry.debit)} ₽
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {entry.credit > 0 ? (
                        <span className="font-medium text-gray-900 dark:text-white">
                          +{fmtMoney(entry.credit)} ₽
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                      {fmtMoney(entry.runningBalance)} ₽
                    </td>
                    {/* TODO: TEMPORARY - Remove after manual payment cleanup */}
                    {entry.type === "payment" && entry.description.includes("(ручная отметка)") && (
                      <td className="px-2 py-2.5">
                        <button
                          onClick={async () => {
                            if (!confirm("Удалить эту ручную оплату? Статус счёта будет сброшен.")) return;
                            setDeletingId(entry.sourceId);
                            try {
                              await deleteManualPayment(entry.sourceId);
                              // Перезагружаем данные
                              if (id) {
                                const data = await getCounterpartyFinanceSummary(Number(id), dateFrom, dateTo);
                                setSummary(data);
                              }
                            } catch (e: any) {
                              alert(e?.message || "Ошибка при удалении");
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          disabled={deletingId === entry.sourceId}
                          className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          title="Удалить ручную оплату"
                        >
                          {deletingId === entry.sourceId ? "..." : "×"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Total row */}
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td className="px-4 py-3" colSpan={4}>
                    <span className="text-gray-700 dark:text-gray-300">Итого</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    −{fmtMoney(ledger.reduce((s, e) => s + e.debit, 0))} ₽
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    +{fmtMoney(ledger.reduce((s, e) => s + e.credit, 0))} ₽
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-bold">
                    {fmtMoney(ledger[ledger.length - 1]?.runningBalance ?? 0)} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
