import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getCounterpartyFinanceSummary,
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

export default function Reconciliation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CounterpartyFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    getCounterpartyFinanceSummary(Number(id))
      .then(setSummary)
      .catch((e) => setError(e?.message || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id]);

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

    // Calculate running balance (positive = they owe us)
    let balance = 0;
    return entries.map((e) => {
      balance += e.debit - e.credit;
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
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400 mb-2 inline-block"
          >
            ← Назад
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Сверка — {cp.shortName || cp.name}
          </h1>
          {cp.inn && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">ИНН: {cp.inn}</div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Выставлено</div>
          <div className="text-xl font-bold text-gray-900 dark:text-gray-200">{fmtMoney(bal.totalBilled)} ₽</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Оплачено</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">{fmtMoney(bal.totalPaid)} ₽</div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
            {bal.balance > 0 ? "Долг контрагента" : bal.balance < 0 ? "Переплата" : "Баланс"}
          </div>
          <div className={`text-xl font-bold ${
            bal.balance > 0
              ? "text-red-600 dark:text-red-400"
              : bal.balance < 0
              ? "text-green-600 dark:text-green-400"
              : "text-gray-500"
          }`}>
            {fmtMoney(Math.abs(bal.balance))} ₽
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
                  <th className="px-4 py-2.5 text-right">Сальдо</th>
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
                        <span className="font-medium text-gray-900 dark:text-gray-200">
                          {fmtMoney(entry.debit)} ₽
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {entry.credit > 0 ? (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {fmtMoney(entry.credit)} ₽
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className={`px-4 py-2.5 text-right whitespace-nowrap font-semibold ${
                      entry.runningBalance > 0
                        ? "text-red-600 dark:text-red-400"
                        : entry.runningBalance < 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500"
                    }`}>
                      {fmtMoney(entry.runningBalance)} ₽
                    </td>
                  </tr>
                ))}

                {/* Total row */}
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    <span className="text-gray-700 dark:text-gray-300">Итого</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-200">
                    {fmtMoney(ledger.reduce((s, e) => s + e.debit, 0))} ₽
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                    {fmtMoney(ledger.reduce((s, e) => s + e.credit, 0))} ₽
                  </td>
                  <td className={`px-4 py-3 text-right ${
                    (ledger[ledger.length - 1]?.runningBalance ?? 0) > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}>
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
