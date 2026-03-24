import { useState, useEffect, useCallback, useMemo } from "react";
import {
  importBankStatement,
  getFinanceTransactions,
  getFinanceBalances,
  getFinanceImportHistory,
  matchBankTransaction,
  ignoreBankTransaction,
  getCounterparties,
  type BankTransaction,
  type CounterpartyBalance,
  type BankImportBatch,
  type BankImportResult,
  type Counterparty,
} from "../api";

type Tab = "transactions" | "balances" | "import";

const statusLabels: Record<string, string> = {
  new: "Новый",
  matched: "Привязан",
  unmatched: "Не привязан",
  ignored: "Игнорирован",
};

const statusColors: Record<string, string> = {
  matched: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  unmatched: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ignored: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU");
}

function fmtMoney(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
}

export default function Finance() {
  const [tab, setTab] = useState<Tab>("transactions");

  // Transactions tab
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txFilter, setTxFilter] = useState<string>("all");

  // Balances tab
  const [balances, setBalances] = useState<CounterpartyBalance[]>([]);
  const [balLoading, setBalLoading] = useState(false);

  // Import tab
  const [importHistory, setImportHistory] = useState<BankImportBatch[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<BankImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Match modal
  const [matchingTx, setMatchingTx] = useState<BankTransaction | null>(null);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [cpSearch, setCpSearch] = useState("");
  const [matchSaving, setMatchSaving] = useState(false);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const filters = txFilter !== "all" ? { status: txFilter } : undefined;
      setTransactions(await getFinanceTransactions(filters));
    } catch { /* ignore */ }
    setTxLoading(false);
  }, [txFilter]);

  const loadBalances = useCallback(async () => {
    setBalLoading(true);
    try {
      setBalances(await getFinanceBalances());
    } catch { /* ignore */ }
    setBalLoading(false);
  }, []);

  const loadImportHistory = useCallback(async () => {
    setImportLoading(true);
    try {
      setImportHistory(await getFinanceImportHistory());
    } catch { /* ignore */ }
    setImportLoading(false);
  }, []);

  useEffect(() => {
    if (tab === "transactions") loadTransactions();
    else if (tab === "balances") loadBalances();
    else if (tab === "import") loadImportHistory();
  }, [tab, loadTransactions, loadBalances, loadImportHistory]);

  // File upload handler
  const handleFile = useCallback(async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const result = await importBankStatement(text, file.name);
      setImportResult(result);
      loadImportHistory();
    } catch (err: any) {
      alert("Ошибка импорта: " + (err.message || "Неизвестная ошибка"));
    }
    setImporting(false);
  }, [loadImportHistory]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  // Match modal
  const openMatchModal = useCallback(async (tx: BankTransaction) => {
    setMatchingTx(tx);
    setCpSearch("");
    if (counterparties.length === 0) {
      try {
        setCounterparties(await getCounterparties());
      } catch { /* ignore */ }
    }
  }, [counterparties.length]);

  const filteredCp = useMemo(() => {
    if (!cpSearch.trim()) return counterparties;
    const q = cpSearch.toLowerCase();
    return counterparties.filter(
      (cp) =>
        cp.name.toLowerCase().includes(q) ||
        (cp.shortName && cp.shortName.toLowerCase().includes(q)) ||
        (cp.inn && cp.inn.includes(q))
    );
  }, [counterparties, cpSearch]);

  const handleMatch = useCallback(async (cpId: number) => {
    if (!matchingTx) return;
    setMatchSaving(true);
    try {
      await matchBankTransaction(matchingTx.id, cpId);
      setMatchingTx(null);
      loadTransactions();
    } catch (err: any) {
      alert("Ошибка: " + (err.message || ""));
    }
    setMatchSaving(false);
  }, [matchingTx, loadTransactions]);

  const handleIgnore = useCallback(async (txId: number) => {
    if (!confirm("Игнорировать эту транзакцию?")) return;
    try {
      await ignoreBankTransaction(txId);
      loadTransactions();
    } catch { /* ignore */ }
  }, [loadTransactions]);

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition ${
      tab === t
        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-b-0 border-gray-200 dark:border-gray-700"
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Финансы</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-0">
        <button className={tabClass("transactions")} onClick={() => setTab("transactions")}>
          Реестр операций
        </button>
        <button className={tabClass("balances")} onClick={() => setTab("balances")}>
          Балансы
        </button>
        <button className={tabClass("import")} onClick={() => setTab("import")}>
          Импорт выписок
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b-lg rounded-tr-lg p-6">
        {/* ─── TRANSACTIONS TAB ─── */}
        {tab === "transactions" && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-500 dark:text-gray-400">Статус:</label>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              >
                <option value="all">Все</option>
                <option value="matched">Привязанные</option>
                <option value="unmatched">Не привязанные</option>
                <option value="ignored">Игнорированные</option>
              </select>
              <span className="text-sm text-gray-400 dark:text-gray-500 ml-auto">
                {transactions.length} операций
              </span>
            </div>

            {txLoading ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Нет операций. Загрузите банковскую выписку во вкладке «Импорт выписок».
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-2 pr-3">Дата</th>
                      <th className="pb-2 pr-3">Плательщик</th>
                      <th className="pb-2 pr-3">ИНН</th>
                      <th className="pb-2 pr-3 text-right">Сумма</th>
                      <th className="pb-2 pr-3">Назначение</th>
                      <th className="pb-2 pr-3">Организация</th>
                      <th className="pb-2 pr-3">Счета</th>
                      <th className="pb-2 pr-3">Статус</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(tx.documentDate)}</td>
                        <td className="py-2 pr-3 max-w-[200px] truncate" title={tx.payerName}>
                          {tx.payerName}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-400 font-mono text-xs">
                          {tx.payerInn || "—"}
                        </td>
                        <td className="py-2 pr-3 text-right whitespace-nowrap font-medium text-green-600 dark:text-green-400">
                          +{fmtMoney(tx.amount)}
                        </td>
                        <td className="py-2 pr-3 max-w-[250px] truncate text-gray-500 dark:text-gray-400" title={tx.purpose}>
                          {tx.purpose}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {tx.counterparty ? (
                            <span className="text-gray-900 dark:text-gray-200">
                              {tx.counterparty.shortName || tx.counterparty.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {tx.invoiceNumbers.length > 0 ? (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {tx.invoiceNumbers.join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                            {statusLabels[tx.status]}
                          </span>
                        </td>
                        <td className="py-2">
                          {tx.status === "unmatched" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => openMatchModal(tx)}
                                className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                              >
                                Привязать
                              </button>
                              <button
                                onClick={() => handleIgnore(tx.id)}
                                className="px-2 py-1 text-xs rounded bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                              >
                                Игнор
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
        )}

        {/* ─── BALANCES TAB ─── */}
        {tab === "balances" && (
          <div>
            {balLoading ? (
              <div className="text-center py-8 text-gray-500">Загрузка...</div>
            ) : balances.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Нет данных о балансах. Импортируйте банковскую выписку.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-2 pr-3">Организация</th>
                      <th className="pb-2 pr-3">ИНН</th>
                      <th className="pb-2 pr-3 text-right">Выставлено</th>
                      <th className="pb-2 pr-3 text-right">Оплачено</th>
                      <th className="pb-2 pr-3 text-right">Баланс</th>
                      <th className="pb-2">Обновлено</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="py-2.5 pr-3 font-medium text-gray-900 dark:text-gray-200">
                          {b.counterparty.shortName || b.counterparty.name}
                        </td>
                        <td className="py-2.5 pr-3 text-gray-400 font-mono text-xs">
                          {b.counterparty.inn || "—"}
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          {fmtMoney(b.totalBilled)}
                        </td>
                        <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                          {fmtMoney(b.totalPaid)}
                        </td>
                        <td className={`py-2.5 pr-3 text-right whitespace-nowrap font-semibold ${
                          b.balance > 0
                            ? "text-green-600 dark:text-green-400"
                            : b.balance < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-500"
                        }`}>
                          {b.balance > 0 ? "+" : ""}{fmtMoney(b.balance)}
                        </td>
                        <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">
                          {fmtDate(b.lastUpdated)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary row */}
                <div className="mt-4 pt-3 border-t dark:border-gray-700 flex gap-8 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Всего выставлено:{" "}
                    <strong className="text-gray-900 dark:text-gray-200">
                      {fmtMoney(balances.reduce((s, b) => s + b.totalBilled, 0))}
                    </strong>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Всего оплачено:{" "}
                    <strong className="text-gray-900 dark:text-gray-200">
                      {fmtMoney(balances.reduce((s, b) => s + b.totalPaid, 0))}
                    </strong>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Общий баланс:{" "}
                    <strong className={
                      balances.reduce((s, b) => s + b.balance, 0) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }>
                      {fmtMoney(balances.reduce((s, b) => s + b.balance, 0))}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── IMPORT TAB ─── */}
        {tab === "import" && (
          <div>
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition ${
                dragOver
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {importing ? (
                <div className="text-blue-600 dark:text-blue-400 font-medium">
                  Импортирую выписку...
                </div>
              ) : (
                <>
                  <p className="text-gray-500 dark:text-gray-400 mb-3">
                    Перетащите файл банковской выписки (.txt) сюда
                  </p>
                  <label className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition">
                    Выбрать файл
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-2">
                    Формат: 1CClientBankExchange (выписка из Т-Банк / Сбербанк и др.)
                  </p>
                </>
              )}
            </div>

            {/* Import result */}
            {importResult && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">
                  Импорт завершён
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Всего документов: </span>
                    <strong>{importResult.totalDocuments}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Поступлений: </span>
                    <strong>{importResult.incomingCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Импортировано: </span>
                    <strong className="text-green-700 dark:text-green-400">{importResult.importedCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Привязано: </span>
                    <strong className="text-blue-700 dark:text-blue-400">{importResult.matchedCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Не привязано: </span>
                    <strong className="text-yellow-700 dark:text-yellow-400">{importResult.unmatchedCount}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Дубликаты: </span>
                    <strong>{importResult.skippedDuplicates}</strong>
                  </div>
                </div>

                {importResult.transactions.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Импортированные поступления:</h4>
                    <div className="space-y-1">
                      {importResult.transactions.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 text-sm">
                          <span className={`inline-block w-2 h-2 rounded-full ${t.status === "matched" ? "bg-green-500" : "bg-yellow-500"}`} />
                          <span className="font-medium">{fmtMoney(t.amount)}</span>
                          <span className="text-gray-500 truncate">{t.payerName}</span>
                          {t.counterpartyName && (
                            <span className="text-green-600 dark:text-green-400">→ {t.counterpartyName}</span>
                          )}
                          {t.invoiceNumbers.length > 0 && (
                            <span className="text-blue-500 text-xs">[{t.invoiceNumbers.join(", ")}]</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import history */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                История импортов
              </h3>
              {importLoading ? (
                <div className="text-gray-400 text-sm">Загрузка...</div>
              ) : importHistory.length === 0 ? (
                <div className="text-gray-400 text-sm">Нет импортов</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-2 pr-3">Дата импорта</th>
                      <th className="pb-2 pr-3">Файл</th>
                      <th className="pb-2 pr-3">Период</th>
                      <th className="pb-2 pr-3">Счёт</th>
                      <th className="pb-2 pr-3 text-right">Поступления</th>
                      <th className="pb-2 pr-3 text-right">Списания</th>
                      <th className="pb-2 pr-3">Записей</th>
                      <th className="pb-2">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importHistory.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(b.importedAt)}</td>
                        <td className="py-2 pr-3 text-gray-500 max-w-[200px] truncate" title={b.fileName}>{b.fileName}</td>
                        <td className="py-2 pr-3 whitespace-nowrap text-gray-400 text-xs">
                          {fmtDate(b.periodStart)} — {fmtDate(b.periodEnd)}
                        </td>
                        <td className="py-2 pr-3 font-mono text-xs text-gray-400">{b.account}</td>
                        <td className="py-2 pr-3 text-right text-green-600 dark:text-green-400">+{fmtMoney(b.totalIncoming)}</td>
                        <td className="py-2 pr-3 text-right text-red-500 dark:text-red-400">-{fmtMoney(b.totalOutgoing)}</td>
                        <td className="py-2 pr-3">{b.recordCount}</td>
                        <td className="py-2 text-xs text-gray-400">{b.source === "email" ? "📧 Email" : "📁 Ручной"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MATCH MODAL ─── */}
      {matchingTx && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setMatchingTx(null); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Привязать к организации
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              <strong>{matchingTx.payerName}</strong>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              ИНН: {matchingTx.payerInn || "—"} • Сумма: <strong className="text-green-600">{fmtMoney(matchingTx.amount)}</strong>
            </div>
            <div className="text-xs text-gray-400 mb-4 truncate" title={matchingTx.purpose}>
              {matchingTx.purpose}
            </div>

            <input
              type="text"
              placeholder="Поиск по названию или ИНН..."
              value={cpSearch}
              onChange={(e) => setCpSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 mb-3"
            />

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {filteredCp.map((cp) => (
                <button
                  key={cp.id}
                  disabled={matchSaving}
                  onClick={() => handleMatch(cp.id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {cp.shortName || cp.name}
                    </span>
                    {cp.shortName && (
                      <span className="ml-2 text-gray-400 text-xs">{cp.name}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{cp.inn || "—"}</span>
                </button>
              ))}
              {filteredCp.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">Ничего не найдено</div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setMatchingTx(null)}
                className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
