import { getPhone, getToken, clearAuth } from "../auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBalance, createDeposit, getDepositStatus, type BalanceResponse } from "../api";

export default function Profile() {
  const navigate = useNavigate();
  const phone = getPhone();
  const token = getToken();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [pendingDepositId, setPendingDepositId] = useState<number | null>(null);
  const [pendingDepositAmount, setPendingDepositAmount] = useState<number | null>(null);

  const clearPendingDeposit = () => {
    setPendingDepositId(null);
    setPendingDepositAmount(null);
    localStorage.removeItem("pending_deposit_id");
    localStorage.removeItem("pending_deposit_amount");
    localStorage.removeItem("pending_deposit_started_at");
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getBalance(token)
      .then((data) => {
        setBalance(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load balance:", err);
        setError("Не удалось загрузить баланс");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // Восстанавливаем незавершённый депозит (например, после возврата из TBank/PWA)
    const storedId = localStorage.getItem("pending_deposit_id");
    const storedAmount = localStorage.getItem("pending_deposit_amount");
    const startedAt = localStorage.getItem("pending_deposit_started_at");
    if (storedId && storedAmount && startedAt) {
      const ageMinutes = (Date.now() - Number(startedAt)) / 60000;
      if (ageMinutes < 30) {
        setPendingDepositId(Number(storedId));
        setPendingDepositAmount(Number(storedAmount));
      } else {
        clearPendingDeposit();
      }
    }
  }, [token]);

  useEffect(() => {
    if (!token || !pendingDepositId) return;

    const interval = setInterval(() => {
      getDepositStatus(pendingDepositId, token)
        .then((status) => {
          if (status.status === "paid") {
            clearPendingDeposit();
            setDepositAmount("");
            getBalance(token).then(setBalance).catch(console.error);
            alert("✅ Баланс успешно пополнен!");
          }
        })
        .catch((err) => console.error("Deposit status check failed:", err));
    }, 5000);

    return () => clearInterval(interval);
  }, [pendingDepositId, token]);

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
  };

  const handleDeposit = async () => {
    if (!token) return;
    const amount = Number(depositAmount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositError("Введите корректную сумму");
      return;
    }
    setDepositLoading(true);
    setDepositError(null);
    try {
      const result = await createDeposit(amount, token);
      setPendingDepositId(result.depositId);
      setPendingDepositAmount(result.amount);
      localStorage.setItem("pending_deposit_id", String(result.depositId));
      localStorage.setItem("pending_deposit_amount", String(result.amount));
      localStorage.setItem("pending_deposit_started_at", String(Date.now()));
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      console.error("Failed to create deposit:", err);
      setDepositError(err?.message || "Не удалось создать платёж. Попробуйте позже.");
    } finally {
      setDepositLoading(false);
    }
  };

  const formatMoney = (n: number) => {
    return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₽";
  };

  const hasDebt = (balance?.balance || 0) > 0;
  const hasOverpayment = (balance?.balance || 0) < 0;
  const balanceColor = hasDebt ? "text-red-500" : hasOverpayment ? "text-green-500" : "text-accent";

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2.5">
          <img src="/logotip.jpg" alt="Логотип" className="w-[42px] h-[42px] rounded-xl object-contain flex-shrink-0" />
          <div>
            <p className="text-muted text-xs m-0">Логистический сервис</p>
            <h1 className="text-heading text-[21px] font-bold m-0">Доставка на маркетплейсы</h1>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-sm text-heading"><strong>Телефон:</strong> {phone}</p>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-muted text-xs">Баланс клиента</p>
        {loading ? (
          <p className="text-sm text-muted mt-2">Загрузка...</p>
        ) : error ? (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        ) : (
          <>
            <p className={`text-[34px] font-bold ${balanceColor} mt-1 mb-1`}>
              {formatMoney(Math.abs(balance?.balance || 0))}
            </p>
            {hasDebt && <p className="text-sm text-red-500">Долг (к оплате)</p>}
            {hasOverpayment && <p className="text-sm text-green-500">Переплата</p>}
            {balance && balance.organizationCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Выставлено:</span>
                  <span className="font-medium">{formatMoney(balance.totalBilled)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Оплачено:</span>
                  <span className="font-medium">{formatMoney(balance.totalPaid)}</span>
                </div>
              </div>
            )}
            {balance?.organizationCount === 0 && (
              <p className="text-sm text-muted mt-2">Нет привязанных организаций</p>
            )}
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mt-3">
              ⚠️ Функция находится в стадии доработки. Отображаемая сумма может отличаться от реального баланса.
            </p>
          </>
        )}
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-muted text-xs">Пополнение баланса по СБП</p>
        <p className="text-sm text-heading mt-2 mb-3">
          Введите сумму, которую хотите зачислить на баланс. После подтверждения откроется окно оплаты T-Bank.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Например, 5000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            min="1"
            step="1"
            disabled={depositLoading || pendingDepositId !== null}
            className="flex-1 min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
          />
          <span className="text-sm text-muted">₽</span>
        </div>
        {depositError && <p className="text-sm text-red-500 mt-2">{depositError}</p>}
        {pendingDepositId && pendingDepositAmount && (
          <p className="text-sm text-blue-600 mt-2">
            Ожидаем оплату {pendingDepositAmount.toLocaleString("ru-RU")} ₽... После оплаты баланс обновится автоматически.
          </p>
        )}
        <button
          onClick={handleDeposit}
          disabled={depositLoading || pendingDepositId !== null || !depositAmount}
          className="w-full mt-3 py-3 rounded-2xl bg-accent text-white text-sm font-semibold transition active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {depositLoading ? "Создаём платёж..." : "Пополнить баланс"}
        </button>
      </section>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold transition active:opacity-80"
      >
        Выйти
      </button>
    </div>
  );
}
