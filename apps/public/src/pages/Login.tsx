import { useState } from "react";
import { authCall, authVerify } from "../api";
import { saveAuth } from "../auth";

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCall = async () => {
    if (!phone || phone.length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authCall(phone);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      setError("Введите код");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authVerify(phone, code);
      saveAuth(res.phone, res.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] fade-in">
        <div className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[42px] h-[42px] rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm">
              СЭ
            </div>
            <div>
              <p className="text-muted text-xs m-0">Логистический сервис</p>
              <h1 className="text-heading text-lg font-bold m-0">Соловьев-Экспресс</h1>
            </div>
          </div>

          {step === "phone" ? (
            <>
              <h2 className="text-heading text-base font-bold mb-3">Вход по телефону</h2>
              <p className="text-muted text-sm mb-4">Мы позвоним на ваш номер. Последние 4 цифры входящего номера — ваш код.</p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
                className="w-full h-12 px-4 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm mb-3 transition-all focus:border-accent"
              />
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <button
                onClick={handleCall}
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-50 transition active:bg-accent-dark"
              >
                {loading ? "Звоним..." : "Получить код"}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-heading text-base font-bold mb-3">Введите код</h2>
              <p className="text-muted text-sm mb-4">
                Последние 4 цифры входящего номера на <strong>{phone}</strong>
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Код из 4 цифр"
                maxLength={4}
                className="w-full h-12 px-4 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm text-center tracking-[0.3em] text-lg mb-3 transition-all focus:border-accent"
              />
              {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-50 transition active:bg-accent-dark"
              >
                {loading ? "Проверяем..." : "Войти"}
              </button>
              <button
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="w-full mt-2 text-muted text-xs underline"
              >
                Изменить номер
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
