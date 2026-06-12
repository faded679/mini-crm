import { getPhone, getToken, clearAuth } from "../auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBalance, type BalanceResponse } from "../api";

export default function Profile() {
  const navigate = useNavigate();
  const phone = getPhone();
  const token = getToken();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
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

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold transition active:opacity-80"
      >
        Выйти
      </button>
    </div>
  );
}
